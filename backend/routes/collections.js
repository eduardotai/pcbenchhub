const express = require('express');
const router = express.Router();
const Collection = require('../models/Collection');
const { auth, optionalAuth } = require('../middleware/auth');

// GET /api/collections — lista pública, ordenada por upvotes
router.get('/', optionalAuth, (req, res) => {
  try {
    const limit  = parseInt(req.query.limit,  10) || 20;
    const offset = parseInt(req.query.offset, 10) || 0;
    const featured = req.query.featured === '1' || req.query.featured === 'true';

    const colls = Collection.getAll({ isPublic: 1, limit, offset });
    const result = featured ? colls.filter((c) => c.is_featured) : colls;

    res.json({ collections: result });
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

// GET /api/collections/my — coleções do usuário autenticado
router.get('/my', auth, (req, res) => {
  try {
    const colls = Collection.getByUser(req.user.id);
    res.json({ collections: colls });
  } catch (error) {
    console.error('Error fetching user collections:', error);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

// GET /api/collections/:id — detalhe com items
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const coll = Collection.getById(id);
    if (!coll) return res.status(404).json({ error: 'Collection not found' });

    // Coleções privadas só visíveis para o dono
    if (!coll.is_public && (!req.user || req.user.id !== coll.user_id)) {
      return res.status(403).json({ error: 'This collection is private' });
    }

    const items = Collection.getItems(id);
    const userVote = req.user ? Collection.getUserVote(req.user.id, id) : null;

    res.json({ collection: coll, items, voted: !!userVote });
  } catch (error) {
    console.error('Error fetching collection:', error);
    res.status(500).json({ error: 'Failed to fetch collection' });
  }
});

// POST /api/collections — criar (auth)
router.post('/', auth, (req, res) => {
  try {
    const { title, description, isPublic } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'title is required' });
    }

    const coll = Collection.create({
      userId: req.user.id,
      title: title.trim(),
      description: description || null,
      isPublic: isPublic !== false && isPublic !== 0 ? 1 : 0,
    });

    res.status(201).json({ collection: coll });
  } catch (error) {
    console.error('Error creating collection:', error);
    res.status(500).json({ error: 'Failed to create collection' });
  }
});

// PUT /api/collections/:id — editar (auth, dono)
router.put('/:id', auth, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const coll = Collection.getById(id);
    if (!coll) return res.status(404).json({ error: 'Collection not found' });
    if (coll.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const { title, description, isPublic } = req.body;
    const updated = Collection.update(id, { title, description, isPublic });

    res.json({ collection: updated });
  } catch (error) {
    console.error('Error updating collection:', error);
    res.status(500).json({ error: 'Failed to update collection' });
  }
});

// DELETE /api/collections/:id — deletar (auth, dono)
router.delete('/:id', auth, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const coll = Collection.getById(id);
    if (!coll) return res.status(404).json({ error: 'Collection not found' });
    if (coll.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    Collection.delete(id);
    res.json({ deleted: true });
  } catch (error) {
    console.error('Error deleting collection:', error);
    res.status(500).json({ error: 'Failed to delete collection' });
  }
});

// GET /api/collections/:id/items — items da coleção
router.get('/:id/items', optionalAuth, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const coll = Collection.getById(id);
    if (!coll) return res.status(404).json({ error: 'Collection not found' });
    if (!coll.is_public && (!req.user || req.user.id !== coll.user_id)) {
      return res.status(403).json({ error: 'This collection is private' });
    }

    const items = Collection.getItems(id);
    res.json({ items });
  } catch (error) {
    console.error('Error fetching collection items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// POST /api/collections/:id/items — adicionar item
router.post('/:id/items', auth, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const coll = Collection.getById(id);
    if (!coll) return res.status(404).json({ error: 'Collection not found' });
    if (coll.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const { componentId, reportId, notes, position } = req.body;
    if (!componentId && !reportId) {
      return res.status(400).json({ error: 'componentId or reportId is required' });
    }

    const item = Collection.addItem(id, { componentId, reportId, notes, position });
    res.status(201).json({ item });
  } catch (error) {
    console.error('Error adding collection item:', error);
    res.status(500).json({ error: 'Failed to add item' });
  }
});

// DELETE /api/collections/:id/items/:itemId — remover item
router.delete('/:id/items/:itemId', auth, (req, res) => {
  try {
    const id     = parseInt(req.params.id,     10);
    const itemId = parseInt(req.params.itemId, 10);
    if (isNaN(id) || isNaN(itemId)) return res.status(400).json({ error: 'Invalid id' });

    const coll = Collection.getById(id);
    if (!coll) return res.status(404).json({ error: 'Collection not found' });
    if (coll.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    Collection.removeItem(id, itemId);
    res.json({ deleted: true });
  } catch (error) {
    console.error('Error removing collection item:', error);
    res.status(500).json({ error: 'Failed to remove item' });
  }
});

// POST /api/collections/:id/vote — votar
router.post('/:id/vote', auth, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const coll = Collection.getById(id);
    if (!coll) return res.status(404).json({ error: 'Collection not found' });

    const result = Collection.vote(req.user.id, id);
    const updated = Collection.getById(id);
    res.json({ ...result, upvote_count: updated.upvote_count });
  } catch (error) {
    console.error('Error voting on collection:', error);
    res.status(500).json({ error: 'Failed to vote' });
  }
});

// DELETE /api/collections/:id/vote — remover voto
router.delete('/:id/vote', auth, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const coll = Collection.getById(id);
    if (!coll) return res.status(404).json({ error: 'Collection not found' });

    const result = Collection.unvote(req.user.id, id);
    const updated = Collection.getById(id);
    res.json({ ...result, upvote_count: updated.upvote_count });
  } catch (error) {
    console.error('Error removing vote from collection:', error);
    res.status(500).json({ error: 'Failed to remove vote' });
  }
});

module.exports = router;
