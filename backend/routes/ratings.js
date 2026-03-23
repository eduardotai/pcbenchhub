const express = require('express');
const router = express.Router();
const { getDb } = require('../config/db');
const { auth } = require('../middleware/auth');
const { recalculateRating, extractAggregateScore } = require('../utils/ratingEngine');

function requireAdmin(req, res, next) {
  if (!req.user || req.user.email !== 'admin@pcbenchhub.com') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  return next();
}

function getComponentScoreSeries(componentId) {
  const db = getDb();
  const id = String(componentId);
  const patterns = [
    `[${id}]`,
    `[${id},%`,
    `%,${id},%`,
    `%,${id}]`,
    `["${id}"]`,
    `["${id}",%`,
    `%,"${id}",%`,
    `%,"${id}"]`,
  ];

  const stmt = db.prepare(`
    SELECT b.scores
    FROM benchmarks b
    WHERE b.component_ids IS NOT NULL
      AND (
        b.component_ids LIKE ? OR b.component_ids LIKE ? OR b.component_ids LIKE ? OR b.component_ids LIKE ? OR
        b.component_ids LIKE ? OR b.component_ids LIKE ? OR b.component_ids LIKE ? OR b.component_ids LIKE ?
      )
  `);
  stmt.bind(patterns);

  const scoreSeries = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    const aggregate = extractAggregateScore(row.scores);
    if (aggregate != null) {
      scoreSeries.push(aggregate);
    }
  }
  stmt.free();

  return scoreSeries;
}

router.get('/hardware/:componentId', (req, res) => {
  const componentId = Number(req.params.componentId);
  if (!Number.isFinite(componentId)) {
    return res.status(400).json({ error: 'Invalid componentId' });
  }

  const db = getDb();

  try {
    const snapshotStmt = db.prepare(`
      SELECT * FROM rating_snapshots
      WHERE component_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `);
    snapshotStmt.bind([componentId]);

    let snapshot = null;
    if (snapshotStmt.step()) {
      snapshot = snapshotStmt.getAsObject();
    }
    snapshotStmt.free();

    const compStmt = db.prepare(`
      SELECT id, name, category, community_rating, rating_confidence, report_count, avg_score
      FROM hardware_components
      WHERE id = ?
    `);
    compStmt.bind([componentId]);

    let component = null;
    if (compStmt.step()) {
      component = compStmt.getAsObject();
    }
    compStmt.free();

    if (!component) {
      return res.status(404).json({ error: 'Component not found' });
    }

    const scores = getComponentScoreSeries(componentId);

    return res.json({
      component,
      snapshot,
      scores,
      rating: component.community_rating || 'Unrated',
      confidence: component.rating_confidence || 0,
    });
  } catch (err) {
    console.error('[ratings] GET /hardware/:componentId error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/hardware/:componentId/history', (req, res) => {
  const componentId = Number(req.params.componentId);
  if (!Number.isFinite(componentId)) {
    return res.status(400).json({ error: 'Invalid componentId' });
  }

  const limit = Math.min(Math.max(Number(req.query.limit) || 30, 1), 180);
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
    stmt.bind([componentId, limit]);

    const snapshots = [];
    while (stmt.step()) {
      snapshots.push(stmt.getAsObject());
    }
    stmt.free();

    return res.json({ componentId, snapshots });
  } catch (err) {
    console.error('[ratings] GET /hardware/:componentId/history error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/recalculate/:componentId', auth, requireAdmin, (req, res) => {
  const componentId = Number(req.params.componentId);
  if (!Number.isFinite(componentId)) {
    return res.status(400).json({ error: 'Invalid componentId' });
  }

  try {
    const result = recalculateRating(componentId);
    return res.json({ success: true, componentId, ...result });
  } catch (err) {
    console.error('[ratings] POST /recalculate/:componentId error:', err.message);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
});

module.exports = router;
