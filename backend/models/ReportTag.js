const { getDb, saveDatabase } = require('../config/db');

class ReportTag {
  static findById(id) {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM report_tags WHERE id = ?');
    stmt.bind([id]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  }

  static findByName(name) {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM report_tags WHERE name = ?');
    stmt.bind([name.toLowerCase().trim()]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  }

  static getAll({ category = null, limit = 50 } = {}) {
    const db = getDb();
    let query = 'SELECT * FROM report_tags';
    const params = [];

    if (category) {
      query += ' WHERE category = ?';
      params.push(category);
    }

    query += ' ORDER BY name ASC LIMIT ?';
    params.push(limit);

    const results = [];
    const stmt = db.prepare(query);
    stmt.bind(params);
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  static getPopular(limit = 20) {
    const db = getDb();
    const results = [];
    const stmt = db.prepare('SELECT * FROM report_tags ORDER BY usage_count DESC LIMIT ?');
    stmt.bind([limit]);
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  static findOrCreate(name, category = null) {
    const normalized = name.toLowerCase().trim();
    const existing = this.findByName(normalized);
    if (existing) {
      return existing;
    }

    const db = getDb();
    const now = new Date().toISOString();
    db.run(
      'INSERT INTO report_tags (name, category, usage_count, created_at) VALUES (?, ?, 0, ?)',
      [normalized, category, now]
    );
    saveDatabase();
    return this.findByName(normalized);
  }

  static getByReport(reportId) {
    const db = getDb();
    const results = [];
    const stmt = db.prepare(`
      SELECT rt.*
      FROM report_tags rt
      JOIN report_tag_map rtm ON rt.id = rtm.tag_id
      WHERE rtm.report_id = ?
      ORDER BY rt.name ASC
    `);
    stmt.bind([reportId]);
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  static addToReport(reportId, tagId) {
    const db = getDb();
    db.run(
      'INSERT OR IGNORE INTO report_tag_map (report_id, tag_id) VALUES (?, ?)',
      [reportId, tagId]
    );
    db.run(
      'UPDATE report_tags SET usage_count = usage_count + 1 WHERE id = ?',
      [tagId]
    );
    saveDatabase();
  }

  static removeFromReport(reportId, tagId) {
    const db = getDb();
    db.run(
      'DELETE FROM report_tag_map WHERE report_id = ? AND tag_id = ?',
      [reportId, tagId]
    );
    db.run(
      'UPDATE report_tags SET usage_count = MAX(0, usage_count - 1) WHERE id = ?',
      [tagId]
    );
    saveDatabase();
  }

  static search(query) {
    const db = getDb();
    const results = [];
    const stmt = db.prepare(
      'SELECT * FROM report_tags WHERE name LIKE ? ORDER BY usage_count DESC LIMIT 20'
    );
    stmt.bind([`%${query.toLowerCase().trim()}%`]);
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }
}

module.exports = ReportTag;
