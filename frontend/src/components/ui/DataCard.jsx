import { cn } from '../../utils/cn';

export default function DataCard({ children, className, interactive = false, ...props }) {
  return (
    <div className={cn('surface p-5 sm:p-6', interactive && 'surface-hover', className)} {...props}>
      {children}
    </div>
  );
}

