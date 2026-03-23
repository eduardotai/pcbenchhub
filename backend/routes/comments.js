const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const { auth } = require('../middleware/auth');
const { validateComment } = require('../middleware/validate');

router.get('/:benchmarkId', async (req, res) => {
  try {
    const comments = Comment.findByBenchmarkId(req.params.benchmarkId);
    res.json({ comments });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

router.post('/', auth, validateComment, async (req, res) => {
  try {
    const { benchmarkId, content } = req.body;

    const Benchmark = require('../models/Benchmark');
    const benchmark = Benchmark.findById(benchmarkId);
    
    if (!benchmark) {
      return res.status(404).json({ error: 'Benchmark not found' });
    }

    const comment = Comment.create({
      benchmarkId,
      userId: req.user.id,
      content
    });

    res.status(201).json({
      message: 'Comment added successfully',
      comment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    if (error.message.includes('must be at least')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const comment = Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.user_id !== req.user.id) {
      const User = require('../models/User');
      const user = User.findById(req.user.id);
      
      if (user.email !== 'admin@pcbenchhub.com') {
        return res.status(403).json({ error: 'Not authorized to delete this comment' });
      }
    }

    Comment.delete(req.params.id);
    
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

module.exports = router;
