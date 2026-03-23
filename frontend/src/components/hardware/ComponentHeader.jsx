import { Link } from 'react-router-dom';
import RatingBadge from '../community/RatingBadge';
import {
  formatComponentName,
  formatReportCount,
  getCategoryColor,
  getCategoryIcon,
} from '../../viewmodels/hardwareViewModel';

/**
 * ComponentHeader — hero header for a hardware detail page.
 *
 * Props:
 *   component  {object}  — { id, name, category, brand, generation,
 *                            report_count, community_rating, avg_score }
 */
export default function ComponentHeader({ component }) {
  if (!component) return null;

  const {
    id,
    category,
    brand,
    generation,
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
    <div
      className="surface overflow-hidden"
      style={{
        padding: '2rem 2.5rem',
        borderRadius: 'var(--r-xl)',
        position: 'relative',
      }}
    >
      {/* Decorative glow orb */}
      <div style={{
        position: 'absolute', top: '-60px', right: '-40px',
        width: '300px', height: '300px', borderRadius: '50%',
        background: `radial-gradient(circle, ${color}22 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Category label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{icon}</span>
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color,
          }}>
            {category}
          </span>
        </div>

        {/* Name + Rating badge */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
          <h1
            className="font-display font-black gradient-title"
            style={{ fontSize: 'clamp(1.6rem, 2vw + 1rem, 2.6rem)', letterSpacing: '-0.03em', lineHeight: 1.15 }}
          >
            {fullName}
          </h1>
          <div style={{ paddingTop: '6px' }}>
            <RatingBadge tier={community_rating || 'Unrated'} size="lg" />
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '20px' }}>
          <Stat label="Reports" value={reportStr} />
          {score && <Stat label="Avg Score" value={score} mono />}
          {brand && <Stat label="Brand" value={brand} />}
          {generation && <Stat label="Generation" value={generation} />}
        </div>

        {/* Compare button */}
        <Link
          to={`/hardware/compare?ids=${id}`}
          className="btn btn-secondary"
          style={{ fontSize: '0.85rem' }}
        >
          Compare
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value, mono = false }) {
  return (
    <div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-soft)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>
        {label}
      </div>
      <div
        className={mono ? 'mono' : 'font-display font-semibold'}
        style={{ fontSize: '1rem', color: 'var(--text-primary)' }}
      >
        {value}
      </div>
    </div>
  );
}
