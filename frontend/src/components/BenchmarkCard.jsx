/**
 * BenchmarkCard.jsx — "Nebula Dark" redesign
 *
 * Key upgrades:
 * 1. Left colored accent bar per hardware category (CPU=blue, GPU=orange, etc.)
 * 2. Category badge uses .badge-{cpu|gpu|ram|storage} for color coding
 * 3. Score bars: gradient fill with subtle glow (purple→cyan)
 * 4. Trust score: relocated to top-right corner, cleaner presentation
 * 5. Hover: lift + purple glow border (premium feel)
 * 6. Footer: divider line replaced with subtle separator, better alignment
 */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ScorePill from './ui/ScorePill';
import {
  buildArchetypeTag,
  buildTrustMeta,
  formatBenchmarkDate,
  formatMetricLabel,
  formatScore,
  getMainScore,
  getScoreEntries,
  getCategoryTone
} from '../viewmodels/benchmarkViewModel';

/* Category accent colors — matches the CSS variables */
const categoryAccent = {
  cpu:     { color: 'var(--cat-cpu)',     bg: 'rgba(37,99,235,0.08)',    border: 'rgba(96,165,250,0.22)' },
  gpu:     { color: 'var(--cat-gpu)',     bg: 'rgba(234,88,12,0.08)',    border: 'rgba(251,146,60,0.22)' },
  ram:     { color: 'var(--cat-ram)',     bg: 'rgba(124,58,237,0.08)',   border: 'rgba(167,139,250,0.22)' },
  storage: { color: 'var(--cat-storage)', bg: 'rgba(16,185,129,0.08)',   border: 'rgba(52,211,153,0.22)' }
};

export default function BenchmarkCard({ benchmark }) {
  const { t, i18n } = useTranslation();

  const scoreEntries = getScoreEntries(benchmark?.scores).slice(0, 4);
  const mainScore    = getMainScore(benchmark);
  const trust        = buildTrustMeta(benchmark);
  const archetype    = buildArchetypeTag(benchmark);
  const maxMetric    = scoreEntries.length ? Math.max(...scoreEntries.map((s) => s.value)) : 1;

  const accent = categoryAccent[benchmark?.category] || {
    color: 'var(--accent)',
    bg: 'rgba(124,77,255,0.08)',
    border: 'rgba(148,115,255,0.22)'
  };

  return (
    <Link to={`/benchmarks/${benchmark.id}`} className="block fade-up">
      <article
        className="surface surface-hover h-full"
        style={{
          padding: '1.1rem 1.2rem 1.1rem 1.4rem',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Left category accent bar */}
        <div style={{
          position: 'absolute',
          top: '14px', bottom: '14px', left: 0,
          width: '3px',
          borderRadius: '0 4px 4px 0',
          background: accent.color,
          boxShadow: `0 0 10px ${accent.color}66`
        }} />

        {/* Top row: category badge + trust score */}
        <div className="flex flex-wrap items-start justify-between gap-3" style={{ marginBottom: '10px' }}>
          <div className="space-y-1.5">
            <span className={`badge badge-${benchmark.category}`}>
              {t(`benchmark.categories.${benchmark.category}`)}
            </span>
            <h3 className="font-display font-semibold leading-snug" style={{
              fontSize: '1rem',
              color: 'var(--text-primary)',
              lineHeight: 1.35
            }}>
              {benchmark.title}
            </h3>
          </div>

          {/* Trust index score */}
          <ScorePill
            tone={trust.tone}
            value={`${trust.score}%`}
            label={t('benchmark.trustIndexShort')}
          />
        </div>

        {/* Archetype + meta pills */}
        <div className="flex flex-wrap gap-1.5" style={{ marginBottom: '14px' }}>
          <span className="pill">{archetype}</span>
          {benchmark.userExperience && (
            <span className="pill">{t(`profile.${benchmark.userExperience}`)}</span>
          )}
          {benchmark.test_tool && (
            <span className="pill">{benchmark.test_tool}</span>
          )}
        </div>

        {/* Score bars */}
        {scoreEntries.length > 0 ? (
          <div className="space-y-2.5">
            {scoreEntries.map((entry) => {
              const width = Math.max(8, Math.round((entry.value / maxMetric) * 100));
              return (
                <div key={entry.key}>
                  <div className="flex items-center justify-between gap-2" style={{ marginBottom: '5px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-soft)', fontWeight: 500 }}>
                      {formatMetricLabel(entry.key)}
                    </span>
                    <span className="mono" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {formatScore(entry.value)}
                    </span>
                  </div>
                  {/* Gradient progress bar */}
                  <div className="metric-track">
                    <span style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {t('benchmark.noScoreData')}
          </div>
        )}

        {/* Footer: author + main score + date */}
        <div
          className="flex flex-wrap items-center justify-between gap-2"
          style={{
            marginTop: '14px',
            paddingTop: '12px',
            borderTop: '1px solid var(--line-dim)',
            fontSize: '0.78rem'
          }}
        >
          <span style={{ color: 'var(--text-muted)' }}>
            {t('benchmark.byUser', { user: benchmark.username || 'Unknown' })}
          </span>
          <div className="flex items-center gap-2">
            {mainScore && (
              <ScorePill
                tone={getCategoryTone(benchmark.category)}
                value={formatScore(mainScore.value)}
                label={formatMetricLabel(mainScore.key)}
              />
            )}
            <span style={{ color: 'var(--text-soft)' }}>
              {formatBenchmarkDate(benchmark.created_at, i18n.language === 'pt' ? 'pt-BR' : 'en-US')}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
