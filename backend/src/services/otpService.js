const crypto = require('crypto');
const pool = require('../config/database');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { sendOtpEmail } = require('./mailService');

// In-memory fallback cache for ultra-low latency OTP lookup
const otpStore = new Map();

// Normalize phone number to standard E.164 or cleaned 10-digit format
function normalizePhone(phone) {
  if (!phone) return '';
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (!cleaned.startsWith('+')) {
    if (cleaned.length === 10) {
      cleaned = '+91' + cleaned; // Default Indian prefix if 10 digits provided
    } else {
      cleaned = '+' + cleaned;
    }
  }
  return cleaned;
}

// Generate cryptographically secure 6-digit OTP
function generateOtpCode() {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Dispatches real SMS through configured gateway (Fast2SMS / Twilio / 2Factor)
 */
async function dispatchSmsGateway({ phone, otpCode, purpose }) {
  const provider = (process.env.SMS_PROVIDER || 'FAST2SMS').toUpperCase();
  const apiKey = process.env.SMS_API_KEY || process.env.FAST2SMS_API_KEY || '';
  const cleanPhone = phone.replace(/\D/g, '');
  const digits10 = cleanPhone.slice(-10);

  const message = `Your Campus BloodConnect verification code is ${otpCode}. Valid for 5 minutes. Save lives!`;

  let deliveryStatus = 'PENDING';
  let providerMessageId = null;
  let providerUsed = provider;

  try {
    // 1. Fast2SMS Provider (Active SMS Gateway)
    if (provider === 'FAST2SMS' && apiKey && apiKey.length > 5) {
      try {
        const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
          route: 'otp',
          variables_values: otpCode,
          numbers: digits10
        }, {
          headers: {
            'authorization': apiKey,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });

        if (response.data && response.data.return) {
          deliveryStatus = 'SENT';
          providerMessageId = response.data.request_id || 'f2s_' + Date.now();
          providerUsed = 'FAST2SMS';
        } else {
          deliveryStatus = 'FAILED';
          console.warn('Fast2SMS gateway returned error:', response.data?.message || response.data);
          return {
            success: false,
            provider: 'FAST2SMS',
            error: response.data?.message || 'Carrier dispatch rejected'
          };
        }
      } catch (f2sErr) {
        deliveryStatus = 'FAILED';
        console.warn('Fast2SMS dispatch error:', f2sErr.response?.data || f2sErr.message);
        return {
          success: false,
          provider: 'FAST2SMS',
          error: f2sErr.response?.data?.message || f2sErr.message
        };
      }
    }
    // 2. Twilio Provider (Optional international SMS)
    else if (provider === 'TWILIO' && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
      try {
        const twilio = require('twilio');
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        const twilioRes = await client.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phone
        });
        deliveryStatus = 'SENT';
        providerMessageId = twilioRes.sid;
        providerUsed = 'TWILIO';
      } catch (twErr) {
        deliveryStatus = 'FAILED';
        console.warn('Twilio dispatch error:', twErr.message);
        return {
          success: false,
          provider: 'TWILIO',
          error: twErr.message
        };
      }
    } 
    // 3. 2Factor Provider (Optional India OTP)
    else if (provider === '2FACTOR' && process.env.TWO_FACTOR_API_KEY) {
      try {
        const tfRes = await axios.get(
          `https://2factor.in/v3/${process.env.TWO_FACTOR_API_KEY}/SMS/${digits10}/${otpCode}/CAMPUS_BLOOD`,
          { timeout: 10000 }
        );
        deliveryStatus = 'SENT';
        providerMessageId = tfRes.data?.Details || '2f_' + Date.now();
        providerUsed = '2FACTOR';
      } catch (tfErr) {
        deliveryStatus = 'FAILED';
        console.warn('2Factor dispatch error:', tfErr.message);
        return {
          success: false,
          provider: '2FACTOR',
          error: tfErr.message
        };
      }
    } else {
      // Unconfigured provider
      providerUsed = 'NONE';
      deliveryStatus = 'NOT_CONFIGURED';
    }

    // Log SMS delivery in database
    await pool.query(
      `INSERT INTO sms_logs (phone, message, provider, delivery_status, provider_message_id)
       VALUES (?, ?, ?, ?, ?)`,
      [phone, `Verification code OTP sent for ${purpose}`, providerUsed, deliveryStatus, providerMessageId]
    );

    return {
      success: deliveryStatus === 'SENT',
      provider: providerUsed,
      providerMessageId,
      deliveryStatus
    };
  } catch (error) {
    console.error('SMS Gateway Error:', error.message);
    return {
      success: false,
      error: error.message,
      provider: providerUsed
    };
  }
}

/**
 * Generate and dispatch a real-time OTP to the entered phone number and optional email
 */
async function sendOtp({ phone, email = null, name = 'Student Donor', purpose = 'REGISTER' }) {
  const normalized = normalizePhone(phone);
  if (!normalized || normalized.length < 8) {
    throw new Error('Please enter a valid phone number with country code (e.g. +919876543210).');
  }

  const otpCode = generateOtpCode();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  // Store in database
  await pool.query(
    `INSERT INTO otp_verifications (phone, otp_code, purpose, attempts, is_verified, expires_at)
     VALUES (?, ?, ?, 0, 0, ?)`,
    [normalized, otpCode, purpose, expiresAt]
  );

  // Store in memory for ultra-fast validation
  otpStore.set(normalized, {
    otpCode,
    purpose,
    attempts: 0,
    expiresAt,
    createdAt: Date.now()
  });

  // Dispatch via SMS Gateway
  const smsResult = await dispatchSmsGateway({
    phone: normalized,
    otpCode,
    purpose
  });

  let emailSent = false;
  // Also dispatch via Google Mail / Email in real time if email is provided
  if (email) {
    try {
      const emailRes = await sendOtpEmail({
        toEmail: email,
        otpCode,
        name,
        purpose
      });
      emailSent = Boolean(emailRes && emailRes.emailSent);
    } catch (e) {
      console.warn('Email dispatch warning:', e.message);
    }
  }

  return {
    success: true,
    message: `Verification code generated and sent to ${normalized}${email ? ` and ${email}` : ''}`,
    phone: normalized,
    email,
    expiresInSeconds: 300,
    expiresAt: new Date(expiresAt).toISOString(),
    smsStatus: smsResult.deliveryStatus,
    smsProvider: smsResult.provider,
    emailSent
  };
}

/**
 * Verify the user entered OTP code
 */
async function verifyOtp({ phone, otpCode, purpose = 'REGISTER' }) {
  const normalized = normalizePhone(phone);
  const now = Date.now();

  // Check in-memory store first
  const memoryRecord = otpStore.get(normalized);
  if (memoryRecord) {
    if (now > memoryRecord.expiresAt) {
      otpStore.delete(normalized);
      throw new Error('The OTP code has expired. Please request a new code.');
    }
    if (memoryRecord.attempts >= 5) {
      otpStore.delete(normalized);
      throw new Error('Too many invalid attempts. Please request a fresh OTP code.');
    }
    if (memoryRecord.otpCode !== String(otpCode).trim()) {
      memoryRecord.attempts += 1;
      throw new Error('Incorrect 6-digit OTP verification code. Please try again.');
    }

    // Success - consume OTP
    otpStore.delete(normalized);

    // Update database record
    await pool.query(
      `UPDATE otp_verifications 
       SET is_verified = 1 
       WHERE phone = ? AND otp_code = ?`,
      [normalized, otpCode]
    );

    // Generate signed verification token
    const verificationToken = jwt.sign(
      { phone: normalized, verifiedAt: Date.now(), purpose },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '15m' }
    );

    return {
      success: true,
      message: 'Mobile number verified successfully!',
      phone: normalized,
      verificationToken
    };
  }

  // Fallback DB check
  const [rows] = await pool.query(
    `SELECT * FROM otp_verifications 
     WHERE phone = ? AND otp_code = ? AND is_verified = 0 AND expires_at > ?
     ORDER BY id DESC LIMIT 1`,
    [normalized, otpCode, now]
  );

  if (rows.length === 0) {
    throw new Error('Invalid or expired OTP code. Please request a new code.');
  }

  const record = rows[0];
  if (record.attempts >= 5) {
    throw new Error('Maximum verification attempts exceeded. Please request a new OTP.');
  }

  await pool.query(
    'UPDATE otp_verifications SET is_verified = 1 WHERE id = ?',
    [record.id]
  );

  const verificationToken = jwt.sign(
    { phone: normalized, verifiedAt: Date.now(), purpose },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '15m' }
  );

  return {
    success: true,
    message: 'Mobile number verified successfully!',
    phone: normalized,
    verificationToken
  };
}

module.exports = {
  sendOtp,
  verifyOtp,
  normalizePhone
};
