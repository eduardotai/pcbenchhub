const migrations = [
  {
    id: 'create_hardware_components',
    up: (db) => {
      db.run(`CREATE TABLE IF NOT EXISTS hardware_components (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        normalized_name TEXT UNIQUE NOT NULL,
        category TEXT NOT NULL,
        brand TEXT,
        generation TEXT,
        report_count INTEGER DEFAULT 0,
        avg_score REAL DEFAULT 0,
        community_rating TEXT DEFAULT 'Unrated',
        rating_confidence REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
      db.run(`CREATE TABLE IF NOT EXISTS hardware_aliases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        alias TEXT UNIQUE NOT NULL,
        component_id INTEGER NOT NULL,
        FOREIGN KEY (component_id) REFERENCES hardware_components(id)
      )`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_hardware_category ON hardware_components(category)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_hardware_normalized ON hardware_components(normalized_name)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_aliases_component ON hardware_aliases(component_id)`);
    }
  },
  {
    id: 'create_activity_log',
    up: (db) => {
      db.run(`CREATE TABLE IF NOT EXISTS activity_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action_type TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(user_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_activity_type ON activity_log(action_type)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_activity_entity ON activity_log(entity_type, entity_id)`);
    }
  },
  {
    id: 'add_community_columns_benchmarks',
    up: (db) => {
      const columns = [
        'ALTER TABLE benchmarks ADD COLUMN gaming_context TEXT',
        'ALTER TABLE benchmarks ADD COLUMN user_notes TEXT',
        'ALTER TABLE benchmarks ADD COLUMN tags TEXT',
        'ALTER TABLE benchmarks ADD COLUMN component_ids TEXT',
        'ALTER TABLE benchmarks ADD COLUMN is_update_of TEXT',
        'ALTER TABLE benchmarks ADD COLUMN helpfulness_score INTEGER DEFAULT 0',
        "ALTER TABLE benchmarks ADD COLUMN report_type TEXT DEFAULT 'benchmark'",
      ];
      for (const sql of columns) {
        try { db.run(sql); } catch (e) { /* column already exists */ }
      }
    }
  },
  {
    id: 'create_report_tags',
    up: (db) => {
      db.run(`CREATE TABLE IF NOT EXISTS report_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        category TEXT,
        usage_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
      db.run(`CREATE TABLE IF NOT EXISTS report_tag_map (
        report_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        PRIMARY KEY (report_id, tag_id)
      )`);
    }
  },
  {
    id: 'create_rating_snapshots',
    up: (db) => {
      db.run(`CREATE TABLE IF NOT EXISTS rating_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        component_id INTEGER NOT NULL,
        rating TEXT,
        composite_score REAL,
        report_count INTEGER,
        avg_score REAL,
        score_stddev REAL,
        snapshot_date TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (component_id) REFERENCES hardware_components(id)
      )`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_rating_snapshots_component ON rating_snapshots(component_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_rating_snapshots_date ON rating_snapshots(component_id, snapshot_date)`);
    }
  },
  {
    id: 'add_user_community_columns',
    up: (db) => {
      const columns = [
        'ALTER TABLE users ADD COLUMN reputation_score INTEGER DEFAULT 0',
        "ALTER TABLE users ADD COLUMN reputation_tier TEXT DEFAULT 'newcomer'",
        'ALTER TABLE users ADD COLUMN bio TEXT',
        'ALTER TABLE users ADD COLUMN avatar_url TEXT',
        'ALTER TABLE users ADD COLUMN is_trusted INTEGER DEFAULT 0',
      ];
      for (const sql of columns) {
        try { db.run(sql); } catch (e) { /* column already exists */ }
      }
    }
  },
  {
    id: 'create_badges_system',
    up: (db) => {
      db.run(`CREATE TABLE IF NOT EXISTS badges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        display_name TEXT,
        description TEXT,
        icon TEXT,
        category TEXT,
        requirement_type TEXT,
        requirement_value TEXT,
        color TEXT
      )`);
      db.run(`CREATE TABLE IF NOT EXISTS user_badges (
        user_id INTEGER NOT NULL,
        badge_id INTEGER NOT NULL,
        earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, badge_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (badge_id) REFERENCES badges(id)
      )`);
      db.run(`CREATE TABLE IF NOT EXISTS user_hardware (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        component_id INTEGER NOT NULL,
        acquired_date TEXT,
        notes TEXT,
        is_primary INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (component_id) REFERENCES hardware_components(id)
      )`);
    }
  },
  {
    id: 'create_milestones',
    up: (db) => {
      db.run(`CREATE TABLE IF NOT EXISTS milestones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        threshold INTEGER NOT NULL,
        message TEXT NOT NULL,
        reached_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
    }
  },
  {
    id: 'create_collections',
    up: (db) => {
      db.run(`CREATE TABLE IF NOT EXISTS collections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        is_public INTEGER DEFAULT 1,
        is_featured INTEGER DEFAULT 0,
        upvote_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`);
      db.run(`CREATE TABLE IF NOT EXISTS collection_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        collection_id INTEGER NOT NULL,
        component_id INTEGER,
        report_id INTEGER,
        notes TEXT,
        position INTEGER DEFAULT 0,
        FOREIGN KEY (collection_id) REFERENCES collections(id),
        FOREIGN KEY (component_id) REFERENCES hardware_components(id),
        FOREIGN KEY (report_id) REFERENCES benchmarks(id)
      )`);
      db.run(`CREATE TABLE IF NOT EXISTS collection_votes (
        user_id INTEGER NOT NULL,
        collection_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, collection_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (collection_id) REFERENCES collections(id)
      )`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_collections_user ON collections(user_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_collections_public ON collections(is_public, upvote_count)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_collection_items_coll ON collection_items(collection_id)`);
    }
  }
];

function runMigrations(db) {
  db.run(`CREATE TABLE IF NOT EXISTS _migrations (
    id TEXT PRIMARY KEY,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  for (const migration of migrations) {
    const result = db.exec(`SELECT id FROM _migrations WHERE id = '${migration.id}'`);
    if (!result.length || !result[0].values.length) {
      try {
        migration.up(db);
        db.run(`INSERT INTO _migrations (id) VALUES ('${migration.id}')`);
        console.log(`[Migration] Applied: ${migration.id}`);
      } catch (err) {
        console.error(`[Migration] Failed: ${migration.id}`, err.message);
      }
    }
  }
}

module.exports = { runMigrations };
