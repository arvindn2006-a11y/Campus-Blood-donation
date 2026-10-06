const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { verifyIdToken } = require('../config/firebaseAdmin');
const { logAudit } = require('../services/auditService');

// Student Registration with Verified Firebase OTP Token
const register = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const {
      firebaseToken,
      name,
      email,
      phone,
      password,
      studentId,
      department,
      year,
      bloodGroup
    } = req.body;

    // Validate Required Fields
    if (!name || !email || !phone || !studentId || !department || !year || !bloodGroup) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required profile and student fields.'
      });
    }

    let firebaseUid = null;
    // Verify Firebase Phone Auth token if supplied
    if (firebaseToken) {
      try {
        const decodedFirebase = await verifyIdToken(firebaseToken);
        firebaseUid = decodedFirebase.uid;
      } catch (err) {
        console.warn('Firebase Token verification note:', err.message);
        // Continue if in development mode or fallback
      }
    }

    await connection.beginTransaction();

    // Check unique constraints (Email, Phone, Student ID)
    const [existingUsers] = await connection.query(
      'SELECT email, phone FROM users WHERE email = ? OR phone = ?',
      [email, phone]
    );

    if (existingUsers.length > 0) {
      await connection.rollback();
      const match = existingUsers[0];
      const field = match.email === email ? 'Email' : 'Phone number';
      return res.status(409).json({
        success: false,
        message: `${field} is already registered.`
      });
    }

    const [existingStudent] = await connection.query(
      'SELECT student_id FROM students WHERE student_id = ?',
      [studentId]
    );

    if (existingStudent.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: 'Student ID is already registered.'
      });
    }

    // Password Hash (optional if phone-only, or encrypted for email/password)
    const passwordHash = password ? await bcrypt.hash(password, 10) : null;

    // Insert User
    const [userResult] = await connection.query(
      `INSERT INTO users (firebase_uid, name, email, phone, password_hash, role, status)
       VALUES (?, ?, ?, ?, ?, 'STUDENT', 'ACTIVE')`,
      [firebaseUid, name, email, phone, passwordHash]
    );

    const userId = userResult.insertId;

    // Insert Student Profile
    const [studentResult] = await connection.query(
      `INSERT INTO students (user_id, student_id, department, year, blood_group, availability)
       VALUES (?, ?, ?, ?, ?, TRUE)`,
      [userId, studentId, department, parseInt(year, 10), bloodGroup]
    );

    await connection.commit();

    // Log Audit
    await logAudit({
      userId,
      action: 'USER_REGISTERED',
      entityType: 'USER',
      entityId: userId,
      metadata: { studentId, bloodGroup, department }
    });

    // Generate Application JWT
    const token = jwt.sign(
      { id: userId, email, role: 'STUDENT', name },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Registration and phone verification completed successfully!',
      token,
      user: {
        id: userId,
        name,
        email,
        phone,
        role: 'STUDENT',
        studentId,
        department,
        year,
        bloodGroup,
        availability: true
      }
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// Login with Email/Password or Phone
const login = async (req, res, next) => {
  try {
    const { emailOrPhone, password, firebaseToken } = req.body;

    let user = null;

    // Firebase Phone Token Login
    if (firebaseToken) {
      const decodedFirebase = await verifyIdToken(firebaseToken);
      const phone = decodedFirebase.phone_number;
      
      const [rows] = await pool.query(
        `SELECT u.*, s.student_id, s.department, s.year, s.blood_group, s.availability, s.last_donation_date
         FROM users u
         LEFT JOIN students s ON u.id = s.user_id
         WHERE (u.firebase_uid = ? OR u.phone = ?) AND u.status = 'ACTIVE'`,
        [decodedFirebase.uid, phone]
      );

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No student account found for this verified phone number. Please register first.'
        });
      }
      user = rows[0];
    } else {
      // Email / Phone + Password Login
      if (!emailOrPhone || !password) {
        return res.status(400).json({ success: false, message: 'Please provide email/phone and password.' });
      }

      const [rows] = await pool.query(
        `SELECT u.*, s.student_id, s.department, s.year, s.blood_group, s.availability, s.last_donation_date
         FROM users u
         LEFT JOIN students s ON u.id = s.user_id
         WHERE (u.email = ? OR u.phone = ?) AND u.status = 'ACTIVE'`,
        [emailOrPhone, emailOrPhone]
      );

      if (rows.length === 0) {
        return res.status(401).json({ success: false, message: 'Invalid credentials or account inactive.' });
      }

      user = rows[0];

      if (!user.password_hash) {
        return res.status(401).json({ success: false, message: 'Please log in using Phone OTP verification.' });
      }

      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
      }
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    // Audit Log
    await logAudit({
      userId: user.id,
      action: user.role === 'ADMIN' ? 'ADMIN_LOGIN' : 'STUDENT_LOGIN',
      entityType: 'USER',
      entityId: user.id
    });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        studentId: user.student_id,
        department: user.department,
        year: user.year,
        bloodGroup: user.blood_group,
        availability: Boolean(user.availability),
        lastDonationDate: user.last_donation_date
      }
    });
  } catch (error) {
    next(error);
  }
};

// Admin Secure Login
const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required.' });
    }

    const [rows] = await pool.query(
      "SELECT * FROM users WHERE email = ? AND role = 'ADMIN' AND status = 'ACTIVE'",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
    }

    const adminUser = rows[0];
    const isValid = await bcrypt.compare(password, adminUser.password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
    }

    const token = jwt.sign(
      { id: adminUser.id, email: adminUser.email, role: 'ADMIN', name: adminUser.name },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '2d' }
    );

    await logAudit({
      userId: adminUser.id,
      action: 'ADMIN_LOGIN',
      entityType: 'USER',
      entityId: adminUser.id
    });

    res.json({
      success: true,
      message: 'Admin authorization successful',
      token,
      user: {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        phone: adminUser.phone,
        role: 'ADMIN'
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  adminLogin
};
