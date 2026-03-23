const { getDb, saveDatabase } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class RateLimiter {
  static getToday() {
    return new Date().toISOString().split('T')[0];
  }

  static checkLimit(userId, action, limit) {
    const db = getDb();
    const today = this.getToday();
    
    const stmt = db.prepare('SELECT * FROM rate_limits WHERE user_id = ? AND action = ? AND date = ?');
    stmt.bind([userId, action, today]);
    
    if (stmt.step()) {
      const record = stmt.getAsObject();
      stmt.free();
      
      if (record.count >= limit) {
        return { allowed: false, remaining: 0, resetDate: today };
      }

      db.run('UPDATE rate_limits SET count = count + 1 WHERE id = ?', [record.id]);
      saveDatabase();
      return { allowed: true, remaining: limit - record.count - 1 };
    }
    
    stmt.free();
    
    const id = uuidv4();
    db.run('INSERT INTO rate_limits (id, user_id, action, count, date) VALUES (?, ?, ?, 1, ?)',
      [id, userId, action, today]);
    saveDatabase();
    return { allowed: true, remaining: limit - 1 };
  }

  static getSubmissionCount(userId) {
    const db = getDb();
    const today = this.getToday();
    const stmt = db.prepare('SELECT count FROM rate_limits WHERE user_id = ? AND action = ? AND date = ?');
    stmt.bind([userId, 'submit_benchmark', today]);
    if (stmt.step()) {
      const result = stmt.getAsObject();
      stmt.free();
      return result.count;
    }
    stmt.free();
    return 0;
  }
}

module.exports = RateLimiter;
