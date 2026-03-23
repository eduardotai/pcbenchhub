const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Badge = require('../models/Badge');
const UserHardware = require('../models/UserHardware');
const ActivityLog = require('../models/ActivityLog');
const activityTracker = require('../utils/activityTracker');
const { auth } = require('../middleware/auth');
const { getDb } = require('../config/db');

/**
 * Helper: look up a user by username; returns null if not found.
 */
function findUserByUsername(username) {
  return User.findByUsername(username);
}

/**
 * Helper: get report stats for a user.
 * Returns { report_count, upvotes_received }
 */
function getUserStats(userId) {
  const db = getDb();

  // report_count — number of benchmarks submitted
  const reportStmt = db.prepare('SELECT COUNT(*) as cnt FROM benchmarks WHERE user_id = ?');
  reportStmt.bind([userId]);
  reportStmt.step();
  const reportRow = reportStmt.getAsObject();
  reportStmt.free();
  const report_count = reportRow.cnt || 0;

  // upvotes_received — total upvotes across all their benchmarks
  const voteStmt = db.prepare(
    `SELECT COUNT(*) as cnt
     FROM votes v
     JOIN benchmarks b ON b.id = v.report_id
     WHERE b.user_id = ? AND CAST(v.vote_type AS INTEGER) = 1`
  );
  voteStmt.bind([userId]);
  voteStmt.step();
  const voteRow = voteStmt.getAsObject();
  voteStmt.free();
  const upvotes_received = voteRow.cnt || 0;

  return { report_count, upvotes_received };
}

/**
 * GET /api/profiles/:username
 * Public full profile.
 */
router.get('/:username', (req, res) => {
  try {
    const user = findUserByUsername(req.params.username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const badges = Badge.getByUser(user.id);
    const hardware = UserHardware.getByUser(user.id);
    const stats = getUserStats(user.id);

    res.json({
      user: {
        id: user.id,
        username: user.username,
        reputation_score: user.reputation_score || 0,
        reputation_tier: user.reputation_tier || 'newcomer',
        bio: user.bio || null,
        avatar_url: user.avatar_url || null,
        is_trusted: user.is_trusted || 0,
        created_at: user.created_at,
      },
      badges,
      hardware,
      stats: {
        ...stats,
        badges_count: badges.length,
      },
    });
  } catch (err) {
    console.error('[profiles] GET /:username error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});

/**
 * GET /api/profiles/:username/badges
 * Badges earned by the user.
 */
router.get('/:username/badges', (req, res) => {
  try {
    const user = findUserByUsername(req.params.username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const badges = Badge.getByUser(user.id);
    res.json({ badges });
  } catch (err) {
    console.error('[profiles] GET /:username/badges error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve badges' });
  }
});

/**
 * GET /api/profiles/:username/hardware
 * Hardware components linked to the user.
 */
router.get('/:username/hardware', (req, res) => {
  try {
    const user = findUserByUsername(req.params.username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const hardware = UserHardware.getByUser(user.id);
    res.json({ hardware });
  } catch (err) {
    console.error('[profiles] GET /:username/hardware error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve hardware' });
  }
});

/**
 * GET /api/profiles/:username/activity
 * Activity feed for a user.
 * Query params: limit (default 20), offset (default 0)
 */
router.get('/:username/activity', (req, res) => {
  try {
    const user = findUserByUsername(req.params.username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;

    const rawItems = ActivityLog.getByUser(user.id, { limit, offset });

    const activity = rawItems.map((item) => {
      let metadata = null;
      if (item.metadata) {
        try {
          metadata = JSON.parse(item.metadata);
        } catch {
          metadata = item.metadata;
        }
      }
      return {
        id: item.id,
        action_type: item.action_type,
        entity_type: item.entity_type,
        entity_id: item.entity_id,
        metadata,
        created_at: item.created_at,
        username: item.username,
      };
    });

    res.json({ activity, limit, offset, total: activity.length });
  } catch (err) {
    console.error('[profiles] GET /:username/activity error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve activity' });
  }
});

/**
 * POST /api/profiles/:username/hardware
 * Add hardware to a user's profile (auth required, own profile only).
 * Body: { componentId, acquiredDate?, notes?, isPrimary? }
 */
router.post('/:username/hardware', auth, (req, res) => {
  try {
    const user = findUserByUsername(req.params.username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { componentId, acquiredDate, notes, isPrimary } = req.body;
    if (!componentId) {
      return res.status(400).json({ error: 'componentId is required' });
    }

    const entry = UserHardware.add({
      userId: user.id,
      componentId,
      acquiredDate: acquiredDate || null,
      notes: notes || null,
      isPrimary: isPrimary ? 1 : 0,
    });

    if (entry) {
      activityTracker.hardwareAdded(user.id, entry.component_id, entry.component_name);
    }

    res.status(201).json({ hardware: entry });
  } catch (err) {
    console.error('[profiles] POST /:username/hardware error:', err.message);
    res.status(500).json({ error: 'Failed to add hardware' });
  }
});

/**
 * DELETE /api/profiles/:username/hardware/:componentId
 * Remove hardware from a user's profile (auth required, own profile only).
 */
router.delete('/:username/hardware/:componentId', auth, (req, res) => {
  try {
    const user = findUserByUsername(req.params.username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const componentId = parseInt(req.params.componentId);
    if (isNaN(componentId)) {
      return res.status(400).json({ error: 'Invalid componentId' });
    }

    UserHardware.remove(user.id, componentId);
    res.json({ success: true });
  } catch (err) {
    console.error('[profiles] DELETE /:username/hardware/:componentId error:', err.message);
    res.status(500).json({ error: 'Failed to remove hardware' });
  }
});

/**
 * PUT /api/profiles/:username/hardware/:componentId/primary
 * Set a hardware component as primary (auth required, own profile only).
 */
router.put('/:username/hardware/:componentId/primary', auth, (req, res) => {
  try {
    const user = findUserByUsername(req.params.username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const componentId = parseInt(req.params.componentId);
    if (isNaN(componentId)) {
      return res.status(400).json({ error: 'Invalid componentId' });
    }

    UserHardware.setPrimary(user.id, componentId);
    const hardware = UserHardware.getByUser(user.id);
    res.json({ hardware });
  } catch (err) {
    console.error('[profiles] PUT /:username/hardware/:componentId/primary error:', err.message);
    res.status(500).json({ error: 'Failed to set primary hardware' });
  }
});

module.exports = router;
