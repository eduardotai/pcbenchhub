import { Link } from 'react-router-dom';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
  if (diffDay < 30) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
  const diffMonth = Math.floor(diffDay / 30);
  return `${diffMonth} month${diffMonth !== 1 ? 's' : ''} ago`;
}

function parseMetadata(item) {
  if (!item.metadata) return {};
  try {
    return typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata;
  } catch {
    return {};
  }
}

function FeedItemContent({ item }) {
  const meta = parseMetadata(item);
  const username = item.username || 'Someone';
  const userLink = item.username ? (
    <Link to={`/u/${item.username}`} className="font-semibold" style={{ color: 'var(--accent)' }}>
      {item.username}
    </Link>
  ) : (
    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{username}</span>
  );

  switch (item.action_type) {
    case 'report_submitted': {
      const hwName = meta.hardware_name || meta.component_name;
      return (
        <span>
          {userLink} submitted a report
          {hwName && (
            <>
              {' for '}
              {item.entity_id ? (
                <Link to={`/hardware/${item.entity_id}`} style={{ color: 'var(--text-primary)' }}>
                  {hwName}
                </Link>
              ) : (
                <span style={{ color: 'var(--text-primary)' }}>{hwName}</span>
              )}
            </>
          )}
        </span>
      );
    }

    case 'vote_cast':
      return <span>{userLink} found a report helpful</span>;

    case 'badge_earned': {
      const badgeName = meta.badge_name || meta.badge || 'a badge';
      return (
        <span>
          {userLink} earned the{' '}
          <span className="font-semibold" style={{ color: 'var(--accent-light, var(--accent))' }}>
            {badgeName}
          </span>{' '}
          badge
        </span>
      );
    }

    case 'hardware_added': {
      const componentName = meta.component_name || meta.name;
      return (
        <span>
          {userLink} added{' '}
          {componentName ? (
            item.entity_id ? (
              <Link to={`/hardware/${item.entity_id}`} className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {componentName}
              </Link>
            ) : (
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{componentName}</span>
            )
          ) : (
            'a component'
          )}{' '}
          to their setup
        </span>
      );
    }

    case 'user_registered':
      return <span>{userLink} joined the community</span>;

    case 'collection_created': {
      const collectionName = meta.name || meta.collection_name;
      return (
        <span>
          {userLink} created a collection
          {collectionName && (
            <>
              {': '}
              {item.entity_id ? (
                <Link to={`/collections/${item.entity_id}`} style={{ color: 'var(--text-primary)' }}>
                  {collectionName}
                </Link>
              ) : (
                <span style={{ color: 'var(--text-primary)' }}>{collectionName}</span>
              )}
            </>
          )}
        </span>
      );
    }

    default:
      return <span>{userLink} performed an action</span>;
  }
}

function getActionIcon(actionType) {
  switch (actionType) {
    case 'report_submitted':  return '🔬';
    case 'vote_cast':         return '👍';
    case 'badge_earned':      return '🏆';
    case 'hardware_added':    return '💻';
    case 'user_registered':   return '👋';
    case 'collection_created': return '📚';
    default:                  return '📌';
  }
}

export default function FeedItem({ item }) {
  const icon = getActionIcon(item.action_type);
  const timeLabel = timeAgo(item.created_at);

  return (
    <div
      className="surface-muted"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '12px 14px',
        borderRadius: 'var(--r-md)',
      }}
    >
      <span style={{ fontSize: '1.1rem', lineHeight: 1, flexShrink: 0, marginTop: '2px' }}>
        {icon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary, var(--text-muted))', lineHeight: 1.5 }}>
          <FeedItemContent item={item} />
        </p>
        {timeLabel && (
          <span className="text-soft" style={{ fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
            {timeLabel}
          </span>
        )}
      </div>
    </div>
  );
}
