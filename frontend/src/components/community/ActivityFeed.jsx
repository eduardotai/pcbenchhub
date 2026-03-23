import { useEffect, useState, useCallback } from 'react';
import { profiles } from '../../services/api';
import Skeleton from '../ui/Skeleton';

const ACTION_CONFIG = {
  report_submitted: { icon: '📊', label: 'Submitted a report' },
  vote_cast: { icon: '👍', label: 'Cast a vote' },
  badge_earned: { icon: '🏆', label: 'Earned a badge' },
  hardware_added: { icon: '💻', label: 'Added hardware' },
  user_registered: { icon: '🌱', label: 'Joined PCBenchHub' },
};

function relativeTime(dateStr) {
  if (!dateStr) return '';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function ActivityItem({ item }) {
  const config = ACTION_CONFIG[item.action_type] || { icon: '🔔', label: item.action_type };

  // Build a description using metadata if present
  let description = config.label;
  if (item.metadata) {
    if (item.action_type === 'report_submitted' && item.metadata.title) {
      description = `Submitted report: "${item.metadata.title}"`;
    } else if (item.action_type === 'badge_earned' && item.metadata.badge_name) {
      description = `Earned badge: ${item.metadata.badge_name}`;
    } else if (item.action_type === 'hardware_added' && item.metadata.component_name) {
      description = `Added hardware: ${item.metadata.component_name}`;
    } else if (item.action_type === 'vote_cast' && item.metadata.vote_type) {
      description = `Cast a ${item.metadata.vote_type}vote`;
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '10px 0',
        borderBottom: '1px solid rgba(148,115,255,0.08)',
      }}
    >
      {/* Icon */}
      <span
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'rgba(148,115,255,0.10)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 15,
          flexShrink: 0,
        }}
      >
        {config.icon}
      </span>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: '#eef2ff', lineHeight: 1.4 }}>
          {description}
        </div>
        {item.entity_id && item.entity_type && (
          <div style={{ fontSize: 11, color: '#4d5d7a', marginTop: 1 }}>
            {item.entity_type} #{item.entity_id}
          </div>
        )}
      </div>

      {/* Timestamp */}
      <div style={{ fontSize: 11, color: '#4d5d7a', flexShrink: 0, marginTop: 2 }}>
        {relativeTime(item.created_at)}
      </div>
    </div>
  );
}

/**
 * ActivityFeed — shows a user's recent activity, fetched from the API.
 *
 * Props:
 *   username  {string}  — the user's username
 *   limit     {number}  — initial items to show (default: 10)
 */
export default function ActivityFeed({ username, limit: initialLimit = 10 }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchActivity = useCallback(
    async (currentOffset, append = false) => {
      if (!username) return;

      if (append) setLoadingMore(true);
      else setLoading(true);

      setError('');
      try {
        const res = await profiles.getActivity(username, {
          limit: initialLimit,
          offset: currentOffset,
        });
        const newItems = res.data.activity || [];

        setItems((prev) => (append ? [...prev, ...newItems] : newItems));
        setHasMore(newItems.length === initialLimit);
        setOffset(currentOffset + newItems.length);
      } catch {
        setError('Failed to load activity.');
      } finally {
        if (append) setLoadingMore(false);
        else setLoading(false);
      }
    },
    [username, initialLimit]
  );

  useEffect(() => {
    setItems([]);
    setOffset(0);
    setHasMore(true);
    fetchActivity(0, false);
  }, [username, fetchActivity]);

  const handleLoadMore = () => {
    fetchActivity(offset, true);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0' }}>
            <Skeleton className="h-8 w-8 rounded-full" />
            <div style={{ flex: 1 }}>
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="mt-2 h-2 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <p style={{ color: '#f43f5e', fontSize: 13 }}>{error}</p>;
  }

  if (items.length === 0) {
    return <p style={{ color: '#8896b0', fontSize: 14 }}>No activity yet.</p>;
  }

  return (
    <div>
      <div>
        {items.map((item, idx) => (
          <ActivityItem key={item.id ?? idx} item={item} />
        ))}
      </div>

      {hasMore && (
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleLoadMore}
            disabled={loadingMore}
            style={{ fontSize: 13 }}
          >
            {loadingMore ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}
