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
        "group border-3 border-dashed rounded-3xl p-12 text-center transition-all duration-300 cursor-pointer block relative overflow-hidden",
        "shadow-sm hover:shadow-xl hover:-translate-y-1",
        file 
          ? "border-secondary bg-secondary/5" 
          : "border-muted bg-white hover:border-primary",
        isDragActive && "border-primary bg-primary/10 scale-[1.02]"
      )}
    >
      <input {...getInputProps()} />
      
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>

      {file ? (
        <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-secondary/10 rounded-2xl flex items-center justify-center mb-4 shadow-inner relative group/file">
            <Icon icon="solar:document-bold-duotone" className="w-12 h-12 text-secondary transition-transform group-hover/file:scale-110" />
            <div className="absolute inset-0 bg-secondary/20 rounded-2xl opacity-0 group-hover/file:opacity-100 transition-opacity flex items-center justify-center">
               <Icon icon="solar:pen-bold" className="w-6 h-6 text-secondary" />
            </div>
          </div>
          <span className="text-lg font-bold text-foreground truncate max-w-xs">{file.name}</span>
          <span className="text-sm font-bold text-secondary mt-1 bg-secondary/10 px-3 py-1 rounded-full uppercase tracking-wider">
            {(file.size / 1024 / 1024).toFixed(2)} MB • Ready
          </span>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className={cn(
            "w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 shadow-inner",
            isDragActive ? "bg-primary text-white" : "bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-white"
          )}>
            <Icon icon="solar:upload-minimalistic-bold-duotone" className="w-10 h-10" />
          </div>
          <span className="text-xl font-black text-foreground mb-2 group-hover:text-primary transition-colors">{title}</span>
          <span className="text-base font-medium text-muted-foreground">{description}</span>
          
          <div className="mt-6 px-4 py-2 bg-muted/50 rounded-xl text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
            Click or Drop File
          </div>
        </div>
      )}
    </div>
  );
}
