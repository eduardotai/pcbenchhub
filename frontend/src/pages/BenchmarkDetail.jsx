import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Legend,
  Tooltip
} from 'chart.js';
import { useAuth } from '../context/AuthContext';
import DataCard from '../components/ui/DataCard';
import EmptyState from '../components/ui/EmptyState';
import ScorePill from '../components/ui/ScorePill';
import SectionHeader from '../components/ui/SectionHeader';
import Skeleton from '../components/ui/Skeleton';
import { benchmarks, comments } from '../services/api';
import {
  buildArchetypeTag,
  buildTrustMeta,
  formatBenchmarkDate,
  formatMetricLabel,
  formatScore,
  getMainScore,
  getScoreEntries
} from '../viewmodels/benchmarkViewModel';

ChartJS.register(CategoryScale, LinearScale, BarElement, Legend, Tooltip);

export default function BenchmarkDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const [benchmark, setBenchmark] = useState(null);
  const [commentsList, setCommentsList] = useState([]);
  const [similarBenchmarks, setSimilarBenchmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      try {
        const [benchmarkRes, commentsRes] = await Promise.all([
          benchmarks.getById(id),
          comments.getByBenchmark(id)
        ]);

        if (cancelled) return;

        const loadedBenchmark = benchmarkRes.data.benchmark;
        setBenchmark(loadedBenchmark);
        setCommentsList(commentsRes.data.comments || []);

        const listRes = await benchmarks.getAll({ category: loadedBenchmark.category, limit: 40 });
        if (!cancelled) {
          const related = (listRes.data.benchmarks || []).filter((item) => String(item.id) !== String(id));
          setSimilarBenchmarks(related);
        }
      } catch (error) {
        console.error('Failed to load benchmark detail:', error);
        navigate('/dashboard');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  const locale = i18n.language === 'pt' ? 'pt-BR' : 'en-US';
  const trust = useMemo(() => buildTrustMeta(benchmark), [benchmark]);
  const archetype = useMemo(() => buildArchetypeTag(benchmark), [benchmark]);
  const mainScore = useMemo(() => getMainScore(benchmark), [benchmark]);

  const percentile = useMemo(() => {
    if (!benchmark || !mainScore) return null;
    const key = mainScore.key;
    const values = [benchmark, ...similarBenchmarks]
      .map((entry) => Number(entry.scores?.[key]))
      .filter((value) => Number.isFinite(value))
      .sort((a, b) => a - b);

    if (!values.length) return null;

    const current = Number(benchmark.scores?.[key]);
    const below = values.filter((value) => value < current).length;
    return Math.round((below / values.length) * 100);
  }, [benchmark, mainScore, similarBenchmarks]);

  const chartData = useMemo(() => {
    if (!benchmark) return null;
    const entries = getScoreEntries(benchmark.scores).slice(0, 8);

    return {
      labels: entries.map((entry) => formatMetricLabel(entry.key)),
      datasets: [
        {
          label: t('benchmark.score'),
          data: entries.map((entry) => entry.value),
          backgroundColor: '#35d0ff',
          borderRadius: 8
        }
      ]
    };
  }, [benchmark, t]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(context) {
              return formatScore(context.parsed.y);
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: '#8ca4c8', maxRotation: 0 },
          grid: { color: 'rgba(118, 152, 201, 0.16)' }
        },
        y: {
          beginAtZero: true,
          ticks: { color: '#8ca4c8' },
          grid: { color: 'rgba(118, 152, 201, 0.2)' }
        }
      }
    }),
    []
  );

  const sortedSimilar = useMemo(() => {
    if (!mainScore) return similarBenchmarks.slice(0, 4);
    const key = mainScore.key;
    return [...similarBenchmarks]
      .map((entry) => ({
        entry,
        delta: Math.abs((Number(entry.scores?.[key]) || 0) - mainScore.value)
      }))
      .sort((a, b) => a.delta - b.delta)
      .slice(0, 4)
      .map((item) => item.entry);
  }, [mainScore, similarBenchmarks]);

  const handleCommentSubmit = async (event) => {
    event.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const res = await comments.add({ benchmarkId: id, content: newComment.trim() });
      setCommentsList((prev) => [...prev, res.data.comment]);
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFlag = async () => {
    if (!window.confirm(t('benchmark.flagConfirm'))) return;

    try {
      await benchmarks.flag(id);
      window.alert(t('benchmark.flagSuccess'));
    } catch (error) {
      window.alert(error.response?.data?.error || t('benchmark.flagError'));
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  if (!benchmark) {
    return <EmptyState title={t('errors.notFound')} description={t('benchmark.detailMissing')} />;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <Link to="/dashboard" className="btn btn-ghost">{t('common.back')}</Link>
        <div className="flex items-center gap-2">
          <Link to={`/compare?ids=${benchmark.id}`} className="btn btn-secondary">{t('benchmark.compare')}</Link>
          {user && user.id !== benchmark.user_id ? (
            <button type="button" onClick={handleFlag} className="btn btn-danger">
              {t('benchmark.flag')}
            </button>
          ) : null}
        </div>
      </div>

      <SectionHeader
        eyebrow={t(`benchmark.categories.${benchmark.category}`)}
        title={benchmark.title}
        subtitle={`${t('benchmark.byUser', { user: benchmark.username })} - ${formatBenchmarkDate(benchmark.created_at, locale)}`}
      />

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <DataCard>
          <div className="h-80">
            {chartData ? <Bar data={chartData} options={chartOptions} /> : null}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="surface-muted p-3">
              <div className="text-xs uppercase tracking-wider text-muted">{t('benchmark.mainMetric')}</div>
              <div className="mt-2 mono text-lg text-slate-100">
                {mainScore ? formatScore(mainScore.value) : '-'}
              </div>
              <div className="text-xs text-soft">{mainScore ? formatMetricLabel(mainScore.key) : t('benchmark.score')}</div>
            </div>

            <div className="surface-muted p-3">
              <div className="text-xs uppercase tracking-wider text-muted">{t('benchmark.percentile')}</div>
              <div className="mt-2 mono text-lg text-slate-100">{percentile !== null ? `${percentile}%` : '-'}</div>
              <div className="text-xs text-soft">{t('benchmark.percentileHint')}</div>
            </div>

            <div className="surface-muted p-3">
              <div className="text-xs uppercase tracking-wider text-muted">{t('benchmark.archetype')}</div>
              <div className="mt-2 text-sm font-semibold text-slate-100">{archetype}</div>
              <div className="text-xs text-soft">{benchmark.test_tool || 'N/A'}</div>
            </div>
          </div>
        </DataCard>

        <div className="space-y-4">
          <DataCard>
            <div className="flex items-center gap-3">
              <div className="trust-ring" style={{ '--value': trust.score }}>
                <div className="trust-ring__inner">{trust.score}%</div>
              </div>
              <div>
                <div className="badge">{t('benchmark.trustIndex')}</div>
                <div className="mt-2 font-display text-lg font-semibold text-slate-100">{trust.label}</div>
                <div className="mt-1 text-sm text-muted">{trust.reasons[0]}</div>
              </div>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-muted">
              {trust.reasons.map((reason) => (
                <li key={reason} className="surface-muted px-3 py-2">{reason}</li>
              ))}
            </ul>
          </DataCard>

          <DataCard>
            <h3 className="font-display text-lg font-semibold text-slate-100">{t('benchmark.specifications')}</h3>
            <div className="mt-4 space-y-2">
              <details open className="surface-muted px-3 py-2">
                <summary className="cursor-pointer text-sm font-semibold text-slate-100">{t('benchmark.hardwareSpecs')}</summary>
                <div className="mt-2 space-y-1.5 text-sm text-muted">
                  {Object.entries(benchmark.hardwareSpecs || {}).map(([key, value]) => (
                    <div key={key} className="flex items-start justify-between gap-3">
                      <span>{formatMetricLabel(key)}</span>
                      <span className="mono text-xs text-slate-200">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </details>

              <details className="surface-muted px-3 py-2">
                <summary className="cursor-pointer text-sm font-semibold text-slate-100">{t('benchmark.software')}</summary>
                <div className="mt-2 space-y-1.5 text-sm text-muted">
                  {Object.entries(benchmark.software || {}).map(([key, value]) => (
                    <div key={key} className="flex items-start justify-between gap-3">
                      <span>{formatMetricLabel(key)}</span>
                      <span className="mono text-xs text-slate-200">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          </DataCard>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.35fr]">
        <DataCard>
          <SectionHeader
            title={t('benchmark.similarSystemsTitle')}
            subtitle={t('benchmark.similarSystemsSubtitle')}
          />

          {sortedSimilar.length > 0 ? (
            <div className="mt-4 space-y-2">
              {sortedSimilar.map((entry) => {
                const score = getMainScore(entry);
                return (
                  <Link key={entry.id} to={`/benchmarks/${entry.id}`} className="surface-muted surface-hover block px-3 py-2.5">
                    <div className="truncate font-medium text-slate-100">{entry.title}</div>
                    <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted">
                      <span>{entry.username}</span>
                      <span className="mono text-slate-200">{score ? formatScore(score.value) : '-'}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState title={t('benchmark.noSimilarTitle')} description={t('benchmark.noSimilarDesc')} />
          )}
        </DataCard>

        <DataCard>
          <SectionHeader
            title={t('comment.add')}
            subtitle={t('benchmark.commentsSubtitle')}
          />

          {user ? (
            <form onSubmit={handleCommentSubmit} className="mt-4 space-y-2">
              <textarea
                className="field"
                rows={3}
                placeholder={t('comment.placeholder')}
                value={newComment}
                onChange={(event) => setNewComment(event.target.value)}
              />
              <button type="submit" disabled={submitting || !newComment.trim()} className="btn btn-primary">
                {submitting ? t('common.loading') : t('comment.submit')}
              </button>
            </form>
          ) : (
            <p className="mt-3 text-sm text-muted">
              <Link to="/login" className="link">{t('nav.login')}</Link> {t('benchmark.loginToComment')}
            </p>
          )}

          <div className="mt-5 space-y-3">
            {commentsList.length > 0 ? (
              commentsList.map((comment) => (
                <article key={comment.id} className="surface-muted px-3 py-2.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                    <span className="font-semibold text-slate-100">{comment.username}</span>
                    {comment.userExperience ? <span className="chip">{t(`profile.${comment.userExperience}`)}</span> : null}
                    <span>{formatBenchmarkDate(comment.created_at, locale)}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-200">{comment.content}</p>
                </article>
              ))
            ) : (
              <EmptyState title={t('comment.noComments')} description={t('benchmark.beFirstComment')} />
            )}
          </div>
        </DataCard>
      </div>
    </div>
  );
}

