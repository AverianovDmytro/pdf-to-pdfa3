import { FileRejection, useDropzone, DropzoneOptions } from 'react-dropzone';
import { Icon } from '@iconify/react';
import { cn } from './lib/utils';

interface FileUploadProps {
  file: File | null;
  onDrop: (acceptedFiles: File[], fileRejections: FileRejection[]) => void;
  accept: DropzoneOptions['accept'];
  title: string;
  description: string;
  num?: string;
}

export function FileUpload({ file, onDrop, accept, title, description, num }: FileUploadProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple: false,
  });

  const isPdf = accept && Object.keys(accept).some(key => key.includes('pdf'));

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-[1.5px] border-dashed border-border-secondary rounded-lg p-[2rem_1.5rem] flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 bg-background-secondary min-h-[160px] relative overflow-hidden",
        "hover:border-text-secondary hover:bg-background-tertiary",
        file && "border-solid border-border-success bg-background-success",
        isDragActive && "border-text-secondary bg-background-tertiary"
      )}
    >
      <input {...getInputProps()} />
      
      {num && <span className="absolute top-[14px] left-[18px] text-[11px] font-bold tracking-[1px] text-text-tertiary font-mono-dm">{num}</span>}

      <Icon 
        icon={isPdf ? "ti:file-type-pdf" : "ti:code"} 
        className={cn("text-[40px]", file ? "text-text-success" : "text-text-tertiary")}
      />

      <div className={cn("text-center", file ? "hidden" : "block")}>
        <div className="text-[15px] font-semibold text-text-primary">{title}</div>
        <div className="text-[12px] text-text-secondary leading-[1.5]">{description}</div>
        <div className="inline-block mt-2 px-[10px] py-[3px] rounded-[20px] text-[11px] font-semibold tracking-[0.5px] bg-background-tertiary text-text-secondary">
          {isPdf ? ".pdf" : ".xml"}
        </div>
      </div>

      <div className={cn("text-center", file ? "block" : "hidden")}>
        <div className="font-mono-dm text-[12px] text-text-success font-medium truncate max-w-[250px]">{file?.name}</div>
        <div className="text-[15px] font-semibold text-text-success">{isPdf ? "PDF ready" : "XML ready"}</div>
        <div className="inline-block mt-2 px-[10px] py-[3px] rounded-[20px] text-[11px] font-semibold tracking-[0.5px] bg-[rgba(0,0,0,0.08)] text-text-success">
          {(file?.size ? (file.size / 1024).toFixed(1) : 0)} KB
        </div>
      </div>
    </div>
  );
}
