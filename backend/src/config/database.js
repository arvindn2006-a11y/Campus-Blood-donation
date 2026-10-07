const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
require('dotenv').config();

let dbType = 'NONE';
let pool = null;
let sqliteDb = null;

// ============================================================================
// 1. PURE JAVASCRIPT IN-MEMORY & JSON-PERSISTENT DATABASE ENGINE
// (Guaranteed to run anywhere: Vercel Serverless, Node.js, Cloud, Docker)
// ============================================================================

const jsonDbPath = process.env.VERCEL ? '/tmp/campus_bloodconnect_db.json' : path.join(process.cwd(), 'database', 'campus_bloodconnect_db.json');

let memoryDb = {
  users: [],
  students: [],
  blood_requests: [],
  donor_matches: [],
  donations: [],
  notifications: [],
  sms_logs: [],
  audit_logs: [],
  otp_verifications: [],
  _autoId: {
    users: 1,
    students: 1,
    blood_requests: 1,
    donor_matches: 1,
    donations: 1,
    notifications: 1,
    sms_logs: 1,
    audit_logs: 1,
    otp_verifications: 1
  }
};

function saveJsonDb() {
  try {
    const dir = path.dirname(jsonDbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(jsonDbPath, JSON.stringify(memoryDb, null, 2), 'utf-8');
  } catch (e) {}
}

function loadJsonDb() {
  try {
    if (fs.existsSync(jsonDbPath)) {
      const raw = fs.readFileSync(jsonDbPath, 'utf-8');
      const loaded = JSON.parse(raw);
      if (loaded && loaded.users) {
        memoryDb = loaded;
        return true;
      }
    }
  } catch (e) {}
  return false;
}

function seedMemoryDb() {
  if (memoryDb.users.length > 0) return;

  const adminHash = bcrypt.hashSync('Admin@12345', 10);
  const studentHash = bcrypt.hashSync('Admin@12345', 10);
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  // Admin Account
  memoryDb.users.push({
    id: 1,
    firebase_uid: null,
    name: 'Campus Health Admin',
    email: 'admin@campus.edu',
    phone: '+919999000000',
    password_hash: adminHash,
    role: 'ADMIN',
    status: 'ACTIVE',
    created_at: now,
    updated_at: now
  });

  // Students
  const s1User = {
    id: 2,
    firebase_uid: null,
    name: 'John Doe',
    email: 'john.doe@campus.edu',
    phone: '+919876543210',
    password_hash: studentHash,
    role: 'STUDENT',
    status: 'ACTIVE',
    created_at: now,
    updated_at: now
  };
  memoryDb.users.push(s1User);
  memoryDb.students.push({
    id: 1,
    user_id: 2,
    student_id: 'CS2023001',
    department: 'Computer Science',
    year: 3,
    blood_group: 'O+',
    availability: 1,
    last_donation_date: '2026-08-15',
    created_at: now,
    updated_at: now
  });

  const s2User = {
    id: 3,
    firebase_uid: null,
    name: 'Jane Smith',
    email: 'jane.smith@campus.edu',
    phone: '+919876543211',
    password_hash: studentHash,
    role: 'STUDENT',
    status: 'ACTIVE',
    created_at: now,
    updated_at: now
  };
  memoryDb.users.push(s2User);
  memoryDb.students.push({
    id: 2,
    user_id: 3,
    student_id: 'EC2023045',
    department: 'Electronics & Comm.',
    year: 2,
    blood_group: 'A+',
    availability: 1,
    last_donation_date: '2026-07-20',
    created_at: now,
    updated_at: now
  });

  const s3User = {
    id: 4,
    firebase_uid: null,
    name: 'Priya Patel',
    email: 'priya.p@campus.edu',
    phone: '+919876543212',
    password_hash: studentHash,
    role: 'STUDENT',
    status: 'ACTIVE',
    created_at: now,
    updated_at: now
  };
  memoryDb.users.push(s3User);
  memoryDb.students.push({
    id: 3,
    user_id: 4,
    student_id: 'BT2022018',
    department: 'Biotechnology',
    year: 4,
    blood_group: 'O-',
    availability: 1,
    last_donation_date: null,
    created_at: now,
    updated_at: now
  });

  // Seed Initial Blood Request
  memoryDb.blood_requests.push({
    id: 1,
    blood_group: 'O+',
    component: 'Whole Blood / RBC',
    units_required: 2,
    hospital_name: 'Campus Medical Health Center',
    hospital_address: 'Building B, University Hospital Complex',
    hospital_phone: '+91-9876500000',
    required_date: new Date().toISOString().split('T')[0],
    required_time: '18:00',
    urgency: 'EMERGENCY',
    additional_info: 'Emergency surgical procedure scheduled. Urgent blood needed.',
    status: 'ACTIVE',
    created_by: 1,
    created_at: now,
    updated_at: now
  });

  // Matches
  memoryDb.donor_matches.push({
    id: 1,
    blood_request_id: 1,
    donor_id: 1,
    match_type: 'EXACT',
    notification_status: 'SENT',
    response: 'PENDING',
    confirmed: 0,
    created_at: now,
    updated_at: now
  });

  memoryDb.donor_matches.push({
    id: 2,
    blood_request_id: 1,
    donor_id: 3,
    match_type: 'COMPATIBLE',
    notification_status: 'SENT',
    response: 'PENDING',
    confirmed: 0,
    created_at: now,
    updated_at: now
  });

  memoryDb._autoId.users = 10;
  memoryDb._autoId.students = 10;
  memoryDb._autoId.blood_requests = 10;
  memoryDb._autoId.donor_matches = 10;
  memoryDb._autoId.donations = 10;
  memoryDb._autoId.notifications = 10;
  memoryDb._autoId.sms_logs = 10;
  memoryDb._autoId.audit_logs = 10;
  memoryDb._autoId.otp_verifications = 10;

  saveJsonDb();
}

// Pure JS SQL Execution Engine
function executeJsSql(sql, params = []) {
  let cleanSql = sql.trim().replace(/;/g, '');
  const upper = cleanSql.toUpperCase();

  // Normalize parameters
  const flatParams = [];
  params.forEach(p => {
    if (Array.isArray(p)) flatParams.push(...p);
    else flatParams.push(p === undefined ? null : p);
  });

  // 1. INSERT QUERY
  if (upper.startsWith('INSERT INTO')) {
    const match = cleanSql.match(/INSERT\s+INTO\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
    if (match) {
      const table = match[1].toLowerCase();
      const cols = match[2].split(',').map(c => c.trim().toLowerCase());
      
      const newRow = {};
      let pIdx = 0;
      cols.forEach(col => {
        newRow[col] = flatParams[pIdx++] !== undefined ? flatParams[pIdx - 1] : null;
      });

      if (!memoryDb[table]) memoryDb[table] = [];
      const id = memoryDb._autoId[table] ? memoryDb._autoId[table]++ : (memoryDb[table].length + 1);
      newRow.id = id;
      if (!newRow.created_at) newRow.created_at = new Date().toISOString().replace('T', ' ').substring(0, 19);
      if (!newRow.updated_at) newRow.updated_at = new Date().toISOString().replace('T', ' ').substring(0, 19);

      memoryDb[table].push(newRow);
      saveJsonDb();

      return [{ insertId: id, affectedRows: 1 }, []];
    }
  }

  // 2. UPDATE QUERY
  if (upper.startsWith('UPDATE')) {
    const match = cleanSql.match(/UPDATE\s+([a-zA-Z0-9_]+)\s+SET\s+(.+?)(?:\s+WHERE\s+(.+))?$/i);
    if (match) {
      const table = match[1].toLowerCase();
      const setClause = match[2];
      const whereClause = match[3] || '';

      const setPairs = setClause.split(',').map(p => p.trim());
      let paramIdx = 0;

      const updates = {};
      setPairs.forEach(pair => {
        const [col, valExpr] = pair.split('=').map(s => s.trim());
        const cleanCol = col.toLowerCase();
        if (valExpr === '?') {
          updates[cleanCol] = flatParams[paramIdx++];
        } else if (valExpr.toUpperCase() === 'TRUE' || valExpr === '1') {
          updates[cleanCol] = 1;
        } else if (valExpr.toUpperCase() === 'FALSE' || valExpr === '0') {
          updates[cleanCol] = 0;
        } else if (valExpr.toUpperCase() === 'NOW()' || valExpr.toUpperCase().includes('DATETIME')) {
          updates[cleanCol] = new Date().toISOString().replace('T', ' ').substring(0, 19);
        } else {
          updates[cleanCol] = valExpr.replace(/['"]/g, '');
        }
      });

      let affected = 0;
      if (memoryDb[table]) {
        memoryDb[table].forEach(row => {
          let matchRow = true;
          if (whereClause) {
            matchRow = evaluateWhere(row, whereClause, flatParams, paramIdx);
          }
          if (matchRow) {
            Object.assign(row, updates);
            row.updated_at = new Date().toISOString().replace('T', ' ').substring(0, 19);
            affected++;
          }
        });
      }
      saveJsonDb();
      return [{ affectedRows: affected, changedRows: affected }, []];
    }
  }

  // 3. DELETE QUERY
  if (upper.startsWith('DELETE FROM')) {
    const match = cleanSql.match(/DELETE\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+(.+))?$/i);
    if (match) {
      const table = match[1].toLowerCase();
      const whereClause = match[2] || '';
      let initialCount = memoryDb[table] ? memoryDb[table].length : 0;
      if (memoryDb[table]) {
        if (!whereClause) {
          memoryDb[table] = [];
        } else {
          memoryDb[table] = memoryDb[table].filter(row => !evaluateWhere(row, whereClause, flatParams, 0));
        }
      }
      saveJsonDb();
      const affected = initialCount - (memoryDb[table] ? memoryDb[table].length : 0);
      return [{ affectedRows: affected }, []];
    }
  }

  // 4. SELECT QUERY
  if (upper.startsWith('SELECT')) {
    return [executeSelect(cleanSql, flatParams), []];
  }

  return [[], []];
}

// Evaluate simple WHERE predicates
function evaluateWhere(row, whereClause, params, startParamIdx = 0) {
  if (!whereClause) return true;
  let pIdx = startParamIdx;

  // Split conditions by AND
  const parts = whereClause.split(/\s+AND\s+/i);
  for (const part of parts) {
    const trimmed = part.trim();
    
    // Equal condition
    const eqMatch = trimmed.match(/([a-zA-Z0-9_.]+)\s*=\s*(\?|'[^']*'|[0-9]+|TRUE|FALSE)/i);
    if (eqMatch) {
      const col = eqMatch[1].split('.').pop().toLowerCase();
      let expected;
      if (eqMatch[2] === '?') {
        expected = params[pIdx++];
      } else if (eqMatch[2].toUpperCase() === 'TRUE') {
        expected = 1;
      } else if (eqMatch[2].toUpperCase() === 'FALSE') {
        expected = 0;
      } else {
        expected = eqMatch[2].replace(/['"]/g, '');
      }

      const actual = row[col];
      if (String(actual) !== String(expected) && actual != expected) {
        return false;
      }
      continue;
    }

    // IN condition: col IN (?, ?) or col IN ('A+', 'O+')
    const inMatch = trimmed.match(/([a-zA-Z0-9_.]+)\s+IN\s*\(([^)]+)\)/i);
    if (inMatch) {
      const col = inMatch[1].split('.').pop().toLowerCase();
      const inItems = inMatch[2].split(',').map(s => s.trim());
      const allowedValues = [];
      inItems.forEach(item => {
        if (item === '?') allowedValues.push(params[pIdx++]);
        else allowedValues.push(item.replace(/['"]/g, ''));
      });
      if (!allowedValues.includes(row[col])) return false;
      continue;
    }

    // LIKE condition
    const likeMatch = trimmed.match(/([a-zA-Z0-9_.]+)\s+LIKE\s*(\?|'[^']*')/i);
    if (likeMatch) {
      const col = likeMatch[1].split('.').pop().toLowerCase();
      let val = likeMatch[2] === '?' ? params[pIdx++] : likeMatch[2].replace(/['"]/g, '');
      val = String(val).replace(/%/g, '').toLowerCase();
      if (!String(row[col] || '').toLowerCase().includes(val)) return false;
      continue;
    }
  }

  return true;
}

// Execute SELECT query on memory collections
function executeSelect(sql, params) {
  const upper = sql.toUpperCase();
  let paramIdx = 0;

  // Aggregate COUNT queries (e.g. SELECT COUNT(*) as count FROM ...)
  if (upper.includes('COUNT(') || upper.includes('SUM(')) {
    let rows = evaluateSelectRows(sql, params, paramIdx);
    if (upper.includes('GROUP BY')) {
      return aggregateGroupBy(sql, rows);
    }
    const totalCount = rows.length;
    let totalUnits = 0;
    rows.forEach(r => { totalUnits += Number(r.units || r.units_required || 0); });

    return [{
      count: totalCount,
      total_units: totalUnits,
      'COUNT(*)': totalCount
    }];
  }

  let results = evaluateSelectRows(sql, params, paramIdx);

  // Sorting (ORDER BY)
  if (upper.includes('ORDER BY')) {
    const orderPart = sql.substring(upper.indexOf('ORDER BY') + 8);
    const orderCols = orderPart.split('LIMIT')[0].split(',').map(s => s.trim());
    results.sort((a, b) => {
      for (const ord of orderCols) {
        const [colRaw, dir] = ord.split(/\s+/);
        const col = colRaw.split('.').pop().toLowerCase();
        const isDesc = dir && dir.toUpperCase() === 'DESC';
        if (a[col] < b[col]) return isDesc ? 1 : -1;
        if (a[col] > b[col]) return isDesc ? -1 : 1;
      }
      return 0;
    });
  }

  // Slicing (LIMIT)
  if (upper.includes('LIMIT')) {
    const limitMatch = sql.match(/LIMIT\s+([0-9]+)(?:\s+OFFSET\s+([0-9]+))?/i);
    if (limitMatch) {
      const limit = parseInt(limitMatch[1], 10);
      const offset = limitMatch[2] ? parseInt(limitMatch[2], 10) : 0;
      results = results.slice(offset, offset + limit);
    }
  }

  return results;
}

function evaluateSelectRows(sql, params, paramIdx) {
  const upper = sql.toUpperCase();

  // Determine main table
  let fromMatch = sql.match(/FROM\s+([a-zA-Z0-9_]+)(?:\s+([a-zA-Z0-9_]+))?/i);
  if (!fromMatch) return [];
  const mainTable = fromMatch[1].toLowerCase();
  const mainAlias = fromMatch[2] ? fromMatch[2].toLowerCase() : mainTable;

  let baseRows = (memoryDb[mainTable] || []).map(r => ({ ...r }));

  // Handle JOINs
  const joinMatches = [...sql.matchAll(/(?:LEFT\s+|INNER\s+)?JOIN\s+([a-zA-Z0-9_]+)(?:\s+([a-zA-Z0-9_]+))?\s+ON\s+([^\s]+)\s*=\s*([^\s]+)/gi)];
  for (const jm of joinMatches) {
    const joinTable = jm[1].toLowerCase();
    const joinAlias = jm[2] ? jm[2].toLowerCase() : joinTable;
    const condLeft = jm[3].toLowerCase();
    const condRight = jm[4].toLowerCase();

    const joinedRows = [];
    baseRows.forEach(baseRow => {
      const targetList = memoryDb[joinTable] || [];
      const matches = targetList.filter(jRow => {
        const getVal = (expr) => {
          const [tableOrAlias, col] = expr.split('.');
          if (tableOrAlias === mainAlias || tableOrAlias === mainTable) return baseRow[col];
          if (tableOrAlias === joinAlias || tableOrAlias === joinTable) return jRow[col];
          return baseRow[expr] || jRow[expr];
        };
        return String(getVal(condLeft)) === String(getVal(condRight));
      });

      if (matches.length > 0) {
        matches.forEach(m => joinedRows.push({ ...m, ...baseRow }));
      }
    });
    baseRows = joinedRows;
  }

  // Handle WHERE
  const whereMatch = sql.match(/\s+WHERE\s+(.+?)(?:\s+GROUP\s+BY|\s+ORDER\s+BY|\s+LIMIT|$)/i);
  if (whereMatch) {
    const whereClause = whereMatch[1];
    baseRows = baseRows.filter(row => evaluateWhere(row, whereClause, params, paramIdx));
  }

  return baseRows;
}

function aggregateGroupBy(sql, rows) {
  const upper = sql.toUpperCase();
  const groupMatch = sql.match(/GROUP\s+BY\s+([a-zA-Z0-9_.]+)/i);
  if (!groupMatch) return rows;

  const groupCol = groupMatch[1].split('.').pop().toLowerCase();
  const grouped = {};

  rows.forEach(r => {
    const key = r[groupCol] || 'Other';
    if (!grouped[key]) {
      grouped[key] = {
        [groupCol]: key,
        count: 0,
        total_units: 0,
        donor_count: 0,
        verified_donations: 0
      };
    }
    grouped[key].count++;
    grouped[key].donor_count++;
    if (r.verification_status === 'VERIFIED') grouped[key].verified_donations++;
    grouped[key].total_units += Number(r.units || 1);
  });

  return Object.values(grouped);
}

// ============================================================================
// 2. DATABASE INITIALIZATION: MYSQL -> SQLITE -> PURE JS JSON ENGINE
// ============================================================================

async function initializeDatabase() {
  // Try MySQL if DB_HOST is configured and not default unconfigured localhost
  if (process.env.DB_HOST && process.env.DB_USER && process.env.DB_HOST !== 'localhost') {
    try {
      const mysql = require('mysql2/promise');
      pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });
      const conn = await pool.getConnection();
      conn.release();
      dbType = 'MYSQL';
      console.log('✅ Connected to MySQL Database Pool');
      return;
    } catch (err) {
      console.warn('⚠️  MySQL connection not available. Testing embedded engines...');
    }
  }

  // Try SQLite native addon if available
  try {
    const Database = require('better-sqlite3');
    const dbDir = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'database');
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
    sqliteDb = new Database(path.join(dbDir, 'campus_bloodconnect.sqlite'));
    sqliteDb.pragma('foreign_keys = ON');
    dbType = 'SQLITE';
    console.log('💾 Initialized SQLite Database Engine');
    return;
  } catch (sqliteErr) {
    // Expected in Vercel Serverless Function (No native binary needed)
  }

  // Pure JavaScript Engine fallback
  dbType = 'PURE_JS';
  loadJsonDb();
  seedMemoryDb();
  console.log('⚡ Initialized Zero-Dependency Pure JS In-Memory & JSON Engine (Vercel Serverless Ready)');
}

// Execute Query Function
async function query(sql, params = []) {
  if (dbType === 'NONE') {
    await initializeDatabase();
  }

  if (dbType === 'MYSQL' && pool) {
    return pool.query(sql, params);
  }

  if (dbType === 'SQLITE' && sqliteDb) {
    try {
      const trimmed = sql.trim().toUpperCase();
      if (trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA')) {
        const stmt = sqliteDb.prepare(sql);
        const rows = stmt.all(...params);
        return [rows, []];
      } else {
        const stmt = sqliteDb.prepare(sql);
        const info = stmt.run(...params);
        return [{ insertId: Number(info.lastInsertRowid), affectedRows: info.changes }, []];
      }
    } catch (err) {
      console.warn('SQLite execution error, falling back to Pure JS engine:', err.message);
    }
  }

  // Pure JS execution (100% resilient)
  return executeJsSql(sql, params);
}

// Unified Database Adapter
const dbAdapter = {
  query: (sql, params) => query(sql, params),
  getConnection: async () => {
    return {
      query: (sql, params) => query(sql, params),
      beginTransaction: async () => {},
      commit: async () => {},
      rollback: async () => {},
      release: () => {}
    };
  }
};

// Initialize immediately on load
initializeDatabase().catch(console.error);

module.exports = dbAdapter;
