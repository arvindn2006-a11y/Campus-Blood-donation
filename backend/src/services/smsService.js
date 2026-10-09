const pool = require('../config/database');
const axios = require('axios');

const sendTransactionalSms = async ({ phone, message, donorId = null, bloodRequestId = null }) => {
  const provider = (process.env.SMS_PROVIDER || 'FAST2SMS').toUpperCase();
  const apiKey = process.env.SMS_API_KEY || process.env.FAST2SMS_API_KEY || '';
  const digits10 = phone.replace(/\D/g, '').slice(-10);

  let deliveryStatus = 'PENDING';
  let providerMessageId = null;
  let providerUsed = provider;

  try {
    if (provider === 'FAST2SMS' && apiKey && apiKey.length > 5) {
      // Fast2SMS integration (India)
      const res = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
        route: 'q',
        message: message,
        language: 'english',
        flash: 0,
        numbers: digits10
      }, {
        headers: {
          'authorization': apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      providerMessageId = res.data?.request_id || 'f2s_' + Date.now();
      deliveryStatus = res.data?.return ? 'SENT' : 'FAILED';
      providerUsed = 'FAST2SMS';
    } else if (provider === 'TWILIO' && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
      // Twilio integration
      const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const res = await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone
      });
      providerMessageId = res.sid;
      deliveryStatus = 'SENT';
      providerUsed = 'TWILIO';
    } else {
      // Unconfigured
      providerUsed = 'NONE';
      deliveryStatus = 'NOT_CONFIGURED';
    }

    // Record into sms_logs table
    await pool.query(
      `INSERT INTO sms_logs (donor_id, blood_request_id, phone, message, provider, delivery_status, provider_message_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [donorId, bloodRequestId, phone, message, providerUsed, deliveryStatus, providerMessageId]
    );

    return { success: deliveryStatus === 'SENT', providerMessageId, deliveryStatus };
  } catch (err) {
    console.error('Transactional SMS Dispatch Error:', err.message);
    await pool.query(
      `INSERT INTO sms_logs (donor_id, blood_request_id, phone, message, provider, delivery_status, provider_message_id)
       VALUES (?, ?, ?, ?, ?, 'FAILED', ?)`,
      [donorId, bloodRequestId, phone, message, providerUsed, 'err_' + Date.now()]
    );
    return { success: false, error: err.message };
  }
};

module.exports = {
  sendTransactionalSms
};
