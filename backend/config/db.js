const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const { runMigrations } = require('./migrations');

const dbPath = path.join(__dirname, '..', 'data', 'pcbenchhub.db');
let db = null;

async function initializeDatabase() {
  const SQL = await initSqlJs();
  
  let data = null;
  if (fs.existsSync(dbPath)) {
    data = fs.readFileSync(dbPath);
  }
  
  db = new SQL.Database(data);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      experience_level TEXT DEFAULT 'beginner',
      hardware_setup TEXT,
      is_verified INTEGER DEFAULT 0,
      verification_token TEXT,
      is_banned INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS benchmarks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      hardware_specs TEXT NOT NULL,
      software TEXT NOT NULL,
      test_tool TEXT NOT NULL,
      scores TEXT NOT NULL,
      is_flagged INTEGER DEFAULT 0,
      flag_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      benchmark_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (benchmark_id) REFERENCES benchmarks(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS rate_limits (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      count INTEGER DEFAULT 0,
      date TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  try {
    db.run(`CREATE INDEX IF NOT EXISTS idx_benchmarks_user ON benchmarks(user_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_benchmarks_category ON benchmarks(category)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_comments_benchmark ON comments(benchmark_id)`);
  } catch (e) {}

  runMigrations(db);

  saveDatabase();
  return db;
}

function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

function getDb() {
  return db;
}

module.exports = { initializeDatabase, getDb, saveDatabase, db: { get: () => db } };
