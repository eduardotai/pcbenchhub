import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { feed } from '../../services/api';
import RatingBadge from './RatingBadge';
import Skeleton from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';

export default function TrendingHardware({ limit = 5 }) {
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    feed.getTrending({ limit })
      .then((res) => {
        if (!cancelled) setComponents(res.data.components || []);
      })
      .catch(() => {
        if (!cancelled) setComponents([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [limit]);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: limit }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!components.length) {
    return (
      <EmptyState
        title="No trending hardware yet"
        description="Submit benchmarks to build community ratings."
      />
    );
  }

  return (
    <div className="space-y-1">
      {components.map((item, index) => (
        <Link
          key={item.id}
          to={`/hardware/${item.id}`}
          className="surface-muted surface-hover"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '9px 12px',
            borderRadius: 'var(--r-md)',
            textDecoration: 'none',
          }}
        >
          {/* Position number */}
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: index < 3 ? 'rgba(212,175,55,0.9)' : 'var(--text-soft)',
              width: '16px',
              flexShrink: 0,
              textAlign: 'center',
            }}
          >
            {index + 1}
          </span>

          {/* Name + category */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              className="font-semibold"
              style={{
                fontSize: '0.85rem',
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {item.name}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-soft)', marginTop: '1px' }}>
              {item.category}
              {item.report_count != null && (
                <span style={{ marginLeft: '5px' }}>
                  · {item.report_count} report{item.report_count !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Rating badge */}
          <div style={{ flexShrink: 0 }}>
            <RatingBadge tier={item.community_rating || 'Unrated'} size="sm" />
          </div>
        </Link>
      ))}
    </div>
  );
}
