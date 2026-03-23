const { getDb, saveDatabase } = require('../config/db');

const TIERS = {
  Legendary: { min: 90, max: 100, color: '#9333ea', altColor: '#f59e0b' },
  Great: { min: 70, max: 89, color: '#22c55e' },
  Solid: { min: 50, max: 69, color: '#3b82f6' },
  Mediocre: { min: 30, max: 49, color: '#f97316' },
  Poor: { min: 0, max: 29, color: '#ef4444' },
  Unrated: { min: null, max: null, color: '#6b7280' },
};

function calculateStdDev(values) {
  if (!values || values.length < 2) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function scoreToPercentile(score, allScores) {
  if (!allScores || allScores.length === 0) return 50;
  const below = allScores.filter((s) => s < score).length;
  return Math.round((below / allScores.length) * 100);
}

function parseScores(scoresPayload) {
  if (!scoresPayload) return null;
  if (typeof scoresPayload === 'object') return scoresPayload;

  try {
    return JSON.parse(scoresPayload);
  } catch (err) {
    return null;
  }
}

function extractAggregateScore(scoresPayload) {
  const parsed = parseScores(scoresPayload);
  if (!parsed || typeof parsed !== 'object') return null;

  const numericValues = Object.values(parsed)
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  if (numericValues.length === 0) return null;

  return numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length;
}

function buildComponentMatch(componentId) {
  const id = String(componentId);

  const patterns = [
    `[${id}]`,
    `[${id},%`,
    `%,${id},%`,
    `%,${id}]`,
    `["${id}"]`,
    `["${id}",%`,
    `%,"${id}",%`,
    `%,"${id}"]`,
  ];

  const conditions = patterns.map(() => 'b.component_ids LIKE ?').join(' OR ');
  return { conditions, patterns };
}

function getReportsForComponent(componentId) {
  const db = getDb();
  const { conditions, patterns } = buildComponentMatch(componentId);

  const stmt = db.prepare(`
    SELECT b.id, b.scores, COALESCE(u.reputation_score, 0) AS user_reputation_score
    FROM benchmarks b
    LEFT JOIN users u ON u.id = b.user_id
    WHERE b.component_ids IS NOT NULL
      AND (${conditions})
  `);

  stmt.bind(patterns);

  const reports = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    const aggregateScore = extractAggregateScore(row.scores);

    if (aggregateScore != null) {
      reports.push({
        id: row.id,
        aggregate_score: aggregateScore,
        user_reputation_score: Number(row.user_reputation_score) || 0,
      });
    }
  }
  stmt.free();

  return reports;
}

function getGlobalAggregateScores() {
  const db = getDb();
  const stmt = db.prepare('SELECT scores FROM benchmarks WHERE scores IS NOT NULL');

  const scores = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    const aggregate = extractAggregateScore(row.scores);
    if (aggregate != null) {
      scores.push(aggregate);
    }
  }
  stmt.free();

  return scores;
}

function calculateCompositeScore(reports, globalScores = []) {
  if (!reports || reports.length === 0) {
    return { compositeScore: 0, avgScore: 0, stddev: 0 };
  }

  const scores = reports
    .map((report) => report.aggregate_score)
    .filter((score) => score != null && Number.isFinite(score));

  if (scores.length === 0) {
    return { compositeScore: 0, avgScore: 0, stddev: 0 };
  }

  const avgScore = scores.reduce((sum, value) => sum + value, 0) / scores.length;
  const stddev = calculateStdDev(scores);

  const scorePercentile = scoreToPercentile(avgScore, globalScores.length ? globalScores : scores);

  const coefficientOfVariation = avgScore !== 0 ? stddev / Math.abs(avgScore) : 1;
  const consistencyScore = Math.max(0, 100 - Math.min(coefficientOfVariation, 1) * 100);

  const volumeScore = Math.min(100, (Math.log(scores.length + 1) / Math.log(51)) * 100);

  const reputationValues = reports
    .map((report) => Number(report.user_reputation_score))
    .filter((score) => Number.isFinite(score));

  let qualityScore = 50;
  if (reputationValues.length > 0) {
    const avgRep = reputationValues.reduce((sum, value) => sum + value, 0) / reputationValues.length;
    qualityScore = Math.min(100, (avgRep / 500) * 100);
  }

  const composite =
    scorePercentile * 0.4 +
    consistencyScore * 0.3 +
    volumeScore * 0.2 +
    qualityScore * 0.1;

  return {
    compositeScore: Math.round(Math.min(100, Math.max(0, composite))),
    avgScore,
    stddev,
  };
}

function determineTier(compositeScore, reportCount) {
  if (reportCount < 3) return 'Unrated';
  if (compositeScore >= 90) return 'Legendary';
  if (compositeScore >= 70) return 'Great';
  if (compositeScore >= 50) return 'Solid';
  if (compositeScore >= 30) return 'Mediocre';
  return 'Poor';
}

function recalculateRating(componentId) {
  const db = getDb();
  const numericComponentId = Number(componentId);
  if (!Number.isFinite(numericComponentId)) {
    throw new Error('Invalid component id');
  }

  const reports = getReportsForComponent(numericComponentId);
  const reportCount = reports.length;

  const globalScores = getGlobalAggregateScores();
  const { compositeScore, avgScore, stddev } = calculateCompositeScore(reports, globalScores);

  const tier = determineTier(compositeScore, reportCount);
  const confidence = Math.min(1, reportCount / 50);
  const snapshotDate = new Date().toISOString().slice(0, 10);

  db.run(
    `INSERT INTO rating_snapshots
       (component_id, rating, composite_score, report_count, avg_score, score_stddev, snapshot_date)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [numericComponentId, tier, compositeScore, reportCount, avgScore, stddev, snapshotDate]
  );

  db.run(
    `UPDATE hardware_components
     SET community_rating = ?, rating_confidence = ?, report_count = ?, avg_score = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [tier, confidence, reportCount, avgScore, numericComponentId]
  );

  saveDatabase();

  return {
    tier,
    compositeScore,
    reportCount,
    avgScore,
    stddev,
    confidence,
    scores: reports.map((report) => report.aggregate_score),
  };
}

module.exports = {
  recalculateRating,
  determineTier,
  calculateCompositeScore,
  calculateStdDev,
  scoreToPercentile,
  TIERS,
  extractAggregateScore,
};
