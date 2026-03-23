import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collections as collectionsApi } from '../services/api';
import SectionHeader from '../components/ui/SectionHeader';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { useAuth } from '../context/AuthContext';

function CollectionRow({ collection }) {
  return (
    <Link
      to={`/collections/${collection.id}`}
      className="surface-muted surface-hover"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        padding: '14px 16px',
        borderRadius: 'var(--r-md)',
        textDecoration: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <span className="font-display font-semibold" style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
          {collection.title}
        </span>
        {collection.upvote_count > 0 && (
          <span className="chip" style={{ fontSize: '0.72rem' }}>
            {collection.upvote_count} upvote{collection.upvote_count !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      {collection.description && (
        <p className="text-muted" style={{ fontSize: '0.82rem', margin: 0, lineHeight: 1.5 }}>
          {collection.description}
        </p>
      )}
      {collection.username && (
        <span className="text-soft" style={{ fontSize: '0.75rem' }}>
          by {collection.username}
        </span>
      )}
    </Link>
  );
}

export default function Collections() {
  const { user } = useAuth();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    collectionsApi.getAll()
      .then((res) => {
        if (!cancelled) setCollections(res.data.collections || []);
      })
      .catch(() => {
        if (!cancelled) setCollections([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6 pb-8">
      <div className="fade-up" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <SectionHeader
          eyebrow="Community"
          title="Collections"
          subtitle="Curated lists of hardware and benchmarks."
        />
        {user && (
          <Link to="/collections/new" className="btn btn-primary" style={{ fontSize: '0.875rem', flexShrink: 0 }}>
            + New Collection
          </Link>
        )}
      </div>

      <div className="fade-up space-y-3" data-delay="1">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="surface-muted" style={{ padding: '14px 16px', borderRadius: 'var(--r-md)' }}>
              <Skeleton className="h-4 w-6/12" />
              <Skeleton className="mt-2 h-3 w-9/12" />
            </div>
          ))
        ) : collections.length > 0 ? (
          collections.map((c) => <CollectionRow key={c.id} collection={c} />)
        ) : (
          <EmptyState
            title="No collections yet"
            description="Be the first to create a curated list of hardware or benchmarks."
            action={user ? (
              <Link to="/collections/new" className="btn btn-primary">Create Collection</Link>
            ) : (
              <Link to="/register" className="btn btn-primary">Join to Create</Link>
            )}
          />
        )}
      </div>
    </div>
  );
}
