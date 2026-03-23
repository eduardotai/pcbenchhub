import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { feed } from '../services/api';
import FeedItem from '../components/community/FeedItem';
import MilestoneCard from '../components/community/MilestoneCard';
import TrendingHardware from '../components/community/TrendingHardware';
import FilterChip from '../components/ui/FilterChip';
import SectionHeader from '../components/ui/SectionHeader';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

const FEED_LIMIT = 20;

export default function CommunityFeed() {
  const [feedType, setFeedType] = useState('new');
  const [items, setItems] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Fetch milestones once
  useEffect(() => {
    feed.getMilestones()
      .then((res) => setMilestones(res.data.milestones || []))
      .catch(() => setMilestones([]));
  }, []);

  // Fetch feed when type changes — reset list
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setItems([]);
    setOffset(0);
    setHasMore(true);

    feed.getAll({ type: feedType, limit: FEED_LIMIT, offset: 0 })
      .then((res) => {
        if (cancelled) return;
        const newItems = res.data.items || [];
        setItems(newItems);
        setOffset(newItems.length);
        setHasMore(newItems.length === FEED_LIMIT);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [feedType]);

  function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    feed.getAll({ type: feedType, limit: FEED_LIMIT, offset })
      .then((res) => {
        const newItems = res.data.items || [];
        setItems((prev) => [...prev, ...newItems]);
        setOffset((prev) => prev + newItems.length);
        setHasMore(newItems.length === FEED_LIMIT);
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  }

  return (
    <div className="space-y-6 pb-8">

      {/* Header */}
      <div className="fade-up">
        <SectionHeader
          eyebrow="Community Activity"
          title="Community Feed"
          subtitle="See what the community has been up to."
        />
      </div>

      {/* Toggle Hot / New */}
      <div className="flex items-center gap-2 fade-up" data-delay="1">
        <FilterChip active={feedType === 'new'} onClick={() => setFeedType('new')}>
          New
        </FilterChip>
        <FilterChip active={feedType === 'hot'} onClick={() => setFeedType('hot')}>
          Hot
        </FilterChip>
      </div>

      {/* Main layout: feed + sidebar */}
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">

        {/* Feed column */}
        <div className="space-y-3 fade-up" data-delay="2">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="surface-muted" style={{ padding: '12px 14px', borderRadius: 'var(--r-md)' }}>
                <Skeleton className="h-4 w-10/12" />
                <Skeleton className="mt-2 h-3 w-4/12" />
              </div>
            ))
          ) : items.length > 0 ? (
            <>
              {items.map((item, i) => (
                <FeedItem key={item.id || `${item.entity_type}-${item.entity_id}-${i}`} item={item} />
              ))}

              {/* Load more */}
              {hasMore && (
                <div style={{ paddingTop: '8px', textAlign: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={loadMore}
                    disabled={loadingMore}
                    style={{ fontSize: '0.875rem' }}
                  >
                    {loadingMore ? 'Loading...' : 'Load more'}
                  </button>
                </div>
              )}

              {!hasMore && items.length > 0 && (
                <p className="text-soft" style={{ textAlign: 'center', fontSize: '0.8rem', paddingTop: '8px' }}>
                  You've reached the end.
                </p>
              )}
            </>
          ) : (
            <EmptyState
              title="No activity yet"
              description="Be the first to submit a report or vote on a benchmark."
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6 fade-up" data-delay="3">

          {/* Milestones */}
          {milestones.length > 0 && (
            <div className="space-y-3">
              <h3
                className="font-display font-bold"
                style={{ fontSize: '0.95rem', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}
              >
                Milestones
              </h3>
              {milestones.map((m) => (
                <MilestoneCard key={m.id} milestone={m} />
              ))}
            </div>
          )}

          {/* Trending Hardware widget */}
          <div className="surface p-4 space-y-3">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3
                className="font-display font-bold"
                style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}
              >
                Trending Hardware
              </h3>
              <Link
                to="/hardware"
                className="btn btn-ghost"
                style={{ fontSize: '0.78rem', padding: '0.3rem 0.7rem' }}
              >
                View All →
              </Link>
            </div>
            <TrendingHardware limit={5} />
          </div>

        </div>
      </div>
    </div>
  );
}
