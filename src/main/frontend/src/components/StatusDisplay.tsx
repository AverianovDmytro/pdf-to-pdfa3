import { Icon } from '@iconify/react';
import { cn } from './lib/utils';
import { ValidationError } from '../App';
import { useState } from 'react';

interface StatusDisplayProps {
  status: 'idle' | 'success' | 'error';
  message: string;
  xmlErrors: ValidationError[];
}

export function StatusDisplay({ status, message, xmlErrors }: StatusDisplayProps) {
  const [expanded, setExpanded] = useState(false);

  if (status === 'idle') return null;

  const hasIssues = xmlErrors.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <div
        onClick={() => hasIssues && setExpanded(!expanded)}
        className={cn(
          "flex items-center gap-2 px-4 py-3 rounded-[10px] text-[13px] font-semibold",
          status === 'success' ? "bg-background-success text-text-success" : "bg-background-danger text-text-danger",
          hasIssues && "cursor-pointer hover:opacity-90 transition-opacity"
        )}
      >
        <Icon icon={status === 'success' ? "ti:check" : "ti:alert-circle"} className="text-[16px]" />
        <span>{message}</span>

        {hasIssues && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[11px] font-bold bg-[rgba(0,0,0,0.05)] px-2 py-0.5 rounded-full">
              {xmlErrors.length} issues
            </span>
            <Icon
              icon="ti:chevron-down"
              className={cn("text-[14px] transition-transform", expanded && "rotate-180")}
            />
          </div>
        )}
      </div>

      {(hasIssues && expanded) && (
        <div className="flex flex-col gap-2 p-4 bg-background-secondary rounded-[10px] border border-border-tertiary animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="text-[12px] font-bold text-text-secondary uppercase tracking-wider mb-1 flex justify-between items-center">
            <span>Validation Issues</span>
            <span className="text-[10px] font-medium normal-case opacity-60">
              {xmlErrors.filter(e => e.type === 'ERROR' || e.type === 'FATAL').length} Errors · {xmlErrors.filter(e => e.type === 'WARNING').length} Warnings
            </span>
          </div>
          <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {xmlErrors.map((err, i) => (
              <div key={i} className="flex gap-3 p-3 bg-background-primary rounded-lg border border-border-tertiary group hover:border-border-secondary transition-colors">
                <div className={cn(
                  "mt-0.5 w-1.5 h-1.5 rounded-full shrink-0",
                  err.type === 'WARNING' ? "bg-amber-500" : "bg-red-500"
                )} />
                <div className="flex flex-col gap-1 flex-1">
                  <div className="text-[12px] font-medium text-text-primary leading-tight">
                    {err.message}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                    {(err.line > 0 || err.column > 0) && (
                      <div className="text-[10px] font-mono-dm text-text-tertiary flex items-center gap-1">
                        <span className="opacity-50">Pos:</span> {err.line}:{err.column}
                      </div>
                    )}
                    {err.location && (
                      <div className="text-[10px] font-mono-dm text-text-tertiary flex items-center gap-1 break-all">
                        <span className="opacity-50">Path:</span> {err.location}
                      </div>
                    )}
                    <div className={cn(
                      "text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm",
                      err.type === 'WARNING' ? "bg-amber-500/10 text-amber-600" : "bg-red-500/10 text-red-600"
                    )}>
                      {err.type}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
