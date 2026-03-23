const express = require('express');
const router = express.Router();
const Benchmark = require('../models/Benchmark');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { getDb } = require('../config/db');

const isAdmin = (req, res, next) => {
  if (req.user.email !== 'admin@pcbenchhub.com') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

router.get('/flags', auth, isAdmin, async (req, res) => {
  try {
    const flagged = Benchmark.getFlagged();
    res.json({ flagged });
  } catch (error) {
    console.error('Get flags error:', error);
    res.status(500).json({ error: 'Failed to fetch flagged benchmarks' });
  }
});

router.post('/benchmark/:id/remove', auth, isAdmin, async (req, res) => {
  try {
    Benchmark.delete(req.params.id);
    res.json({ message: 'Benchmark removed' });
  } catch (error) {
    console.error('Remove benchmark error:', error);
    res.status(500).json({ error: 'Failed to remove benchmark' });
  }
});

router.post('/benchmark/:id/unflag', auth, isAdmin, async (req, res) => {
  try {
    const db = getDb();
    db.run('UPDATE benchmarks SET is_flagged = 0, flag_count = 0 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Benchmark unflagged' });
  } catch (error) {
    console.error('Unflag benchmark error:', error);
    res.status(500).json({ error: 'Failed to unflag benchmark' });
  }
});

router.get('/users', auth, isAdmin, async (req, res) => {
  try {
    const users = User.getAll();
    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.post('/user/:id/ban', auth, isAdmin, async (req, res) => {
  try {
    User.banUser(req.params.id);
    res.json({ message: 'User banned' });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({ error: 'Failed to ban user' });
  }
});

router.post('/user/:id/unban', auth, isAdmin, async (req, res) => {
  try {
    const db = getDb();
    db.run('UPDATE users SET is_banned = 0 WHERE id = ?', [req.params.id]);
    res.json({ message: 'User unbanned' });
  } catch (error) {
    console.error('Unban user error:', error);
    res.status(500).json({ error: 'Failed to unban user' });
  }
});

module.exports = router;
