/**
 * Home.jsx — "Nebula Dark" redesign
 *
 * Key upgrades vs v1:
 * 1. Hero: Large display heading with gradient + purple glow orb decoration
 * 2. Badge: "chip-live" with pulsing green dot (shows platform is active)
 * 3. KPI grid: 2×2 with top accent bar, glowing numbers
 * 4. Category shortcuts: Color-coded per hardware type (CPU/GPU/RAM/Storage)
 * 5. Recent benchmarks: side-by-side with leaderboard, same visual weight
 * 6. Leaderboard rows: rank badge (gold/silver/bronze) + better score display
 * 7. All sections use staggered fade-up animations
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import BenchmarkCard from '../components/BenchmarkCard';
import EmptyState from '../components/ui/EmptyState';
import KPIStat from '../components/ui/KPIStat';
import RatingBadge from '../components/community/RatingBadge';
import SectionHeader from '../components/ui/SectionHeader';
import Skeleton from '../components/ui/Skeleton';
import { benchmarks } from '../services/api';
import api from '../services/api';
import { formatBenchmarkDate, getMainScore } from '../viewmodels/benchmarkViewModel';
import { getCategoryColor, getCategoryIcon } from '../viewmodels/hardwareViewModel';

/* Category shortcuts with color theming (unique differentiator vs competitors) */
const categoryShortcuts = [
  {
    key:         'cpu',
    title:       'CPU',
    description: 'Processor benchmarks & multi-core performance',
    color:       'var(--cat-cpu)',
    bg:          'rgba(37,99,235,0.10)',
    border:      'rgba(96,165,250,0.28)'
  },
  {
    key:         'gpu',
    title:       'GPU',
    description: 'Graphics card rendering & compute tests',
    color:       'var(--cat-gpu)',
    bg:          'rgba(234,88,12,0.10)',
    border:      'rgba(251,146,60,0.28)'
  },
  {
    key:         'ram',
    title:       'RAM',
    description: 'Memory speed, bandwidth & latency',
    color:       'var(--cat-ram)',
    bg:          'rgba(124,58,237,0.10)',
    border:      'rgba(167,139,250,0.28)'
  },
  {
    key:         'storage',
    title:       'Storage',
    description: 'SSD / NVMe read-write throughput',
    color:       'var(--cat-storage)',
    bg:          'rgba(16,185,129,0.10)',
    border:      'rgba(52,211,153,0.28)'
  }
];

export default function Home() {
  const { t, i18n } = useTranslation();

  const [recentBenchmarks, setRecentBenchmarks] = useState([]);
  const [trending, setTrending] = useState([]);
  const [summary, setSummary] = useState({ total: 0, loadedAt: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      try {
        const [recentRes, trendingRes] = await Promise.all([
          benchmarks.getAll({ limit: 24 }),
          api.get('/hardware/trending', { params: { limit: 5 } }).catch(() => ({ data: { components: [] } }))
        ]);
        if (cancelled) return;
        setRecentBenchmarks(recentRes.data.benchmarks || []);
        setTrending(
          trendingRes.data.components ||
          trendingRes.data.hardware ||
          []
        );
        setSummary({
          total: recentRes.data.pagination?.total || (recentRes.data.benchmarks || []).length,
          loadedAt: new Date().toISOString()
        });
      } catch (error) {
        console.error('Failed to fetch home data:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, []);

  const modelCount = useMemo(() => {
    const models = new Set();
    for (const benchmark of recentBenchmarks) {
      const specs = benchmark.hardwareSpecs || {};
      ['cpu', 'gpu', 'ram', 'storage', 'motherboard'].forEach((key) => {
        if (specs[key]) models.add(String(specs[key]).trim().toLowerCase());
      });
    }
    return models.size;
  }, [recentBenchmarks]);

  const latestDate = useMemo(() => {
    if (!recentBenchmarks.length) return null;
    const sorted = [...recentBenchmarks].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return sorted[0]?.created_at;
  }, [recentBenchmarks]);

  const locale = i18n.language === 'pt' ? 'pt-BR' : 'en-US';

  return (
    <div className="space-y-10 pb-4">

      {/* ════════════════════════════════════════════════
          HERO SECTION
          ════════════════════════════════════════════════ */}
      <section className="surface overflow-hidden px-6 py-10 sm:px-10 sm:py-12 fade-up" style={{ position: 'relative' }}>

        {/* Decorative glow orbs — depth & premium feel */}
        <div style={{
          position: 'absolute', top: '-60px', right: '-40px',
          width: '320px', height: '320px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,77,255,0.18) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: '-40px', left: '30%',
          width: '240px', height: '240px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34,211,238,0.10) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center" style={{ position: 'relative', zIndex: 1 }}>

          {/* Left: Headline + CTAs */}
          <div>
            {/* Live badge */}
            <span className="chip chip-live mb-5" style={{ display: 'inline-flex' }}>
              {t('home.insightBadge')}
            </span>

            {/* Main headline */}
            <h1 className="font-display font-black leading-tight"
              style={{ fontSize: 'clamp(2rem, 2.5vw + 1.2rem, 3.4rem)', letterSpacing: '-0.035em' }}>
              <span className="gradient-title">{t('hero.title')}</span>
            </h1>

            <p className="mt-4 text-muted" style={{
              fontSize: 'clamp(0.95rem, 0.85rem + 0.3vw, 1.1rem)',
              maxWidth: '52ch',
              lineHeight: 1.75
            }}>
              {t('hero.subtitle')}
            </p>

            {/* CTAs */}
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/dashboard" className="btn btn-primary" style={{ fontSize: '0.9rem', padding: '0.65rem 1.4rem' }}>
                {t('hero.ctaSecondary')}
              </Link>
              <Link to="/submit" className="btn btn-secondary" style={{ fontSize: '0.9rem', padding: '0.65rem 1.4rem' }}>
                {t('hero.cta')}
              </Link>
              <Link to="/compare" className="btn btn-ghost" style={{ fontSize: '0.9rem', padding: '0.65rem 1.2rem' }}>
                {t('nav.compare')}
              </Link>
            </div>
          </div>

          {/* Right: KPI stat grid */}
          <div className="grid gap-3 sm:grid-cols-2">
            <KPIStat
              label={t('home.stats.systemsTested')}
              value={summary.total.toLocaleString(locale)}
              hint={t('home.stats.systemsHint')}
              className="!min-h-[118px]"
            />
            <KPIStat
              label={t('home.stats.modelsTracked')}
              value={modelCount.toLocaleString(locale)}
              hint={t('home.stats.modelsHint')}
              className="!min-h-[118px]"
            />
            <KPIStat
              label={t('home.stats.lastUpdate')}
              value={latestDate ? formatBenchmarkDate(latestDate, locale) : '—'}
              hint={t('home.stats.lastUpdateHint')}
              className="!min-h-[118px]"
            />
            <KPIStat
              label={t('home.stats.focus')}
              value={t('home.stats.focusValue')}
              hint={t('home.stats.focusHint')}
              className="!min-h-[118px]"
            />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          CATEGORY SHORTCUTS — color-coded per type
          ════════════════════════════════════════════════ */}
      <section className="space-y-4 fade-up" data-delay="1">
        <SectionHeader
          eyebrow={t('home.sections.quickAccessBadge')}
          title={t('home.sections.quickAccessTitle')}
          subtitle={t('home.sections.quickAccessSubtitle')}
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categoryShortcuts.map((cat) => (
            <Link
              key={cat.key}
              to={`/dashboard?category=${cat.key}`}
              className="surface-hover"
              style={{
                display: 'block',
                padding: '1.1rem 1.25rem',
                background: cat.bg,
                border: `1px solid ${cat.border}`,
                borderRadius: 'var(--r-lg)',
                boxShadow: 'var(--shadow-sm)',
                transition: 'transform 280ms var(--ease-spring), box-shadow 280ms ease, border-color 280ms ease'
              }}
            >
              {/* Category color indicator dot */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <div style={{
                  width: '10px', height: '10px', borderRadius: '50%',
                  background: cat.color,
                  boxShadow: `0 0 10px ${cat.color}88`,
                  flexShrink: 0
                }} />
                <span style={{
                  fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em',
                  textTransform: 'uppercase', color: cat.color
                }}>
                  {t(`benchmark.categories.${cat.key}`)}
                </span>
              </div>
              <h3 className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)', marginBottom: '6px' }}>
                {cat.title}
              </h3>
              <p className="text-sm text-muted">{cat.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          RECENT BENCHMARKS + LEADERBOARD (side by side)
          ════════════════════════════════════════════════ */}
      <section className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">

        {/* Recent Benchmarks */}
        <div className="space-y-4 fade-up" data-delay="2">
          <SectionHeader
            eyebrow={t('home.sections.recentBadge')}
            title={t('home.sections.recentTitle')}
            subtitle={t('home.sections.recentSubtitle')}
            action={
              <Link to="/dashboard" className="btn btn-ghost" style={{ fontSize: '0.82rem', padding: '0.42rem 0.9rem' }}>
                {t('home.viewAll')} →
              </Link>
            }
          />

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="surface p-5">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="mt-3 h-6 w-10/12" />
                  <Skeleton className="mt-5 h-2 w-full" />
                  <Skeleton className="mt-2 h-2 w-9/12" />
                  <Skeleton className="mt-6 h-4 w-8/12" />
                </div>
              ))}
            </div>
          ) : recentBenchmarks.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {recentBenchmarks.slice(0, 6).map((benchmark) => (
                <BenchmarkCard key={benchmark.id} benchmark={benchmark} />
              ))}
            </div>
          ) : (
            <EmptyState
              title={t('benchmark.noResults')}
              description={t('home.emptyRecent')}
              action={<Link to="/submit" className="btn btn-primary">{t('nav.submit')}</Link>}
            />
          )}
        </div>

        {/* Trending Hardware */}
        <div className="space-y-4 fade-up" data-delay="3">
          <SectionHeader
            eyebrow="Community Hardware"
            title="Trending Hardware"
            subtitle="Top-rated components this week."
            action={
              <Link to="/hardware" className="btn btn-ghost" style={{ fontSize: '0.82rem', padding: '0.42rem 0.9rem' }}>
                View All Hardware →
              </Link>
            }
          />

          <div className="surface p-4">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : trending.length > 0 ? (
              <div className="space-y-2">
                {trending.map((item) => (
                  <Link
                    key={item.id}
                    to={`/hardware/${item.id}`}
                    className="surface-muted surface-hover"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 12px',
                      borderRadius: 'var(--r-md)',
                      textDecoration: 'none',
                    }}
                  >
                    <span style={{ fontSize: '1.1rem', lineHeight: 1, flexShrink: 0 }}>
                      {getCategoryIcon(item.category)}
                    </span>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="font-display font-semibold" style={{
                        color: 'var(--text-primary)',
                        fontSize: '0.875rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {item.name}
                      </div>
                      <div style={{ marginTop: '2px', fontSize: '0.75rem', color: getCategoryColor(item.category) }}>
                        {item.category}
                        {item.report_count != null && (
                          <span style={{ color: 'var(--text-soft)', marginLeft: '6px' }}>
                            · {item.report_count} report{item.report_count !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ flexShrink: 0 }}>
                      <RatingBadge tier={item.community_rating || 'Unrated'} size="sm" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No trending hardware"
                description="Submit benchmarks to build the community ratings."
              />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
