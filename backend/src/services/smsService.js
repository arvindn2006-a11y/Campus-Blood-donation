const pool = require('../config/database');

const sendTransactionalSms = async ({ phone, message, donorId = null, bloodRequestId = null }) => {
  const provider = process.env.SMS_PROVIDER || 'DEV_LOG';
  let deliveryStatus = 'SENT';
  let providerMessageId = null;

  try {
    if (provider === 'TWILIO' && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      // Twilio integration
      const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const res = await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone
      });
      providerMessageId = res.sid;
      deliveryStatus = 'SENT';
    } else if (provider === 'FAST2SMS' && process.env.SMS_API_KEY) {
      // Fast2SMS integration (India)
      const axios = require('axios');
      const res = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
        route: 'v3',
        sender_id: process.env.SMS_SENDER_ID || 'TXTIND',
        message: message,
        language: 'english',
        flash: 0,
        numbers: phone.replace(/\D/g, '')
      }, {
        headers: { 'authorization': process.env.SMS_API_KEY }
      });
      providerMessageId = res.data?.request_id || 'f2s_' + Date.now();
      deliveryStatus = res.data?.return ? 'SENT' : 'FAILED';
    } else {
      // Development mode log
      providerMessageId = 'dev_' + Date.now();
      deliveryStatus = 'SENT';
      console.log(`📱 [DEV SMS LOG] To: ${phone} | Message: "${message}"`);
    }

    // Record into sms_logs table
    await pool.query(
      `INSERT INTO sms_logs (donor_id, blood_request_id, phone, message, provider, delivery_status, provider_message_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [donorId, bloodRequestId, phone, message, provider, deliveryStatus, providerMessageId]
    );

    return { success: true, providerMessageId, deliveryStatus };
  } catch (err) {
    console.error('SMS Dispatch Error:', err.message);
    await pool.query(
      `INSERT INTO sms_logs (donor_id, blood_request_id, phone, message, provider, delivery_status, provider_message_id)
       VALUES (?, ?, ?, ?, ?, 'FAILED', ?)`,
      [donorId, bloodRequestId, phone, message, provider, 'err_' + Date.now()]
    );
    return { success: false, error: err.message };
  }
};

module.exports = {
  sendTransactionalSms
};
