const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
require('dotenv').config();

let dbType = 'MYSQL';
let pool = null;
let sqliteDb = null;

// Helper to sanitize/adapt SQL queries between MySQL and SQLite
function adaptSqlForSqlite(sql) {
  let s = sql;
  // Replace MySQL specific functions and constructs
  s = s.replace(/NOW\(\)/gi, "datetime('now', 'localtime')");
  s = s.replace(/CURRENT_DATE\(\)/gi, "date('now', 'localtime')");
  s = s.replace(/DATE_FORMAT\s*\(\s*([^,]+)\s*,\s*'%Y-%m'\s*\)/gi, "strftime('%Y-%m', $1)");
  s = s.replace(/DATE_FORMAT\s*\(\s*([^,]+)\s*,\s*['"]%Y-%m['"]\s*\)/gi, "strftime('%Y-%m', $1)");
  s = s.replace(/ON\s+DUPLICATE\s+KEY\s+UPDATE\s+[^;]+/gi, '');
  return s;
}

// Initialize SQLite database fallback if MySQL is not available
function initSqliteFallback() {
  try {
    const Database = require('better-sqlite3');
    let dbDir = path.join(process.cwd(), 'database');
    try {
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
    } catch (e) {
      dbDir = process.cwd();
    }
    const dbPath = path.join(dbDir, 'campus_bloodconnect.sqlite');
    sqliteDb = new Database(dbPath);
    sqliteDb.pragma('foreign_keys = ON');

    // Register MySQL compatibility functions in SQLite
    sqliteDb.function('DATE_FORMAT', (val, fmt) => {
      if (!val) return null;
      const d = new Date(val);
      if (isNaN(d.getTime())) {
        const s = String(val);
        return s.substring(0, 7);
      }
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      return `${yyyy}-${mm}`;
    });

    sqliteDb.function('COALESCE_NULL', (a, b) => (a !== null && a !== undefined ? a : b));

    // Create tables in SQLite
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firebase_uid TEXT UNIQUE NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT NOT NULL UNIQUE,
        password_hash TEXT NULL,
        role TEXT NOT NULL DEFAULT 'STUDENT',
        status TEXT DEFAULT 'ACTIVE',
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime'))
      );

      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        student_id TEXT NOT NULL UNIQUE,
        department TEXT NOT NULL,
        year INTEGER NOT NULL,
        blood_group TEXT NOT NULL,
        availability INTEGER DEFAULT 1,
        last_donation_date TEXT NULL,
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS blood_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        blood_group TEXT NOT NULL,
        component TEXT DEFAULT 'Whole Blood / RBC',
        units_required INTEGER NOT NULL DEFAULT 1,
        hospital_name TEXT NOT NULL,
        hospital_address TEXT NOT NULL,
        hospital_phone TEXT NOT NULL,
        required_date TEXT NOT NULL,
        required_time TEXT NULL,
        urgency TEXT DEFAULT 'NORMAL',
        additional_info TEXT NULL,
        status TEXT DEFAULT 'ACTIVE',
        created_by INTEGER NOT NULL,
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime')),
        FOREIGN KEY (created_by) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS donor_matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        blood_request_id INTEGER NOT NULL,
        donor_id INTEGER NOT NULL,
        match_type TEXT NOT NULL,
        notification_status TEXT DEFAULT 'PENDING',
        response TEXT DEFAULT 'PENDING',
        confirmed INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime')),
        FOREIGN KEY (blood_request_id) REFERENCES blood_requests(id) ON DELETE CASCADE,
        FOREIGN KEY (donor_id) REFERENCES students(id) ON DELETE CASCADE,
        UNIQUE(blood_request_id, donor_id)
      );

      CREATE TABLE IF NOT EXISTS donations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        donor_id INTEGER NOT NULL,
        blood_request_id INTEGER NULL,
        donation_date TEXT NOT NULL,
        units REAL DEFAULT 1.0,
        hospital_name TEXT NOT NULL,
        verification_status TEXT DEFAULT 'PENDING',
        verified_by INTEGER NULL,
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        FOREIGN KEY (donor_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (blood_request_id) REFERENCES blood_requests(id) ON DELETE SET NULL,
        FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        blood_request_id INTEGER NULL,
        notification_type TEXT DEFAULT 'EMERGENCY_ALERT',
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (blood_request_id) REFERENCES blood_requests(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS sms_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        donor_id INTEGER NULL,
        blood_request_id INTEGER NULL,
        phone TEXT NOT NULL,
        message TEXT NOT NULL,
        provider TEXT DEFAULT 'FIREBASE_OR_SMS_GATEWAY',
        delivery_status TEXT DEFAULT 'PENDING',
        provider_message_id TEXT NULL,
        sent_at TEXT DEFAULT (datetime('now', 'localtime')),
        FOREIGN KEY (donor_id) REFERENCES students(id) ON DELETE SET NULL,
        FOREIGN KEY (blood_request_id) REFERENCES blood_requests(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NULL,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id INTEGER NULL,
        metadata TEXT NULL,
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS otp_verifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT NOT NULL,
        otp_code TEXT NOT NULL,
        purpose TEXT DEFAULT 'REGISTER',
        attempts INTEGER DEFAULT 0,
        is_verified INTEGER DEFAULT 0,
        expires_at INTEGER NOT NULL,
        created_at TEXT DEFAULT (datetime('now', 'localtime'))
      );
    `);

    // Seed admin and initial students if users table is empty
    const count = sqliteDb.prepare('SELECT COUNT(*) as count FROM users').get().count;
    if (count === 0) {
      const adminHash = bcrypt.hashSync('Admin@12345', 10);
      const studentHash = bcrypt.hashSync('Admin@12345', 10);

      const insertUser = sqliteDb.prepare(`
        INSERT INTO users (name, email, phone, password_hash, role, status)
        VALUES (?, ?, ?, ?, ?, 'ACTIVE')
      `);

      const insertStudent = sqliteDb.prepare(`
        INSERT INTO students (user_id, student_id, department, year, blood_group, availability, last_donation_date)
        VALUES (?, ?, ?, ?, ?, 1, ?)
      `);

      const adminRes = insertUser.run('Campus Health Admin', 'admin@campus.edu', '+919999000000', adminHash, 'ADMIN');
      const adminId = adminRes.lastInsertRowid;

      const s1 = insertUser.run('John Doe', 'john.doe@campus.edu', '+919876543210', studentHash, 'STUDENT');
      insertStudent.run(s1.lastInsertRowid, 'CS2026001', 'Computer Science & Engineering', 3, 'O+', '2025-11-15');

      const s2 = insertUser.run('Jane Smith', 'jane.smith@campus.edu', '+919876543211', studentHash, 'STUDENT');
      insertStudent.run(s2.lastInsertRowid, 'EC2026042', 'Electronics & Communication', 2, 'A+', '2025-10-01');

      const s3 = insertUser.run('Rahul Sharma', 'rahul.s@campus.edu', '+919876543212', studentHash, 'STUDENT');
      insertStudent.run(s3.lastInsertRowid, 'ME2025019', 'Mechanical Engineering', 4, 'B+', '2025-08-20');

      const s4 = insertUser.run('Priya Patel', 'priya.p@campus.edu', '+919876543213', studentHash, 'STUDENT');
      insertStudent.run(s4.lastInsertRowid, 'BT2026088', 'Bio-Technology', 2, 'O-', null);

      // Seed Initial Sample Blood Request
      const insertReq = sqliteDb.prepare(`
        INSERT INTO blood_requests (blood_group, component, units_required, hospital_name, hospital_address, hospital_phone, required_date, required_time, urgency, additional_info, status, created_by)
        VALUES ('O+', 'Packed Red Blood Cells', 2, 'University Teaching Hospital', 'Medical Campus, 3rd Floor ICU', '+91-9876500001', date('now', 'localtime'), '16:00:00', 'EMERGENCY', 'Urgent requirement for trauma surgery patient.', 'EMERGENCY', ?)
      `);
      const reqRes = insertReq.run(adminId);
      const reqId = reqRes.lastInsertRowid;

      // Match O+ (John Doe id: 1) and O- (Priya Patel id: 4)
      const student1 = sqliteDb.prepare('SELECT id FROM students WHERE user_id = ?').get(s1.lastInsertRowid);
      const student4 = sqliteDb.prepare('SELECT id FROM students WHERE user_id = ?').get(s4.lastInsertRowid);

      if (student1) {
        sqliteDb.prepare(`
          INSERT INTO donor_matches (blood_request_id, donor_id, match_type, notification_status, response)
          VALUES (?, ?, 'EXACT', 'SENT', 'PENDING')
        `).run(reqId, student1.id);
      }
      if (student4) {
        sqliteDb.prepare(`
          INSERT INTO donor_matches (blood_request_id, donor_id, match_type, notification_status, response)
          VALUES (?, ?, 'COMPATIBLE', 'SENT', 'PENDING')
        `).run(reqId, student4.id);
      }

      console.log('🌱 SQLite database initialized and seeded with campus test data successfully!');
    }

    dbType = 'SQLITE';
    console.log('💾 Database Mode: Embedded SQLite Engine (Fast, Persistent & Zero-Config)');
  } catch (err) {
    console.error('❌ Failed to initialize SQLite fallback:', err.message);
  }
}

// Database query wrapper that supports both MySQL2 and SQLite transparently
async function executeSql(sql, params = []) {
  if (dbType === 'MYSQL' && pool) {
    return pool.query(sql, params);
  }

  // SQLite execution
  if (!sqliteDb) {
    initSqliteFallback();
  }

  // Handle parameter flattening for IN (?) queries (e.g. IN (['A+', 'O+']))
  let adaptedSql = adaptSqlForSqlite(sql);
  let flatParams = [];

  // Check for array inside params for IN (?)
  if (params && params.length > 0) {
    let paramIndex = 0;
    adaptedSql = adaptedSql.replace(/\?/g, (match) => {
      const val = params[paramIndex++];
      if (Array.isArray(val)) {
        flatParams.push(...val);
        return val.map(() => '?').join(', ');
      } else {
        flatParams.push(val === undefined ? null : val);
        return '?';
      }
    });
  }

  const trimmed = adaptedSql.trim().toUpperCase();

  if (trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA')) {
    const stmt = sqliteDb.prepare(adaptedSql);
    const rows = stmt.all(...flatParams);
    return [rows, []];
  } else {
    const stmt = sqliteDb.prepare(adaptedSql);
    const info = stmt.run(...flatParams);
    return [{
      insertId: Number(info.lastInsertRowid),
      affectedRows: info.changes,
      warningStatus: 0
    }, []];
  }
}

// Unified Database Adapter Object
const dbAdapter = {
  query: (sql, params) => executeSql(sql, params),
  getConnection: async () => {
    if (dbType === 'MYSQL' && pool) {
      return pool.getConnection();
    }
    // SQLite connection simulation
    return {
      query: (sql, params) => executeSql(sql, params),
      beginTransaction: async () => {
        sqliteDb.prepare('BEGIN').run();
      },
      commit: async () => {
        try {
          sqliteDb.prepare('COMMIT').run();
        } catch (e) {
          // Ignore if no transaction active
        }
      },
      rollback: async () => {
        try {
          sqliteDb.prepare('ROLLBACK').run();
        } catch (e) {
          // Ignore if no transaction active
        }
      },
      release: () => {}
    };
  }
};

// Attempt MySQL connection on startup, fallback to SQLite on failure
(async () => {
  try {
    const mysqlPool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'campus_bloodconnect',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      waitForConnections: true,
      connectionLimit: 15,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    });

    const conn = await mysqlPool.getConnection();
    console.log('✅ Connected to MySQL Database successfully');
    conn.release();
    pool = mysqlPool;
    dbType = 'MYSQL';
  } catch (err) {
    console.log('ℹ️  MySQL not detected/accessible. Switching to embedded SQLite engine...');
    initSqliteFallback();
  }
})();

module.exports = dbAdapter;

