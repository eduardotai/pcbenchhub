import { cn } from '../../utils/cn';

export default function FilterChip({ active, children, className, ...props }) {
  return (
    <button
      type="button"
      className={cn('chip transition-colors', active && 'chip-active', className)}
      {...props}
    >
      {children}
    </button>
  );
}

