const { getDb, saveDatabase } = require('../config/db');

class UserHardware {
  static getByUser(userId) {
    const db = getDb();
    const results = [];
    const stmt = db.prepare(`
      SELECT uh.*, hc.name AS component_name, hc.category AS component_category,
             hc.brand AS component_brand, hc.normalized_name AS component_normalized_name
      FROM user_hardware uh
      JOIN hardware_components hc ON hc.id = uh.component_id
      WHERE uh.user_id = ?
      ORDER BY uh.is_primary DESC, uh.id ASC
    `);
    stmt.bind([userId]);
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  static add({ userId, componentId, acquiredDate = null, notes = null, isPrimary = 0 }) {
    const db = getDb();
    db.run(
      `INSERT INTO user_hardware (user_id, component_id, acquired_date, notes, is_primary)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, componentId, acquiredDate, notes, isPrimary ? 1 : 0]
    );
    const idResult = db.exec('SELECT last_insert_rowid() as id');
    const newId = idResult[0].values[0][0];
    saveDatabase();

    const stmt = db.prepare(`
      SELECT uh.*, hc.name AS component_name, hc.category AS component_category,
             hc.brand AS component_brand, hc.normalized_name AS component_normalized_name
      FROM user_hardware uh
      JOIN hardware_components hc ON hc.id = uh.component_id
      WHERE uh.id = ?
    `);
    stmt.bind([newId]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  }

  static remove(userId, componentId) {
    const db = getDb();
    db.run(
      'DELETE FROM user_hardware WHERE user_id = ? AND component_id = ?',
      [userId, componentId]
    );
    saveDatabase();
  }

  static setPrimary(userId, componentId) {
    const db = getDb();
    // Clear is_primary for all of this user's hardware
    db.run(
      'UPDATE user_hardware SET is_primary = 0 WHERE user_id = ?',
      [userId]
    );
    // Set the specified component as primary
    db.run(
      'UPDATE user_hardware SET is_primary = 1 WHERE user_id = ? AND component_id = ?',
      [userId, componentId]
    );
    saveDatabase();
  }
}

module.exports = UserHardware;
