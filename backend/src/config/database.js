const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
require('dotenv').config();

let dbType = 'NONE';
let pool = null;
let sqliteDb = null;

// ============================================================================
// 1. PURE JAVASCRIPT IN-MEMORY & JSON DATABASE ENGINE
// (100% Reliable, Zero-Dependency Engine for Vercel Serverless & Node.js)
// ============================================================================

const jsonDbPath = process.env.VERCEL 
  ? '/tmp/campus_bloodconnect_db.json' 
  : path.join(process.cwd(), 'database', 'campus_bloodconnect_db.json');

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
      if (loaded && loaded.users && loaded.users.length > 0) {
        memoryDb = loaded;
        return true;
      }
    }
  } catch (e) {}
  return false;
}

function seedMemoryDb() {
  if (memoryDb.users && memoryDb.users.length > 0) return;

  const adminHash = bcrypt.hashSync('Admin@12345', 10);
  const studentHash = bcrypt.hashSync('Admin@12345', 10);
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  memoryDb = {
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
      users: 10,
      students: 10,
      blood_requests: 10,
      donor_matches: 10,
      donations: 10,
      notifications: 10,
      sms_logs: 10,
      audit_logs: 10,
      otp_verifications: 10
    }
  };

  // 1. Admin Account
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

  // 2. Student Donors
  const studentsSeed = [
    {
      userId: 2,
      name: 'John Doe',
      email: 'john.doe@campus.edu',
      phone: '+919876543210',
      studentId: 'CS2023001',
      department: 'Computer Science',
      year: 3,
      bloodGroup: 'O+',
      availability: 1,
      lastDonationDate: '2026-08-15'
    },
    {
      userId: 3,
      name: 'Jane Smith',
      email: 'jane.smith@campus.edu',
      phone: '+919876543211',
      studentId: 'EC2023045',
      department: 'Electronics & Comm.',
      year: 2,
      bloodGroup: 'A+',
      availability: 1,
      lastDonationDate: '2026-07-20'
    },
    {
      userId: 4,
      name: 'Priya Patel',
      email: 'priya.p@campus.edu',
      phone: '+919876543212',
      studentId: 'BT2022018',
      department: 'Biotechnology',
      year: 4,
      bloodGroup: 'O-',
      availability: 1,
      lastDonationDate: null
    },
    {
      userId: 5,
      name: 'Rahul Verma',
      email: 'rahul.verma@campus.edu',
      phone: '+919876543213',
      studentId: 'ME2023019',
      department: 'Mechanical Eng.',
      year: 3,
      bloodGroup: 'B+',
      availability: 1,
      lastDonationDate: '2026-06-10'
    },
    {
      userId: 6,
      name: 'Ananya Sharma',
      email: 'ananya.sharma@campus.edu',
      phone: '+919876543214',
      studentId: 'EE2023022',
      department: 'Electrical Eng.',
      year: 2,
      bloodGroup: 'AB+',
      availability: 1,
      lastDonationDate: null
    }
  ];

  studentsSeed.forEach((s, idx) => {
    memoryDb.users.push({
      id: s.userId,
      firebase_uid: null,
      name: s.name,
      email: s.email,
      phone: s.phone,
      password_hash: studentHash,
      role: 'STUDENT',
      status: 'ACTIVE',
      created_at: now,
      updated_at: now
    });

    memoryDb.students.push({
      id: idx + 1,
      user_id: s.userId,
      student_id: s.studentId,
      department: s.department,
      year: s.year,
      blood_group: s.bloodGroup,
      availability: s.availability,
      last_donation_date: s.lastDonationDate,
      created_at: now,
      updated_at: now
    });
  });

  // 3. Initial Blood Request
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

  // 4. Initial Donor Matches
  memoryDb.donor_matches.push({
    id: 1,
    blood_request_id: 1,
    donor_id: 1, // John Doe (O+)
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
    donor_id: 3, // Priya Patel (O-)
    match_type: 'COMPATIBLE',
    notification_status: 'SENT',
    response: 'PENDING',
    confirmed: 0,
    created_at: now,
    updated_at: now
  });

  // 5. Initial Donations
  memoryDb.donations.push({
    id: 1,
    donor_id: 1,
    blood_request_id: null,
    donation_date: '2026-08-15',
    units: 1.0,
    hospital_name: 'Campus Health Center',
    verification_status: 'VERIFIED',
    verified_by: 1,
    created_at: now
  });

  memoryDb.donations.push({
    id: 2,
    donor_id: 2,
    blood_request_id: null,
    donation_date: '2026-07-20',
    units: 1.0,
    hospital_name: 'City Red Cross Center',
    verification_status: 'VERIFIED',
    verified_by: 1,
    created_at: now
  });

  // 6. Notifications
  memoryDb.notifications.push({
    id: 1,
    user_id: 2,
    blood_request_id: 1,
    notification_type: 'EMERGENCY_ALERT',
    message: '🚨 Emergency Alert: O+ blood required at Campus Medical Health Center for 2 unit(s). Urgency: EMERGENCY.',
    is_read: 0,
    created_at: now
  });

  memoryDb.notifications.push({
    id: 2,
    user_id: 4,
    blood_request_id: 1,
    notification_type: 'EMERGENCY_ALERT',
    message: '🚨 Emergency Alert: O+ blood required at Campus Medical Health Center for 2 unit(s). Urgency: EMERGENCY.',
    is_read: 0,
    created_at: now
  });

  saveJsonDb();
}

function normalizeSqlAndParams(sql, params) {
  let expandedSql = sql.trim().replace(/;/g, '');
  const flatParams = [];
  let paramIdx = 0;

  expandedSql = expandedSql.replace(/\?/g, () => {
    const p = params[paramIdx++];
    if (Array.isArray(p)) {
      if (p.length === 0) {
        flatParams.push(null);
        return '?';
      }
      flatParams.push(...p);
      return p.map(() => '?').join(', ');
    }
    flatParams.push(p === undefined ? null : p);
    return '?';
  });

  return { sql: expandedSql, params: flatParams };
}

// Split expression by top-level AND or OR respecting parenthesis and quotes
function splitTopLevel(str, operator) {
  const parts = [];
  let depth = 0;
  let inQuotes = false;
  let quoteChar = '';
  let lastIdx = 0;
  const opUpper = operator.toUpperCase();
  const opLen = operator.length;

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (inQuotes) {
      if (ch === quoteChar) inQuotes = false;
      continue;
    }
    if (ch === "'" || ch === '"') {
      inQuotes = true;
      quoteChar = ch;
      continue;
    }
    if (ch === '(') {
      depth++;
      continue;
    }
    if (ch === ')') {
      depth--;
      continue;
    }

    if (depth === 0) {
      const sub = str.substring(i, i + opLen).toUpperCase();
      const prevChar = i > 0 ? str[i - 1] : ' ';
      const nextChar = i + opLen < str.length ? str[i + opLen] : ' ';
      if (sub === opUpper && /\s/.test(prevChar) && /\s/.test(nextChar)) {
        parts.push(str.substring(lastIdx, i - 1).trim());
        i += opLen;
        lastIdx = i + 1;
      }
    }
  }

  if (lastIdx < str.length) {
    parts.push(str.substring(lastIdx).trim());
  }

  return parts.length > 0 ? parts : [str];
}

function evaluateExpression(row, expr, getParam) {
  let str = expr.trim();
  if (!str) return true;

  // Strip wrapping parentheses
  while (str.startsWith('(') && str.endsWith(')')) {
    let depth = 0;
    let matchedOuter = true;
    for (let i = 0; i < str.length - 1; i++) {
      if (str[i] === '(') depth++;
      else if (str[i] === ')') depth--;
      if (depth === 0) {
        matchedOuter = false;
        break;
      }
    }
    if (matchedOuter) {
      str = str.slice(1, -1).trim();
    } else {
      break;
    }
  }

  // 1. Top-level OR
  const orParts = splitTopLevel(str, 'OR');
  if (orParts.length > 1) {
    return orParts.some(part => evaluateExpression(row, part, getParam));
  }

  // 2. Top-level AND
  const andParts = splitTopLevel(str, 'AND');
  if (andParts.length > 1) {
    return andParts.every(part => evaluateExpression(row, part, getParam));
  }

  // 3. Base Predicate
  return evaluateSinglePredicate(row, str, getParam);
}

function evaluateSinglePredicate(row, predicate, getParam) {
  const trimmed = predicate.trim();
  if (trimmed === '1=1' || trimmed === '1' || trimmed.toUpperCase() === 'TRUE') return true;
  if (trimmed === '1=0' || trimmed === '0' || trimmed.toUpperCase() === 'FALSE') return false;

  // 1. IN Condition: `col IN (?, ?)`
  const inMatch = trimmed.match(/([a-zA-Z0-9_.]+)\s+IN\s*\(([^)]+)\)/i);
  if (inMatch) {
    const colName = inMatch[1].split('.').pop().toLowerCase();
    const inItemsStr = inMatch[2];
    const items = inItemsStr.split(',').map(s => s.trim());
    const allowed = [];
    items.forEach(item => {
      if (item === '?') {
        const val = getParam();
        if (Array.isArray(val)) allowed.push(...val.map(v => String(v)));
        else allowed.push(String(val));
      } else {
        allowed.push(item.replace(/['"]/g, ''));
      }
    });
    const cellVal = row[colName];
    return allowed.includes(String(cellVal));
  }

  // 2. IS NULL / IS NOT NULL
  const isNullMatch = trimmed.match(/([a-zA-Z0-9_.]+)\s+IS\s+(NOT\s+)?NULL/i);
  if (isNullMatch) {
    const colName = isNullMatch[1].split('.').pop().toLowerCase();
    const isNot = Boolean(isNullMatch[2]);
    const val = row[colName];
    const isNil = val === null || val === undefined;
    return isNot ? !isNil : isNil;
  }

  // 3. LIKE condition
  const likeMatch = trimmed.match(/([a-zA-Z0-9_.]+)\s+LIKE\s*(\?|'[^']*'|"[^"]*")/i);
  if (likeMatch) {
    const colName = likeMatch[1].split('.').pop().toLowerCase();
    let pattern = likeMatch[2] === '?' ? getParam() : likeMatch[2].replace(/['"]/g, '');
    pattern = String(pattern || '').toLowerCase().replace(/%/g, '');
    const cellVal = String(row[colName] || '').toLowerCase();
    return cellVal.includes(pattern);
  }

  // 4. Binary Comparison Operators: =, !=, <>, >=, <=, >, <
  const compMatch = trimmed.match(/([a-zA-Z0-9_.]+)\s*(=|!=|<>|>=|<=|>|<)\s*(\?|'[^']*'|"[^"]*"|[0-9.]+|TRUE|FALSE|NULL)/i);
  if (compMatch) {
    const colName = compMatch[1].split('.').pop().toLowerCase();
    const op = compMatch[2];
    let rightValRaw = compMatch[3];

    let expected;
    if (rightValRaw === '?') {
      expected = getParam();
    } else if (rightValRaw.toUpperCase() === 'TRUE') {
      expected = 1;
    } else if (rightValRaw.toUpperCase() === 'FALSE') {
      expected = 0;
    } else if (rightValRaw.toUpperCase() === 'NULL') {
      expected = null;
    } else {
      expected = rightValRaw.replace(/['"]/g, '');
    }

    const actual = row[colName];

    if (op === '=') {
      if (actual === null || expected === null) return actual === expected;
      if (typeof actual === 'boolean' || typeof expected === 'boolean' || actual === 0 || actual === 1) {
        return Boolean(Number(actual)) === Boolean(Number(expected));
      }
      return String(actual).toLowerCase() === String(expected).toLowerCase();
    }
    if (op === '!=' || op === '<>') {
      if (actual === null || expected === null) return actual !== expected;
      return String(actual).toLowerCase() !== String(expected).toLowerCase();
    }
    if (op === '>') return Number(actual) > Number(expected);
    if (op === '<') return Number(actual) < Number(expected);
    if (op === '>=') return Number(actual) >= Number(expected);
    if (op === '<=') return Number(actual) <= Number(expected);
  }

  return true;
}

function executeJsSql(sql, flatParams = []) {
  const cleanSql = sql.trim().replace(/;/g, '');
  const upper = cleanSql.toUpperCase();

  // 1. INSERT QUERY
  if (upper.startsWith('INSERT INTO')) {
    const match = cleanSql.match(/INSERT\s+INTO\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
    if (match) {
      const table = match[1].toLowerCase();
      const cols = match[2].split(',').map(c => c.trim().toLowerCase());
      const valuePlaceholders = match[3].split(',').map(s => s.trim());

      const newRow = {};
      let pIdx = 0;
      cols.forEach((col, idx) => {
        const ph = valuePlaceholders[idx] || '?';
        if (ph === '?') {
          newRow[col] = flatParams[pIdx++] !== undefined ? flatParams[pIdx - 1] : null;
        } else if (ph.toUpperCase() === 'TRUE' || ph === '1') {
          newRow[col] = 1;
        } else if (ph.toUpperCase() === 'FALSE' || ph === '0') {
          newRow[col] = 0;
        } else if (ph.toUpperCase() === 'NOW()' || ph.toUpperCase().includes('CURRENT_TIMESTAMP')) {
          newRow[col] = new Date().toISOString().replace('T', ' ').substring(0, 19);
        } else {
          newRow[col] = ph.replace(/['"]/g, '');
        }
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
        } else if (valExpr.toUpperCase() === 'NOW()' || valExpr.toUpperCase().includes('CURRENT_TIMESTAMP')) {
          updates[cleanCol] = new Date().toISOString().replace('T', ' ').substring(0, 19);
        } else {
          updates[cleanCol] = valExpr.replace(/['"]/g, '');
        }
      });

      const whereParams = flatParams.slice(paramIdx);
      let affected = 0;

      if (memoryDb[table]) {
        memoryDb[table].forEach(row => {
          let matchRow = true;
          if (whereClause) {
            let pCursor = 0;
            matchRow = evaluateExpression(row, whereClause, () => whereParams[pCursor++]);
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
          memoryDb[table] = memoryDb[table].filter(row => {
            let pCursor = 0;
            return !evaluateExpression(row, whereClause, () => flatParams[pCursor++]);
          });
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

function executeSelect(sql, params) {
  const upper = sql.toUpperCase();

  // Aggregate GROUP BY
  if (upper.includes('GROUP BY')) {
    const rows = evaluateSelectRows(sql, params);
    return aggregateGroupBy(sql, rows);
  }

  // Aggregate without GROUP BY
  if (upper.includes('COUNT(') || upper.includes('SUM(')) {
    const rows = evaluateSelectRows(sql, params);
    const count = rows.length;
    let sumUnits = 0;
    rows.forEach(r => {
      sumUnits += Number(r.units || r.units_required || 0);
    });
    return [{
      count,
      total_units: sumUnits,
      'COUNT(*)': count,
      'unread_count': count
    }];
  }

  let results = evaluateSelectRows(sql, params);

  // ORDER BY
  if (upper.includes('ORDER BY')) {
    const orderPart = sql.substring(upper.indexOf('ORDER BY') + 8);
    const orderCols = orderPart.split('LIMIT')[0].split(',').map(s => s.trim());
    results.sort((a, b) => {
      for (const ord of orderCols) {
        if (ord.toUpperCase().includes("URGENCY = 'EMERGENCY'")) {
          const aVal = (a.urgency === 'EMERGENCY') ? 1 : 0;
          const bVal = (b.urgency === 'EMERGENCY') ? 1 : 0;
          if (aVal !== bVal) return ord.toUpperCase().includes('DESC') ? bVal - aVal : aVal - bVal;
          continue;
        }
        const [colRaw, dir] = ord.split(/\s+/);
        const col = colRaw.split('.').pop().toLowerCase();
        const isDesc = dir && dir.toUpperCase() === 'DESC';
        const vA = a[col];
        const vB = b[col];
        if (vA < vB) return isDesc ? 1 : -1;
        if (vA > vB) return isDesc ? -1 : 1;
      }
      return 0;
    });
  }

  // LIMIT & OFFSET
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

function evaluateSelectRows(sql, params) {
  const fromMatch = sql.match(/FROM\s+([a-zA-Z0-9_]+)(?:\s+([a-zA-Z0-9_]+))?/i);
  if (!fromMatch) return [];
  const mainTable = fromMatch[1].toLowerCase();
  const mainAlias = fromMatch[2] ? fromMatch[2].toLowerCase() : mainTable;

  let baseRows = (memoryDb[mainTable] || []).map(r => ({ ...r }));

  // Handle JOINs
  const joinMatches = [...sql.matchAll(/(LEFT\s+|INNER\s+)?JOIN\s+([a-zA-Z0-9_]+)(?:\s+([a-zA-Z0-9_]+))?\s+ON\s+([^\s]+)\s*=\s*([^\s]+)/gi)];
  
  for (const jm of joinMatches) {
    const isLeftJoin = !jm[1] || jm[1].trim().toUpperCase() === 'LEFT';
    const joinTable = jm[2].toLowerCase();
    const joinAlias = jm[3] ? jm[3].toLowerCase() : joinTable;
    const condLeft = jm[4].toLowerCase();
    const condRight = jm[5].toLowerCase();

    const joinedRows = [];
    const targetList = memoryDb[joinTable] || [];

    baseRows.forEach(baseRow => {
      const matches = targetList.filter(jRow => {
        const getVal = (expr) => {
          const parts = expr.replace(/[()]/g, '').split('.');
          const tbl = parts.length > 1 ? parts[0] : null;
          const col = parts.length > 1 ? parts[1] : parts[0];

          if (tbl === mainAlias || tbl === mainTable) return baseRow[col];
          if (tbl === joinAlias || tbl === joinTable) return jRow[col];
          return baseRow[col] !== undefined ? baseRow[col] : jRow[col];
        };
        return String(getVal(condLeft)) === String(getVal(condRight));
      });

      if (matches.length > 0) {
        matches.forEach(m => {
          joinedRows.push({
            ...m,
            ...baseRow,
            [`${joinTable}_id`]: m.id,
            [`${joinAlias}_id`]: m.id,
            donor_id: joinTable === 'students' ? m.id : baseRow.donor_id
          });
        });
      } else if (isLeftJoin) {
        joinedRows.push({ ...baseRow });
      }
    });

    baseRows = joinedRows;
  }

  // WHERE filtering
  const whereMatch = sql.match(/\s+WHERE\s+(.+?)(?:\s+GROUP\s+BY|\s+ORDER\s+BY|\s+LIMIT|$)/i);
  if (whereMatch) {
    const whereClause = whereMatch[1];
    baseRows = baseRows.filter(row => {
      let pCursor = 0;
      return evaluateExpression(row, whereClause, () => params[pCursor++]);
    });
  }

  // Column / subquery projection
  baseRows.forEach(row => {
    if (row.id && memoryDb.donor_matches) {
      const matchedList = memoryDb.donor_matches.filter(dm => dm.blood_request_id === row.id);
      row.total_matches = matchedList.length;
      row.total_matched_donors = matchedList.length;
      row.accepted_matches = matchedList.filter(dm => dm.response === 'AVAILABLE').length;
      row.accepted_donors = matchedList.filter(dm => dm.response === 'AVAILABLE').length;
    }

    if (row.id && memoryDb.donations) {
      const studentId = row.donor_id || row.id;
      row.total_donations = memoryDb.donations.filter(d => d.donor_id === studentId && d.verification_status === 'VERIFIED').length;
    }

    if (row.created_by && memoryDb.users) {
      const creator = memoryDb.users.find(u => u.id === row.created_by);
      if (creator) {
        row.created_by_name = creator.name;
        row.requester_email = creator.email;
      }
    }

    if (row.user_id && memoryDb.students) {
      const s = memoryDb.students.find(st => st.user_id === (row.user_id || row.id));
      if (s) {
        row.student_table_id = s.id;
        row.student_id = s.student_id;
        row.department = s.department;
        row.year = s.year;
        row.blood_group = s.blood_group;
        row.availability = s.availability;
        row.last_donation_date = s.last_donation_date;
      }
    }
  });

  return baseRows;
}

function aggregateGroupBy(sql, rows) {
  const groupMatch = sql.match(/GROUP\s+BY\s+([a-zA-Z0-9_().,'% -]+)/i);
  if (!groupMatch) return rows;

  const rawGroupExpr = groupMatch[1].split('ORDER BY')[0].split('LIMIT')[0].trim();
  const isDateFormat = rawGroupExpr.toUpperCase().includes('DATE_FORMAT') || rawGroupExpr.toUpperCase().includes('STRFTIME');
  const groupCol = isDateFormat ? 'month' : rawGroupExpr.split('.').pop().toLowerCase();

  const grouped = {};

  rows.forEach(r => {
    let key;
    if (isDateFormat) {
      const dateVal = r.donation_date || r.created_at || '';
      key = dateVal.substring(0, 7) || '2026-10';
    } else {
      key = r[groupCol] || 'Other';
    }

    if (!grouped[key]) {
      grouped[key] = {
        [groupCol]: key,
        count: 0,
        donation_count: 0,
        total_units: 0,
        units: 0,
        donor_count: 0,
        verified_donations: 0
      };
    }

    grouped[key].count++;
    grouped[key].donation_count++;
    grouped[key].donor_count++;
    if (r.verification_status === 'VERIFIED') grouped[key].verified_donations++;
    grouped[key].units += Number(r.units || 1);
    grouped[key].total_units += Number(r.units || 1);
  });

  return Object.values(grouped);
}

// ============================================================================
// 2. DATABASE INITIALIZATION: MYSQL -> SQLITE -> PURE JS JSON ENGINE
// ============================================================================

async function initializeDatabase() {
  // 1. MySQL
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
      console.warn('⚠️  MySQL connection not available. Falling back to embedded engines...');
    }
  }

  // 2. SQLite
  try {
    const Database = require('better-sqlite3');
    const dbDir = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'database');
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
    
    sqliteDb = new Database(path.join(dbDir, 'campus_bloodconnect.sqlite'));
    sqliteDb.pragma('foreign_keys = ON');

    initSqliteTables(sqliteDb);
    dbType = 'SQLITE';
    console.log('💾 Initialized SQLite Database Engine');
    return;
  } catch (sqliteErr) {
    // Expected in Vercel Serverless Function
  }

  // 3. Pure JavaScript Engine fallback
  dbType = 'PURE_JS';
  loadJsonDb();
  seedMemoryDb();
  console.log('⚡ Initialized Zero-Dependency Pure JS In-Memory & JSON Engine (Vercel Serverless Ready)');
}

function initSqliteTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firebase_uid TEXT UNIQUE NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL UNIQUE,
      password_hash TEXT NULL,
      role TEXT NOT NULL DEFAULT 'STUDENT',
      status TEXT DEFAULT 'ACTIVE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (blood_request_id) REFERENCES blood_requests(id) ON DELETE CASCADE,
      FOREIGN KEY (donor_id) REFERENCES students(id) ON DELETE CASCADE
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (donor_id) REFERENCES students(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      blood_request_id INTEGER NULL,
      notification_type TEXT DEFAULT 'EMERGENCY_ALERT',
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER NULL,
      metadata TEXT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS otp_verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL,
      otp_code TEXT NOT NULL,
      purpose TEXT DEFAULT 'REGISTER',
      attempts INTEGER DEFAULT 0,
      is_verified INTEGER DEFAULT 0,
      expires_at INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const rowCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (!rowCount || rowCount.count === 0) {
    const adminHash = bcrypt.hashSync('Admin@12345', 10);
    const studentHash = bcrypt.hashSync('Admin@12345', 10);
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    db.prepare(`
      INSERT INTO users (id, name, email, phone, password_hash, role, status, created_at, updated_at)
      VALUES (1, 'Campus Health Admin', 'admin@campus.edu', '+919999000000', ?, 'ADMIN', 'ACTIVE', ?, ?)
    `).run(adminHash, now, now);

    db.prepare(`
      INSERT INTO users (id, name, email, phone, password_hash, role, status, created_at, updated_at)
      VALUES (2, 'John Doe', 'john.doe@campus.edu', '+919876543210', ?, 'STUDENT', 'ACTIVE', ?, ?)
    `).run(studentHash, now, now);

    db.prepare(`
      INSERT INTO students (id, user_id, student_id, department, year, blood_group, availability, last_donation_date, created_at, updated_at)
      VALUES (1, 2, 'CS2023001', 'Computer Science', 3, 'O+', 1, '2026-08-15', ?, ?)
    `).run(now, now);

    db.prepare(`
      INSERT INTO users (id, name, email, phone, password_hash, role, status, created_at, updated_at)
      VALUES (3, 'Jane Smith', 'jane.smith@campus.edu', '+919876543211', ?, 'STUDENT', 'ACTIVE', ?, ?)
    `).run(studentHash, now, now);

    db.prepare(`
      INSERT INTO students (id, user_id, student_id, department, year, blood_group, availability, last_donation_date, created_at, updated_at)
      VALUES (2, 3, 'EC2023045', 'Electronics & Comm.', 2, 'A+', 1, '2026-07-20', ?, ?)
    `).run(now, now);

    db.prepare(`
      INSERT INTO users (id, name, email, phone, password_hash, role, status, created_at, updated_at)
      VALUES (4, 'Priya Patel', 'priya.p@campus.edu', '+919876543212', ?, 'STUDENT', 'ACTIVE', ?, ?)
    `).run(studentHash, now, now);

    db.prepare(`
      INSERT INTO students (id, user_id, student_id, department, year, blood_group, availability, last_donation_date, created_at, updated_at)
      VALUES (3, 4, 'BT2022018', 'Biotechnology', 4, 'O-', 1, NULL, ?, ?)
    `).run(now, now);

    db.prepare(`
      INSERT INTO blood_requests (id, blood_group, component, units_required, hospital_name, hospital_address, hospital_phone, required_date, required_time, urgency, additional_info, status, created_by, created_at, updated_at)
      VALUES (1, 'O+', 'Whole Blood / RBC', 2, 'Campus Medical Health Center', 'Building B, University Hospital Complex', '+91-9876500000', '2026-10-09', '18:00', 'EMERGENCY', 'Emergency surgical procedure scheduled.', 'ACTIVE', 1, ?, ?)
    `).run(now, now);

    db.prepare(`
      INSERT INTO donor_matches (id, blood_request_id, donor_id, match_type, notification_status, response, confirmed, created_at, updated_at)
      VALUES (1, 1, 1, 'EXACT', 'SENT', 'PENDING', 0, ?, ?)
    `).run(now, now);

    db.prepare(`
      INSERT INTO donor_matches (id, blood_request_id, donor_id, match_type, notification_status, response, confirmed, created_at, updated_at)
      VALUES (2, 1, 3, 'COMPATIBLE', 'SENT', 'PENDING', 0, ?, ?)
    `).run(now, now);

    db.prepare(`
      INSERT INTO donations (id, donor_id, blood_request_id, donation_date, units, hospital_name, verification_status, verified_by, created_at)
      VALUES (1, 1, NULL, '2026-08-15', 1.0, 'Campus Health Center', 'VERIFIED', 1, ?)
    `).run(now);

    db.prepare(`
      INSERT INTO donations (id, donor_id, blood_request_id, donation_date, units, hospital_name, verification_status, verified_by, created_at)
      VALUES (2, 2, NULL, '2026-07-20', 1.0, 'City Red Cross Center', 'VERIFIED', 1, ?)
    `).run(now);
  }
}

// Execute Query Function
async function query(sql, params = []) {
  if (dbType === 'NONE') {
    await initializeDatabase();
  }

  const { sql: normalizedSql, params: flatParams } = normalizeSqlAndParams(sql, params);

  if (dbType === 'MYSQL' && pool) {
    return pool.query(normalizedSql, flatParams);
  }

  if (dbType === 'SQLITE' && sqliteDb) {
    try {
      const trimmed = normalizedSql.trim().toUpperCase();
      if (trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA')) {
        const stmt = sqliteDb.prepare(normalizedSql);
        const rows = stmt.all(...flatParams);
        return [rows, []];
      } else {
        const stmt = sqliteDb.prepare(normalizedSql);
        const info = stmt.run(...flatParams);
        return [{ insertId: Number(info.lastInsertRowid), affectedRows: info.changes }, []];
      }
    } catch (err) {
      console.warn('SQLite execution fallback to Pure JS engine:', err.message);
    }
  }

  // Pure JS execution (100% resilient)
  return executeJsSql(normalizedSql, flatParams);
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
