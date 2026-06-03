import { Icon } from '@iconify/react';

export function Hero() {
  return (
    <div className="relative overflow-hidden bg-brand-navy py-24 sm:py-32 rounded-3xl mb-12 shadow-layered group">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-navy via-brand-navy/80 to-transparent"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:mx-0">
          <div className="flex items-center gap-x-4 mb-6">
            <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10">
              <Icon icon="simple-icons:blueprint" className="text-primary h-10 w-auto" />
            </div>
            <h2 className="text-4xl font-black tracking-tight text-white sm:text-6xl">Archive <span className="text-primary">Secure</span></h2>
          </div>
          <p className="mt-6 text-xl leading-8 text-slate-300 font-medium">
            Professional PDF to PDF/A-3 (ZUGFeRD) conversion service. Secure, compliant, and ready for long-term digital archiving.
          </p>
        </div>
        <div className="mx-auto mt-12 max-w-2xl lg:mx-0 lg:max-w-none">
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 text-base font-bold leading-7 text-white sm:grid-cols-2 md:flex lg:gap-x-12">
            <div className="flex items-center gap-x-3 bg-white/5 px-4 py-2 rounded-xl border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
               <Icon icon="solar:shield-check-bold-duotone" className="text-primary w-6 h-6" />
               <span>ISO Compliant</span>
            </div>
            <div className="flex items-center gap-x-3 bg-white/5 px-4 py-2 rounded-xl border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
               <Icon icon="solar:document-zip-bold-duotone" className="text-primary w-6 h-6" />
               <span>ZUGFeRD Ready</span>
            </div>
            <div className="flex items-center gap-x-3 bg-white/5 px-4 py-2 rounded-xl border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
               <Icon icon="solar:clock-circle-bold-duotone" className="text-primary w-6 h-6" />
               <span>Long-term Archival</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
