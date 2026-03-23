const { getDb, saveDatabase } = require('../config/db');

const BADGE_DEFINITIONS = [
  // Milestone
  { name: 'first_report', display_name: 'First Report', description: 'Submitted your first report', icon: '🏆', category: 'milestone', requirement_type: 'report_count', requirement_value: 1, color: '#f59e0b' },
  { name: 'prolific_reporter', display_name: 'Prolific Reporter', description: 'Submitted 10 reports', icon: '📊', category: 'milestone', requirement_type: 'report_count', requirement_value: 10, color: '#f59e0b' },
  { name: 'centurion', display_name: 'Centurion', description: 'Submitted 100 reports', icon: '💯', category: 'milestone', requirement_type: 'report_count', requirement_value: 100, color: '#9333ea' },
  // Community
  { name: 'helpful', display_name: 'Helpful', description: 'Received 10 upvotes', icon: '👍', category: 'community', requirement_type: 'upvotes_received', requirement_value: 10, color: '#22c55e' },
  { name: 'community_pillar', display_name: 'Community Pillar', description: 'Received 100 upvotes', icon: '🏛️', category: 'community', requirement_type: 'upvotes_received', requirement_value: 100, color: '#22c55e' },
  // Expertise
  { name: 'gpu_guru', display_name: 'GPU Guru', description: '10 GPU reports', icon: '🎮', category: 'expertise', requirement_type: 'category_reports_gpu', requirement_value: 10, color: '#3b82f6' },
  { name: 'cpu_expert', display_name: 'CPU Expert', description: '10 CPU reports', icon: '⚡', category: 'expertise', requirement_type: 'category_reports_cpu', requirement_value: 10, color: '#3b82f6' },
  { name: 'storage_specialist', display_name: 'Storage Specialist', description: '10 Storage reports', icon: '💾', category: 'expertise', requirement_type: 'category_reports_storage', requirement_value: 10, color: '#3b82f6' },
  { name: 'memory_master', display_name: 'Memory Master', description: '10 RAM reports', icon: '🧠', category: 'expertise', requirement_type: 'category_reports_ram', requirement_value: 10, color: '#3b82f6' },
  // Special
  { name: 'overclocker', display_name: 'Overclocker', description: '5 reports tagged "overclocked"', icon: '🔥', category: 'special', requirement_type: 'tag_reports_overclocked', requirement_value: 5, color: '#ef4444' },
];

class Badge {
  static getAll() {
    const db = getDb();
    const results = [];
    const stmt = db.prepare('SELECT * FROM badges ORDER BY category ASC, name ASC');
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  static getById(id) {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM badges WHERE id = ?');
    stmt.bind([id]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  }

  static getByUser(userId) {
    const db = getDb();
    const results = [];
    const stmt = db.prepare(`
      SELECT b.*, ub.earned_at
      FROM badges b
      JOIN user_badges ub ON b.id = ub.badge_id
      WHERE ub.user_id = ?
      ORDER BY ub.earned_at DESC
    `);
    stmt.bind([userId]);
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  static seed() {
    const db = getDb();
    for (const def of BADGE_DEFINITIONS) {
      db.run(
        `INSERT OR IGNORE INTO badges (name, display_name, description, icon, category, requirement_type, requirement_value, color)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          def.name,
          def.display_name,
          def.description,
          def.icon,
          def.category,
          def.requirement_type,
          def.requirement_value,
          def.color,
        ]
      );
    }
    saveDatabase();
  }
}

module.exports = Badge;
module.exports.BADGE_DEFINITIONS = BADGE_DEFINITIONS;
