import { ZUGFeRDData } from './lib/zugferdParser';
import { Icon } from '@iconify/react';

interface XMLPreviewProps {
  data: ZUGFeRDData;
  onRemove: () => void;
}

export function XMLPreview({ data, onRemove }: XMLPreviewProps) {
  if (!data) return null;

  const { summary, seller, buyer, lineItems, totals } = data;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
      <div className="flex items-center justify-between border-b border-border pb-4 sticky top-0 bg-card/95 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Icon icon="solar:xml-bold-duotone" className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h4 className="font-bold text-foreground">ZUGFeRD Data</h4>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Extracted from XML</p>
          </div>
        </div>
        <button 
          onClick={onRemove}
          className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-destructive"
        >
          <Icon icon="solar:trash-bin-minimalistic-linear" className="w-5 h-5" />
        </button>
      </div>

      {/* Parties */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-muted/30 p-5 rounded-[1.5rem] border border-border/50">
          <h5 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Icon icon="solar:shop-2-bold-duotone" className="w-3.5 h-3.5" />
            Supplier
          </h5>
          <div className="space-y-1">
            <p className="font-bold text-foreground leading-tight">{seller?.name || 'N/A'}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{seller?.address || 'No address provided'}</p>
            {seller?.vatId && (
              <p className="text-[10px] font-mono font-bold text-primary mt-2 bg-primary/5 px-2 py-0.5 rounded inline-block">VAT: {seller.vatId}</p>
            )}
          </div>
        </div>
        <div className="bg-muted/30 p-5 rounded-[1.5rem] border border-border/50">
          <h5 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Icon icon="solar:user-bold-duotone" className="w-3.5 h-3.5" />
            Buyer
          </h5>
          <div className="space-y-1">
            <p className="font-bold text-foreground leading-tight">{buyer?.name || 'N/A'}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{buyer?.address || 'No address provided'}</p>
            {buyer?.vatId && (
              <p className="text-[10px] font-mono font-bold text-primary mt-2 bg-primary/5 px-2 py-0.5 rounded inline-block">VAT: {buyer.vatId}</p>
            )}
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="space-y-3">
        <h5 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 px-1">
          <Icon icon="solar:list-bold-duotone" className="w-3.5 h-3.5" />
          Line Items
        </h5>
        <div className="border border-border/50 rounded-2xl overflow-hidden bg-muted/20">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border/50">
              <tr>
                <th className="px-4 py-3 font-black uppercase tracking-widest text-[9px] text-muted-foreground">Description</th>
                <th className="px-4 py-3 font-black uppercase tracking-widest text-[9px] text-muted-foreground text-right">Qty</th>
                <th className="px-4 py-3 font-black uppercase tracking-widest text-[9px] text-muted-foreground text-right">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {lineItems.length > 0 ? lineItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-foreground font-medium">{item.description}</td>
                  <td className="px-4 py-3 text-muted-foreground text-right font-mono">{item.quantity}</td>
                  <td className="px-4 py-3 text-foreground text-right font-bold">{item.unitPrice}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground italic">No line items found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div className="bg-foreground p-6 rounded-[2rem] text-background shadow-xl">
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs font-medium opacity-60 uppercase tracking-widest">
            <span>Tax Total</span>
            <span>{totals.taxAmount} {summary.currencyCode}</span>
          </div>
          <div className="flex justify-between items-center pt-4 border-t border-background/10">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Grand Total</span>
              <span className="text-3xl font-black text-primary drop-shadow-[0_2px_10px_rgba(var(--primary),0.3)]">
                {totals.totalAmount}
              </span>
            </div>
            <span className="text-xl font-bold opacity-40">{summary.currencyCode}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
