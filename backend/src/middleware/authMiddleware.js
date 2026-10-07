const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const authorize = require('./roleMiddleware');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required. Token missing.' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Session expired or invalid token.' });
    }

    // Verify user in Database
    const [rows] = await pool.query(
      'SELECT id, firebase_uid, name, email, phone, role, status FROM users WHERE id = ?',
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'User account not found.' });
    }

    const user = rows[0];
    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ success: false, message: 'Account has been disabled.' });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

authenticate.verifyToken = authenticate;
authenticate.requireRole = (roles) => Array.isArray(roles) ? authorize(...roles) : authorize(roles);

module.exports = authenticate;
module.exports.verifyToken = authenticate;
module.exports.requireRole = authenticate.requireRole;

