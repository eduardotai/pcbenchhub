const { getDb, saveDatabase } = require('../config/db');

class Milestone {
  static getAll() {
    const db = getDb();
    const results = [];
    const stmt = db.prepare(
      `SELECT * FROM milestones ORDER BY reached_at DESC`
    );
    stmt.bind([]);
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  static getRecent(limit = 5) {
    const db = getDb();
    const results = [];
    const stmt = db.prepare(
      `SELECT * FROM milestones WHERE reached_at IS NOT NULL ORDER BY reached_at DESC LIMIT ?`
    );
    stmt.bind([limit]);
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  // Verifica e cria milestone se threshold foi atingido.
  // Retorna o milestone criado ou null se já existia.
  static checkAndCreate({ type, threshold, message }) {
    const db = getDb();

    // Check if milestone with this type+threshold already exists
    const checkStmt = db.prepare(
      `SELECT id FROM milestones WHERE type = ? AND threshold = ?`
    );
    checkStmt.bind([type, threshold]);
    const exists = checkStmt.step();
    checkStmt.free();

    if (exists) {
      return null;
    }

    // Insert new milestone with reached_at = now
    db.run(
      `INSERT INTO milestones (type, threshold, message, reached_at) VALUES (?, ?, ?, datetime('now'))`,
      [type, threshold, message]
    );
    saveDatabase();

    // Return the newly created milestone
    const fetchStmt = db.prepare(
      `SELECT * FROM milestones WHERE type = ? AND threshold = ? ORDER BY id DESC LIMIT 1`
    );
    fetchStmt.bind([type, threshold]);
    fetchStmt.step();
    const result = fetchStmt.getAsObject();
    fetchStmt.free();
    return result;
  }
}

module.exports = Milestone;
