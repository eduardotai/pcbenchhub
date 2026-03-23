const express = require('express');
const router = express.Router();
const Vote = require('../models/Vote');
const { auth, optionalAuth } = require('../middleware/auth');

// POST /api/votes — body: { reportId, voteType (1 ou -1) }
router.post('/', auth, (req, res) => {
  try {
    const { reportId, voteType } = req.body;

    if (!reportId) {
      return res.status(400).json({ error: 'reportId is required' });
    }
    if (voteType !== 1 && voteType !== -1) {
      return res.status(400).json({ error: 'voteType must be 1 or -1' });
    }

    const result = Vote.castVote(req.user.id, reportId, voteType);
    const counts = Vote.getByReport(reportId);

    res.json({ ...result, ...counts });
  } catch (error) {
    console.error('Error casting vote:', error);
    res.status(500).json({ error: 'Failed to cast vote' });
  }
});

// DELETE /api/votes/:reportId — remove voto do usuário autenticado
router.delete('/:reportId', auth, (req, res) => {
  try {
    const reportId = parseInt(req.params.reportId, 10);
    if (isNaN(reportId)) {
      return res.status(400).json({ error: 'Invalid reportId' });
    }

    Vote.removeVote(req.user.id, reportId);
    const counts = Vote.getByReport(reportId);

    res.json({ action: 'removed', report_id: reportId, ...counts });
  } catch (error) {
    console.error('Error removing vote:', error);
    res.status(500).json({ error: 'Failed to remove vote' });
  }
});

// GET /api/votes/report/:reportId — contagem de votos (público)
router.get('/report/:reportId', (req, res) => {
  try {
    const reportId = parseInt(req.params.reportId, 10);
    if (isNaN(reportId)) {
      return res.status(400).json({ error: 'Invalid reportId' });
    }

    const counts = Vote.getByReport(reportId);
    res.json(counts);
  } catch (error) {
    console.error('Error fetching vote counts:', error);
    res.status(500).json({ error: 'Failed to fetch votes' });
  }
});

// GET /api/votes/my/:reportId — voto do usuário atual (autenticado)
router.get('/my/:reportId', auth, (req, res) => {
  try {
    const reportId = parseInt(req.params.reportId, 10);
    if (isNaN(reportId)) {
      return res.status(400).json({ error: 'Invalid reportId' });
    }

    const vote = Vote.getUserVote(req.user.id, reportId);
    res.json({ vote: vote ? vote.vote_type : null });
  } catch (error) {
    console.error('Error fetching user vote:', error);
    res.status(500).json({ error: 'Failed to fetch user vote' });
  }
});

module.exports = router;
