import { cn } from '../../utils/cn';

export default function ScorePill({ value, label, tone = 'mid', className }) {
  return (
    <span className={cn('score-pill', className)} data-tone={tone}>
      <span>{value}</span>
      {label ? <span className="text-xs text-soft">{label}</span> : null}
    </span>
  );
}

