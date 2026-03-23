const express = require('express');
const router = express.Router();
const Benchmark = require('../models/Benchmark');
const ReportTag = require('../models/ReportTag');
const { auth, optionalAuth, requireVerified } = require('../middleware/auth');
const { validateBenchmark } = require('../middleware/validate');
const RateLimiter = require('../utils/RateLimiter');
const { getDb } = require('../config/db');

const DAILY_SUBMISSION_LIMIT = 5;

router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, testTool, minScore, maxScore, userLevel, search, page = 1, limit = 20 } = req.query;
    
    const benchmarks = Benchmark.findAll({
      category,
      testTool,
      minScore: minScore ? parseInt(minScore) : undefined,
      maxScore: maxScore ? parseInt(maxScore) : undefined,
      userLevel,
      search,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    const total = Benchmark.count({ category, testTool, userLevel, search });

    res.json({
      benchmarks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('List benchmarks error:', error);
    res.status(500).json({ error: 'Failed to fetch benchmarks' });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { userId } = req.params;

    const benchmarks = Benchmark.findByUserId(userId, parseInt(page), parseInt(limit));
    const total = Benchmark.countByUserId(userId);

    res.json({
      benchmarks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('User benchmarks error:', error);
    res.status(500).json({ error: 'Failed to fetch user benchmarks' });
  }
});

router.get('/tags/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      return res.json({ tags: ReportTag.getPopular(20) });
    }
    const tags = ReportTag.search(q);
    res.json({ tags });
  } catch (error) {
    console.error('Tag search error:', error);
    res.status(500).json({ error: 'Failed to search tags' });
  }
});

router.get('/tag/:tagName', optionalAuth, async (req, res) => {
  try {
    const { tagName } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const benchmarkList = Benchmark.findByTag(tagName, { limit: parseInt(limit), offset });

    res.json({
      benchmarks: benchmarkList,
      tag: tagName,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: benchmarkList.length
      }
    });
  } catch (error) {
    console.error('Benchmarks by tag error:', error);
    res.status(500).json({ error: 'Failed to fetch benchmarks by tag' });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const benchmark = Benchmark.findById(req.params.id);
    
    if (!benchmark) {
      return res.status(404).json({ error: 'Benchmark not found' });
    }

    if (benchmark.is_flagged && (!req.user || req.user.id !== benchmark.user_id)) {
      return res.status(404).json({ error: 'Benchmark not found' });
    }

    res.json({ benchmark });
  } catch (error) {
    console.error('Get benchmark error:', error);
    res.status(500).json({ error: 'Failed to fetch benchmark' });
  }
});

router.post('/', auth, requireVerified, async (req, res) => {
  try {
    const limitCheck = RateLimiter.checkLimit(req.user.id, 'submit_benchmark', DAILY_SUBMISSION_LIMIT);
    
    if (!limitCheck.allowed) {
      return res.status(429).json({ 
        error: 'Daily submission limit reached',
        resetDate: limitCheck.resetDate
      });
    }

    const { title, category, hardwareSpecs, software, testTool, scores, gaming_context, user_notes, tags, component_ids, report_type } = req.body;

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
      component_ids,
      report_type
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

    res.status(201).json({
      message: 'Benchmark submitted successfully',
      benchmark,
      remainingSubmissions: limitCheck.remaining
    });
  } catch (error) {
    console.error('Submit benchmark error:', error);
    if (error.message.includes('Invalid scores')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to submit benchmark' });
  }
});

router.post('/:id/flag', auth, async (req, res) => {
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
      const benchmarks = Benchmark.findAll({});
      const userFlags = benchmarks.filter(b => b.user_id === benchmark.user_id).length;
      
      if (userFlags >= 3) {
        User.banUser(benchmark.user_id);
      }
    }

    res.json({
      message: result.flagged ? 'Benchmark has been flagged and removed' : 'Benchmark flagged',
      flagCount: result.benchmark.flag_count
    });
  } catch (error) {
    console.error('Flag benchmark error:', error);
    res.status(500).json({ error: 'Failed to flag benchmark' });
  }
});

router.get('/stats/categories', async (req, res) => {
  try {
    const db = getDb();
    const results = [];
    const stmt = db.prepare(`SELECT category, COUNT(*) as count FROM benchmarks WHERE is_flagged = 0 GROUP BY category`);
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    res.json({ categories: results });
  } catch (error) {
    console.error('Category stats error:', error);
    res.status(500).json({ error: 'Failed to fetch category stats' });
  }
});

router.get('/stats/tools', async (req, res) => {
  try {
    const db = getDb();
    const results = [];
    const stmt = db.prepare(`SELECT test_tool, COUNT(*) as count FROM benchmarks WHERE is_flagged = 0 GROUP BY test_tool ORDER BY count DESC LIMIT 10`);
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    res.json({ tools: results });
  } catch (error) {
    console.error('Tool stats error:', error);
    res.status(500).json({ error: 'Failed to fetch tool stats' });
  }
});

module.exports = router;
