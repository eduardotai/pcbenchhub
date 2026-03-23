import { getTierInfo } from '../../viewmodels/ratingViewModel';

const SIZE_CLASSES = {
  sm: 'text-xs px-2 py-0.5 font-semibold tracking-wide',
  md: 'text-sm px-3 py-1  font-semibold tracking-wide',
  lg: 'text-base px-4 py-1.5 font-bold  tracking-wider',
};

/**
 * RatingBadge — compact visual indicator of a component's community rating tier.
 *
 * Props:
 *   tier  {string}  — one of: Legendary, Great, Solid, Mediocre, Poor, Unrated
 *   size  {string}  — 'sm' | 'md' | 'lg'  (default: 'md')
 */
export default function RatingBadge({ tier = 'Unrated', size = 'md' }) {
  const info = getTierInfo(tier);
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  return (
    <span
      className={`inline-flex items-center rounded ${sizeClass} ${info.bgClass} text-white`}
      style={{ letterSpacing: '0.04em' }}
      title={info.description}
    >
      {info.label}
    </span>
  );
}
