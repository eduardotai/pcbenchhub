export const TIERS = {
  Legendary: {
    label: 'Legendary',
    color: '#9333ea',
    altColor: '#f59e0b',
    bgClass: 'bg-purple-600',
    textClass: 'text-purple-400',
    borderClass: 'border-purple-500',
    description: 'Top tier performance',
  },
  Great: {
    label: 'Great',
    color: '#22c55e',
    bgClass: 'bg-green-600',
    textClass: 'text-green-400',
    borderClass: 'border-green-500',
    description: 'Excellent performance',
  },
  Solid: {
    label: 'Solid',
    color: '#3b82f6',
    bgClass: 'bg-blue-600',
    textClass: 'text-blue-400',
    borderClass: 'border-blue-500',
    description: 'Good performance',
  },
  Mediocre: {
    label: 'Mediocre',
    color: '#f97316',
    bgClass: 'bg-orange-600',
    textClass: 'text-orange-400',
    borderClass: 'border-orange-500',
    description: 'Average performance',
  },
  Poor: {
    label: 'Poor',
    color: '#ef4444',
    bgClass: 'bg-red-600',
    textClass: 'text-red-400',
    borderClass: 'border-red-500',
    description: 'Below average',
  },
  Unrated: {
    label: 'Unrated',
    color: '#6b7280',
    bgClass: 'bg-gray-600',
    textClass: 'text-gray-400',
    borderClass: 'border-gray-500',
    description: 'Not enough data',
  },
};

/**
 * Returns the full tier info object for the given tier name.
 * Falls back to Unrated if the tier is unknown.
 */
export function getTierInfo(tier) {
  return TIERS[tier] || TIERS.Unrated;
}

/**
 * Formats a composite score number for display.
 * Returns '—' when score is null/undefined.
 */
export function formatScore(score) {
  if (score == null || isNaN(score)) return '—';
  return String(Math.round(Number(score)));
}

/**
 * Formats a confidence value (0–1) as a percentage string.
 * Returns '—' when confidence is null/undefined.
 */
export function formatConfidence(confidence) {
  if (confidence == null || isNaN(confidence)) return '—';
  return `${Math.round(Number(confidence) * 100)}%`;
}
