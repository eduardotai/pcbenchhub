const { getDb, saveDatabase } = require('../config/db');

class ActivityLog {
  // Cria entrada no log
  static log({ userId = null, actionType, entityType, entityId = null, metadata = null }) {
    const db = getDb();
    const metadataStr = (metadata !== null && typeof metadata === 'object')
      ? JSON.stringify(metadata)
      : metadata;

    db.run(
      `INSERT INTO activity_log (user_id, action_type, entity_type, entity_id, metadata)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, actionType, entityType, entityId, metadataStr]
    );
    saveDatabase();
  }

  // Busca feed global recente, com JOIN em users para pegar username
  static getFeed({ limit = 20, offset = 0, actionType = null } = {}) {
    const db = getDb();
    let query = `
      SELECT al.*, u.username
      FROM activity_log al
      LEFT JOIN users u ON al.user_id = u.id
    `;
    const params = [];

    if (actionType) {
      query += ' WHERE al.action_type = ?';
      params.push(actionType);
    }

    query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const results = [];
    const stmt = db.prepare(query);
    stmt.bind(params);
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  // Busca atividade de um usuário específico
  static getByUser(userId, { limit = 20, offset = 0 } = {}) {
    const db = getDb();
    const results = [];
    const stmt = db.prepare(
      `SELECT al.*, u.username
       FROM activity_log al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.user_id = ?
       ORDER BY al.created_at DESC
       LIMIT ? OFFSET ?`
    );
    stmt.bind([userId, limit, offset]);
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  // Busca atividade de uma entidade (ex: todos os reports de um hardware)
  static getByEntity(entityType, entityId, { limit = 20, offset = 0 } = {}) {
    const db = getDb();
    const results = [];
    const stmt = db.prepare(
      `SELECT al.*, u.username
       FROM activity_log al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.entity_type = ? AND al.entity_id = ?
       ORDER BY al.created_at DESC
       LIMIT ? OFFSET ?`
    );
    stmt.bind([entityType, String(entityId), limit, offset]);
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  // Conta ações de um tipo no período (últimas N horas)
  static countRecent(actionType, hours = 24) {
    const db = getDb();
    const stmt = db.prepare(
      `SELECT COUNT(*) as total
       FROM activity_log
       WHERE action_type = ?
         AND created_at >= datetime('now', ? || ' hours')`
    );
    stmt.bind([actionType, String(-hours)]);
    stmt.step();
    const result = stmt.getAsObject();
    stmt.free();
    return result.total;
  }
}

module.exports = ActivityLog;
