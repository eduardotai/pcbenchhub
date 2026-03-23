const express = require('express');
const router = express.Router();
const { getDb } = require('../config/db');
const { recalculateRating } = require('../utils/ratingEngine');

// Middleware: require authenticated admin user
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Authorization required' });

  const token = authHeader.replace('Bearer ', '');
  const db = getDb();

  try {
    const stmt = db.prepare(
      `SELECT u.id, u.role FROM users u
       JOIN sessions s ON s.user_id = u.id
       WHERE s.token = ? AND (s.expires_at IS NULL OR s.expires_at > CURRENT_TIMESTAMP)`
    );
    stmt.bind([token]);
    let user = null;
    if (stmt.step()) user = stmt.getAsObject();
    stmt.free();

    if (!user) return res.status(401).json({ error: 'Invalid or expired token' });
    if (user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

    req.user = user;
    next();
  } catch (err) {
    console.error('[ratings] requireAdmin error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/ratings/hardware/:componentId
// Returns the current rating for a component.
router.get('/hardware/:componentId', (req, res) => {
  const { componentId } = req.params;
  const db = getDb();

  try {
    // Fetch latest snapshot
    const snapshotStmt = db.prepare(`
      SELECT * FROM rating_snapshots
      WHERE component_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `);
    snapshotStmt.bind([componentId]);
    let snapshot = null;
    if (snapshotStmt.step()) snapshot = snapshotStmt.getAsObject();
    snapshotStmt.free();

    // Fetch component base info
    const compStmt = db.prepare(`
      SELECT id, name, category, community_rating, rating_confidence, report_count, avg_score
      FROM hardware_components WHERE id = ?
    `);
    compStmt.bind([componentId]);
    let component = null;
    if (compStmt.step()) component = compStmt.getAsObject();
    compStmt.free();

    if (!component) return res.status(404).json({ error: 'Component not found' });

    res.json({
      component,
      snapshot,
      rating: component.community_rating || 'Unrated',
      confidence: component.rating_confidence || 0,
    });
  } catch (err) {
    console.error('[ratings] GET /hardware/:componentId error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/ratings/hardware/:componentId/history
// Returns the historical rating snapshots for a component.
router.get('/hardware/:componentId/history', (req, res) => {
  const { componentId } = req.params;
  const { limit = 30 } = req.query;
  const db = getDb();

  try {
    const stmt = db.prepare(`
      SELECT id, component_id, rating, composite_score, report_count,
             avg_score, score_stddev, snapshot_date, created_at
      FROM rating_snapshots
      WHERE component_id = ?
      ORDER BY snapshot_date DESC
      LIMIT ?
    `);
    stmt.bind([componentId, Number(limit)]);

    const snapshots = [];
    while (stmt.step()) {
      snapshots.push(stmt.getAsObject());
    }
    stmt.free();

    res.json({ componentId, snapshots });
  } catch (err) {
    console.error('[ratings] GET /hardware/:componentId/history error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/ratings/recalculate/:componentId
// Triggers a full rating recalculation. Requires admin auth.
router.post('/recalculate/:componentId', requireAdmin, (req, res) => {
  const { componentId } = req.params;

  try {
    const result = recalculateRating(Number(componentId));
    res.json({ success: true, componentId: Number(componentId), ...result });
  } catch (err) {
    console.error('[ratings] POST /recalculate/:componentId error:', err.message);
    res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
});

module.exports = router;
