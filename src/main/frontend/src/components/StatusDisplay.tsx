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
    <div className="flex flex-col gap-4">
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

      {xmlErrors.length > 0 && (
        <div className="flex flex-col gap-2 p-4 bg-background-secondary rounded-[10px] border border-border-tertiary">
          <div className="text-[12px] font-bold text-text-secondary uppercase tracking-wider mb-1">Validation Issues</div>
          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {xmlErrors.map((err, i) => (
              <div key={i} className="flex gap-3 p-3 bg-background-primary rounded-lg border border-border-tertiary">
                <div className={cn(
                  "mt-0.5 w-1.5 h-1.5 rounded-full shrink-0",
                  err.type === 'WARNING' ? "bg-amber-500" : "bg-red-500"
                )} />
                <div className="flex flex-col gap-1">
                  <div className="text-[12px] font-medium text-text-primary leading-tight">
                    {err.message}
                  </div>
                  {(err.line > 0 || err.column > 0) && (
                    <div className="text-[10px] font-mono-dm text-text-tertiary">
                      Line: {err.line}, Column: {err.column}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
