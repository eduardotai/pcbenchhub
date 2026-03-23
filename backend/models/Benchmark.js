const { getDb, saveDatabase } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const HARDWARE_LIMITS = {
  cpu: {
    cinebench_r23: { min: 100, max: 50000 },
    cinebench_r20: { min: 100, max: 40000 },
    geekbench_5_single: { min: 500, max: 5000 },
    geekbench_5_multi: { min: 1000, max: 50000 },
  },
  gpu: {
    '3dmark_fire_strike': { min: 1000, max: 100000 },
    '3dmark_time_spy': { min: 1000, max: 50000 },
    heaven_benchmark: { min: 10, max: 5000 },
    furmark: { min: 100, max: 50000 },
  },
  ram: {
    aida64_read: { min: 1000, max: 200000 },
    aida64_write: { min: 1000, max: 200000 },
    aida64_copy: { min: 1000, max: 200000 },
    aida64_latency: { min: 1, max: 200 },
  },
  storage: {
    crystaldiskmark_seq_read: { min: 100, max: 15000 },
    crystaldiskmark_seq_write: { min: 100, max: 14000 },
    'crystaldiskmark_4k_read': { min: 1, max: 500 },
    'crystaldiskmark_4k_write': { min: 1, max: 500 },
  },
};

function safeParseJson(value, fallback = null) {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;

  try {
    return JSON.parse(value);
  } catch (err) {
    return fallback;
  }
}

function aggregateScore(scores) {
  const parsed = safeParseJson(scores, {});
  const numericValues = Object.values(parsed)
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  if (!numericValues.length) return null;
  return numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length;
}

function componentMatchSql(componentId, params, alias = 'b') {
  if (!componentId) return '';
  const id = String(componentId);

  const patterns = [
    `[${id}]`,
    `[${id},%`,
    `%,${id},%`,
    `%,${id}]`,
    `["${id}"]`,
    `["${id}",%`,
    `%,"${id}",%`,
    `%,"${id}"]`,
  ];

  params.push(...patterns);
  return ` AND (${patterns.map(() => `${alias}.component_ids LIKE ?`).join(' OR ')})`;
}

class Benchmark {
  static create({
    userId,
    title,
    category,
    hardwareSpecs,
    software,
    testTool,
    scores,
    gaming_context,
    user_notes,
    tags,
    component_ids,
    report_type,
  }) {
    const db = getDb();
    const id = uuidv4();

    const validation = this.validateScores(category, testTool, scores);
    if (!validation.valid) {
      throw new Error(`Invalid scores: ${validation.error}`);
    }

    const now = new Date().toISOString();

    db.run(
      `INSERT INTO benchmarks
        (id, user_id, title, category, hardware_specs, software, test_tool, scores,
         gaming_context, user_notes, tags, component_ids, report_type, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        String(userId),
        title,
        category,
        JSON.stringify(hardwareSpecs || {}),
        JSON.stringify(software || {}),
        testTool,
        JSON.stringify(scores || {}),
        gaming_context ? JSON.stringify(gaming_context) : null,
        user_notes || null,
        tags ? JSON.stringify(tags) : null,
        component_ids ? JSON.stringify(component_ids) : null,
        report_type || 'benchmark',
        now,
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

    const toolLower = String(testTool || '').toLowerCase().replace(/[^a-z0-9]/g, '_');
    const limit = categoryLimits[toolLower];

    if (limit) {
      for (const [metric, value] of Object.entries(scores || {})) {
        if (typeof value === 'number') {
          if (value < limit.min || value > limit.max) {
            return {
              valid: false,
              error: `${metric} value ${value} is outside plausible range (${limit.min}-${limit.max})`,
            };
          }
        }
      }
    }

    return { valid: true };
  }

  static _parseRow(row) {
    if (!row) return null;

    const parsed = {
      ...row,
      hardwareSpecs: safeParseJson(row.hardware_specs, {}),
      software: safeParseJson(row.software, {}),
      scores: safeParseJson(row.scores, {}),
      gaming_context: safeParseJson(row.gaming_context, row.gaming_context),
      tags: safeParseJson(row.tags, row.tags),
      component_ids: safeParseJson(row.component_ids, row.component_ids),
      testTool: row.test_tool,
    };

    return parsed;
  }

  static _queryFilteredRows({ category, testTool, userLevel, search, componentId, minScore, maxScore }) {
    const db = getDb();
    const params = [];

    let query = `
      SELECT b.*, u.username, u.experience_level as userExperience
      FROM benchmarks b
      JOIN users u ON b.user_id = u.id
      WHERE b.is_flagged = 0
    `;

    if (category) {
      query += ' AND b.category = ?';
      params.push(category);
    }
    if (testTool) {
      query += ' AND b.test_tool LIKE ?';
      params.push(`%${testTool}%`);
    }
    if (userLevel) {
      query += ' AND u.experience_level = ?';
      params.push(userLevel);
    }
    if (search) {
      query += ' AND (b.title LIKE ? OR b.hardware_specs LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += componentMatchSql(componentId, params, 'b');
    query += ' ORDER BY b.created_at DESC';

    const stmt = db.prepare(query);
    stmt.bind(params);

    const results = [];
    while (stmt.step()) {
      const row = this._parseRow(stmt.getAsObject());
      const score = aggregateScore(row.scores);

      if (minScore != null && (score == null || score < Number(minScore))) {
        continue;
      }
      if (maxScore != null && (score == null || score > Number(maxScore))) {
        continue;
      }

      results.push(row);
    }
    stmt.free();

    return results;
  }

  static findById(id) {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT b.*, u.username, u.experience_level as userExperience
      FROM benchmarks b
      JOIN users u ON b.user_id = u.id
      WHERE b.id = ?
    `);
    stmt.bind([String(id)]);

    let row = null;
    if (stmt.step()) {
      row = this._parseRow(stmt.getAsObject());
    }
    stmt.free();

    return row;
  }

  static findAll({
    category,
    testTool,
    minScore,
    maxScore,
    userLevel,
    search,
    componentId,
    page = 1,
    limit = 20,
  }) {
    const rows = this._queryFilteredRows({
      category,
      testTool,
      minScore,
      maxScore,
      userLevel,
      search,
      componentId,
    });

    const offset = (page - 1) * limit;
    return rows.slice(offset, offset + limit);
  }

  static count({ category, testTool, minScore, maxScore, userLevel, search, componentId }) {
    return this._queryFilteredRows({
      category,
      testTool,
      minScore,
      maxScore,
      userLevel,
      search,
      componentId,
    }).length;
  }

  static findByUserId(userId, page = 1, limit = 20) {
    const db = getDb();
    const offset = (page - 1) * limit;

    const results = [];
    const stmt = db.prepare('SELECT * FROM benchmarks WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?');
    stmt.bind([String(userId), limit, offset]);

    while (stmt.step()) {
      results.push(this._parseRow(stmt.getAsObject()));
    }
    stmt.free();

    return results;
  }

  static countByUserId(userId) {
    const db = getDb();
    const stmt = db.prepare('SELECT COUNT(*) as total FROM benchmarks WHERE user_id = ?');
    stmt.bind([String(userId)]);
    stmt.step();
    const result = stmt.getAsObject();
    stmt.free();
    return result.total;
  }

  static findByIds(ids) {
    if (!ids || ids.length === 0) return [];

    const db = getDb();
    const placeholders = ids.map(() => '?').join(',');
    const stmt = db.prepare(`
      SELECT b.*, u.username, u.experience_level as userExperience
      FROM benchmarks b
      JOIN users u ON b.user_id = u.id
      WHERE b.id IN (${placeholders})
    `);
    stmt.bind(ids.map((id) => String(id)));

    const results = [];
    while (stmt.step()) {
      results.push(this._parseRow(stmt.getAsObject()));
    }
    stmt.free();

    return results;
  }

  static flag(id) {
    const db = getDb();
    db.run(
      `UPDATE benchmarks
       SET flag_count = flag_count + 1,
           is_flagged = CASE WHEN flag_count + 1 >= 3 THEN 1 ELSE is_flagged END
       WHERE id = ?`,
      [String(id)]
    );

    saveDatabase();
    const benchmark = this.findById(id);
    if (benchmark && benchmark.flag_count >= 3) {
      return { flagged: true, benchmark };
    }

    return { flagged: false, benchmark };
  }

  static getLeaderboard(category, testTool, limit = 10) {
    const filtered = this._queryFilteredRows({ category, testTool })
      .map((row) => ({ ...row, _aggregate: aggregateScore(row.scores) || 0 }))
      .sort((a, b) => b._aggregate - a._aggregate)
      .slice(0, limit)
      .map(({ _aggregate, ...row }) => row);

    return filtered;
  }

  static getFlagged() {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT b.*, u.username, u.email
      FROM benchmarks b
      JOIN users u ON b.user_id = u.id
      WHERE b.is_flagged = 1 OR b.flag_count > 0
      ORDER BY b.flag_count DESC
    `);

    const results = [];
    while (stmt.step()) {
      results.push(this._parseRow(stmt.getAsObject()));
    }
    stmt.free();

    return results;
  }

  static delete(id) {
    const db = getDb();
    db.run('DELETE FROM benchmarks WHERE id = ?', [String(id)]);
    saveDatabase();
  }

  static findByComponentId(componentId, { limit = 20, offset = 0 } = {}) {
    const rows = this._queryFilteredRows({ componentId });
    return rows.slice(offset, offset + limit);
  }

  static countByComponentId(componentId) {
    return this._queryFilteredRows({ componentId }).length;
  }

  static findByTag(tagName, { limit = 20, offset = 0 } = {}) {
    const db = getDb();
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
    stmt.bind([String(tagName).toLowerCase().trim(), limit, offset]);

    const results = [];
    while (stmt.step()) {
      results.push(this._parseRow(stmt.getAsObject()));
    }
    stmt.free();

    return results;
  }
}

module.exports = Benchmark;
