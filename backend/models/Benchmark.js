const { getDb, saveDatabase } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const HARDWARE_LIMITS = {
  cpu: {
    cinebench_r23: { min: 100, max: 50000 },
    cinebench_r20: { min: 100, max: 40000 },
    geekbench_5_single: { min: 500, max: 5000 },
    geekbench_5_multi: { min: 1000, max: 50000 }
  },
  gpu: {
    "3dmark_fire_strike": { min: 1000, max: 100000 },
    "3dmark_time_spy": { min: 1000, max: 50000 },
    heaven_benchmark: { min: 10, max: 5000 },
    furmark: { min: 100, max: 50000 }
  },
  ram: {
    aida64_read: { min: 1000, max: 200000 },
    aida64_write: { min: 1000, max: 200000 },
    aida64_copy: { min: 1000, max: 200000 },
    aida64_latency: { min: 1, max: 200 }
  },
  storage: {
    crystaldiskmark_seq_read: { min: 100, max: 15000 },
    crystaldiskmark_seq_write: { min: 100, max: 14000 },
    "crystaldiskmark_4k_read": { min: 1, max: 500 },
    "crystaldiskmark_4k_write": { min: 1, max: 500 }
  }
};

class Benchmark {
  static create({ userId, title, category, hardwareSpecs, software, testTool, scores, gaming_context, user_notes, tags, component_ids, report_type }) {
    const db = getDb();
    const id = uuidv4();

    const validation = this.validateScores(category, testTool, scores);
    if (!validation.valid) {
      throw new Error(`Invalid scores: ${validation.error}`);
    }

    const now = new Date().toISOString();

    db.run(
      `INSERT INTO benchmarks (id, user_id, title, category, hardware_specs, software, test_tool, scores, gaming_context, user_notes, tags, component_ids, report_type, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, userId, title, category,
        JSON.stringify(hardwareSpecs), JSON.stringify(software), testTool, JSON.stringify(scores),
        gaming_context ? JSON.stringify(gaming_context) : null,
        user_notes || null,
        tags ? JSON.stringify(tags) : null,
        component_ids ? JSON.stringify(component_ids) : null,
        report_type || 'benchmark',
        now
      ]
    );

    saveDatabase();
    return this.findById(id);
  }

  static validateScores(category, testTool, scores) {
    const categoryLimits = HARDWARE_LIMITS[category];
    if (!categoryLimits) {
      return { valid: true };
    }

    const toolLower = testTool.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const limit = categoryLimits[toolLower];
    
    if (limit) {
      for (const [metric, value] of Object.entries(scores)) {
        if (typeof value === 'number') {
          if (value < limit.min || value > limit.max) {
            return { valid: false, error: `${metric} value ${value} is outside plausible range (${limit.min}-${limit.max})` };
          }
        }
      }
    }
    
    return { valid: true };
  }

  static findById(id) {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT b.*, u.username, u.experience_level as userExperience
      FROM benchmarks b
      JOIN users u ON b.user_id = u.id
      WHERE b.id = ?
    `);
    stmt.bind([id]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return {
        ...row,
        hardwareSpecs: JSON.parse(row.hardware_specs),
        software: JSON.parse(row.software),
        scores: JSON.parse(row.scores)
      };
    }
    stmt.free();
    return null;
  }

  static findAll({ category, testTool, minScore, maxScore, userLevel, search, page = 1, limit = 20 }) {
    const db = getDb();
    let query = `
      SELECT b.*, u.username, u.experience_level as userExperience
      FROM benchmarks b
      JOIN users u ON b.user_id = u.id
      WHERE b.is_flagged = 0
    `;
    const params = [];

    if (category) { query += ' AND b.category = ?'; params.push(category); }
    if (testTool) { query += ' AND b.test_tool LIKE ?'; params.push(`%${testTool}%`); }
    if (userLevel) { query += ' AND u.experience_level = ?'; params.push(userLevel); }
    if (search) { query += ' AND (b.title LIKE ? OR b.hardware_specs LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    query += ' ORDER BY b.created_at DESC LIMIT ? OFFSET ?';
    const offset = (page - 1) * limit;
    params.push(limit, offset);

    const results = [];
    const stmt = db.prepare(query);
    stmt.bind(params);
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push({
        ...row,
        hardwareSpecs: JSON.parse(row.hardware_specs),
        software: JSON.parse(row.software),
        scores: JSON.parse(row.scores)
      });
    }
    stmt.free();
    return results;
  }

  static count({ category, testTool, userLevel, search }) {
    const db = getDb();
    let query = 'SELECT COUNT(*) as total FROM benchmarks b JOIN users u ON b.user_id = u.id WHERE b.is_flagged = 0';
    const params = [];

    if (category) { query += ' AND b.category = ?'; params.push(category); }
    if (testTool) { query += ' AND b.test_tool LIKE ?'; params.push(`%${testTool}%`); }
    if (userLevel) { query += ' AND u.experience_level = ?'; params.push(userLevel); }
    if (search) { query += ' AND (b.title LIKE ? OR b.hardware_specs LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    const stmt = db.prepare(query);
    stmt.bind(params);
    stmt.step();
    const result = stmt.getAsObject();
    stmt.free();
    return result.total;
  }

  static findByUserId(userId, page = 1, limit = 20) {
    const db = getDb();
    const offset = (page - 1) * limit;
    const results = [];
    const stmt = db.prepare(`SELECT * FROM benchmarks WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`);
    stmt.bind([userId, limit, offset]);
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push({
        ...row,
        hardwareSpecs: JSON.parse(row.hardware_specs),
        software: JSON.parse(row.software),
        scores: JSON.parse(row.scores)
      });
    }
    stmt.free();
    return results;
  }

  static countByUserId(userId) {
    const db = getDb();
    const stmt = db.prepare('SELECT COUNT(*) as total FROM benchmarks WHERE user_id = ?');
    stmt.bind([userId]);
    stmt.step();
    const result = stmt.getAsObject();
    stmt.free();
    return result.total;
  }

  static findByIds(ids) {
    if (!ids || ids.length === 0) return [];
    const db = getDb();
    const placeholders = ids.map(() => '?').join(',');
    const results = [];
    const stmt = db.prepare(`
      SELECT b.*, u.username, u.experience_level as userExperience
      FROM benchmarks b
      JOIN users u ON b.user_id = u.id
      WHERE b.id IN (${placeholders})
    `);
    stmt.bind(ids);
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push({
        ...row,
        hardwareSpecs: JSON.parse(row.hardware_specs),
        software: JSON.parse(row.software),
        scores: JSON.parse(row.scores)
      });
    }
    stmt.free();
    return results;
  }

  static flag(id) {
    const db = getDb();
    db.run(`UPDATE benchmarks SET flag_count = flag_count + 1, is_flagged = CASE WHEN flag_count + 1 >= 3 THEN 1 ELSE is_flagged END WHERE id = ?`, [id]);
    saveDatabase();
    const benchmark = this.findById(id);
    if (benchmark && benchmark.flag_count >= 3) {
      return { flagged: true, benchmark };
    }
    return { flagged: false, benchmark };
  }

  static getLeaderboard(category, testTool, limit = 10) {
    const db = getDb();
    let query = `
      SELECT b.*, u.username, u.experience_level as userExperience
      FROM benchmarks b
      JOIN users u ON b.user_id = u.id
      WHERE b.is_flagged = 0
    `;
    const params = [];

    if (category) { query += ' AND b.category = ?'; params.push(category); }
    if (testTool) { query += ' AND b.test_tool LIKE ?'; params.push(`%${testTool}%`); }

    query += ' ORDER BY b.created_at DESC LIMIT ?';
    params.push(limit);

    const results = [];
    const stmt = db.prepare(query);
    stmt.bind(params);
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push({
        ...row,
        hardwareSpecs: JSON.parse(row.hardware_specs),
        software: JSON.parse(row.software),
        scores: JSON.parse(row.scores)
      });
    }
    stmt.free();
    return results;
  }

  static getFlagged() {
    const db = getDb();
    const results = [];
    const stmt = db.prepare(`
      SELECT b.*, u.username, u.email
      FROM benchmarks b
      JOIN users u ON b.user_id = u.id
      WHERE b.is_flagged = 1 OR b.flag_count > 0
      ORDER BY b.flag_count DESC
    `);
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push({
        ...row,
        hardwareSpecs: JSON.parse(row.hardware_specs),
        software: JSON.parse(row.software),
        scores: JSON.parse(row.scores)
      });
    }
    stmt.free();
    return results;
  }

  static delete(id) {
    const db = getDb();
    db.run('DELETE FROM benchmarks WHERE id = ?', [id]);
    saveDatabase();
  }

  static findByComponentId(componentId, { limit = 20, offset = 0 } = {}) {
    const db = getDb();
    const results = [];
    const stmt = db.prepare(`
      SELECT b.*, u.username, u.experience_level as userExperience
      FROM benchmarks b
      JOIN users u ON b.user_id = u.id
      WHERE b.is_flagged = 0 AND b.component_ids LIKE ?
      ORDER BY b.created_at DESC
      LIMIT ? OFFSET ?
    `);
    stmt.bind([`%${componentId}%`, limit, offset]);
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push({
        ...row,
        hardwareSpecs: JSON.parse(row.hardware_specs),
        software: JSON.parse(row.software),
        scores: JSON.parse(row.scores)
      });
    }
    stmt.free();
    return results;
  }

  static findByTag(tagName, { limit = 20, offset = 0 } = {}) {
    const db = getDb();
    const results = [];
    const stmt = db.prepare(`
      SELECT b.*, u.username, u.experience_level as userExperience
      FROM benchmarks b
      JOIN users u ON b.user_id = u.id
      JOIN report_tag_map rtm ON b.id = rtm.report_id
      JOIN report_tags rt ON rtm.tag_id = rt.id
      WHERE b.is_flagged = 0 AND rt.name = ?
      ORDER BY b.created_at DESC
      LIMIT ? OFFSET ?
    `);
    stmt.bind([tagName.toLowerCase().trim(), limit, offset]);
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push({
        ...row,
        hardwareSpecs: JSON.parse(row.hardware_specs),
        software: JSON.parse(row.software),
        scores: JSON.parse(row.scores)
      });
    }
    stmt.free();
    return results;
  }
}

module.exports = Benchmark;
