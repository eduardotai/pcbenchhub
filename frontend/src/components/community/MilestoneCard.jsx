function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function MilestoneCard({ milestone }) {
  return (
    <div
      style={{
        padding: '16px 18px',
        borderRadius: 'var(--r-lg)',
        background: 'rgba(124,77,255,0.08)',
        border: '1.5px solid rgba(212,175,55,0.45)',
        boxShadow: '0 0 18px rgba(212,175,55,0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>🎉</span>
        <span
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            color: 'rgba(212,175,55,0.9)',
          }}
        >
          Community Milestone
        </span>
      </div>

      <p
        style={{
          fontSize: '0.9rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          lineHeight: 1.45,
          margin: 0,
        }}
      >
        {milestone.message}
      </p>

      {milestone.reached_at && (
        <span
          className="text-soft"
          style={{ fontSize: '0.75rem' }}
        >
          Reached on {formatDate(milestone.reached_at)}
        </span>
      )}
    </div>
  );
}
