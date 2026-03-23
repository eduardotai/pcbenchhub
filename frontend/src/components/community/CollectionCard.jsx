import { Link } from 'react-router-dom';
import DataCard from '../ui/DataCard';

export default function CollectionCard({ collection, onVote, voted = false }) {
  if (!collection) return null;

  const {
    id,
    title,
    description,
    upvote_count = 0,
    username,
    item_count = 0,
    is_featured,
  } = collection;

  return (
    <DataCard
      className={`flex flex-col gap-3 transition-shadow${is_featured ? ' ring-2 ring-yellow-400/70' : ''}`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {is_featured ? (
            <span className="chip chip-active text-xs mb-1 inline-block">Featured</span>
          ) : null}
          <Link
            to={`/collections/${id}`}
            className="block font-display font-semibold text-slate-100 hover:text-violet-300 transition-colors truncate"
          >
            {title}
          </Link>
        </div>

        {/* Item count badge */}
        <span
          className="chip text-xs shrink-0"
          title={`${item_count} item${item_count !== 1 ? 's' : ''}`}
        >
          {item_count} {item_count === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Description */}
      {description ? (
        <p className="text-sm text-muted line-clamp-2">{description}</p>
      ) : null}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-white/5 mt-auto">
        {/* Creator */}
        {username ? (
          <Link
            to={`/u/${username}`}
            className="text-xs text-slate-400 hover:text-violet-300 transition-colors font-medium"
          >
            {username}
          </Link>
        ) : (
          <span className="text-xs text-muted">Unknown</span>
        )}

        {/* Vote button */}
        <button
          type="button"
          onClick={onVote}
          className={`flex items-center gap-1 text-sm transition-colors${
            voted
              ? ' text-violet-400 font-semibold'
              : ' text-muted hover:text-slate-200'
          }`}
          title={voted ? 'Remove upvote' : 'Upvote this collection'}
        >
          <span aria-hidden="true">▲</span>
          <span>{upvote_count}</span>
        </button>
      </div>
    </DataCard>
  );
}
