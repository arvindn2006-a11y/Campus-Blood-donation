const pool = require('../config/database');

const createInAppNotification = async ({ userId, bloodRequestId, notificationType, message }) => {
  try {
    const [result] = await pool.query(
      `INSERT INTO notifications (user_id, blood_request_id, notification_type, message)
       VALUES (?, ?, ?, ?)`,
      [userId, bloodRequestId, notificationType, message]
    );
    return { id: result.insertId, userId, bloodRequestId, notificationType, message, is_read: false };
  } catch (error) {
    console.error('Notification Service Error:', error.message);
    throw error;
  }
};

module.exports = {
  createInAppNotification
};
