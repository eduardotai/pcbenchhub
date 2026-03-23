const express = require('express');
const router = express.Router();
const HardwareComponent = require('../models/HardwareComponent');

/**
 * GET /api/hardware
 * List hardware components with optional filters.
 * Query params: category, search, limit, offset
 */
router.get('/', (req, res) => {
  try {
    const { category, search } = req.query;
    const sort = req.query.sort || 'rating';
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const offset = parseInt(req.query.offset, 10) || (page - 1) * limit;

    const components = HardwareComponent.getAll({ category, search, sort, limit, offset });
    const total = HardwareComponent.count({ category, search });

    res.json({
      components,
      pagination: {
        page,
        limit,
        offset,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (err) {
    console.error('[hardware] GET / error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve hardware components' });
  }
});

/**
 * GET /api/hardware/trending
 * Return the top hardware components by report count.
 * Query param: limit (default 10, max 50)
 */
router.get('/trending', (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const components = HardwareComponent.getTrending(limit);
    res.json({ components });
  } catch (err) {
    console.error('[hardware] GET /trending error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve trending hardware' });
  }
});

/**
 * GET /api/hardware/:id
 * Return a single hardware component by numeric ID.
 */
router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid hardware component ID' });
    }

    const component = HardwareComponent.findById(id);
    if (!component) {
      return res.status(404).json({ error: 'Hardware component not found' });
    }

    res.json({ component });
  } catch (err) {
    console.error('[hardware] GET /:id error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve hardware component' });
  }
});

/**
 * POST /api/hardware/resolve
 * Resolve free-form hardware text to a canonical component.
 * Body: { text: string }
 * Returns the matched or newly created component.
 */
router.post('/resolve', (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Request body must include a non-empty "text" field' });
    }

    const { component, created } = HardwareComponent.findOrCreate(text.trim());
    res.status(created ? 201 : 200).json({ component, created });
  } catch (err) {
    console.error('[hardware] POST /resolve error:', err.message);
    res.status(500).json({ error: 'Failed to resolve hardware component' });
  }
});

module.exports = router;
