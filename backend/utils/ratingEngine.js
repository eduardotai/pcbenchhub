const { getDb, saveDatabase } = require('../config/db');

// Tier definitions with composite score thresholds
const TIERS = {
  Legendary: { min: 90, max: 100, color: '#9333ea', altColor: '#f59e0b' },
  Great:     { min: 70, max: 89,  color: '#22c55e' },
  Solid:     { min: 50, max: 69,  color: '#3b82f6' },
  Mediocre:  { min: 30, max: 49,  color: '#f97316' },
  Poor:      { min: 0,  max: 29,  color: '#ef4444' },
  Unrated:   { min: null, max: null, color: '#6b7280' },
};

/**
 * Calculates the population standard deviation of an array of numbers.
 * Returns 0 if fewer than 2 values are provided.
 */
function calculateStdDev(values) {
  if (!values || values.length < 2) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Returns the percentile position (0-100) of `score` within `allScores`.
 * A higher percentile means the score is better relative to the pool.
 */
function scoreToPercentile(score, allScores) {
  if (!allScores || allScores.length === 0) return 50;
  const below = allScores.filter((s) => s < score).length;
  return (below / allScores.length) * 100;
}

/**
 * Calculates a composite score (0-100) from an array of report objects.
 *
 * Each report: { score: Number, user_reputation_score: Number }
 *
 * Weights:
 *   40% — score percentile (position of this component's avg score in the global pool)
 *   30% — consistency (inverse of normalised standard deviation)
 *   20% — volume (log scale, capped at ~50 reports for full score)
 *   10% — reporter quality (average reputation_score normalised 0-100)
 */
function calculateCompositeScore(reports) {
  if (!reports || reports.length === 0) return 0;

  const scores = reports.map((r) => r.score).filter((s) => s != null && !isNaN(s));
  if (scores.length === 0) return 0;

  const avgScore = scores.reduce((s, v) => s + v, 0) / scores.length;

  // --- Factor 1: Score percentile (40%) ---
  // Since we are scoring a single component we normalise the avg score to a
  // 0-100 scale assuming benchmark scores live roughly in the 0-100 range.
  // Callers that have the global score pool can pass it via a third argument;
  // here we do a simple normalisation as a sensible default.
  const scorePercentile = Math.min(100, Math.max(0, avgScore));

  // --- Factor 2: Consistency (30%) ---
  // stddev normalised: 0 stddev → 100 pts; stddev ≥ 50 → 0 pts
  const stddev = calculateStdDev(scores);
  const maxStddev = 50;
  const consistencyScore = Math.max(0, 100 - (stddev / maxStddev) * 100);

  // --- Factor 3: Volume (20%) ---
  // log(n) / log(50) capped at 1, scaled to 100
  const volumeScore = Math.min(100, (Math.log(scores.length + 1) / Math.log(51)) * 100);

  // --- Factor 4: Reporter quality (10%) ---
  const repScores = reports
    .map((r) => r.user_reputation_score)
    .filter((r) => r != null && !isNaN(r));
  let qualityScore = 50; // neutral default when no reputation data
  if (repScores.length > 0) {
    const avgRep = repScores.reduce((s, v) => s + v, 0) / repScores.length;
    // Normalise: assume max meaningful reputation is 1000
    qualityScore = Math.min(100, (avgRep / 1000) * 100);
  }

  const composite =
    scorePercentile * 0.4 +
    consistencyScore * 0.3 +
    volumeScore * 0.2 +
    qualityScore * 0.1;

  return Math.round(Math.min(100, Math.max(0, composite)));
}

/**
 * Maps a composite score + report count to a tier name.
 */
function determineTier(compositeScore, reportCount) {
  if (reportCount < 3) return 'Unrated';
  if (compositeScore >= 90) return 'Legendary';
  if (compositeScore >= 70) return 'Great';
  if (compositeScore >= 50) return 'Solid';
  if (compositeScore >= 30) return 'Mediocre';
  return 'Poor';
}

/**
 * Full recalculation pipeline for a single component.
 *
 * 1. Fetches all benchmark rows that mention componentId inside the
 *    `component_ids` JSON array field.
 * 2. Fetches scores and reporter reputation.
 * 3. Calculates composite score and tier.
 * 4. Persists a snapshot in `rating_snapshots`.
 * 5. Updates `hardware_components.community_rating` and `rating_confidence`.
 *
 * Returns { tier, compositeScore, reportCount, avgScore, stddev }
 */
function recalculateRating(componentId) {
  const db = getDb();

  // Fetch benchmarks that include this component in their component_ids JSON array.
  // component_ids is stored as a JSON string, e.g. '[1,2,3]'
  const stmt = db.prepare(`
    SELECT b.id, b.score, COALESCE(u.reputation_score, 0) AS user_reputation_score
    FROM benchmarks b
    LEFT JOIN users u ON u.id = b.user_id
    WHERE b.component_ids IS NOT NULL
      AND (
        b.component_ids = ?
        OR b.component_ids LIKE ?
        OR b.component_ids LIKE ?
        OR b.component_ids LIKE ?
      )
  `);

  const idStr = String(componentId);
  stmt.bind([
    `[${idStr}]`,
    `[${idStr},%`,
    `%,${idStr},%`,
    `%,${idStr}]`,
  ]);

  const reports = [];
  while (stmt.step()) {
    reports.push(stmt.getAsObject());
  }
  stmt.free();

  const reportCount = reports.length;
  const scores = reports.map((r) => r.score).filter((s) => s != null && !isNaN(s));
  const avgScore = scores.length > 0 ? scores.reduce((s, v) => s + v, 0) / scores.length : 0;
  const stddev = calculateStdDev(scores);

  const compositeScore = calculateCompositeScore(reports);
  const tier = determineTier(compositeScore, reportCount);

  // Confidence: based on report count (0–1 scale, capped at 50 reports)
  const confidence = Math.min(1, reportCount / 50);

  // Snapshot date: today's date (YYYY-MM-DD)
  const snapshotDate = new Date().toISOString().slice(0, 10);

  // Persist snapshot
  db.run(
    `INSERT INTO rating_snapshots
       (component_id, rating, composite_score, report_count, avg_score, score_stddev, snapshot_date)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [componentId, tier, compositeScore, reportCount, avgScore, stddev, snapshotDate]
  );

  // Update hardware_components
  db.run(
    `UPDATE hardware_components
     SET community_rating = ?, rating_confidence = ?, report_count = ?, avg_score = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [tier, confidence, reportCount, avgScore, componentId]
  );

  saveDatabase();

  return { tier, compositeScore, reportCount, avgScore, stddev, confidence };
}

module.exports = { recalculateRating, determineTier, calculateCompositeScore, calculateStdDev, scoreToPercentile, TIERS };
