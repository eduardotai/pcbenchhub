/**
 * HardwareDetail.jsx — Detail page for a single hardware component.
 *
 * Tabs: Overview (ComponentHeader + RatingBreakdown + ScoreDistribution + TrendChart)
 *       Reports (ReportList)
 */
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import ComponentHeader from '../components/hardware/ComponentHeader';
import ScoreDistribution from '../components/hardware/ScoreDistribution';
import TrendChart from '../components/hardware/TrendChart';
import ReportList from '../components/hardware/ReportList';
import RatingBreakdown from '../components/community/RatingBreakdown';
import Skeleton from '../components/ui/Skeleton';

const TABS = ['Overview', 'Reports'];

export default function HardwareDetail() {
  const { id } = useParams();
  const [component, setComponent] = useState(null);
  const [ratingData, setRatingData] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [activeTab, setActiveTab]   = useState('Overview');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [compRes, ratingRes] = await Promise.allSettled([
          api.get(`/hardware/${id}`),
          api.get(`/ratings/hardware/${id}`),
        ]);

        if (cancelled) return;

        if (compRes.status === 'fulfilled') {
          const data = compRes.value.data;
          setComponent(data.component || data);
        } else {
          setError('Component not found.');
        }

        if (ratingRes.status === 'fulfilled') {
          setRatingData(ratingRes.value.data);
        }
      } catch {
        if (!cancelled) setError('Failed to load component.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="surface p-8">
          <Skeleton className="h-8 w-1/3 mb-4" />
          <Skeleton className="h-6 w-20 mb-4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !component) {
    return (
      <div className="surface p-8 text-center space-y-4">
        <p className="text-muted">{error || 'Component not found.'}</p>
        <Link to="/hardware" className="btn btn-secondary">Back to Hardware</Link>
      </div>
    );
  }

  // Extract scores array from ratingData for ScoreDistribution
  const scores = ratingData?.scores || ratingData?.snapshot?.scores || [];
  const history = ratingData?.history || ratingData?.snapshots || [];

  return (
    <div className="space-y-6 pb-4">
      {/* Breadcrumb */}
      <div style={{ fontSize: '0.8rem', color: 'var(--text-soft)' }}>
        <Link to="/hardware" style={{ color: 'var(--text-soft)', textDecoration: 'none' }}>
          Hardware
        </Link>
        {' / '}
        <span style={{ color: 'var(--text-primary)' }}>{component.name}</span>
      </div>

      {/* Hero header */}
      <ComponentHeader component={component} />

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--line-dim)', paddingBottom: '0' }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.55rem 1.1rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              borderRadius: 'var(--r-md) var(--r-md) 0 0',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === tab ? 'var(--surface-bg)' : 'transparent',
              color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-soft)',
              borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'Overview' && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <RatingBreakdown componentId={id} />
            <ScoreDistribution scores={scores} />
          </div>
          <TrendChart history={history} />
        </div>
      )}

      {activeTab === 'Reports' && (
        <ReportList componentId={id} pageSize={10} />
      )}
    </div>
  );
}
