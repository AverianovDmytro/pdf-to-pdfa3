import { Icon } from '@iconify/react';

interface XMLPreviewProps {
  data: any;
  onRemove: () => void;
}

export function XMLPreview({ data, onRemove }: XMLPreviewProps) {
  if (!data) return null;

  const { summary, seller, buyer, lineItems, totals } = data;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center">
            <Icon icon="solar:xml-bold-duotone" className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900">ZUGFeRD Data</h4>
            <p className="text-xs text-slate-500">Extracted from uploaded XML</p>
          </div>
        </div>
        <button 
          onClick={onRemove}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-red-500"
        >
          <Icon icon="solar:trash-bin-minimalistic-linear" className="w-5 h-5" />
        </button>
      </div>

      {/* Invoice Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-50 p-4 rounded-2xl">
          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Invoice Number</p>
          <p className="font-bold text-slate-900">{summary.invoiceNumber || 'N/A'}</p>
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl">
          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Issue Date</p>
          <p className="font-bold text-slate-900">{summary.issueDate || 'N/A'}</p>
        </div>
      </div>

      {/* Parties */}
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Supplier</h5>
          <div className="space-y-1">
            <p className="font-bold text-slate-900">{seller?.name || 'N/A'}</p>
            <p className="text-sm text-slate-500">{seller?.address || 'No address provided'}</p>
            <p className="text-xs font-mono text-slate-400">{seller?.vatId && `VAT: ${seller.vatId}`}</p>
          </div>
        </div>
        <div>
          <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Buyer</h5>
          <div className="space-y-1">
            <p className="font-bold text-slate-900">{buyer?.name || 'N/A'}</p>
            <p className="text-sm text-slate-500">{buyer?.address || 'No address provided'}</p>
            <p className="text-xs font-mono text-slate-400">{buyer?.vatId && `VAT: ${buyer.vatId}`}</p>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div>
        <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Line Items</h5>
        <div className="border border-slate-100 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 font-bold text-slate-700">Description</th>
                <th className="px-4 py-3 font-bold text-slate-700 text-right">Qty</th>
                <th className="px-4 py-3 font-bold text-slate-700 text-right">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lineItems.length > 0 ? lineItems.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td className="px-4 py-3 text-slate-600">{item.description}</td>
                  <td className="px-4 py-3 text-slate-600 text-right">{item.quantity}</td>
                  <td className="px-4 py-3 text-slate-600 text-right">{item.unitPrice}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-slate-400 italic">No line items found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div className="bg-slate-900 p-6 rounded-2xl text-white">
        <div className="flex justify-between items-center mb-2">
          <span className="text-slate-400 text-sm">Tax Total</span>
          <span className="font-bold">{totals.taxAmount} {summary.currencyCode}</span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-slate-800">
          <span className="font-bold">Grand Total</span>
          <span className="text-2xl font-black text-accent">{totals.totalAmount} {summary.currencyCode}</span>
        </div>
      </div>
    </div>
  );
}
