const pool = require('../config/database');

const logAudit = async ({ userId = null, action, entityType, entityId = null, metadata = null }) => {
  try {
    const metaJson = metadata ? JSON.stringify(metadata) : null;
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, action, entityType, entityId, metaJson]
    );
  } catch (error) {
    console.error('Audit Logging Error:', error.message);
  }
};

module.exports = { logAudit };
