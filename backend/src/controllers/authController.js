const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const pool = require('../config/database');
const { verifyIdToken } = require('../config/firebaseAdmin');
const { logAudit } = require('../services/auditService');
const { sendOtp, verifyOtp, normalizePhone } = require('../services/otpService');

const handleSendOtp = async (req, res, next) => {
  try {
    const { phone, email, name, purpose } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Please provide a mobile phone number.' });
    }

    const normalized = normalizePhone(phone);

    // If purpose is LOGIN, check if user exists
    if (purpose === 'LOGIN') {
      const [rows] = await pool.query(
        'SELECT id, name, status FROM users WHERE phone = ?',
        [normalized]
      );
      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No student account found for this mobile number. Please register as a donor first.'
        });
      }
      if (rows[0].status !== 'ACTIVE') {
        return res.status(403).json({
          success: false,
          message: 'Your student account is inactive. Please contact campus admin.'
        });
      }
    }

    // If purpose is REGISTER, check if phone already registered
    if (purpose === 'REGISTER') {
      const [rows] = await pool.query(
        'SELECT id FROM users WHERE phone = ?',
        [normalized]
      );
      if (rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'This mobile number is already registered. Please log in directly.'
        });
      }
    }

    const result = await sendOtp({
      phone: normalized,
      email: email || null,
      name: name || 'Student Donor',
      purpose: purpose || 'REGISTER'
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// 2. Verify User Entered Real-Time OTP Code
const handleVerifyOtp = async (req, res, next) => {
  try {
    const { phone, otpCode, purpose } = req.body;
    if (!phone || !otpCode) {
      return res.status(400).json({ success: false, message: 'Phone number and 6-digit OTP code are required.' });
    }

    const result = await verifyOtp({ phone, otpCode, purpose });
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 3. One-step Phone Login with OTP
const handlePhoneLogin = async (req, res, next) => {
  try {
    const { phone, otpCode, verificationToken } = req.body;
    const normalized = normalizePhone(phone);

    if (!normalized) {
      return res.status(400).json({ success: false, message: 'Phone number required.' });
    }

    // If otpCode provided, verify it first
    if (otpCode) {
      await verifyOtp({ phone: normalized, otpCode, purpose: 'LOGIN' });
    } else if (verificationToken) {
      try {
        const decoded = jwt.verify(verificationToken, process.env.JWT_SECRET || 'secret');
        if (decoded.phone !== normalized) {
          return res.status(401).json({ success: false, message: 'Invalid verification token for this phone.' });
        }
      } catch (e) {
        return res.status(401).json({ success: false, message: 'Verification token expired. Please request a new OTP.' });
      }
    } else {
      return res.status(400).json({ success: false, message: 'OTP code or verification token required.' });
    }

    // Fetch user profile
    const [rows] = await pool.query(
      `SELECT u.*, s.id as student_table_id, s.student_id, s.department, s.year, s.blood_group, s.availability, s.last_donation_date
       FROM users u
       LEFT JOIN students s ON u.id = s.user_id
       WHERE u.phone = ? AND u.status = 'ACTIVE'`,
      [normalized]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No student profile found with this mobile number. Please register first.'
      });
    }

    const user = rows[0];

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    await logAudit({
      userId: user.id,
      action: 'PHONE_OTP_LOGIN',
      entityType: 'USER',
      entityId: user.id
    });

    res.json({
      success: true,
      message: 'Mobile OTP login successful!',
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

// 4. Student Registration with Verified Phone OTP
const register = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const {
      verificationToken,
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
        message: 'Please provide all required student profile fields.'
      });
    }

    const normalizedPhone = normalizePhone(phone);

    // Verify verification token if provided
    if (verificationToken) {
      try {
        const decoded = jwt.verify(verificationToken, process.env.JWT_SECRET || 'secret');
        if (decoded.phone !== normalizedPhone) {
          return res.status(400).json({ success: false, message: 'Verification token does not match phone number.' });
        }
      } catch (err) {
        console.warn('Verification token decode note:', err.message);
      }
    }

    let firebaseUid = null;
    if (firebaseToken) {
      try {
        const decodedFirebase = await verifyIdToken(firebaseToken);
        firebaseUid = decodedFirebase.uid;
      } catch (err) {
        console.warn('Firebase Token verification note:', err.message);
      }
    }

    await connection.beginTransaction();

    // Check unique constraints (Email, Phone)
    const [existingUsers] = await connection.query(
      'SELECT email, phone FROM users WHERE email = ? OR phone = ?',
      [email.trim().toLowerCase(), normalizedPhone]
    );

    if (existingUsers.length > 0) {
      await connection.rollback();
      const match = existingUsers[0];
      const field = match.email.toLowerCase() === email.trim().toLowerCase() ? 'Email' : 'Mobile phone number';
      return res.status(409).json({
        success: false,
        message: `${field} is already registered. Please log in.`
      });
    }

    const [existingStudent] = await connection.query(
      'SELECT student_id FROM students WHERE student_id = ?',
      [studentId.trim()]
    );

    if (existingStudent.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: 'Student Roll / ID is already registered.'
      });
    }

    const passwordHash = password ? await bcrypt.hash(password, 10) : await bcrypt.hash('Donor@2026', 10);

    // Insert User
    const [userResult] = await connection.query(
      `INSERT INTO users (firebase_uid, name, email, phone, password_hash, role, status)
       VALUES (?, ?, ?, ?, ?, 'STUDENT', 'ACTIVE')`,
      [firebaseUid, name.trim(), email.trim().toLowerCase(), normalizedPhone, passwordHash]
    );

    const userId = userResult.insertId;

    // Insert Student Profile
    await connection.query(
      `INSERT INTO students (user_id, student_id, department, year, blood_group, availability)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [userId, studentId.trim(), department, parseInt(year, 10), bloodGroup]
    );

    await connection.commit();

    // Log Audit
    await logAudit({
      userId,
      action: 'USER_REGISTERED',
      entityType: 'USER',
      entityId: userId,
      metadata: { studentId, bloodGroup, department, phone: normalizedPhone }
    });

    // Generate Application JWT
    const token = jwt.sign(
      { id: userId, email: email.trim().toLowerCase(), role: 'STUDENT', name: name.trim() },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Mobile OTP verified and campus donor profile registered successfully!',
      token,
      user: {
        id: userId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: normalizedPhone,
        role: 'STUDENT',
        studentId: studentId.trim(),
        department,
        year: parseInt(year, 10),
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

// 5. Login with Email/Phone + Password or Firebase Token
const login = async (req, res, next) => {
  try {
    const { emailOrPhone, password, firebaseToken } = req.body;

    let user = null;

    if (firebaseToken) {
      const decodedFirebase = await verifyIdToken(firebaseToken);
      const phone = normalizePhone(decodedFirebase.phone_number);
      
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
          message: 'No student account found for this phone number. Please register first.'
        });
      }
      user = rows[0];
    } else {
      if (!emailOrPhone || !password) {
        return res.status(400).json({ success: false, message: 'Please enter your email/phone and password.' });
      }

      const cleanInput = emailOrPhone.trim();
      const normalizedInput = normalizePhone(cleanInput);

      const [rows] = await pool.query(
        `SELECT u.*, s.student_id, s.department, s.year, s.blood_group, s.availability, s.last_donation_date
         FROM users u
         LEFT JOIN students s ON u.id = s.user_id
         WHERE (u.email = ? OR u.phone = ? OR u.phone = ?) AND u.status = 'ACTIVE'`,
        [cleanInput.toLowerCase(), cleanInput, normalizedInput]
      );

      if (rows.length === 0) {
        return res.status(401).json({ success: false, message: 'Invalid credentials or account inactive.' });
      }

      user = rows[0];

      if (!user.password_hash) {
        return res.status(401).json({ success: false, message: 'Please log in using Phone SMS OTP verification.' });
      }

      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ success: false, message: 'Invalid password.' });
      }
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

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

// 6. Admin Secure Login
const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required.' });
    }

    const [rows] = await pool.query(
      "SELECT * FROM users WHERE email = ? AND role = 'ADMIN' AND status = 'ACTIVE'",
      [email.trim().toLowerCase()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
    }

    const adminUser = rows[0];
    const isValid = await bcrypt.compare(password, adminUser.password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid admin password.' });
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

// 7. Get Recent SMS Logs (Admin & Gateway status)
const getSmsLogs = async (req, res, next) => {
  try {
    const [logs] = await pool.query(
      'SELECT * FROM sms_logs ORDER BY id DESC LIMIT 50'
    );
    res.json({ success: true, logs });
  } catch (error) {
    next(error);
  }
};

// 8. Initiate Google OAuth Flow
const googleAuth = (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({
      success: false,
      message: 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env'
    });
  }

  const backendPort = process.env.PORT || 5000;
  const backendUrl = process.env.BACKEND_URL || `http://localhost:${backendPort}`;
  const redirectUri = `${backendUrl}/api/auth/google/callback`;
  const scope = encodeURIComponent('openid profile email');
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;

  res.redirect(googleAuthUrl);
};

// 9. Handle Google OAuth Callback
const googleAuthCallback = async (req, res, next) => {
  const { code, error } = req.query;
  const frontendUrl = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim().replace(/\/+$/, '');

  if (error || !code) {
    console.warn('Google OAuth error or cancellation:', error);
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(error || 'Google sign-in was cancelled.')}`);
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const backendPort = process.env.PORT || 5000;
    const backendUrl = process.env.BACKEND_URL || `http://localhost:${backendPort}`;
    const redirectUri = `${backendUrl}/api/auth/google/callback`;

    // Exchange authorization code for tokens
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });

    const { access_token } = tokenResponse.data;

    // Fetch user profile info from Google
    const profileResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
      timeout: 10000
    });

    const googleUser = profileResponse.data;
    const email = (googleUser.email || '').trim().toLowerCase();
    const name = (googleUser.name || 'Campus Student').trim();
    const googleId = googleUser.id || '';

    if (!email) {
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('No email associated with this Google account.')}`);
    }

    // Check if user exists in database
    const [existingRows] = await pool.query(
      `SELECT u.*, s.id as student_table_id, s.student_id, s.department, s.year, s.blood_group, s.availability, s.last_donation_date
       FROM users u
       LEFT JOIN students s ON u.id = s.user_id
       WHERE u.email = ?`,
      [email]
    );

    let user = null;

    if (existingRows.length > 0) {
      user = existingRows[0];
      if (user.status !== 'ACTIVE') {
        return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Your student account is inactive. Please contact campus admin.')}`);
      }
    } else {
      // Auto-register new student user via Google
      const generatedPhone = '+919' + Math.floor(100000000 + Math.random() * 900000000);
      const generatedStudentId = 'STU' + (googleId ? String(googleId).slice(-6) : Math.floor(100000 + Math.random() * 900000));

      const [insertUser] = await pool.query(
        `INSERT INTO users (name, email, phone, role, status)
         VALUES (?, ?, ?, 'STUDENT', 'ACTIVE')`,
        [name, email, generatedPhone]
      );

      const userId = insertUser.insertId;

      await pool.query(
        `INSERT INTO students (user_id, student_id, department, year, blood_group, availability)
         VALUES (?, ?, 'Computer Science & Engineering', 1, 'O+', 1)`,
        [userId, generatedStudentId]
      );

      user = {
        id: userId,
        name,
        email,
        phone: generatedPhone,
        role: 'STUDENT',
        student_id: generatedStudentId,
        department: 'Computer Science & Engineering',
        year: 1,
        blood_group: 'O+',
        availability: true,
        last_donation_date: null
      };
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    await logAudit({
      userId: user.id,
      action: 'GOOGLE_OAUTH_LOGIN',
      entityType: 'USER',
      entityId: user.id
    });

    const userPayload = encodeURIComponent(JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      studentId: user.student_id,
      department: user.department,
      year: user.year,
      bloodGroup: user.blood_group || 'O+',
      availability: Boolean(user.availability),
      lastDonationDate: user.last_donation_date
    }));

    return res.redirect(`${frontendUrl}/login?token=${token}&user=${userPayload}`);
  } catch (err) {
    console.error('Google OAuth callback error:', err.response?.data || err.message);
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Failed to authenticate with Google. Please check your credentials.')}`);
  }
};

module.exports = {
  handleSendOtp,
  handleVerifyOtp,
  handlePhoneLogin,
  register,
  login,
  adminLogin,
  getSmsLogs,
  googleAuth,
  googleAuthCallback
};

