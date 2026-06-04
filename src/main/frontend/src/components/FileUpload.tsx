import { FileRejection, useDropzone, DropzoneOptions } from 'react-dropzone';
import { Icon } from '@iconify/react';
import { cn } from './lib/utils';

interface FileUploadProps {
  file: File | null;
  onDrop: (acceptedFiles: File[], fileRejections: FileRejection[]) => void;
  accept: DropzoneOptions['accept'];
  title: string;
  description: string;
  variant?: 'default' | 'large';
}

export function FileUpload({ file, onDrop, accept, title, description, variant = 'default' }: FileUploadProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple: false,
  });

  const isLarge = variant === 'large';

  return (
    <div
      {...getRootProps()}
      className={cn(
        "group border-4 rounded-2xl transition-all duration-75 cursor-pointer block relative overflow-hidden",
        isLarge ? "p-12" : "p-8",
        "text-center",
        file 
          ? "border-brand-blue bg-blue-50/30 shadow-[0_6px_0_0_#2563eb]" 
          : "border-slate-200 bg-white hover:border-slate-300 shadow-[0_6px_0_0_#e2e8f0]",
        "active:translate-y-[4px] active:shadow-none",
        isDragActive && "border-brand-gold bg-amber-50 shadow-[0_6px_0_0_#d97706] scale-[1.01]"
      )}
    >
      <input {...getInputProps()} />
      
      {file ? (
        <div className="flex flex-col items-center">
          <div className={cn(
            "bg-brand-blue/10 rounded-xl flex items-center justify-center mb-3 relative group/file transition-all",
            isLarge ? "w-24 h-24" : "w-16 h-16"
          )}>
            <Icon 
              icon="solar:document-bold-duotone" 
              className={cn(
                "text-brand-blue transition-transform group-hover/file:scale-110",
                isLarge ? "w-16 h-16" : "w-10 h-10"
              )} 
            />
            <div className="absolute inset-0 bg-brand-blue/20 rounded-xl opacity-0 group-hover/file:opacity-100 transition-opacity flex items-center justify-center">
               <Icon icon="solar:pen-bold" className={cn(isLarge ? "w-8 h-8" : "w-5 h-5", "text-brand-blue")} />
            </div>
          </div>
          <span className={cn(
            "font-bold text-brand-navy truncate max-w-[250px]",
            isLarge ? "text-lg" : "text-sm"
          )}>{file.name}</span>
          <span className={cn(
            "font-black text-brand-blue mt-1 bg-white border-2 border-brand-blue/20 rounded-full uppercase tracking-wider",
            isLarge ? "text-xs px-4 py-1" : "text-[10px] px-2 py-0.5"
          )}>
            {(file.size / 1024 / 1024).toFixed(2)} MB • Confirmed
          </span>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className={cn(
            "rounded-xl flex items-center justify-center mb-4 transition-all duration-300",
            isLarge ? "w-24 h-24" : "w-16 h-16",
            isDragActive ? "bg-brand-gold text-brand-navy" : "bg-slate-100 text-slate-400 group-hover:bg-brand-navy group-hover:text-white"
          )}>
            <Icon 
              icon={isDragActive ? "solar:download-minimalistic-bold" : "solar:upload-minimalistic-bold-duotone"} 
              className={isLarge ? "w-12 h-12" : "w-8 h-8"} 
            />
          </div>
          <span className={cn(
            "font-bold text-brand-navy mb-1 group-hover:text-brand-navy transition-colors uppercase tracking-tight",
            isLarge ? "text-lg" : "text-sm"
          )}>{title}</span>
          <span className={cn(
            "font-medium text-slate-400",
            isLarge ? "text-sm" : "text-xs"
          )}>{description}</span>
        </div>
      )}
    </div>
  );
}
