const { getDb, saveDatabase } = require('../config/db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

class User {
  static create({ email, password, username, experienceLevel = 'beginner' }) {
    const db = getDb();
    const id = uuidv4();
    const hashedPassword = bcrypt.hashSync(password, 10);
    const verificationToken = uuidv4();
    const now = new Date().toISOString();
    
    try {
      db.run(
        `INSERT INTO users (id, email, password, username, experience_level, verification_token, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, email.toLowerCase(), hashedPassword, username, experienceLevel, verificationToken, now, now]
      );
      saveDatabase();
      return { id, email, username, experienceLevel, verificationToken };
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        throw new Error('Email or username already exists');
      }
      throw error;
    }
  }

  static findByEmail(email) {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    stmt.bind([email.toLowerCase()]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  }

  static findById(id) {
    const db = getDb();
    const stmt = db.prepare('SELECT id, email, username, experience_level, hardware_setup, is_verified, is_banned, created_at FROM users WHERE id = ?');
    stmt.bind([id]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  }

  static findByUsername(username) {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    stmt.bind([username]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  }

  static verifyEmail(token) {
    const db = getDb();
    db.run('UPDATE users SET is_verified = 1, verification_token = NULL WHERE verification_token = ?', [token]);
    saveDatabase();
    return true;
  }

  static update(id, { username, experienceLevel, hardwareSetup }) {
    const db = getDb();
    const now = new Date().toISOString();
    
    const updates = [];
    const params = [];
    
    if (username !== undefined) { updates.push('username = ?'); params.push(username); }
    if (experienceLevel !== undefined) { updates.push('experience_level = ?'); params.push(experienceLevel); }
    if (hardwareSetup !== undefined) { updates.push('hardware_setup = ?'); params.push(hardwareSetup); }
    
    if (updates.length > 0) {
      updates.push('updated_at = ?');
      params.push(now);
      params.push(id);
      db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
      saveDatabase();
    }
    
    return this.findById(id);
  }

  static updatePassword(id, newPassword) {
    const db = getDb();
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
    saveDatabase();
  }

  static banUser(id) {
    const db = getDb();
    db.run('UPDATE users SET is_banned = 1 WHERE id = ?', [id]);
    saveDatabase();
  }

  static getAll() {
    const db = getDb();
    const results = [];
    const stmt = db.prepare('SELECT id, email, username, experience_level, is_verified, is_banned, created_at FROM users');
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  static delete(id) {
    const db = getDb();
    db.run('DELETE FROM users WHERE id = ?', [id]);
    saveDatabase();
  }

  static verifyPassword(user, password) {
    return bcrypt.compareSync(password, user.password);
  }
}

module.exports = User;
