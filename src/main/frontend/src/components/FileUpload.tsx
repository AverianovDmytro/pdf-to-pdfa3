import { FileRejection, useDropzone, DropzoneOptions } from 'react-dropzone';
import { Icon } from '@iconify/react';
import { cn } from './lib/utils';

interface FileUploadProps {
  file: File | null;
  onDrop: (acceptedFiles: File[], fileRejections: FileRejection[]) => void;
  accept: DropzoneOptions['accept'];
  title: string;
  description: string;
}

export function FileUpload({ file, onDrop, accept, title, description }: FileUploadProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "group border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer block relative overflow-hidden",
        "shadow-sm hover:shadow-lg",
        file 
          ? "border-brand-blue bg-blue-50/30" 
          : "border-slate-200 bg-white hover:border-brand-navy hover:bg-slate-50",
        isDragActive && "border-brand-gold bg-amber-50 scale-[1.01]"
      )}
    >
      <input {...getInputProps()} />
      
      {file ? (
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-brand-blue/10 rounded-xl flex items-center justify-center mb-3 relative group/file">
            <Icon icon="solar:document-bold-duotone" className="w-10 h-10 text-brand-blue transition-transform group-hover/file:scale-110" />
            <div className="absolute inset-0 bg-brand-blue/20 rounded-xl opacity-0 group-hover/file:opacity-100 transition-opacity flex items-center justify-center">
               <Icon icon="solar:pen-bold" className="w-5 h-5 text-brand-blue" />
            </div>
          </div>
          <span className="text-sm font-bold text-brand-navy truncate max-w-[200px]">{file.name}</span>
          <span className="text-[10px] font-black text-brand-blue mt-1 bg-white border border-brand-blue/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
            {(file.size / 1024 / 1024).toFixed(2)} MB • Confirmed
          </span>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className={cn(
            "w-16 h-16 rounded-xl flex items-center justify-center mb-4 transition-all duration-300",
            isDragActive ? "bg-brand-gold text-brand-navy" : "bg-slate-100 text-slate-400 group-hover:bg-brand-navy group-hover:text-white"
          )}>
            <Icon icon={isDragActive ? "solar:download-minimalistic-bold" : "solar:upload-minimalistic-bold-duotone"} className="w-8 h-8" />
          </div>
          <span className="text-sm font-bold text-brand-navy mb-1 group-hover:text-brand-navy transition-colors uppercase tracking-tight">{title}</span>
          <span className="text-xs font-medium text-slate-400">{description}</span>
        </div>
      )}
    </div>
  );
}
