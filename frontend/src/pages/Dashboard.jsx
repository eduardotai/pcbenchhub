import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import BenchmarkCard from '../components/BenchmarkCard';
import DataCard from '../components/ui/DataCard';
import EmptyState from '../components/ui/EmptyState';
import FilterChip from '../components/ui/FilterChip';
import KPIStat from '../components/ui/KPIStat';
import RankBadge from '../components/ui/RankBadge';
import ScorePill from '../components/ui/ScorePill';
import SectionHeader from '../components/ui/SectionHeader';
import Skeleton from '../components/ui/Skeleton';
import TableRow from '../components/ui/TableRow';
import { benchmarks } from '../services/api';
import {
  buildScoreBands,
  formatMetricLabel,
  formatScore,
  getMainScore,
  calculateValueIndex
} from '../viewmodels/benchmarkViewModel';

const categories = ['', 'cpu', 'gpu', 'ram', 'storage'];
const userLevels = ['', 'beginner', 'intermediate', 'advanced'];
const viewModes = ['explore', 'ranking', 'range'];

export default function Dashboard() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [benchmarksList, setBenchmarksList] = useState([]);
  const [rankingList, setRankingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [viewMode, setViewMode] = useState(searchParams.get('mode') || 'explore');
  const [metricKey, setMetricKey] = useState('');
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    testTool: '',
    userLevel: '',
    search: ''
  });

  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (filters.category) next.set('category', filters.category);
      else next.delete('category');
      if (viewMode && viewMode !== 'explore') next.set('mode', viewMode);
      else next.delete('mode');
      return next;
    });
  }, [filters.category, viewMode, setSearchParams]);

  useEffect(() => {
    if (!viewModes.includes(viewMode)) {
      setViewMode('explore');
    }
  }, [viewMode]);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      try {
        const params = {
          ...filters,
          page: pagination.page,
          limit: 18
        };

        Object.keys(params).forEach((key) => {
          if (!params[key]) delete params[key];
        });

        const [listRes, rankingRes] = await Promise.all([
          benchmarks.getAll(params),
          benchmarks.getLeaderboard({ category: filters.category || undefined, limit: 20 })
        ]);

        if (cancelled) return;

        const list = listRes.data.benchmarks || [];
        const ranking = rankingRes.data.leaderboard || [];

        setBenchmarksList(list);
        setRankingList(ranking);
        setPagination(listRes.data.pagination || { page: 1, pages: 1, total: list.length });

        if (!metricKey) {
          const firstMetric = Object.keys(list[0]?.scores || {})[0] || '';
          setMetricKey(firstMetric);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
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
  }, [filters, pagination.page]);

  const metricOptions = useMemo(() => {
    return [...new Set(benchmarksList.flatMap((benchmark) => Object.keys(benchmark.scores || {})))];
  }, [benchmarksList]);

  useEffect(() => {
    if (metricOptions.length > 0 && !metricOptions.includes(metricKey)) {
      setMetricKey(metricOptions[0]);
    }
  }, [metricKey, metricOptions]);

  const scoreBand = useMemo(() => buildScoreBands(benchmarksList, metricKey), [benchmarksList, metricKey]);

  const topValue = useMemo(() => {
    if (!rankingList.length) return null;
    const sorted = [...rankingList]
      .map((entry) => ({ ...entry, valueIndex: calculateValueIndex(entry) }))
      .sort((a, b) => b.valueIndex - a.valueIndex);
    return sorted[0] || null;
  }, [rankingList]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const locale = 'en-US';

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow={t('dashboard.badge')}
        title={t('dashboard.title')}
        subtitle={t('dashboard.subtitle')}
        action={<Link to="/submit" className="btn btn-primary">+ {t('nav.submit')}</Link>}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KPIStat
          label={t('dashboard.stats.totalVisible')}
          value={(pagination.total || 0).toLocaleString(locale)}
          hint={t('dashboard.stats.totalVisibleHint')}
        />
        <KPIStat
          label={t('dashboard.stats.liveCategory')}
          value={filters.category ? t(`benchmark.categories.${filters.category}`) : t('benchmark.filters.all')}
          hint={t('dashboard.stats.liveCategoryHint')}
        />
        <KPIStat
          label={t('dashboard.stats.rangeMedian')}
          value={metricKey ? formatScore(scoreBand.median) : '-'}
          hint={metricKey ? formatMetricLabel(metricKey) : t('dashboard.stats.rangeMedianHint')}
        />
        <KPIStat
          label={t('dashboard.stats.bestValue')}
          value={topValue ? `${topValue.valueIndex}` : '-'}
          hint={topValue ? topValue.title : t('dashboard.stats.bestValueHint')}
        />
      </div>

      <DataCard className="sticky-filters !p-4 sm:!p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {viewModes.map((mode) => (
              <FilterChip
                key={mode}
                active={viewMode === mode}
                onClick={() => setViewMode(mode)}
              >
                {t(`dashboard.modes.${mode}`)}
              </FilterChip>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <input
              type="text"
              className="field"
              placeholder={t('benchmark.filters.search')}
              value={filters.search}
              onChange={(event) => handleFilterChange('search', event.target.value)}
            />

            <select
              className="field"
              value={filters.category}
              onChange={(event) => handleFilterChange('category', event.target.value)}
            >
              {categories.map((category) => (
                <option key={category || 'all'} value={category}>
                  {category ? t(`benchmark.categories.${category}`) : `${t('benchmark.filters.all')} ${t('benchmark.filters.category')}`}
                </option>
              ))}
            </select>

            <select
              className="field"
              value={filters.userLevel}
              onChange={(event) => handleFilterChange('userLevel', event.target.value)}
            >
              {userLevels.map((level) => (
                <option key={level || 'all'} value={level}>
                  {level ? t(`profile.${level}`) : `${t('benchmark.filters.all')} ${t('benchmark.filters.level')}`}
                </option>
              ))}
            </select>

            <input
              type="text"
              className="field"
              placeholder={t('dashboard.toolPlaceholder')}
              value={filters.testTool}
              onChange={(event) => handleFilterChange('testTool', event.target.value)}
            />
          </div>
        </div>
      </DataCard>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="surface p-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-6 w-10/12" />
              <Skeleton className="mt-5 h-2 w-full" />
              <Skeleton className="mt-2 h-2 w-9/12" />
              <Skeleton className="mt-6 h-4 w-8/12" />
            </div>
          ))}
        </div>
      ) : viewMode === 'explore' ? (
        benchmarksList.length > 0 ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {benchmarksList.map((benchmark, index) => (
                <div key={benchmark.id} className="fade-up" data-delay={Math.min(4, (index % 5) + 1)}>
                  <BenchmarkCard benchmark={benchmark} />
                </div>
              ))}
            </div>

            {pagination.pages > 1 ? (
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page <= 1}
                  className="btn btn-secondary"
                >
                  {t('common.previous')}
                </button>
                <span className="text-sm text-muted">
                  {pagination.page} / {pagination.pages}
                </span>
                <button
                  type="button"
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.pages}
                  className="btn btn-secondary"
                >
                  {t('common.next')}
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <EmptyState
            title={t('benchmark.noResults')}
            description={t('dashboard.emptyExplore')}
            action={<Link to="/submit" className="btn btn-primary">{t('nav.submit')}</Link>}
          />
        )
      ) : viewMode === 'ranking' ? (
        rankingList.length > 0 ? (
          <div className="surface p-3 sm:p-4">
            <div className="table-shell scrollbar-thin">
              <table>
                <thead>
                  <tr>
                    <th>{t('leaderboard.rank')}</th>
                    <th>{t('benchmark.title')}</th>
                    <th>{t('leaderboard.user')}</th>
                    <th>{t('leaderboard.score')}</th>
                    <th>{t('dashboard.valueIndex')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rankingList.map((entry, index) => {
                    const main = getMainScore(entry);
                    const valueIndex = calculateValueIndex(entry);
                    return (
                      <TableRow key={entry.id}>
                        <td><RankBadge rank={index + 1} /></td>
                        <td>
                          <Link className="font-semibold text-slate-100 hover:text-sky-200" to={`/benchmarks/${entry.id}`}>
                            {entry.title}
                          </Link>
                          <div className="mt-1 text-xs text-muted">{t(`benchmark.categories.${entry.category}`)} - {entry.test_tool}</div>
                        </td>
                        <td>{entry.username}</td>
                        <td>
                          <ScorePill
                            value={main ? formatScore(main.value) : '-'}
                            label={main ? formatMetricLabel(main.key) : ''}
                            tone="high"
                          />
                        </td>
                        <td className="mono">{valueIndex}</td>
                      </TableRow>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState title={t('dashboard.emptyRankingTitle')} description={t('dashboard.emptyRankingDesc')} />
        )
      ) : metricKey ? (
        <div className="space-y-4">
          <DataCard>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="badge">{t('dashboard.rangeMode')}</div>
                <h3 className="mt-2 font-display text-xl font-semibold text-slate-100">{t('dashboard.rangeTitle')}</h3>
                <p className="mt-1 text-sm text-muted">{t('dashboard.rangeSubtitle')}</p>
              </div>
              <select
                className="field !w-auto !min-w-[220px]"
                value={metricKey}
                onChange={(event) => setMetricKey(event.target.value)}
              >
                {metricOptions.map((metric) => (
                  <option key={metric} value={metric}>
                    {formatMetricLabel(metric)}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <KPIStat label={t('dashboard.rangeMin')} value={formatScore(scoreBand.min)} hint={t('dashboard.rangeMinHint')} className="!min-h-[108px]" />
              <KPIStat label={t('dashboard.rangeMedian')} value={formatScore(scoreBand.median)} hint={t('dashboard.rangeMedianHint')} className="!min-h-[108px]" />
              <KPIStat label={t('dashboard.rangeMax')} value={formatScore(scoreBand.max)} hint={t('dashboard.rangeMaxHint')} className="!min-h-[108px]" />
            </div>
          </DataCard>

          <div className="surface p-3 sm:p-4">
            <div className="table-shell scrollbar-thin">
              <table>
                <thead>
                  <tr>
                    <th>{t('benchmark.title')}</th>
                    <th>{t('leaderboard.score')}</th>
                    <th>{t('dashboard.percentile')}</th>
                    <th>{t('dashboard.band')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...scoreBand.rows].reverse().map((row) => (
                    <TableRow key={row.benchmark.id}>
                      <td>
                        <Link to={`/benchmarks/${row.benchmark.id}`} className="font-semibold text-slate-100 hover:text-sky-200">
                          {row.benchmark.title}
                        </Link>
                        <div className="mt-1 text-xs text-muted">{row.benchmark.username}</div>
                      </td>
                      <td className="mono">{formatScore(row.score)}</td>
                      <td>
                        <div className="mono text-sm">{row.percentile}%</div>
                        <div className="metric-track mt-2 w-32">
                          <span style={{ width: `${row.percentile}%` }} />
                        </div>
                      </td>
                      <td>
                        <span className="chip">{row.band}</span>
                      </td>
                    </TableRow>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          title={t('dashboard.emptyRangeTitle')}
          description={t('dashboard.emptyRangeDesc')}
        />
      )}
    </div>
  );
}


