const express = require('express');
const router = express.Router();
const ActivityLog = require('../models/ActivityLog');
const Milestone = require('../models/Milestone');
const { getDb } = require('../config/db');

// GET /api/feed — feed global (Hot/New)
// Query: type='hot'|'new' (default 'new'), limit (default 20), offset (default 0)
router.get('/', (req, res) => {
  try {
    const type = req.query.type === 'hot' ? 'hot' : 'new';
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;

    if (type === 'new') {
      // Activity ordered by created_at DESC with user JOIN
      const items = ActivityLog.getFeed({ limit, offset });
      return res.json({ items, type, limit, offset });
    }

    // Hot: last 24h grouped by entity, ordered by count DESC
    const db = getDb();
    const results = [];
    const stmt = db.prepare(`
      SELECT
        al.entity_type,
        al.entity_id,
        al.action_type,
        COUNT(*) as activity_count,
        MAX(al.created_at) as latest_at,
        MAX(al.metadata) as metadata,
        u.username
      FROM activity_log al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.created_at >= datetime('now', '-24 hours')
      GROUP BY al.entity_type, al.entity_id
      ORDER BY activity_count DESC
      LIMIT ? OFFSET ?
    `);
    stmt.bind([limit, offset]);
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();

    return res.json({ items: results, type, limit, offset });
  } catch (err) {
    console.error('[feed] GET / error:', err);
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
});

// GET /api/feed/milestones — milestones recentes
router.get('/milestones', (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 5, 20);
    const milestones = Milestone.getRecent(limit);
    res.json({ milestones });
  } catch (err) {
    console.error('[feed] GET /milestones error:', err);
    res.status(500).json({ error: 'Failed to fetch milestones' });
  }
});

// GET /api/feed/trending — hardware trending
router.get('/trending', (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 5, 20);
    const db = getDb();
    const results = [];
    const stmt = db.prepare(`
      SELECT id, name, category, brand, report_count, avg_score, community_rating, rating_confidence
      FROM hardware_components
      WHERE report_count > 0
      ORDER BY report_count DESC
      LIMIT ?
    `);
    stmt.bind([limit]);
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    res.json({ components: results });
  } catch (err) {
    console.error('[feed] GET /trending error:', err);
    res.status(500).json({ error: 'Failed to fetch trending hardware' });
  }
});

module.exports = router;
