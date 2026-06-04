import { Icon } from '@iconify/react';

export function Hero() {
  return (
    <div className="relative overflow-hidden bg-brand-navy py-12 sm:py-16 rounded-3xl mb-12 shadow-layered group">
      {/* Background patterns */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-colors duration-1000"></div>
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-brand-blue/10 rounded-full blur-3xl"></div>
      
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/40 via-transparent to-transparent"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mx-auto max-w-2xl lg:mx-0">
          <div className="flex items-center gap-x-6 mb-8">
            <div className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 shadow-2xl transition-transform group-hover:scale-105 duration-500">
              <Icon icon="solar:bill-list-bold-duotone" className="text-primary h-12 w-12" />
            </div>
            <div>
              <h2 className="text-4xl font-black tracking-tight text-white sm:text-6xl mb-1">Archive <span className="text-primary">Secure</span></h2>
              <div className="h-1.5 w-24 bg-primary rounded-full"></div>
            </div>
          </div>
          <p className="mt-6 text-xl leading-relaxed text-slate-300 font-medium max-w-xl">
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
