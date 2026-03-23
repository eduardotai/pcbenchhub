import { cn } from '../../utils/cn';

export default function KPIStat({ label, value, hint, className }) {
  return (
    <div className={cn('kpi-stat fade-up', className)}>
      <div className="kpi-stat__label">{label}</div>
      <div className="kpi-stat__value">{value}</div>
      {hint ? <div className="kpi-stat__hint">{hint}</div> : null}
    </div>
  );
}

