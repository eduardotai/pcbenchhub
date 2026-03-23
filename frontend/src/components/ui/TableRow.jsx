import { cn } from '../../utils/cn';

export default function TableRow({ children, className, hover = true }) {
  return <tr className={cn(hover && 'table-row-hover', className)}>{children}</tr>;
}

