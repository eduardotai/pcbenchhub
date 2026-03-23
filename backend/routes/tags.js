const express = require('express');
const router = express.Router();
const ReportTag = require('../models/ReportTag');

// GET /api/tags — lista todas as tags, popular primeiro
router.get('/', (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const tags = ReportTag.getPopular(limit);
    res.json({ tags });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// GET /api/tags/search?q=query — busca tags por nome
router.get('/search', (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) {
      return res.json({ tags: [] });
    }
    const tags = ReportTag.search(q);
    res.json({ tags });
  } catch (error) {
    console.error('Error searching tags:', error);
    res.status(500).json({ error: 'Failed to search tags' });
  }
});

// GET /api/tags/:name — detalhe da tag + reports com ela
router.get('/:name', (req, res) => {
  try {
    const name = req.params.name.toLowerCase().trim();
    const tag = ReportTag.findByName(name);
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    const { getDb } = require('../config/db');
    const db = getDb();
    const reports = [];
    const stmt = db.prepare(`
      SELECT b.id, b.title, b.category, b.scores, b.report_type,
             b.created_at, u.username
      FROM benchmarks b
      JOIN report_tag_map rtm ON b.id = rtm.report_id
      LEFT JOIN users u ON b.user_id = u.id
      WHERE rtm.tag_id = ?
      ORDER BY b.created_at DESC
      LIMIT 50
    `);
    stmt.bind([tag.id]);
    while (stmt.step()) {
      reports.push(stmt.getAsObject());
    }
    stmt.free();

    res.json({ tag, reports });
  } catch (error) {
    console.error('Error fetching tag detail:', error);
    res.status(500).json({ error: 'Failed to fetch tag' });
  }
});

module.exports = router;
