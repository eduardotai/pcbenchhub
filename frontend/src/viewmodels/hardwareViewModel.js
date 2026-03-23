/**
 * hardwareViewModel.js — Display helpers for hardware components.
 */

/**
 * Returns a formatted display name for a component.
 * Falls back to brand + name, or just name if brand is absent.
 */
export function formatComponentName(component) {
  if (!component) return 'Unknown Component';
  const { name, brand } = component;
  if (brand && name && !name.toLowerCase().startsWith(brand.toLowerCase())) {
    return `${brand} ${name}`;
  }
  return name || 'Unknown Component';
}

/**
 * Returns "1 report" or "N reports".
 */
export function formatReportCount(count) {
  const n = Number(count) || 0;
  return n === 1 ? '1 report' : `${n} reports`;
}

/**
 * Maps a confidence value (0–1 float or string 'low'/'medium'/'high'/'very_high')
 * to a human-readable label.
 */
export function formatRatingConfidence(confidence) {
  if (confidence == null) return 'Low';
  // Numeric 0–1 range
  if (typeof confidence === 'number') {
    if (confidence >= 0.75) return 'Very High';
    if (confidence >= 0.5)  return 'High';
    if (confidence >= 0.25) return 'Medium';
    return 'Low';
  }
  // String values coming from backend
  const map = {
    low:       'Low',
    medium:    'Medium',
    high:      'High',
    very_high: 'Very High',
  };
  return map[String(confidence).toLowerCase()] || 'Low';
}

/**
 * Returns the CSS custom-property colour for a hardware category.
 */
export function getCategoryColor(category) {
  const map = {
    CPU:     'var(--cat-cpu)',
    GPU:     'var(--cat-gpu)',
    RAM:     'var(--cat-ram)',
    Storage: 'var(--cat-storage)',
  };
  return map[category] || 'var(--text-muted)';
}

/**
 * Returns an emoji icon for a hardware category.
 */
export function getCategoryIcon(category) {
  const map = {
    CPU:     '⚡',
    GPU:     '🎮',
    RAM:     '🧠',
    Storage: '💾',
  };
  return map[category] || '🔧';
}

/**
 * Sorts an array of components by community_rating tier (descending),
 * then by avg_score descending as a tiebreaker.
 *
 * Tier order: Legendary > Great > Solid > Mediocre > Poor > Unrated
 */
const TIER_ORDER = ['Legendary', 'Great', 'Solid', 'Mediocre', 'Poor', 'Unrated'];

export function sortComponentsByRating(components) {
  if (!Array.isArray(components)) return [];
  return [...components].sort((a, b) => {
    const tierA = TIER_ORDER.indexOf(a.community_rating || 'Unrated');
    const tierB = TIER_ORDER.indexOf(b.community_rating || 'Unrated');
    if (tierA !== tierB) return tierA - tierB;
    return (Number(b.avg_score) || 0) - (Number(a.avg_score) || 0);
  });
}
