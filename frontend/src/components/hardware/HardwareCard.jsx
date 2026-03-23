import { Link } from 'react-router-dom';
import RatingBadge from '../community/RatingBadge';
import {
  formatComponentName,
  formatReportCount,
  getCategoryColor,
  getCategoryIcon,
} from '../../viewmodels/hardwareViewModel';

/**
 * HardwareCard — compact card for hardware browse/listing pages.
 *
 * Props:
 *   component  {object}  — { id, name, category, brand, report_count,
 *                            community_rating, avg_score, rating_confidence }
 */
export default function HardwareCard({ component }) {
  if (!component) return null;

  const {
    id,
    category,
    brand,
    report_count,
    community_rating,
    avg_score,
  } = component;

  const color     = getCategoryColor(category);
  const icon      = getCategoryIcon(category);
  const fullName  = formatComponentName(component);
  const reportStr = formatReportCount(report_count);
  const score     = avg_score != null ? Number(avg_score).toFixed(1) : null;

  return (
    <Link
      to={`/hardware/${id}`}
      className="surface surface-hover"
      style={{
        display: 'block',
        padding: '1.1rem 1.25rem',
        borderRadius: 'var(--r-lg)',
        boxShadow: 'var(--shadow-sm)',
        textDecoration: 'none',
        transition: 'transform 280ms var(--ease-spring), box-shadow 280ms ease',
      }}
    >
      {/* Category badge row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{icon}</span>
        <span style={{
          fontSize: '0.68rem',
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color,
        }}>
          {category}
        </span>
        {brand && (
          <span style={{ fontSize: '0.72rem', color: 'var(--text-soft)', marginLeft: 'auto' }}>
            {brand}
          </span>
        )}
      </div>

      {/* Component name */}
      <h3
        className="font-display font-semibold"
        style={{
          color: 'var(--text-primary)',
          fontSize: '0.95rem',
          marginBottom: '10px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {fullName}
      </h3>

      {/* Rating badge */}
      <div style={{ marginBottom: '10px' }}>
        <RatingBadge tier={community_rating || 'Unrated'} size="sm" />
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: 'var(--text-soft)' }}>
        <span>{reportStr}</span>
        {score && (
          <span>
            Avg: <span className="mono" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{score}</span>
          </span>
        )}
      </div>
    </Link>
  );
}
