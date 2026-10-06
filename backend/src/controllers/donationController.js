const pool = require('../config/database');
const { emitDonationConfirmed } = require('../services/socketService');
const { logAudit } = require('../services/auditService');

// Get Current Student's Donation History
const getMyDonations = async (req, res, next) => {
  try {
    const [donations] = await pool.query(
      `SELECT d.*, br.blood_group, br.component, br.urgency, u.name as verified_by_name
       FROM donations d
       JOIN students s ON d.donor_id = s.id
       LEFT JOIN blood_requests br ON d.blood_request_id = br.id
       LEFT JOIN users u ON d.verified_by = u.id
       WHERE s.user_id = ?
       ORDER BY d.donation_date DESC`,
      [req.user.id]
    );

    res.json({ success: true, donations });
  } catch (error) {
    next(error);
  }
};

// Record New Donation (Admin or Coordinator)
const recordDonation = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { donorId, bloodRequestId, donationDate, units, hospitalName } = req.body;

    if (!donorId || !donationDate || !hospitalName) {
      return res.status(400).json({ success: false, message: 'Donor, donation date, and hospital name required.' });
    }

    await connection.beginTransaction();

    const [result] = await connection.query(
      `INSERT INTO donations (donor_id, blood_request_id, donation_date, units, hospital_name, verification_status, verified_by)
       VALUES (?, ?, ?, ?, ?, 'VERIFIED', ?)`,
      [donorId, bloodRequestId || null, donationDate, units || 1.0, hospitalName, req.user.id]
    );

    const donationId = result.insertId;

    // Update student last_donation_date
    await connection.query(
      'UPDATE students SET last_donation_date = ? WHERE id = ?',
      [donationDate, donorId]
    );

    // If linked to request, update match confirmed status
    if (bloodRequestId) {
      await connection.query(
        'UPDATE donor_matches SET confirmed = TRUE WHERE blood_request_id = ? AND donor_id = ?',
        [bloodRequestId, donorId]
      );
    }

    // Get student user_id for notification & websocket
    const [studentRows] = await connection.query(
      'SELECT user_id, student_id FROM students WHERE id = ?',
      [donorId]
    );

    const studentUserId = studentRows[0]?.user_id;

    if (studentUserId) {
      await connection.query(
        `INSERT INTO notifications (user_id, blood_request_id, notification_type, message)
         VALUES (?, ?, 'DONATION_VERIFIED', ?)`,
        [studentUserId, bloodRequestId || null, `🎉 Your blood donation at ${hospitalName} on ${donationDate} has been verified by the campus coordinator. Thank you for saving lives!`]
      );
    }

    await connection.commit();

    await logAudit({
      userId: req.user.id,
      action: 'RECORD_DONATION',
      entityType: 'DONATION',
      entityId: donationId,
      metadata: { donorId, hospitalName, units }
    });

    emitDonationConfirmed({ id: donationId, donorId, hospitalName, donationDate, units }, studentUserId);

    res.status(201).json({
      success: true,
      message: 'Blood donation recorded and verified successfully!',
      donationId
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

module.exports = {
  getMyDonations,
  recordDonation
};
