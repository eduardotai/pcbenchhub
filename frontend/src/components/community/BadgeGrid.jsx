import BadgeIcon from './BadgeIcon';

const CATEGORY_ORDER = ['milestone', 'community', 'expertise', 'special'];

const CATEGORY_LABELS = {
  milestone: 'Milestone',
  community: 'Community',
  expertise: 'Expertise',
  special: 'Special',
};

/**
 * BadgeGrid — displays a grid of badges grouped by category.
 *
 * Props:
 *   badges      {array}   — badges earned by the user (each has icon, display_name, etc.)
 *   showEarned  {boolean} — whether to highlight earned badges  (default: true)
 *   allBadges   {array|null} — if provided, shows ALL badges; unearned ones appear dimmed
 */
export default function BadgeGrid({ badges = [], showEarned = true, allBadges = null }) {
  // Build a Set of earned badge names for fast lookup
  const earnedNames = new Set(badges.map((b) => b.name));

  // The full list to display (either allBadges or just earned badges)
  const displayList = allBadges || badges;

  // Group by category
  const grouped = CATEGORY_ORDER.reduce((acc, cat) => {
    const inCat = displayList.filter((b) => b.category === cat);
    if (inCat.length > 0) acc[cat] = inCat;
    return acc;
  }, {});

  // Collect any uncategorised badges
  const categorised = new Set(displayList.filter((b) => CATEGORY_ORDER.includes(b.category)).map((b) => b.name));
  const other = displayList.filter((b) => !CATEGORY_ORDER.includes(b.category));
  if (other.length > 0) grouped.other = other;

  const sections = Object.keys(grouped);

  if (sections.length === 0) {
    return (
      <p style={{ color: '#8896b0', fontSize: 14 }}>No badges yet.</p>
    );
  }

  return (
    <div className="space-y-6">
      {sections.map((cat) => (
        <div key={cat}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#8896b0',
              marginBottom: 12,
            }}
          >
            {CATEGORY_LABELS[cat] || cat}
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            {grouped[cat].map((badge) => {
              const isEarned = allBadges ? earnedNames.has(badge.name) : true;

              return (
                <div
                  key={badge.name || badge.id}
                  style={{
                    opacity: allBadges && !isEarned ? 0.4 : 1,
                    filter: allBadges && !isEarned ? 'grayscale(1)' : 'none',
                    transition: 'opacity 0.2s ease, filter 0.2s ease',
                  }}
                  title={!isEarned ? `Not yet earned: ${badge.display_name}` : undefined}
                >
                  <BadgeIcon badge={badge} size="md" showTooltip />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
