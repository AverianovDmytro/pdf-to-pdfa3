import { ZUGFeRDData } from './lib/zugferdParser';
import { Icon } from '@iconify/react';
import { useState } from 'react';

interface XMLPreviewProps {
  data: ZUGFeRDData;
  onRemove: () => void;
}

interface CollapsibleSectionProps {
  title: string;
  icon: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleSection({ title, icon, children, defaultOpen = true }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-border-tertiary rounded-lg overflow-hidden bg-background-primary transition-colors">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between bg-background-secondary hover:bg-background-tertiary transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon icon={icon} className="text-text-tertiary" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-text-secondary">{title}</span>
        </div>
        <Icon icon={isOpen ? "ti:chevron-up" : "ti:chevron-down"} className="text-text-tertiary" />
      </button>
      {isOpen && <div className="p-4">{children}</div>}
    </div>
  );
}

export function XMLPreview({ data, onRemove }: XMLPreviewProps) {
  if (!data) return null;

  const { summary, seller, buyer, lineItems, totals } = data;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
      <div className="flex items-center justify-between border-b border-border-tertiary pb-4 sticky top-0 bg-background-primary/95 backdrop-blur-sm z-10 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-text-primary rounded-lg flex items-center justify-center transition-colors">
            <Icon icon="ti:code" className="w-6 h-6 text-background-primary" />
          </div>
          <div>
            <h4 className="font-bold text-text-primary text-sm uppercase tracking-tight">ZUGFeRD Extraction</h4>
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">Structured Data</p>
          </div>
        </div>
        <button 
          onClick={onRemove}
          className="p-2 hover:bg-background-secondary rounded-md transition-colors text-text-tertiary hover:text-text-danger"
        >
          <Icon icon="ti:x" className="w-5 h-5" />
        </button>
      </div>

      <CollapsibleSection title="Parties" icon="ti:users">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Supplier</p>
            <p className="font-bold text-text-primary text-sm leading-tight">{seller?.name || 'N/A'}</p>
            <p className="text-[11px] text-text-secondary leading-relaxed">{seller?.address || 'No address provided'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Buyer</p>
            <p className="font-bold text-text-primary text-sm leading-tight">{buyer?.name || 'N/A'}</p>
            <p className="text-[11px] text-text-secondary leading-relaxed">{buyer?.address || 'No address provided'}</p>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Line Items" icon="ti:list">
        <div className="border border-border-tertiary rounded-lg overflow-x-auto bg-background-primary">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-background-secondary border-b border-border-tertiary transition-colors">
              <tr>
                <th className="px-3 py-2 font-bold uppercase tracking-widest text-[9px] text-text-tertiary">Description</th>
                <th className="px-3 py-2 font-bold uppercase tracking-widest text-[9px] text-text-tertiary text-right">Qty</th>
                <th className="px-3 py-2 font-bold uppercase tracking-widest text-[9px] text-text-tertiary text-right">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-tertiary transition-colors">
              {lineItems.length > 0 ? lineItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-background-secondary transition-colors">
                  <td className="px-3 py-2 text-text-primary font-medium">{item.description}</td>
                  <td className="px-3 py-2 text-text-secondary text-right font-mono-dm font-bold">{item.quantity}</td>
                  <td className="px-3 py-2 text-text-primary text-right font-bold">{item.unitPrice}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={3} className="px-3 py-6 text-center text-text-tertiary italic">No items identified</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CollapsibleSection>

      <div className="bg-text-primary p-5 rounded-lg text-background-primary shadow-lg transition-colors">
        <div className="space-y-3">
          <div className="flex justify-between items-center text-[10px] font-bold opacity-60 uppercase tracking-[0.2em]">
            <span>Taxation Total</span>
            <span className="font-mono-dm">{totals.taxAmount} {summary.currencyCode}</span>
          </div>
          <div className="flex justify-between items-center pt-3 border-t border-background-primary/10">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-[0.3em] opacity-40">Settlement Amount</span>
              <span className="text-2xl font-bold tracking-tighter">
                {totals.totalAmount}
              </span>
            </div>
            <span className="text-lg font-bold opacity-40 font-mono-dm">{summary.currencyCode}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
