/**
 * HelpfulnessBar — visual proportion bar of upvotes vs downvotes.
 *
 * Props:
 *   upvotes   {number}  — number of upvotes
 *   downvotes {number}  — number of downvotes
 *   size      {string}  — 'sm' | 'md' | 'lg' (default: 'md')
 */

const HEIGHT = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

const TEXT_SIZE = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export default function HelpfulnessBar({ upvotes = 0, downvotes = 0, size = 'md' }) {
  const total = upvotes + downvotes;
  const heightClass = HEIGHT[size] || HEIGHT.md;
  const textClass = TEXT_SIZE[size] || TEXT_SIZE.md;

  if (total === 0) {
    return (
      <div className="flex flex-col gap-1">
        <div className={`w-full rounded-full overflow-hidden bg-white/10 ${heightClass}`}>
          <div className="w-0 h-full" />
        </div>
        <span className={`${textClass} text-muted`}>No votes yet</span>
      </div>
    );
  }

  const helpfulPct = Math.round((upvotes / total) * 100);
  const downPct = 100 - helpfulPct;

  return (
    <div className="flex flex-col gap-1">
      {/* Bar */}
      <div className={`w-full rounded-full overflow-hidden flex ${heightClass} bg-white/10`}>
        {helpfulPct > 0 && (
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${helpfulPct}%` }}
            aria-label={`${helpfulPct}% helpful`}
          />
        )}
        {downPct > 0 && (
          <div
            className="h-full bg-red-500 transition-all duration-300"
            style={{ width: `${downPct}%` }}
            aria-label={`${downPct}% not helpful`}
          />
        )}
      </div>

      {/* Label */}
      <span className={`${textClass} text-muted`}>
        <span className="text-green-400 font-medium">{helpfulPct}% helpful</span>
        {' '}
        <span>({total} {total === 1 ? 'vote' : 'votes'})</span>
      </span>
    </div>
  );
}
