/**
 * HardwareCompare.jsx — Side-by-side comparison of up to 3 hardware components.
 *
 * Query param: ?ids=1,2,3
 */
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import RatingBadge from '../components/community/RatingBadge';
import SectionHeader from '../components/ui/SectionHeader';
import Skeleton from '../components/ui/Skeleton';
import {
  formatComponentName,
  formatReportCount,
  getCategoryColor,
  getCategoryIcon,
} from '../viewmodels/hardwareViewModel';

const MAX_COMPONENTS = 3;

export default function HardwareCompare() {
  const [searchParams] = useSearchParams();
  const idsParam = searchParams.get('ids') || '';
  const ids = idsParam
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_COMPONENTS);

  const [components, setComponents] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);

  useEffect(() => {
    if (!ids.length) return;
    let cancelled = false;

    setLoading(true);
    setError(null);

    Promise.allSettled(ids.map((id) => api.get(`/hardware/${id}`)))
      .then((results) => {
        if (cancelled) return;
        const resolved = results
          .filter((r) => r.status === 'fulfilled')
          .map((r) => r.value.data.component || r.value.data);
        setComponents(resolved);
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load components for comparison.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [idsParam]);

  const canAddMore = ids.length < MAX_COMPONENTS;

  const rows = [
    { key: 'community_rating', label: 'Rating Tier', render: (c) => <RatingBadge tier={c.community_rating || 'Unrated'} size="sm" /> },
    { key: 'category',         label: 'Category',    render: (c) => (
      <span style={{ color: getCategoryColor(c.category) }}>
        {getCategoryIcon(c.category)} {c.category}
      </span>
    )},
    { key: 'brand',            label: 'Brand',       render: (c) => c.brand || '—' },
    { key: 'generation',       label: 'Generation',  render: (c) => c.generation || '—' },
    { key: 'report_count',     label: 'Reports',     render: (c) => formatReportCount(c.report_count) },
    { key: 'avg_score',        label: 'Avg Score',   render: (c) =>
      c.avg_score != null
        ? <span className="mono" style={{ fontWeight: 600 }}>{Number(c.avg_score).toFixed(1)}</span>
        : '—'
    },
  ];

  if (!ids.length) {
    return (
      <div className="space-y-6 pb-4">
        <SectionHeader
          eyebrow="Hardware Compare"
          title="Compare Components"
          subtitle="Select components to compare side by side."
        />
        <div className="surface p-8 text-center space-y-4">
          <p className="text-muted">No components selected. Browse hardware to start a comparison.</p>
          <Link to="/hardware" className="btn btn-primary">Browse Hardware</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-4">
      <SectionHeader
        eyebrow="Hardware Compare"
        title="Compare Components"
        subtitle="Side-by-side comparison of community ratings and benchmark scores."
      />

      {loading ? (
        <div className="surface p-6">
          <Skeleton className="h-6 w-1/3 mb-4" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full mb-2" />
          ))}
        </div>
      ) : error ? (
        <p className="text-muted text-sm">{error}</p>
      ) : (
        <div className="surface overflow-x-auto" style={{ borderRadius: 'var(--r-lg)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--line-dim)' }}>
                <th style={thStyle}>Metric</th>
                {components.map((c) => (
                  <th key={c.id} style={thStyle}>
                    <Link
                      to={`/hardware/${c.id}`}
                      style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 700 }}
                    >
                      {formatComponentName(c)}
                    </Link>
                  </th>
                ))}
                {canAddMore && (
                  <th style={thStyle}>
                    <Link
                      to="/hardware"
                      className="btn btn-ghost"
                      style={{ fontSize: '0.8rem' }}
                    >
                      + Add Component
                    </Link>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} style={{ borderBottom: '1px solid var(--line-dim)' }}>
                  <td style={tdLabelStyle}>{row.label}</td>
                  {components.map((c) => (
                    <td key={c.id} style={tdStyle}>
                      {row.render(c)}
                    </td>
                  ))}
                  {canAddMore && <td style={tdStyle} />}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ paddingTop: '4px' }}>
        <Link to="/hardware" className="btn btn-ghost" style={{ fontSize: '0.85rem' }}>
          Back to Hardware
        </Link>
      </div>
    </div>
  );
}

const thStyle = {
  padding: '12px 16px',
  textAlign: 'left',
  fontSize: '0.8rem',
  fontWeight: 700,
  color: 'var(--text-soft)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const tdStyle = {
  padding: '12px 16px',
  fontSize: '0.875rem',
  color: 'var(--text-primary)',
};

const tdLabelStyle = {
  ...tdStyle,
  color: 'var(--text-soft)',
  fontWeight: 600,
  whiteSpace: 'nowrap',
};
