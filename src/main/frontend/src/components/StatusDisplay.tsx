import { Icon } from '@iconify/react';
import { cn } from './lib/utils';

interface ValidationError {
  source: 'PDF' | 'XML';
  pos: string;
  description: string;
}

interface StatusDisplayProps {
  status: 'idle' | 'success' | 'error';
  message: string;
  xmlErrors: string[];
}

export function StatusDisplay({ status, message, xmlErrors }: StatusDisplayProps) {
  if (status === 'idle') return null;

  const errors: ValidationError[] = xmlErrors.map(error => {
    const match = error.match(/Line: (\d+), Column: (\d+)/i) || error.match(/(\d+):(\d+)/);
    const pos = match ? `${match[1]}:${match[2]}` : '—';
    const description = error.replace(/Line: \d+, Column: \d+: /i, '').replace(/^\d+:\d+ /, '');
    return { source: 'XML', pos, description };
  });

  return (
    <div
      className={cn(
        "p-8 rounded-3xl flex flex-col shadow-layered border animate-in slide-in-from-top-4 duration-500",
        status === 'success' 
          ? "bg-green-50 text-green-900 border-green-100" 
          : "bg-red-50 text-red-900 border-red-100"
      )}
    >
      <div className="flex items-start gap-5 mb-6">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
          status === 'success' ? "bg-green-100" : "bg-red-100"
        )}>
          {status === 'success' ? (
            <Icon icon="solar:check-circle-bold-duotone" className="w-8 h-8 text-green-600" />
          ) : (
            <Icon icon="solar:danger-bold-duotone" className="w-8 h-8 text-red-600" />
          )}
        </div>
        <div className="flex-1 pt-1">
          <h4 className="font-black text-xl leading-none mb-2 uppercase tracking-tight">
            {status === 'success' ? 'Conversion Successful' : 'Validation Error'}
          </h4>
          <p className="text-base font-medium opacity-80">{message}</p>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="mt-2 overflow-hidden rounded-2xl border border-red-200 bg-white shadow-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-red-100 text-sm">
              <thead className="bg-red-50/50">
                <tr>
                  <th className="px-6 py-4 text-left font-black text-red-900 uppercase tracking-widest text-[10px]">Source</th>
                  <th className="px-6 py-4 text-left font-black text-red-900 uppercase tracking-widest text-[10px]">Line/Col</th>
                  <th className="px-6 py-4 text-left font-black text-red-900 uppercase tracking-widest text-[10px]">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-50">
                {errors.map((error, index) => (
                  <tr key={index} className="hover:bg-red-50/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        "px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider shadow-sm",
                        error.source === 'PDF' ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {error.source}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-red-600 font-bold bg-red-50/20">{error.pos}</td>
                    <td className="px-6 py-4 text-slate-700 font-medium leading-relaxed">{error.description}</td>
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
