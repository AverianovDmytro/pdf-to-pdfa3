import { X } from 'lucide-react';

interface PDFPreviewProps {
  pdfPreview: string;
  onRemove: () => void;
}

export function PDFPreview({ pdfPreview, onRemove }: PDFPreviewProps) {
  return (
    <div className="mt-4 border rounded-lg overflow-hidden bg-gray-100">
      <div className="bg-gray-200 px-3 py-1 text-xs font-medium text-gray-600 border-b flex justify-between items-center">
        <span>PDF Preview</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="text-gray-500 hover:text-red-500"
        >
          <X className="w-4 h-4" />
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
