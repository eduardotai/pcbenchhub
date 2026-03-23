const { getDb, saveDatabase } = require('../config/db');

class Collection {
  static getAll({ isPublic = 1, limit = 20, offset = 0, userId = null } = {}) {
    const db = getDb();
    const results = [];
    let query = `
      SELECT c.*, u.username,
        (SELECT COUNT(*) FROM collection_items ci WHERE ci.collection_id = c.id) AS item_count
      FROM collections c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.is_public = ?
    `;
    const params = [isPublic];

    if (userId !== null) {
      query += ' AND c.user_id = ?';
      params.push(userId);
    }

    query += ' ORDER BY c.upvote_count DESC, c.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const stmt = db.prepare(query);
    stmt.bind(params);
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  static getById(id) {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT c.*, u.username,
        (SELECT COUNT(*) FROM collection_items ci WHERE ci.collection_id = c.id) AS item_count
      FROM collections c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `);
    stmt.bind([id]);
    let row = null;
    if (stmt.step()) {
      row = stmt.getAsObject();
    }
    stmt.free();
    return row;
  }

  static getByUser(userId) {
    const db = getDb();
    const results = [];
    const stmt = db.prepare(`
      SELECT c.*, u.username,
        (SELECT COUNT(*) FROM collection_items ci WHERE ci.collection_id = c.id) AS item_count
      FROM collections c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.user_id = ?
      ORDER BY c.updated_at DESC
    `);
    stmt.bind([userId]);
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  static create({ userId, title, description, isPublic = 1 }) {
    const db = getDb();
    const now = new Date().toISOString();
    db.run(
      `INSERT INTO collections (user_id, title, description, is_public, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, title, description || null, isPublic ? 1 : 0, now, now]
    );
    const id = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
    saveDatabase();
    return this.getById(id);
  }

  static update(id, { title, description, isPublic }) {
    const db = getDb();
    const now = new Date().toISOString();
    const fields = [];
    const params = [];

    if (title !== undefined) { fields.push('title = ?'); params.push(title); }
    if (description !== undefined) { fields.push('description = ?'); params.push(description); }
    if (isPublic !== undefined) { fields.push('is_public = ?'); params.push(isPublic ? 1 : 0); }

    if (fields.length === 0) return this.getById(id);

    fields.push('updated_at = ?');
    params.push(now, id);

    db.run(`UPDATE collections SET ${fields.join(', ')} WHERE id = ?`, params);
    saveDatabase();
    return this.getById(id);
  }

  static delete(id) {
    const db = getDb();
    db.run('DELETE FROM collection_votes WHERE collection_id = ?', [id]);
    db.run('DELETE FROM collection_items WHERE collection_id = ?', [id]);
    db.run('DELETE FROM collections WHERE id = ?', [id]);
    saveDatabase();
    return { deleted: true };
  }

  // Items
  static getItems(collectionId) {
    const db = getDb();
    const results = [];
    const stmt = db.prepare(`
      SELECT ci.*,
        hc.name AS component_name, hc.category AS component_category,
        hc.community_rating AS component_rating,
        b.title AS report_title, b.category AS report_category,
        b.scores AS report_scores
      FROM collection_items ci
      LEFT JOIN hardware_components hc ON ci.component_id = hc.id
      LEFT JOIN benchmarks b ON ci.report_id = b.id
      WHERE ci.collection_id = ?
      ORDER BY ci.position ASC, ci.id ASC
    `);
    stmt.bind([collectionId]);
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  static addItem(collectionId, { componentId, reportId, notes, position }) {
    const db = getDb();
    db.run(
      `INSERT INTO collection_items (collection_id, component_id, report_id, notes, position)
       VALUES (?, ?, ?, ?, ?)`,
      [
        collectionId,
        componentId || null,
        reportId || null,
        notes || null,
        position != null ? position : 0
      ]
    );
    const id = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
    db.run(
      'UPDATE collections SET updated_at = ? WHERE id = ?',
      [new Date().toISOString(), collectionId]
    );
    saveDatabase();

    // Return the newly inserted item with joins
    const items = this.getItems(collectionId);
    return items.find((i) => i.id === id) || null;
  }

  static removeItem(collectionId, itemId) {
    const db = getDb();
    db.run(
      'DELETE FROM collection_items WHERE id = ? AND collection_id = ?',
      [itemId, collectionId]
    );
    db.run(
      'UPDATE collections SET updated_at = ? WHERE id = ?',
      [new Date().toISOString(), collectionId]
    );
    saveDatabase();
    return { deleted: true };
  }

  static reorderItems(collectionId, itemIds) {
    const db = getDb();
    itemIds.forEach((itemId, index) => {
      db.run(
        'UPDATE collection_items SET position = ? WHERE id = ? AND collection_id = ?',
        [index, itemId, collectionId]
      );
    });
    saveDatabase();
    return this.getItems(collectionId);
  }

  // Votes
  static vote(userId, collectionId) {
    const db = getDb();
    db.run(
      'INSERT OR IGNORE INTO collection_votes (user_id, collection_id, created_at) VALUES (?, ?, ?)',
      [userId, collectionId, new Date().toISOString()]
    );
    const inserted = db.getRowsModified() > 0;
    if (inserted) {
      db.run(
        'UPDATE collections SET upvote_count = upvote_count + 1 WHERE id = ?',
        [collectionId]
      );
    }
    saveDatabase();
    return { voted: inserted || !!this.getUserVote(userId, collectionId) };
  }

  static unvote(userId, collectionId) {
    const db = getDb();
    db.run(
      'DELETE FROM collection_votes WHERE user_id = ? AND collection_id = ?',
      [userId, collectionId]
    );
    const deleted = db.getRowsModified() > 0;
    if (deleted) {
      db.run(
        'UPDATE collections SET upvote_count = MAX(0, upvote_count - 1) WHERE id = ?',
        [collectionId]
      );
    }
    saveDatabase();
    return { voted: false };
  }

  static getUserVote(userId, collectionId) {
    const db = getDb();
    const stmt = db.prepare(
      'SELECT * FROM collection_votes WHERE user_id = ? AND collection_id = ?'
    );
    stmt.bind([userId, collectionId]);
    let row = null;
    if (stmt.step()) {
      row = stmt.getAsObject();
    }
    stmt.free();
    return row;
  }
}

module.exports = Collection;
