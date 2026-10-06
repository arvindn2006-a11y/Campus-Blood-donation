class SmsLog {
  constructor({ id, donor_id, blood_request_id, phone, message, provider, delivery_status, provider_message_id, sent_at }) {
    this.id = id;
    this.donor_id = donor_id;
    this.blood_request_id = blood_request_id;
    this.phone = phone;
    this.message = message;
    this.provider = provider;
    this.delivery_status = delivery_status || 'PENDING';
    this.provider_message_id = provider_message_id;
    this.sent_at = sent_at;
  }
}
module.exports = SmsLog;
