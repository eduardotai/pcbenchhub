const { getDb, saveDatabase } = require('../config/db');
const { parseHardwareName, normalizeText } = require('../utils/hardwareNormalizer');

class HardwareComponent {
  /**
   * Find a component by its integer primary key.
   */
  static findById(id) {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM hardware_components WHERE id = ?');
    stmt.bind([id]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  }

  /**
   * Find a component by its normalized name (exact match).
   */
  static findByNormalizedName(normalizedName) {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM hardware_components WHERE normalized_name = ?');
    stmt.bind([normalizedName]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  }

  /**
   * Look up a component by alias text.
   * Returns the component row if found, otherwise null.
   */
  static findByAlias(alias) {
    const db = getDb();
    const normalizedAlias = normalizeText(alias);
    const stmt = db.prepare(`
      SELECT hc.*
      FROM hardware_components hc
      JOIN hardware_aliases ha ON ha.component_id = hc.id
      WHERE ha.alias = ?
    `);
    stmt.bind([normalizedAlias]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  }

  /**
   * Find or create a hardware component from free-form text.
   * Search order:
   *   1. Exact normalized_name match in hardware_components
   *   2. Alias match in hardware_aliases
   *   3. Create a new component
   * Returns { component, created: boolean }
   */
  static findOrCreate(rawText) {
    if (!rawText || typeof rawText !== 'string') {
      throw new Error('rawText must be a non-empty string');
    }

    const parsed = parseHardwareName(rawText);
    if (!parsed) {
      throw new Error('Could not parse hardware name from provided text');
    }

    const { name, normalized_name, category, brand, generation } = parsed;

    // 1. Search by normalized name
    let component = this.findByNormalizedName(normalized_name);
    if (component) {
      return { component, created: false };
    }

    // 2. Search in aliases
    component = this.findByAlias(rawText);
    if (component) {
      return { component, created: false };
    }

    // 3. Create new component
    const db = getDb();
    db.run(
      `INSERT INTO hardware_components (name, normalized_name, category, brand, generation)
       VALUES (?, ?, ?, ?, ?)`,
      [name, normalized_name, category, brand || null, generation || null]
    );

    // Retrieve the newly inserted row via last_insert_rowid
    const idResult = db.exec('SELECT last_insert_rowid() as id');
    const newId = idResult[0].values[0][0];

    saveDatabase();

    component = this.findById(newId);
    return { component, created: true };
  }

  /**
   * Retrieve a list of hardware components with optional filters.
   * Supports: category, search (against name), limit, offset.
   */
  static getAll({ category, search, sort = 'rating', limit = 20, offset = 0 } = {}) {
    const db = getDb();
    let query = 'SELECT * FROM hardware_components WHERE 1=1';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    if (search) {
      query += ' AND (name LIKE ? OR normalized_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (sort === 'reports') {
      query += ' ORDER BY report_count DESC, name ASC';
    } else if (sort === 'score') {
      query += ' ORDER BY avg_score DESC, report_count DESC, name ASC';
    } else {
      query += ` ORDER BY
        CASE community_rating
          WHEN 'Legendary' THEN 1
          WHEN 'Great' THEN 2
          WHEN 'Solid' THEN 3
          WHEN 'Mediocre' THEN 4
          WHEN 'Poor' THEN 5
          ELSE 6
        END ASC,
        rating_confidence DESC,
        report_count DESC,
        name ASC`;
    }

    query += ' LIMIT ? OFFSET ?';
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

  static count({ category, search } = {}) {
    const db = getDb();
    let query = 'SELECT COUNT(*) as total FROM hardware_components WHERE 1=1';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    if (search) {
      query += ' AND (name LIKE ? OR normalized_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const stmt = db.prepare(query);
    stmt.bind(params);
    stmt.step();
    const result = stmt.getAsObject();
    stmt.free();

    return result.total || 0;
  }

  /**
   * Return the top components ordered by report_count descending.
   */
  static getTrending(limit = 10) {
    const db = getDb();
    const results = [];
    const stmt = db.prepare(
      'SELECT * FROM hardware_components ORDER BY report_count DESC LIMIT ?'
    );
    stmt.bind([limit]);
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  /**
   * Recalculates report_count and avg_score for a component based on
   * the benchmarks table. Benchmarks store hardware_specs as JSON; we
   * look for any benchmark whose hardware_specs JSON string contains the
   * component's normalized_name.
   */
  static updateStats(componentId) {
    const db = getDb();

    const component = this.findById(componentId);
    if (!component) return null;

    // Count benchmarks that reference this component name
    const searchTerm = `%${component.normalized_name}%`;
    const countStmt = db.prepare(
      'SELECT COUNT(*) as cnt FROM benchmarks WHERE LOWER(hardware_specs) LIKE ?'
    );
    countStmt.bind([searchTerm]);
    countStmt.step();
    const { cnt } = countStmt.getAsObject();
    countStmt.free();

    const reportCount = cnt || 0;

    // Derive a community_rating label from report_count thresholds
    let communityRating = 'Unrated';
    if (reportCount >= 100) communityRating = 'Very Popular';
    else if (reportCount >= 50) communityRating = 'Popular';
    else if (reportCount >= 10) communityRating = 'Common';
    else if (reportCount >= 1) communityRating = 'Rare';

    // rating_confidence: simple 0-1 scale capped at 100 reports
    const ratingConfidence = Math.min(reportCount / 100, 1.0);

    db.run(
      `UPDATE hardware_components
       SET report_count = ?, community_rating = ?, rating_confidence = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [reportCount, communityRating, ratingConfidence, componentId]
    );

    saveDatabase();
    return this.findById(componentId);
  }

  /**
   * Add an alias for a component. The alias is stored normalized.
   */
  static addAlias(componentId, alias) {
    if (!alias || typeof alias !== 'string') {
      throw new Error('alias must be a non-empty string');
    }

    const db = getDb();
    const normalizedAlias = normalizeText(alias);

    try {
      db.run(
        'INSERT INTO hardware_aliases (alias, component_id) VALUES (?, ?)',
        [normalizedAlias, componentId]
      );
      saveDatabase();
      return true;
    } catch (err) {
      if (err.message && err.message.includes('UNIQUE constraint failed')) {
        // Alias already exists — not a fatal error
        return false;
      }
      throw err;
    }
  }

  /**
   * Full-text search across name and normalized_name.
   * Also searches alias table and deduplicates results.
   */
  static search(query) {
    if (!query || typeof query !== 'string') return [];

    const db = getDb();
    const term = `%${query}%`;
    const normalizedTerm = `%${normalizeText(query)}%`;

    const results = [];
    const seen = new Set();

    // Search in hardware_components directly
    const stmt = db.prepare(`
      SELECT * FROM hardware_components
      WHERE name LIKE ? OR normalized_name LIKE ?
      ORDER BY report_count DESC
      LIMIT 20
    `);
    stmt.bind([term, normalizedTerm]);
    while (stmt.step()) {
      const row = stmt.getAsObject();
      if (!seen.has(row.id)) {
        seen.add(row.id);
        results.push(row);
      }
    }
    stmt.free();

    // Search via aliases
    const aliasStmt = db.prepare(`
      SELECT hc.*
      FROM hardware_components hc
      JOIN hardware_aliases ha ON ha.component_id = hc.id
      WHERE ha.alias LIKE ?
      ORDER BY hc.report_count DESC
      LIMIT 20
    `);
    aliasStmt.bind([normalizedTerm]);
    while (aliasStmt.step()) {
      const row = aliasStmt.getAsObject();
      if (!seen.has(row.id)) {
        seen.add(row.id);
        results.push(row);
      }
    }
    aliasStmt.free();

    return results;
  }
}

module.exports = HardwareComponent;
