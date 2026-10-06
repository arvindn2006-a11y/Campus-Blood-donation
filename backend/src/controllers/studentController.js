const pool = require('../config/database');
const { logAudit } = require('../services/auditService');

// Get Student Profile
const getProfile = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.role, 
              s.id as student_table_id, s.student_id, s.department, s.year, 
              s.blood_group, s.availability, s.last_donation_date, s.created_at
       FROM users u
       JOIN students s ON u.id = s.user_id
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    res.json({ success: true, profile: rows[0] });
  } catch (error) {
    next(error);
  }
};

// Update Student Profile
const updateProfile = async (req, res, next) => {
  try {
    const { name, department, year, availability } = req.body;

    if (name) {
      await pool.query('UPDATE users SET name = ? WHERE id = ?', [name, req.user.id]);
    }

    await pool.query(
      `UPDATE students 
       SET department = COALESCE(?, department), 
           year = COALESCE(?, year), 
           availability = COALESCE(?, availability)
       WHERE user_id = ?`,
      [department, year, availability !== undefined ? Boolean(availability) : null, req.user.id]
    );

    await logAudit({
      userId: req.user.id,
      action: 'UPDATE_PROFILE',
      entityType: 'STUDENT',
      entityId: req.user.id,
      metadata: { department, year, availability }
    });

    res.json({ success: true, message: 'Profile updated successfully.' });
  } catch (error) {
    next(error);
  }
};

// Toggle Donor Availability
const toggleAvailability = async (req, res, next) => {
  try {
    const { availability } = req.body;
    const isAvail = Boolean(availability);

    await pool.query(
      'UPDATE students SET availability = ? WHERE user_id = ?',
      [isAvail, req.user.id]
    );

    await logAudit({
      userId: req.user.id,
      action: 'TOGGLE_AVAILABILITY',
      entityType: 'STUDENT',
      entityId: req.user.id,
      metadata: { availability: isAvail }
    });

    res.json({ success: true, availability: isAvail, message: `Donor availability set to ${isAvail ? 'AVAILABLE' : 'UNAVAILABLE'}.` });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  toggleAvailability
};
