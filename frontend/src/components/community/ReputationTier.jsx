const TIER_CONFIG = {
  newcomer: {
    label: 'Newcomer',
    icon: '🌱',
    color: '#6b7280',
    minScore: 0,
    nextScore: 100,
  },
  contributor: {
    label: 'Contributor',
    icon: '⚡',
    color: '#3b82f6',
    minScore: 100,
    nextScore: 500,
  },
  veteran: {
    label: 'Veteran',
    icon: '🛡️',
    color: '#22c55e',
    minScore: 500,
    nextScore: 1500,
  },
  trusted: {
    label: 'Trusted',
    icon: '🏆',
    color: '#f59e0b',
    minScore: 1500,
    nextScore: 5000,
  },
  elite: {
    label: 'Elite',
    icon: '💎',
    color: '#9333ea',
    minScore: 5000,
    nextScore: null, // max tier
  },
};

/**
 * ReputationTier — visual display of a user's reputation tier.
 *
 * Props:
 *   tier         {string}  — 'newcomer'|'contributor'|'veteran'|'trusted'|'elite'
 *   score        {number}  — numeric reputation score
 *   showProgress {boolean} — show progress bar to next tier (default: true)
 */
export default function ReputationTier({ tier = 'newcomer', score = 0, showProgress = true }) {
  const config = TIER_CONFIG[tier] || TIER_CONFIG.newcomer;
  const isElite = tier === 'elite';

  // Progress calculation
  let progressPct = 100;
  if (!isElite && config.nextScore !== null) {
    const range = config.nextScore - config.minScore;
    const current = Math.max(0, score - config.minScore);
    progressPct = Math.min(100, Math.round((current / range) * 100));
  }

  const nextConfig = !isElite
    ? Object.values(TIER_CONFIG).find((t) => t.minScore === config.nextScore)
    : null;

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 8, minWidth: 180 }}>
      {/* Tier pill + score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Pill */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 12px',
            borderRadius: 9999,
            backgroundColor: config.color + '22',
            border: `1.5px solid ${config.color}55`,
            fontSize: 13,
            fontWeight: 700,
            color: config.color,
            boxShadow: isElite ? `0 0 12px ${config.color}55` : 'none',
            letterSpacing: '0.02em',
          }}
        >
          <span style={{ fontSize: 14 }}>{config.icon}</span>
          {config.label}
        </span>

        {/* Score */}
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#8896b0',
          }}
        >
          {score.toLocaleString()} pts
        </span>
      </div>

      {/* Progress bar */}
      {showProgress && !isElite && (
        <div>
          <div
            style={{
              height: 5,
              borderRadius: 9999,
              backgroundColor: 'rgba(148,115,255,0.12)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progressPct}%`,
                borderRadius: 9999,
                backgroundColor: config.color,
                transition: 'width 0.4s ease',
                boxShadow: `0 0 6px ${config.color}66`,
              }}
            />
          </div>
          {nextConfig && (
            <div
              style={{
                marginTop: 4,
                fontSize: 11,
                color: '#4d5d7a',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>{progressPct}% to {nextConfig.label}</span>
              <span>{score.toLocaleString()} / {config.nextScore.toLocaleString()}</span>
            </div>
          )}
        </div>
      )}

      {showProgress && isElite && (
        <div
          style={{
            fontSize: 11,
            color: '#9333ea',
            fontWeight: 600,
            letterSpacing: '0.04em',
          }}
        >
          Maximum tier reached
        </div>
      )}
    </div>
  );
}
