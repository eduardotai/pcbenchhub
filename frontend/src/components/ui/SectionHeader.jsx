import { cn } from '../../utils/cn';

export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  action,
  className
}) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="space-y-1.5">
        {eyebrow ? <div className="badge">{eyebrow}</div> : null}
        <h2 className="section-heading">{title}</h2>
        {subtitle ? <p className="section-subtitle">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

