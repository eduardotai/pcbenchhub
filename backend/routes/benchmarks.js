const express = require('express');
const router = express.Router();
const Benchmark = require('../models/Benchmark');
const ReportTag = require('../models/ReportTag');
const HardwareComponent = require('../models/HardwareComponent');
const { auth, optionalAuth, requireVerified } = require('../middleware/auth');
const { validateBenchmark } = require('../middleware/validate');
const RateLimiter = require('../utils/RateLimiter');
const { recalculateRating } = require('../utils/ratingEngine');
const { updateReputation, checkAndGrantBadges } = require('../utils/badgeEngine');
const activityTracker = require('../utils/activityTracker');
const { getDb } = require('../config/db');

const DAILY_SUBMISSION_LIMIT = 5;

function uniqueComponentIds(ids) {
  return [...new Set(ids.map((id) => Number(id)).filter((id) => Number.isFinite(id)))];
}

function resolveComponentId(candidate) {
  if (candidate == null) return null;

  const asNumber = Number(candidate);
  if (Number.isFinite(asNumber) && HardwareComponent.findById(asNumber)) {
    return asNumber;
  }

  if (typeof candidate === 'string' && candidate.trim()) {
    const { component } = HardwareComponent.findOrCreate(candidate.trim());
    return component?.id || null;
  }

  return null;
}

function resolveComponents({ component_ids, hardwareSpecs }) {
  const resolved = [];

  if (Array.isArray(component_ids)) {
    for (const candidate of component_ids) {
      try {
        const id = resolveComponentId(candidate);
        if (id != null) resolved.push(id);
      } catch (err) {
        console.error('[benchmarks] component_ids resolve error:', err.message);
      }
    }
  }

  if (hardwareSpecs && typeof hardwareSpecs === 'object') {
    for (const value of Object.values(hardwareSpecs)) {
      if (!value || typeof value !== 'string') continue;

      try {
        const { component } = HardwareComponent.findOrCreate(value.trim());
        if (component?.id != null) {
          resolved.push(component.id);
        }
      } catch (err) {
        console.error('[benchmarks] hardwareSpecs resolve error:', err.message);
      }
    }
  }

  return uniqueComponentIds(resolved);
}

function refreshComponentCommunity(componentIds) {
  for (const componentId of componentIds) {
    try {
      HardwareComponent.updateStats(componentId);
      recalculateRating(componentId);
    } catch (err) {
      console.error(`[benchmarks] component refresh failed for ${componentId}:`, err.message);
    }
  }
}

function refreshAuthorCommunity(userId) {
  const reputation = updateReputation(userId);
  const newBadges = checkAndGrantBadges(userId);

  for (const badge of newBadges) {
    activityTracker.badgeEarned(userId, badge.id, badge.display_name || badge.name);
  }

  return { reputation, newBadges };
}

router.get('/', optionalAuth, (req, res) => {
  try {
    const {
      category,
      testTool,
      minScore,
      maxScore,
      userLevel,
      search,
      componentId,
      page = 1,
      limit = 20,
    } = req.query;

    const pageNumber = Math.max(1, Number(page) || 1);
    const limitNumber = Math.min(Math.max(1, Number(limit) || 20), 100);

    const filters = {
      category,
      testTool,
      minScore: minScore != null ? Number(minScore) : undefined,
      maxScore: maxScore != null ? Number(maxScore) : undefined,
      userLevel,
      search,
      componentId,
      page: pageNumber,
      limit: limitNumber,
    };

    const benchmarks = Benchmark.findAll(filters);
    const total = Benchmark.count(filters);

    return res.json({
      benchmarks,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        pages: Math.max(1, Math.ceil(total / limitNumber)),
      },
    });
  } catch (error) {
    console.error('List benchmarks error:', error);
    return res.status(500).json({ error: 'Failed to fetch benchmarks' });
  }
});

router.get('/user/:userId', (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(Math.max(1, Number(req.query.limit) || 20), 100);
    const { userId } = req.params;

    const benchmarks = Benchmark.findByUserId(userId, page, limit);
    const total = Benchmark.countByUserId(userId);

    return res.json({
      benchmarks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error('User benchmarks error:', error);
    return res.status(500).json({ error: 'Failed to fetch user benchmarks' });
  }
});

router.get('/tags/search', (req, res) => {
  try {
    const { q } = req.query;
    if (!q || String(q).trim().length === 0) {
      return res.json({ tags: ReportTag.getPopular(20) });
    }

    const tags = ReportTag.search(String(q));
    return res.json({ tags });
  } catch (error) {
    console.error('Tag search error:', error);
    return res.status(500).json({ error: 'Failed to search tags' });
  }
});

router.get('/tag/:tagName', optionalAuth, (req, res) => {
  try {
    const { tagName } = req.params;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(Math.max(1, Number(req.query.limit) || 20), 100);
    const offset = (page - 1) * limit;

    const benchmarkList = Benchmark.findByTag(tagName, { limit, offset });

    return res.json({
      benchmarks: benchmarkList,
      tag: tagName,
      pagination: {
        page,
        limit,
        total: benchmarkList.length,
      },
    });
  } catch (error) {
    console.error('Benchmarks by tag error:', error);
    return res.status(500).json({ error: 'Failed to fetch benchmarks by tag' });
  }
});

router.get('/stats/categories', (req, res) => {
  try {
    const db = getDb();
    const results = [];
    const stmt = db.prepare(
      'SELECT category, COUNT(*) as count FROM benchmarks WHERE is_flagged = 0 GROUP BY category'
    );

    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();

    return res.json({ categories: results });
  } catch (error) {
    console.error('Category stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch category stats' });
  }
});

router.get('/stats/tools', (req, res) => {
  try {
    const db = getDb();
    const results = [];
    const stmt = db.prepare(
      'SELECT test_tool, COUNT(*) as count FROM benchmarks WHERE is_flagged = 0 GROUP BY test_tool ORDER BY count DESC LIMIT 10'
    );

    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();

    return res.json({ tools: results });
  } catch (error) {
    console.error('Tool stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch tool stats' });
  }
});

router.get('/:id', optionalAuth, (req, res) => {
  try {
    const benchmark = Benchmark.findById(req.params.id);

    if (!benchmark) {
      return res.status(404).json({ error: 'Benchmark not found' });
    }

    if (benchmark.is_flagged && (!req.user || req.user.id !== benchmark.user_id)) {
      return res.status(404).json({ error: 'Benchmark not found' });
    }

    return res.json({ benchmark });
  } catch (error) {
    console.error('Get benchmark error:', error);
    return res.status(500).json({ error: 'Failed to fetch benchmark' });
  }
});

router.post('/', auth, requireVerified, validateBenchmark, (req, res) => {
  try {
    const limitCheck = RateLimiter.checkLimit(req.user.id, 'submit_benchmark', DAILY_SUBMISSION_LIMIT);

    if (!limitCheck.allowed) {
      return res.status(429).json({
        error: 'Daily submission limit reached',
        resetDate: limitCheck.resetDate,
      });
    }

    const {
      title,
      category,
      hardwareSpecs,
      software,
      testTool,
      scores,
      gaming_context,
      user_notes,
      tags,
      component_ids,
      report_type,
    } = req.body;

    const resolvedComponentIds = resolveComponents({ component_ids, hardwareSpecs });

    const benchmark = Benchmark.create({
      userId: req.user.id,
      title,
      category,
      hardwareSpecs,
      software,
      testTool,
      scores,
      gaming_context,
      user_notes,
      tags,
      component_ids: resolvedComponentIds,
      report_type,
    });

    if (tags && Array.isArray(tags) && tags.length > 0) {
      for (const tagName of tags) {
        try {
          const tag = ReportTag.findOrCreate(tagName);
          if (tag) {
            ReportTag.addToReport(benchmark.id, tag.id);
          }
        } catch (tagError) {
          console.error('Tag processing error:', tagError);
        }
      }
    }

    refreshComponentCommunity(resolvedComponentIds);

    const { reputation, newBadges } = refreshAuthorCommunity(req.user.id);
    activityTracker.reportSubmitted(req.user.id, benchmark.id, resolvedComponentIds);

    return res.status(201).json({
      message: 'Benchmark submitted successfully',
      benchmark,
      component_ids: resolvedComponentIds,
      reputation,
      badges_earned: newBadges,
      remainingSubmissions: limitCheck.remaining,
    });
  } catch (error) {
    console.error('Submit benchmark error:', error);
    if (error.message.includes('Invalid scores')) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to submit benchmark' });
  }
});

router.post('/:id/flag', auth, (req, res) => {
  try {
    const benchmark = Benchmark.findById(req.params.id);

    if (!benchmark) {
      return res.status(404).json({ error: 'Benchmark not found' });
    }

    if (benchmark.user_id === req.user.id) {
      return res.status(400).json({ error: 'Cannot flag your own benchmark' });
    }

    const result = Benchmark.flag(req.params.id);

    if (result.flagged) {
      const User = require('../models/User');
      const db = getDb();
      const stmt = db.prepare('SELECT COUNT(*) as total FROM benchmarks WHERE user_id = ? AND is_flagged = 1');
      stmt.bind([benchmark.user_id]);
      stmt.step();
      const flaggedCount = stmt.getAsObject().total || 0;
      stmt.free();

      if (flaggedCount >= 3) {
        User.banUser(benchmark.user_id);
      }
    }

    return res.json({
      message: result.flagged ? 'Benchmark has been flagged and removed' : 'Benchmark flagged',
      flagCount: result.benchmark.flag_count,
    });
  } catch (error) {
    console.error('Flag benchmark error:', error);
    return res.status(500).json({ error: 'Failed to flag benchmark' });
  }
});

module.exports = router;
