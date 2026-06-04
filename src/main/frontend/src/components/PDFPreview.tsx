import { Icon } from '@iconify/react';
import { useState } from 'react';

interface PDFPreviewProps {
  pdfPreview: string;
  onRemove: () => void;
}

export function PDFPreview({ pdfPreview, onRemove }: PDFPreviewProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  return (
    <div className="mt-4 border border-border-tertiary rounded-lg overflow-hidden bg-background-secondary transition-colors">
      <div className="bg-background-tertiary px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-text-tertiary border-b border-border-tertiary flex justify-between items-center transition-colors">
        <div className="flex items-center gap-4">
          <span>Document Preview</span>
          <div className="flex items-center gap-2 border-l border-border-secondary pl-4">
            <button 
              onClick={() => setZoom(Math.max(50, zoom - 10))}
              className="hover:text-text-primary transition-colors p-1"
              title="Zoom out"
            >
              <Icon icon="ti:minus" />
            </button>
            <span className="w-8 text-center font-mono-dm">{zoom}%</span>
            <button 
              onClick={() => setZoom(Math.min(200, zoom + 10))}
              className="hover:text-text-primary transition-colors p-1"
              title="Zoom in"
            >
              <Icon icon="ti:plus" />
            </button>
            <button 
              onClick={() => setRotation((rotation + 90) % 360)}
              className="hover:text-text-primary transition-colors p-1 ml-2"
              title="Rotate"
            >
              <Icon icon="ti:rotate-clockwise" />
            </button>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="text-text-tertiary hover:text-text-danger transition-colors"
        >
          <Icon icon="ti:x" className="w-4 h-4" />
        </button>
      </div>
      <div className="overflow-auto bg-background-secondary transition-colors h-[400px] flex items-start justify-center p-4">
        <div 
          style={{ 
            transform: `rotate(${rotation}deg) scale(${zoom / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.2s ease-out'
          }}
          className="w-full h-full"
        >
          <iframe
            src={pdfPreview}
            className="w-full h-full border-none rounded shadow-sm bg-white"
            title="PDF Preview"
          />
        </div>
      </div>
    </div>
  );
}
