import RatingBadge from './RatingBadge';

const CATEGORY_ICONS = {
  CPU: '🖥',
  GPU: '🎮',
  RAM: '💾',
  Storage: '💿',
};

function parseSafe(val) {
  if (!val) return null;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return null; }
}

function getMainScoreValue(scoresRaw) {
  const scores = parseSafe(scoresRaw);
  if (!scores) return null;
  const entries = Object.entries(scores);
  if (!entries.length) return null;
  const [, val] = entries[0];
  return val != null ? val : null;
}

export default function CollectionItemList({
  items = [],
  editable = false,
  onRemove,
  onReorder,
}) {
  if (!items.length) {
    return (
      <p className="text-sm text-muted italic py-4 text-center">
        No items in this collection yet.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((item, index) => {
        const isComponent = !!item.component_id;
        const icon = isComponent
          ? (CATEGORY_ICONS[item.component_category] || '🔧')
          : '📋';

        return (
          <li
            key={item.id}
            className="surface surface-hover flex items-center gap-3 px-4 py-3 rounded-lg"
          >
            {/* Drag handle (visual only) */}
            {editable && (
              <span
                className="text-muted select-none shrink-0 text-lg"
                style={{ cursor: 'grab' }}
                title="Drag to reorder"
                aria-hidden="true"
              >
                ⠿
              </span>
            )}

            {/* Icon */}
            <span className="text-xl shrink-0" aria-hidden="true">{icon}</span>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {isComponent ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-200 truncate">
                    {item.component_name || `Component #${item.component_id}`}
                  </span>
                  {item.component_rating && (
                    <RatingBadge tier={item.component_rating} size="sm" />
                  )}
                  {item.component_category && (
                    <span className="chip text-xs">{item.component_category}</span>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-200 truncate">
                    {item.report_title || `Report #${item.report_id}`}
                  </span>
                  {item.report_category && (
                    <span className="chip text-xs">{item.report_category}</span>
                  )}
                  {item.report_scores && (() => {
                    const score = getMainScoreValue(item.report_scores);
                    return score != null ? (
                      <span className="text-xs font-mono text-slate-300 bg-white/5 rounded px-1.5 py-0.5">
                        {score}
                      </span>
                    ) : null;
                  })()}
                </div>
              )}

              {item.notes ? (
                <p className="text-xs text-muted mt-0.5 line-clamp-1">{item.notes}</p>
              ) : null}
            </div>

            {/* Remove button */}
            {editable && onRemove && (
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="btn btn-ghost text-xs shrink-0 text-rose-400 hover:text-rose-300"
                title="Remove item"
              >
                ✕
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
