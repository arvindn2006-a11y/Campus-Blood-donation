const pool = require('../config/database');
const { emitDonorResponse } = require('../services/socketService');
const { logAudit } = require('../services/auditService');

// Get All Donors (Admin Directory)
const getAllDonors = async (req, res, next) => {
  try {
    const { bloodGroup, department, availability, search } = req.query;
    let query = `
      SELECT s.id as student_id, s.user_id, s.student_id as campus_id, s.department, s.year,
             s.blood_group, s.availability, s.last_donation_date,
             u.name, u.email,
             CASE WHEN ? = 'ADMIN' THEN u.phone ELSE '***-***-****' END as phone,
             (SELECT COUNT(*) FROM donations d WHERE d.donor_id = s.id AND d.verification_status = 'VERIFIED') as total_donations
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE u.status = 'ACTIVE'
    `;
    const params = [req.user.role];

    if (bloodGroup) {
      query += ' AND s.blood_group = ?';
      params.push(bloodGroup);
    }
    if (department) {
      query += ' AND s.department LIKE ?';
      params.push(`%${department}%`);
    }
    if (availability !== undefined && availability !== '') {
      query += ' AND s.availability = ?';
      params.push(availability === 'true' || availability === '1' || availability === true ? 1 : 0);
    }
    if (search) {
      query += ' AND (u.name LIKE ? OR s.student_id LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY s.availability DESC, u.name ASC';

    const [donors] = await pool.query(query, params);
    res.json({ success: true, donors });
  } catch (error) {
    next(error);
  }
};

// Get Matched Requests for logged-in student donor
const getMyMatches = async (req, res, next) => {
  try {
    const [matches] = await pool.query(
      `SELECT dm.id as match_id, dm.match_type, dm.response, dm.confirmed, dm.created_at,
              br.id as blood_request_id, br.blood_group, br.component, br.units_required,
              br.hospital_name, br.hospital_address, br.hospital_phone, br.required_date,
              br.required_time, br.urgency, br.status as request_status, br.additional_info
       FROM donor_matches dm
       JOIN students s ON dm.donor_id = s.id
       JOIN blood_requests br ON dm.blood_request_id = br.id
       WHERE s.user_id = ?
       ORDER BY (br.urgency = 'EMERGENCY') DESC, dm.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, matches });
  } catch (error) {
    next(error);
  }
};

// Student Responds to Blood Request (AVAILABLE / NOT_AVAILABLE)
const respondToMatch = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    const { response } = req.body; // 'AVAILABLE' or 'NOT_AVAILABLE'

    if (!['AVAILABLE', 'NOT_AVAILABLE'].includes(response)) {
      return res.status(400).json({ success: false, message: 'Invalid response status.' });
    }

    // Verify that the match belongs to the logged-in student
    const [matchRows] = await pool.query(
      `SELECT dm.*, s.user_id, u.name as donor_name, s.blood_group, br.hospital_name, br.blood_group as request_bg
       FROM donor_matches dm
       JOIN students s ON dm.donor_id = s.id
       JOIN users u ON s.user_id = u.id
       JOIN blood_requests br ON dm.blood_request_id = br.id
       WHERE dm.id = ?`,
      [matchId]
    );

    if (matchRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Match record not found.' });
    }

    const match = matchRows[0];
    if (match.user_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized to respond for this donor match.' });
    }

    await pool.query(
      'UPDATE donor_matches SET response = ? WHERE id = ?',
      [response, matchId]
    );

    // Audit Log
    await logAudit({
      userId: req.user.id,
      action: response === 'AVAILABLE' ? 'DONOR_ACCEPTED' : 'DONOR_DECLINED',
      entityType: 'DONOR_MATCH',
      entityId: matchId,
      metadata: { response, requestId: match.blood_request_id }
    });

    const responsePayload = {
      matchId: parseInt(matchId, 10),
      bloodRequestId: match.blood_request_id,
      donorName: match.donor_name,
      donorBloodGroup: match.blood_group,
      response,
      timestamp: new Date()
    };

    // Emit live WebSocket update to Admin Dashboard
    emitDonorResponse(responsePayload);

    res.json({
      success: true,
      message: `Response recorded: ${response === 'AVAILABLE' ? 'Accepted - Thank you for volunteering to donate!' : 'Declined'}`,
      data: responsePayload
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllDonors,
  getMyMatches,
  respondToMatch
};

