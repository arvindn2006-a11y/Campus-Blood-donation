const pool = require('../config/database');
const { findMatchingDonors } = require('../services/matchingService');
const { createInAppNotification } = require('../services/notificationService');
const { sendTransactionalSms } = require('../services/smsService');
const { sendEmergencyAlertEmail } = require('../services/mailService');
const { emitBloodRequestCreated } = require('../services/socketService');
const { logAudit } = require('../services/auditService');


// Get All Blood Requests
const getAllRequests = async (req, res, next) => {
  try {
    const { status, urgency, bloodGroup } = req.query;
    let query = `
      SELECT br.*, u.name as created_by_name,
             (SELECT COUNT(*) FROM donor_matches dm WHERE dm.blood_request_id = br.id) as total_matched_donors,
             (SELECT COUNT(*) FROM donor_matches dm WHERE dm.blood_request_id = br.id AND dm.response = 'AVAILABLE') as accepted_donors
      FROM blood_requests br
      JOIN users u ON br.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND br.status = ?';
      params.push(status);
    }
    if (urgency) {
      query += ' AND br.urgency = ?';
      params.push(urgency);
    }
    if (bloodGroup) {
      query += ' AND br.blood_group = ?';
      params.push(bloodGroup);
    }

    query += ' ORDER BY br.created_at DESC';

    const [requests] = await pool.query(query, params);
    res.json({ success: true, requests });
  } catch (error) {
    next(error);
  }
};

// Create Blood Request (Admin or Verified Student in Emergency)
const createRequest = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const {
      bloodGroup,
      component,
      unitsRequired,
      hospitalName,
      hospitalAddress,
      hospitalPhone,
      requiredDate,
      requiredTime,
      urgency,
      additionalInfo
    } = req.body;

    if (!bloodGroup || !unitsRequired || !hospitalName || !hospitalAddress || !hospitalPhone || !requiredDate) {
      return res.status(400).json({ success: false, message: 'Please fill in all mandatory blood request fields.' });
    }

    await connection.beginTransaction();

    const requestStatus = urgency === 'EMERGENCY' ? 'EMERGENCY' : 'ACTIVE';

    const [insertResult] = await connection.query(
      `INSERT INTO blood_requests
        (blood_group, component, units_required, hospital_name, hospital_address, hospital_phone, required_date, required_time, urgency, additional_info, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bloodGroup,
        component || 'Whole Blood / RBC',
        parseInt(unitsRequired, 10),
        hospitalName,
        hospitalAddress,
        hospitalPhone,
        requiredDate,
        requiredTime || null,
        urgency || 'NORMAL',
        additionalInfo || null,
        requestStatus,
        req.user.id
      ]
    );

    const bloodRequestId = insertResult.insertId;

    // 1. Run Blood Compatibility Matching
    const matchingDonors = await findMatchingDonors(bloodGroup);
    const matchedUserIds = [];

    for (const donor of matchingDonors) {
      // Insert Donor Match
      await connection.query(
        `INSERT INTO donor_matches (blood_request_id, donor_id, match_type, notification_status, response)
         VALUES (?, ?, ?, 'SENT', 'PENDING')`,
        [bloodRequestId, donor.student_id, donor.match_type]
      );

      // Create In-App Notification
      const alertMsg = `🚨 Emergency Alert: ${bloodGroup} blood required at ${hospitalName} for ${unitsRequired} unit(s). Urgency: ${urgency}.`;
      await connection.query(
        `INSERT INTO notifications (user_id, blood_request_id, notification_type, message)
         VALUES (?, ?, 'EMERGENCY_ALERT', ?)`,
        [donor.user_id, bloodRequestId, alertMsg]
      );

      matchedUserIds.push(donor.user_id);

      // Send Transactional SMS
      const smsText = `Campus BloodConnect Alert: URGENT ${bloodGroup} Blood required at ${hospitalName}. Log in to app to respond.`;
      sendTransactionalSms({
        phone: donor.phone,
        message: smsText,
        donorId: donor.student_id,
        bloodRequestId
      }).catch(console.error);

      // Send Real-Time Emergency Alert Email
      if (donor.email) {
        sendEmergencyAlertEmail({
          toEmail: donor.email,
          donorName: donor.name,
          bloodGroup,
          unitsRequired,
          hospitalName,
          hospitalAddress,
          hospitalPhone
        }).catch(console.error);
      }
    }


    await connection.commit();

    // Log Audit
    await logAudit({
      userId: req.user.id,
      action: 'CREATE_BLOOD_REQUEST',
      entityType: 'BLOOD_REQUEST',
      entityId: bloodRequestId,
      metadata: { bloodGroup, unitsRequired, matchedCount: matchingDonors.length, urgency }
    });

    const fullRequestData = {
      id: bloodRequestId,
      blood_group: bloodGroup,
      component,
      units_required: unitsRequired,
      hospital_name: hospitalName,
      hospital_address: hospitalAddress,
      hospital_phone: hospitalPhone,
      required_date: requiredDate,
      required_time: requiredTime,
      urgency,
      status: requestStatus,
      created_by_name: req.user.name,
      total_matched_donors: matchingDonors.length
    };

    // 2. Trigger Real-time WebSockets
    emitBloodRequestCreated(fullRequestData, matchedUserIds);

    res.status(201).json({
      success: true,
      message: `Blood request created successfully! Matched with ${matchingDonors.length} compatible campus donors.`,
      request: fullRequestData,
      matchedDonorsCount: matchingDonors.length
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// Get Request Details by ID with matched donors list (Admin or Donor)
const getRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [requests] = await pool.query(
      `SELECT br.*, u.name as created_by_name, u.email as requester_email
       FROM blood_requests br
       JOIN users u ON br.created_by = u.id
       WHERE br.id = ?`,
      [id]
    );

    if (requests.length === 0) {
      return res.status(404).json({ success: false, message: 'Blood request not found.' });
    }

    const request = requests[0];

    // Fetch matched donors for this request
    const [matches] = await pool.query(
      `SELECT dm.id as match_id, dm.match_type, dm.response, dm.confirmed, dm.created_at,
              s.id as donor_id, s.student_id, s.blood_group, s.department, s.year,
              u.name as donor_name,
              CASE WHEN ? = 'ADMIN' THEN u.phone ELSE 'PROTECTED' END as donor_phone
       FROM donor_matches dm
       JOIN students s ON dm.donor_id = s.id
       JOIN users u ON s.user_id = u.id
       WHERE dm.blood_request_id = ?
       ORDER BY dm.match_type ASC, dm.response DESC`,
      [req.user.role, id]
    );

    res.json({
      success: true,
      request,
      matches
    });
  } catch (error) {
    next(error);
  }
};

// Update Request Status (Admin)
const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await pool.query('UPDATE blood_requests SET status = ? WHERE id = ?', [status, id]);

    await logAudit({
      userId: req.user.id,
      action: 'UPDATE_REQUEST_STATUS',
      entityType: 'BLOOD_REQUEST',
      entityId: id,
      metadata: { status }
    });

    res.json({ success: true, message: `Blood request status updated to ${status}` });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllRequests,
  createRequest,
  getRequestById,
  updateStatus
};
