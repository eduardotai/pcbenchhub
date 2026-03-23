import { cn } from '../../utils/cn';

export default function Skeleton({ className }) {
  return <div className={cn('skeleton', className)} aria-hidden="true" />;
}

