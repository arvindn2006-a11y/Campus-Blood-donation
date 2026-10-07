const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter = null;

// Initialize Google Gmail / SMTP Transporter
function getTransporter() {
  if (!transporter) {
    const user = process.env.GOOGLE_EMAIL_USER || process.env.EMAIL_USER || '';
    const pass = process.env.GOOGLE_EMAIL_APP_PASSWORD || process.env.EMAIL_PASS || '';

    if (user && pass) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user,
          pass
        }
      });
      console.log(`📧 Google Mail Service Initialized for ${user}`);
    } else {
      // Create fallback ethereal / log transporter
      transporter = null;
    }
  }
  return transporter;
}

/**
 * Send Real-Time Verification OTP Email
 */
async function sendOtpEmail({ toEmail, otpCode, name = 'Student Donor', purpose = 'REGISTER' }) {
  const mailTransporter = getTransporter();
  const fromAddress = process.env.GOOGLE_EMAIL_USER || process.env.EMAIL_USER || 'noreply@campusbloodconnect.edu';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0d14; color: #e2e8f0; margin: 0; padding: 20px; }
        .container { max-width: 540px; margin: 0 auto; background: #111726; border: 1px solid rgba(225, 29, 72, 0.3); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .header { background: linear-gradient(135deg, #e11d48, #be123c); padding: 24px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; }
        .content { padding: 32px 24px; text-align: center; }
        .otp-box { background: rgba(225, 29, 72, 0.15); border: 2px dashed #e11d48; border-radius: 12px; padding: 18px; margin: 24px 0; font-size: 32px; letter-spacing: 8px; font-weight: 900; color: #fda4af; font-family: monospace; }
        .footer { background: #0b0f19; padding: 16px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid rgba(255,255,255,0.05); }
        .btn { display: inline-block; background: #e11d48; color: #ffffff !important; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-weight: bold; font-size: 13px; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🩸 Campus BloodConnect</h1>
        </div>
        <div class="content">
          <h2 style="color: #ffffff; margin-top: 0;">Real-Time Verification Code</h2>
          <p style="color: #94a3b8; font-size: 13px;">Hello <strong>${name}</strong>,</p>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.5;">
            Use the 6-digit verification code below to complete your ${purpose === 'LOGIN' ? 'donor login' : 'campus donor profile registration'}:
          </p>
          <div class="otp-box">${otpCode}</div>
          <p style="color: #f43f5e; font-size: 12px; font-weight: 600;">
            ⏳ This code is valid for 5 minutes. Never share this code with anyone.
          </p>
        </div>
        <div class="footer">
          Campus BloodConnect • Automated Emergency Response Network • University Health Service
        </div>
      </div>
    </body>
    </html>
  `;

  if (mailTransporter) {
    try {
      await mailTransporter.sendMail({
        from: `"Campus BloodConnect" <${fromAddress}>`,
        to: toEmail,
        subject: `🩸 [${otpCode}] Your Campus BloodConnect Verification Code`,
        html: htmlContent
      });
      console.log(`✉️ [REAL-TIME EMAIL OTP] Sent to ${toEmail} | Code: ${otpCode}`);
      return { success: true, emailSent: true };
    } catch (err) {
      console.warn(`⚠️ Email dispatch note (${toEmail}):`, err.message);
      return { success: false, error: err.message };
    }
  } else {
    console.log(`✉️ [DEV EMAIL LOG] To: ${toEmail} | OTP: ${otpCode} | Purpose: ${purpose}`);
    return { success: true, emailSent: false, simulated: true };
  }
}

/**
 * Send Emergency Blood Alert Email to Matching Donors
 */
async function sendEmergencyAlertEmail({ toEmail, donorName, bloodGroup, unitsRequired, hospitalName, hospitalAddress, hospitalPhone }) {
  const mailTransporter = getTransporter();
  const fromAddress = process.env.GOOGLE_EMAIL_USER || process.env.EMAIL_USER || 'emergency@campusbloodconnect.edu';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0d14; color: #e2e8f0; margin: 0; padding: 20px; }
        .container { max-width: 540px; margin: 0 auto; background: #111726; border: 2px solid #e11d48; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(225,29,72,0.3); }
        .header { background: #e11d48; padding: 20px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 1px; }
        .content { padding: 24px; }
        .details-box { background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 16px; margin: 16px 0; }
        .btn { display: block; text-align: center; background: #e11d48; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 800; font-size: 14px; margin-top: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚨 CRITICAL BLOOD MATCH ALERT</h1>
        </div>
        <div class="content">
          <p style="color: #ffffff; font-size: 15px; margin-top: 0;">Dear <strong>${donorName}</strong>,</p>
          <p style="color: #cbd5e1; font-size: 13px; line-height: 1.5;">
            An emergency request for <strong>${bloodGroup} Blood</strong> has been broadcast on campus matching your verified donor profile!
          </p>
          <div class="details-box">
            <p style="margin: 4px 0; font-size: 13px;">🏥 <strong>Hospital:</strong> ${hospitalName}</p>
            <p style="margin: 4px 0; font-size: 13px;">📍 <strong>Address:</strong> ${hospitalAddress}</p>
            <p style="margin: 4px 0; font-size: 13px;">🩸 <strong>Required:</strong> ${unitsRequired} Unit(s) of ${bloodGroup}</p>
            <p style="margin: 4px 0; font-size: 13px;">📞 <strong>Emergency Line:</strong> ${hospitalPhone}</p>
          </div>
          <p style="color: #94a3b8; font-size: 12px;">
            Please log into your student dashboard to respond with your availability. Your timely response can save a life today.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  if (mailTransporter) {
    try {
      await mailTransporter.sendMail({
        from: `"Campus Emergency Blood Alert" <${fromAddress}>`,
        to: toEmail,
        subject: `🚨 URGENT: ${bloodGroup} Blood Needed at ${hospitalName}`,
        html: htmlContent
      });
      console.log(`✉️ [EMERGENCY EMAIL ALERT] Dispatched to ${toEmail}`);
    } catch (err) {
      console.warn(`⚠️ Emergency alert email error (${toEmail}):`, err.message);
    }
  }
}

module.exports = {
  sendOtpEmail,
  sendEmergencyAlertEmail
};
