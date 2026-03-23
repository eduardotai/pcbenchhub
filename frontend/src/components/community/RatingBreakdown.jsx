import { useState, useEffect } from 'react';
import DataCard from '../ui/DataCard';
import RatingBadge from './RatingBadge';
import { getTierInfo, formatScore, formatConfidence } from '../../viewmodels/ratingViewModel';

/**
 * A bar showing a labelled factor score out of 100.
 */
function FactorBar({ label, value, weight, color }) {
  const pct = Math.min(100, Math.max(0, Number(value) || 0));
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs text-gray-400">
        <span>{label}</span>
        <span className="text-gray-300 font-medium">
          {Math.round(pct)}/100
          <span className="ml-1 text-gray-500">({weight})</span>
        </span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-1.5">
        <div
          className="h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

/**
 * RatingBreakdown — transparent rating detail card for a hardware component.
 *
 * Props:
 *   componentId  {number|string}  — ID of the hardware component to display
 */
export default function RatingBreakdown({ componentId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!componentId) return;
    setLoading(true);
    setError(null);

    fetch(`/api/ratings/hardware/${componentId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [componentId]);

  if (loading) {
    return (
      <DataCard>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-700 rounded w-1/3" />
          <div className="h-8 bg-gray-700 rounded w-1/2" />
          <div className="h-3 bg-gray-700 rounded w-full" />
          <div className="h-3 bg-gray-700 rounded w-full" />
        </div>
      </DataCard>
    );
  }

  if (error) {
    return (
      <DataCard>
        <p className="text-red-400 text-sm">Failed to load rating: {error}</p>
      </DataCard>
    );
  }

  if (!data) return null;

  const { component, snapshot, rating, confidence } = data;
  const tierInfo = getTierInfo(rating);
  const snap = snapshot || {};

  // Derive individual factor scores from snapshot data so the breakdown is
  // transparent even without a dedicated breakdown endpoint.
  const reportCount = snap.report_count || component.report_count || 0;
  const avgScore    = snap.avg_score    || component.avg_score    || 0;
  const stddev      = snap.score_stddev || 0;
  const composite   = snap.composite_score != null ? snap.composite_score : null;

  // Reconstruct approximate factor scores for display
  const scorePercentileFactor  = Math.min(100, Math.max(0, avgScore));
  const maxStddev = 50;
  const consistencyFactor      = Math.max(0, 100 - (stddev / maxStddev) * 100);
  const volumeFactor           = Math.min(100, (Math.log(reportCount + 1) / Math.log(51)) * 100);
  // Quality factor cannot be reconstructed here without per-user data; show neutral 50
  const qualityFactor          = 50;

  return (
    <DataCard>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Community Rating</p>
          <div className="flex items-center gap-3">
            <RatingBadge tier={rating} size="lg" />
            {composite != null && (
              <span className="text-2xl font-bold" style={{ color: tierInfo.color }}>
                {formatScore(composite)}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">{tierInfo.description}</p>
        </div>
        <div className="text-right text-xs text-gray-500 space-y-1">
          <div>
            <span className="text-gray-400 font-medium">{reportCount}</span> report{reportCount !== 1 ? 's' : ''}
          </div>
          <div>Confidence: <span className="text-gray-300">{formatConfidence(confidence)}</span></div>
        </div>
      </div>

      {/* Factor breakdown */}
      <div className="space-y-3 pt-3 border-t border-gray-700">
        <p className="text-xs text-gray-500 uppercase tracking-widest">Score Breakdown</p>
        <FactorBar
          label="Score Percentile"
          value={scorePercentileFactor}
          weight="40%"
          color="#818cf8"
        />
        <FactorBar
          label="Consistency"
          value={consistencyFactor}
          weight="30%"
          color="#34d399"
        />
        <FactorBar
          label="Report Volume"
          value={volumeFactor}
          weight="20%"
          color="#60a5fa"
        />
        <FactorBar
          label="Reporter Quality"
          value={qualityFactor}
          weight="10%"
          color="#f59e0b"
        />
      </div>

      {/* Avg score footer */}
      {avgScore > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-700 flex justify-between text-xs text-gray-500">
          <span>Average benchmark score</span>
          <span className="text-gray-300 font-medium">{avgScore.toFixed(1)}</span>
        </div>
      )}
    </DataCard>
  );
}
