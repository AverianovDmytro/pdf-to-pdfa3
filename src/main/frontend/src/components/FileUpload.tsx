import { useDropzone, DropzoneOptions } from 'react-dropzone';
import { Icon } from '@iconify/react';
import { cn } from './lib/utils';

interface FileUploadProps {
  file: File | null;
  onDrop: (acceptedFiles: File[], fileRejections: any[]) => void;
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
        "border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 cursor-pointer block",
        "shadow-sm hover:shadow-md",
        file 
          ? "border-secondary bg-secondary/5" 
          : "border-gray-200 bg-white hover:border-primary",
        isDragActive && "border-primary bg-primary/5 scale-[1.01]"
      )}
    >
      <input {...getInputProps()} />
      {file ? (
        <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
          <Icon icon="solar:document-bold-duotone" className="w-16 h-16 text-secondary mb-3" />
          <span className="text-base font-semibold text-gray-900">{file.name}</span>
          <span className="text-sm text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 transition-colors group-hover:bg-primary/10">
            <Icon icon="solar:upload-minimalistic-linear" className="w-8 h-8 text-gray-400" />
          </div>
          <span className="text-base font-semibold text-gray-900">{title}</span>
          <span className="text-sm text-gray-500 mt-1">{description}</span>
        </div>
      )}
    </div>
  );
}
