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
        "p-6 rounded-2xl flex flex-col shadow-sm border animate-in slide-in-from-top-4 duration-500",
        status === 'success' 
          ? "bg-green-50 text-green-800 border-green-100" 
          : "bg-red-50 text-red-800 border-red-100"
      )}
    >
      <div className="flex items-center gap-4 mb-4">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
          status === 'success' ? "bg-green-100" : "bg-red-100"
        )}>
          {status === 'success' ? (
            <Icon icon="solar:check-circle-bold" className="w-6 h-6 text-green-600" />
          ) : (
            <Icon icon="solar:danger-bold" className="w-6 h-6 text-red-600" />
          )}
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-base leading-none mb-1">
            {status === 'success' ? 'Conversion Successful' : 'Validation Error'}
          </h4>
          <p className="text-sm opacity-90">{message}</p>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="mt-2 overflow-hidden rounded-xl border border-red-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-red-100 text-xs">
              <thead className="bg-red-50/50">
                <tr>
                  <th className="px-4 py-2 text-left font-bold text-red-900 uppercase tracking-wider">Source</th>
                  <th className="px-4 py-2 text-left font-bold text-red-900 uppercase tracking-wider">Line/Col</th>
                  <th className="px-4 py-2 text-left font-bold text-red-900 uppercase tracking-wider">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-50">
                {errors.map((error, index) => (
                  <tr key={index} className="hover:bg-red-50/30 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full font-bold",
                        error.source === 'PDF' ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {error.source}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-red-600 font-medium bg-red-50/20">{error.pos}</td>
                    <td className="px-4 py-3 text-slate-700 leading-relaxed">{error.description}</td>
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
