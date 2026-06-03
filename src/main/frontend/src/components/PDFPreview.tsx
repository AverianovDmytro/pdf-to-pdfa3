import { Icon } from '@iconify/react';

interface PDFPreviewProps {
  pdfPreview: string;
  onRemove: () => void;
}

export function PDFPreview({ pdfPreview, onRemove }: PDFPreviewProps) {
  return (
    <div className="mt-4 border border-border rounded-2xl overflow-hidden bg-muted/30">
      <div className="bg-muted px-4 py-2 text-xs font-bold text-muted-foreground border-b border-border flex justify-between items-center">
        <span>PDF Preview</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="text-muted-foreground hover:text-destructive transition-colors"
        >
          <Icon icon="solar:close-circle-linear" className="w-5 h-5" />
        </button>
      </div>
      <iframe
        src={pdfPreview}
        className="w-full h-48"
        title="PDF Preview"
      />
    </div>
  );
}
