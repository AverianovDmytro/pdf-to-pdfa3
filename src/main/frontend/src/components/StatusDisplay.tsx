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

  const isWarning = xmlErrors.length > 0 && message.includes('converted');

  return (
    <div
      className={cn(
        "p-6 rounded-2xl flex flex-col shadow-layered border animate-in slide-in-from-top-4 duration-500",
        status === 'success' 
          ? "bg-emerald-50 text-emerald-900 border-emerald-100" 
          : (isWarning ? "bg-amber-50 text-amber-900 border-amber-100" : "bg-rose-50 text-rose-900 border-rose-100")
      )}
    >
      <div className="flex items-start gap-4 mb-4">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
          status === 'success' ? "bg-emerald-100" : (isWarning ? "bg-amber-100" : "bg-rose-100")
        )}>
          {status === 'success' ? (
            <Icon icon="solar:check-circle-bold-duotone" className="w-6 h-6 text-emerald-600" />
          ) : (
            isWarning ? (
              <Icon icon="solar:info-circle-bold-duotone" className="w-6 h-6 text-amber-600" />
            ) : (
              <Icon icon="solar:danger-bold-duotone" className="w-6 h-6 text-rose-600" />
            )
          )}
        </div>
        <div className="flex-1 pt-0.5">
          <h4 className="font-bold text-lg leading-tight mb-1 uppercase tracking-tight">
            {status === 'success' ? 'Conversion Successful' : (isWarning ? 'Completed with Warnings' : 'Validation Error')}
          </h4>
          <p className="text-sm font-medium opacity-80">{message}</p>
        </div>
      </div>

      {xmlErrors.length > 0 && (
        <div className={cn(
          "mt-2 overflow-hidden rounded-xl border bg-white shadow-lg",
          isWarning ? "border-amber-200" : "border-rose-200"
        )}>
          <div className="overflow-x-auto">
            <table className={cn(
              "min-w-full divide-y text-[11px]",
              isWarning ? "divide-amber-100" : "divide-rose-100"
            )}>
              <thead className={isWarning ? "bg-amber-50/50" : "bg-rose-50/50"}>
                <tr>
                  <th className={cn("px-4 py-3 text-left font-black uppercase tracking-widest text-[9px]", isWarning ? "text-amber-900" : "text-rose-900")}>Severity</th>
                  <th className={cn("px-4 py-3 text-left font-black uppercase tracking-widest text-[9px]", isWarning ? "text-amber-900" : "text-rose-900")}>Pos</th>
                  <th className={cn("px-4 py-3 text-left font-black uppercase tracking-widest text-[9px]", isWarning ? "text-amber-900" : "text-rose-900")}>Message</th>
                </tr>
              </thead>
              <tbody className={cn("divide-y", isWarning ? "divide-amber-50" : "divide-rose-50")}>
                {xmlErrors.map((error, index) => (
                  <tr key={index} className={cn("transition-colors", isWarning ? "hover:bg-amber-50/30" : "hover:bg-rose-50/30")}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full font-bold text-[8px] uppercase tracking-wider",
                        error.type === 'WARNING' ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                      )}>
                        {error.type}
                      </span>
                    </td>
                    <td className={cn("px-4 py-3 whitespace-nowrap font-mono font-bold", isWarning ? "text-amber-600" : "text-rose-600")}>
                      {error.line}:{error.column}
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium leading-normal">{error.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
