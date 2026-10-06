class Notification {
  constructor({ id, user_id, blood_request_id, notification_type, message, is_read, created_at }) {
    this.id = id;
    this.user_id = user_id;
    this.blood_request_id = blood_request_id;
    this.notification_type = notification_type || 'EMERGENCY_ALERT';
    this.message = message;
    this.is_read = Boolean(is_read);
    this.created_at = created_at;
  }
}
module.exports = Notification;
