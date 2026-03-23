const express = require('express');
const router = express.Router();
const Vote = require('../models/Vote');
const { auth } = require('../middleware/auth');
const { getDb } = require('../config/db');
const { updateReputation, checkAndGrantBadges } = require('../utils/badgeEngine');
const activityTracker = require('../utils/activityTracker');

function getReportAuthorId(reportId) {
  const db = getDb();
  const stmt = db.prepare('SELECT user_id FROM benchmarks WHERE id = ?');
  stmt.bind([String(reportId)]);

  let authorId = null;
  if (stmt.step()) {
    authorId = stmt.getAsObject().user_id;
  }
  stmt.free();

  return authorId;
}

function refreshAuthorCommunityState(authorId) {
  if (!authorId) return;

  updateReputation(authorId);
  const newBadges = checkAndGrantBadges(authorId);
  for (const badge of newBadges) {
    activityTracker.badgeEarned(authorId, badge.id, badge.display_name || badge.name);
  }
}

router.post('/', auth, (req, res) => {
  try {
    const { reportId, voteType } = req.body;

    if (!reportId) {
      return res.status(400).json({ error: 'reportId is required' });
    }

    if (voteType !== 1 && voteType !== -1) {
      return res.status(400).json({ error: 'voteType must be 1 or -1' });
    }

    const normalizedReportId = String(reportId);
    const authorId = getReportAuthorId(normalizedReportId);

    if (!authorId) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const result = Vote.castVote(req.user.id, normalizedReportId, voteType);
    const counts = Vote.getByReport(normalizedReportId);

    refreshAuthorCommunityState(authorId);

    if (result.action !== 'removed') {
      activityTracker.reportVoted(req.user.id, normalizedReportId, voteType);
    }

    return res.json({ ...result, ...counts });
  } catch (error) {
    console.error('Error casting vote:', error);
    return res.status(500).json({ error: 'Failed to cast vote' });
  }
});

router.delete('/:reportId', auth, (req, res) => {
  try {
    const normalizedReportId = String(req.params.reportId || '').trim();
    if (!normalizedReportId) {
      return res.status(400).json({ error: 'Invalid reportId' });
    }

    const authorId = getReportAuthorId(normalizedReportId);
    if (!authorId) {
      return res.status(404).json({ error: 'Report not found' });
    }

    Vote.removeVote(req.user.id, normalizedReportId);
    const counts = Vote.getByReport(normalizedReportId);

    refreshAuthorCommunityState(authorId);

    return res.json({ action: 'removed', report_id: normalizedReportId, ...counts });
  } catch (error) {
    console.error('Error removing vote:', error);
    return res.status(500).json({ error: 'Failed to remove vote' });
  }
});

router.get('/report/:reportId', (req, res) => {
  try {
    const normalizedReportId = String(req.params.reportId || '').trim();
    if (!normalizedReportId) {
      return res.status(400).json({ error: 'Invalid reportId' });
    }

    const counts = Vote.getByReport(normalizedReportId);
    return res.json(counts);
  } catch (error) {
    console.error('Error fetching vote counts:', error);
    return res.status(500).json({ error: 'Failed to fetch votes' });
  }
});

router.get('/my/:reportId', auth, (req, res) => {
  try {
    const normalizedReportId = String(req.params.reportId || '').trim();
    if (!normalizedReportId) {
      return res.status(400).json({ error: 'Invalid reportId' });
    }

    const vote = Vote.getUserVote(req.user.id, normalizedReportId);
    return res.json({ vote: vote ? Number(vote.vote_type) : null });
  } catch (error) {
    console.error('Error fetching user vote:', error);
    return res.status(500).json({ error: 'Failed to fetch user vote' });
  }
});

module.exports = router;
