import { Icon } from '@iconify/react';

export function Hero() {
  return (
    <div className="relative overflow-hidden bg-slate-900 py-24 sm:py-32 rounded-3xl mb-12 shadow-layered">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:mx-0">
          <div className="flex items-center gap-x-4 mb-6">
            <Icon icon="simple-icons:blueprint" className="text-accent h-12 w-auto" />
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">Archive Secure</h2>
          </div>
          <p className="mt-6 text-lg leading-8 text-gray-300">
            Professional PDF to PDF/A-3 (ZUGFeRD) conversion service. Secure, compliant, and ready for long-term digital archiving.
          </p>
        </div>
        <div className="mx-auto mt-10 max-w-2xl lg:mx-0 lg:max-w-none">
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 text-base font-semibold leading-7 text-white sm:grid-cols-2 md:flex lg:gap-x-10">
            <div className="flex items-center gap-x-2">
               <Icon icon="solar:shield-check-linear" className="text-secondary w-6 h-6" />
               <span>ISO Compliant</span>
            </div>
            <div className="flex items-center gap-x-2">
               <Icon icon="solar:document-zip-linear" className="text-secondary w-6 h-6" />
               <span>ZUGFeRD Ready</span>
            </div>
            <div className="flex items-center gap-x-2">
               <Icon icon="solar:clock-circle-linear" className="text-secondary w-6 h-6" />
               <span>Long-term Archival</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
