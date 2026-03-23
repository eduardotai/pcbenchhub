import { useState } from 'react';

const SIZE_PX = {
  sm: 32,
  md: 48,
  lg: 64,
};

const FONT_SIZE = {
  sm: '14px',
  md: '20px',
  lg: '28px',
};

/**
 * BadgeIcon — displays a single badge as a colored circle with an emoji icon.
 *
 * Props:
 *   badge        {object}  — { icon, display_name, description, color, category }
 *   size         {string}  — 'sm' | 'md' | 'lg'  (default: 'md')
 *   showTooltip  {boolean} — show tooltip on hover  (default: true)
 */
export default function BadgeIcon({ badge, size = 'md', showTooltip = true }) {
  const [tooltipVisible, setTooltipVisible] = useState(false);

  if (!badge) return null;

  const px = SIZE_PX[size] ?? SIZE_PX.md;
  const fontSize = FONT_SIZE[size] ?? FONT_SIZE.md;
  const color = badge.color || '#6b7280';

  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => showTooltip && setTooltipVisible(true)}
      onMouseLeave={() => setTooltipVisible(false)}
      onFocus={() => showTooltip && setTooltipVisible(true)}
      onBlur={() => setTooltipVisible(false)}
      tabIndex={showTooltip ? 0 : -1}
      aria-label={badge.display_name}
    >
      {/* Badge circle */}
      <div
        style={{
          width: px,
          height: px,
          borderRadius: '50%',
          backgroundColor: color + '22',
          border: `2px solid ${color}55`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize,
          cursor: 'default',
          flexShrink: 0,
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          boxShadow: tooltipVisible ? `0 0 12px ${color}55` : 'none',
          transform: tooltipVisible ? 'scale(1.08)' : 'scale(1)',
        }}
        role="img"
        aria-label={badge.display_name}
      >
        {badge.icon}
      </div>

      {/* Tooltip */}
      {showTooltip && tooltipVisible && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: 8,
            zIndex: 50,
            pointerEvents: 'none',
            minWidth: 140,
            maxWidth: 220,
          }}
        >
          <div
            style={{
              background: '#0e1628',
              border: '1px solid rgba(148,115,255,0.28)',
              borderRadius: 10,
              padding: '8px 12px',
              boxShadow: '0 8px 24px rgba(3,7,17,0.5)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 13, color: '#eef2ff', marginBottom: 2 }}>
              {badge.display_name}
            </div>
            {badge.description && (
              <div style={{ fontSize: 11, color: '#8896b0', lineHeight: 1.4 }}>
                {badge.description}
              </div>
            )}
          </div>
          {/* Tooltip arrow */}
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid rgba(148,115,255,0.28)',
            }}
          />
        </div>
      )}
    </div>
  );
}
