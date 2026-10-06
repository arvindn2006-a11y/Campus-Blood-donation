const pool = require('../config/database');

// Get Notifications for Current User
const getUserNotifications = async (req, res, next) => {
  try {
    const [notifications] = await pool.query(
      `SELECT n.*, br.hospital_name, br.blood_group as requested_blood_group, br.urgency,
              dm.id as match_id, dm.response as match_response
       FROM notifications n
       LEFT JOIN blood_requests br ON n.blood_request_id = br.id
       LEFT JOIN students s ON s.user_id = n.user_id
       LEFT JOIN donor_matches dm ON (dm.blood_request_id = n.blood_request_id AND dm.donor_id = s.id)
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [req.user.id]
    );

    const [unreadCountRows] = await pool.query(
      'SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [req.user.id]
    );

    res.json({
      success: true,
      notifications,
      unreadCount: unreadCountRows[0]?.unread_count || 0
    });
  } catch (error) {
    next(error);
  }
};

// Mark Notification as Read
const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?', [id, req.user.id]);
    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    next(error);
  }
};

// Mark All Notifications as Read
const markAllAsRead = async (req, res, next) => {
  try {
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [req.user.id]);
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead
};
