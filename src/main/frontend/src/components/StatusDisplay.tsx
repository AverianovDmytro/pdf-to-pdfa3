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
        "p-8 rounded-3xl flex flex-col shadow-layered border animate-in slide-in-from-top-4 duration-500",
        status === 'success' 
          ? "bg-green-50 text-green-900 border-green-100" 
          : (isWarning ? "bg-amber-50 text-amber-900 border-amber-100" : "bg-red-50 text-red-900 border-red-100")
      )}
    >
      <div className="flex items-start gap-5 mb-6">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
          status === 'success' ? "bg-green-100" : (isWarning ? "bg-amber-100" : "bg-red-100")
        )}>
          {status === 'success' ? (
            <Icon icon="solar:check-circle-bold-duotone" className="w-8 h-8 text-green-600" />
          ) : (
            isWarning ? (
              <Icon icon="solar:info-circle-bold-duotone" className="w-8 h-8 text-amber-600" />
            ) : (
              <Icon icon="solar:danger-bold-duotone" className="w-8 h-8 text-red-600" />
            )
          )}
        </div>
        <div className="flex-1 pt-1">
          <h4 className="font-black text-xl leading-none mb-2 uppercase tracking-tight">
            {status === 'success' ? 'Conversion Successful' : (isWarning ? 'Conversion Completed with Warnings' : 'Validation Error')}
          </h4>
          <p className="text-base font-medium opacity-80">{message}</p>
        </div>
      </div>

      {xmlErrors.length > 0 && (
        <div className={cn(
          "mt-2 overflow-hidden rounded-2xl border bg-white shadow-lg",
          isWarning ? "border-amber-200" : "border-red-200"
        )}>
          <div className="overflow-x-auto">
            <table className={cn(
              "min-w-full divide-y text-sm",
              isWarning ? "divide-amber-100" : "divide-red-100"
            )}>
              <thead className={isWarning ? "bg-amber-50/50" : "bg-red-50/50"}>
                <tr>
                  <th className={cn("px-6 py-4 text-left font-black uppercase tracking-widest text-[10px]", isWarning ? "text-amber-900" : "text-red-900")}>Severity</th>
                  <th className={cn("px-6 py-4 text-left font-black uppercase tracking-widest text-[10px]", isWarning ? "text-amber-900" : "text-red-900")}>Location</th>
                  <th className={cn("px-6 py-4 text-left font-black uppercase tracking-widest text-[10px]", isWarning ? "text-amber-900" : "text-red-900")}>Description</th>
                </tr>
              </thead>
              <tbody className={cn("divide-y", isWarning ? "divide-amber-50" : "divide-red-50")}>
                {xmlErrors.map((error, index) => (
                  <tr key={index} className={cn("transition-colors", isWarning ? "hover:bg-amber-50/30" : "hover:bg-red-50/30")}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        "px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider shadow-sm",
                        error.type === 'WARNING' ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                      )}>
                        {error.type}
                      </span>
                    </td>
                    <td className={cn("px-6 py-4 whitespace-nowrap font-mono font-bold", isWarning ? "text-amber-600 bg-amber-50/20" : "text-red-600 bg-red-50/20")}>
                      {error.line}:{error.column}
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-medium leading-relaxed">{error.message}</td>
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
