const { getDb, saveDatabase } = require('../config/db');
const Badge = require('../models/Badge');
const { BADGE_DEFINITIONS } = require('../models/Badge');

const REPUTATION_TIERS = [
  { name: 'newcomer',    min: 0,   max: 9,        weight: 0.8 },
  { name: 'contributor', min: 10,  max: 49,       weight: 1.0 },
  { name: 'veteran',     min: 50,  max: 199,      weight: 1.2 },
  { name: 'trusted',     min: 200, max: 499,      weight: 1.5 },
  { name: 'elite',       min: 500, max: Infinity, weight: 2.0 },
];

function getReputationTier(score) {
  return REPUTATION_TIERS.find(t => score >= t.min && score <= t.max) || REPUTATION_TIERS[0];
}

function _getUserMetrics(db, userId) {
  // Total report count
  const totalStmt = db.prepare(
    'SELECT COUNT(*) as total FROM benchmarks WHERE user_id = ? AND is_flagged = 0'
  );
  totalStmt.bind([userId]);
  totalStmt.step();
  const { total: reportCount } = totalStmt.getAsObject();
  totalStmt.free();

  // Reports per category
  const catStmt = db.prepare(
    'SELECT category, COUNT(*) as cnt FROM benchmarks WHERE user_id = ? AND is_flagged = 0 GROUP BY category'
  );
  catStmt.bind([userId]);
  const categoryReports = {};
  while (catStmt.step()) {
    const row = catStmt.getAsObject();
    categoryReports[row.category.toLowerCase()] = row.cnt;
  }
  catStmt.free();

  // Total upvotes received (sum of positive helpfulness_score across user's reports)
  const upvoteStmt = db.prepare(
    'SELECT COALESCE(SUM(CASE WHEN helpfulness_score > 0 THEN helpfulness_score ELSE 0 END), 0) as upvotes FROM benchmarks WHERE user_id = ? AND is_flagged = 0'
  );
  upvoteStmt.bind([userId]);
  upvoteStmt.step();
  const { upvotes } = upvoteStmt.getAsObject();
  upvoteStmt.free();

  // Reports with tag "overclocked" via report_tag_map + report_tags
  const tagStmt = db.prepare(`
    SELECT COUNT(*) as cnt
    FROM benchmarks b
    JOIN report_tag_map rtm ON rtm.report_id = b.id
    JOIN report_tags rt ON rt.id = rtm.tag_id
    WHERE b.user_id = ? AND b.is_flagged = 0 AND rt.name = 'overclocked'
  `);
  tagStmt.bind([userId]);
  tagStmt.step();
  const { cnt: overclockCount } = tagStmt.getAsObject();
  tagStmt.free();

  return { reportCount, categoryReports, upvotes, overclockCount };
}

function _getMetricValue(metrics, requirementType) {
  switch (requirementType) {
    case 'report_count':
      return metrics.reportCount;
    case 'upvotes_received':
      return metrics.upvotes;
    case 'category_reports_gpu':
      return metrics.categoryReports['gpu'] || 0;
    case 'category_reports_cpu':
      return metrics.categoryReports['cpu'] || 0;
    case 'category_reports_storage':
      return metrics.categoryReports['storage'] || 0;
    case 'category_reports_ram':
      return metrics.categoryReports['ram'] || 0;
    case 'tag_reports_overclocked':
      return metrics.overclockCount;
    default:
      return 0;
  }
}

function checkAndGrantBadges(userId) {
  const db = getDb();

  const metrics = _getUserMetrics(db, userId);

  // Fetch all badges from DB so we have their IDs
  const allBadges = Badge.getAll();
  const badgeByName = {};
  for (const b of allBadges) {
    badgeByName[b.name] = b;
  }

  // Fetch badges the user already has
  const existingStmt = db.prepare('SELECT badge_id FROM user_badges WHERE user_id = ?');
  existingStmt.bind([userId]);
  const ownedIds = new Set();
  while (existingStmt.step()) {
    ownedIds.add(existingStmt.getAsObject().badge_id);
  }
  existingStmt.free();

  const newlyGranted = [];
  const now = new Date().toISOString();

  for (const def of BADGE_DEFINITIONS) {
    const badge = badgeByName[def.name];
    if (!badge) continue; // not seeded yet, skip

    if (ownedIds.has(badge.id)) continue; // already earned

    const metricValue = _getMetricValue(metrics, def.requirement_type);
    if (metricValue >= def.requirement_value) {
      db.run(
        'INSERT OR IGNORE INTO user_badges (user_id, badge_id, earned_at) VALUES (?, ?, ?)',
        [userId, badge.id, now]
      );
      newlyGranted.push({ ...badge, earned_at: now });
    }
  }

  if (newlyGranted.length > 0) {
    saveDatabase();
  }

  return newlyGranted;
}

function updateReputation(userId) {
  const db = getDb();

  // Total reports
  const reportStmt = db.prepare(
    'SELECT COUNT(*) as cnt FROM benchmarks WHERE user_id = ? AND is_flagged = 0'
  );
  reportStmt.bind([userId]);
  reportStmt.step();
  const { cnt: reportCount } = reportStmt.getAsObject();
  reportStmt.free();

  // Upvotes received (positive helpfulness_score) and downvotes (negative)
  const scoreStmt = db.prepare(
    `SELECT
       COALESCE(SUM(CASE WHEN helpfulness_score > 0 THEN helpfulness_score ELSE 0 END), 0) as upvotes,
       COALESCE(SUM(CASE WHEN helpfulness_score < 0 THEN ABS(helpfulness_score) ELSE 0 END), 0) as downvotes
     FROM benchmarks WHERE user_id = ? AND is_flagged = 0`
  );
  scoreStmt.bind([userId]);
  scoreStmt.step();
  const { upvotes, downvotes } = scoreStmt.getAsObject();
  scoreStmt.free();

  const score = (reportCount * 1) + (upvotes * 2) - (downvotes * 1);
  const reputationScore = Math.max(0, score);
  const tier = getReputationTier(reputationScore);

  db.run(
    'UPDATE users SET reputation_score = ?, reputation_tier = ? WHERE id = ?',
    [reputationScore, tier.name, userId]
  );
  saveDatabase();

  return { score: reputationScore, tier: tier.name };
}

module.exports = { checkAndGrantBadges, updateReputation, getReputationTier, REPUTATION_TIERS };
