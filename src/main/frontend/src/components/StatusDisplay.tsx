import { Icon } from '@iconify/react';
import { cn } from './lib/utils';
import { ValidationError } from '../App';

interface StatusDisplayProps {
  status: 'idle' | 'success' | 'error';
  message: string;
  xmlErrors: ValidationError[];
}

export function StatusDisplay({ status, message, xmlErrors }: StatusDisplayProps) {
  if (status === 'idle') return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-3 rounded-[10px] text-[13px] font-semibold",
        status === 'success' ? "bg-background-success text-text-success" : "bg-background-danger text-text-danger"
      )}
    >
      <Icon icon={status === 'success' ? "ti:check" : "ti:alert-circle"} className="text-[16px]" />
      <span>{message}</span>
      
      {xmlErrors.length > 0 && (
        <span className="ml-auto text-[11px] font-bold bg-[rgba(0,0,0,0.05)] px-2 py-0.5 rounded-full">
          {xmlErrors.length} issues
        </span>
      )}
    </div>
  );
}
