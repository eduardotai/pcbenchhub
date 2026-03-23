const { getDb, saveDatabase } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const PROFANITY_LIST = [
  'fuck', 'shit', 'damn', 'ass', 'bitch', 'crap', 'bastard', 'cunt', 'dick', 'cock',
  'pussy', 'retard', 'idiot', 'stupid', 'moron', 'dumbass', 'fucker', 'shithead'
];

const PROFANITY_PATTERN = new RegExp(PROFANITY_LIST.join('|'), 'gi');

class Comment {
  static create({ benchmarkId, userId, content }) {
    const cleanedContent = this.cleanContent(content);
    if (!cleanedContent || cleanedContent.trim().length < 2) {
      throw new Error('Comment must be at least 2 characters');
    }

    const db = getDb();
    const id = uuidv4();
    const now = new Date().toISOString();
    
    db.run(
      `INSERT INTO comments (id, benchmark_id, user_id, content, created_at) VALUES (?, ?, ?, ?, ?)`,
      [id, benchmarkId, userId, cleanedContent, now]
    );
    saveDatabase();
    return this.findById(id);
  }

  static cleanContent(content) {
    return content.replace(PROFANITY_PATTERN, '***');
  }

  static findById(id) {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT c.*, u.username, u.experience_level as userExperience
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `);
    stmt.bind([id]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  }

  static findByBenchmarkId(benchmarkId) {
    const db = getDb();
    const results = [];
    const stmt = db.prepare(`
      SELECT c.*, u.username, u.experience_level as userExperience
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.benchmark_id = ?
      ORDER BY c.created_at ASC
    `);
    stmt.bind([benchmarkId]);
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  static delete(id) {
    const db = getDb();
    db.run('DELETE FROM comments WHERE id = ?', [id]);
    saveDatabase();
  }

  static countByBenchmarkId(benchmarkId) {
    const db = getDb();
    const stmt = db.prepare('SELECT COUNT(*) as total FROM comments WHERE benchmark_id = ?');
    stmt.bind([benchmarkId]);
    stmt.step();
    const result = stmt.getAsObject();
    stmt.free();
    return result.total;
  }
}

module.exports = Comment;
