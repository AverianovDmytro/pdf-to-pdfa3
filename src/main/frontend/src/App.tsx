import { FileRejection } from 'react-dropzone';
import { useState, useCallback, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import { Icon } from '@iconify/react';
import { FileUpload } from './components/FileUpload';
import { StatusDisplay } from './components/StatusDisplay';
import { cn } from './components/lib/utils';
import { parseZUGFeRD, ZUGFeRDData } from './components/lib/zugferdParser';
import { motion } from 'framer-motion';
import * as Toast from '@radix-ui/react-toast';

export interface ValidationError {
  line: number;
  column: number;
  location?: string;
  message: string;
  type: 'ERROR' | 'FATAL' | 'WARNING';
}

interface RecentConversion {
  id: string;
  filename: string;
  date: string;
  status: 'success' | 'error';
  message?: string;
  errors?: ValidationError[];
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [xmlFile, setXmlFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [xmlErrors, setXmlErrors] = useState<ValidationError[]>([]);
  const [pdfPreview, setPdfPreview] = useState<string | null>(null);
  const [xmlData, setXmlData] = useState<ZUGFeRDData | null>(null);
  const [previewTab, setPreviewTab] = useState<'pdf' | 'xml'>('pdf');
  const [toastOpen, setToastOpen] = useState(false);
  const [toastContent, setToastContent] = useState({ title: '', description: '', variant: 'success' as 'success' | 'error' });
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      if (saved !== null) return JSON.parse(saved);
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const [recentConversions, setRecentConversions] = useState<RecentConversion[]>(() => {
    const saved = localStorage.getItem('recentConversions');
    return saved ? JSON.parse(saved) : [];
  });

  const onDropPdf = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      setStatus('error');
      setMessage('Please upload a valid PDF file.');
      return;
    }
    if (acceptedFiles && acceptedFiles[0]) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      setStatus('idle');
      setMessage('');
      setXmlErrors([]);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPdfPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  }, []);

  const onDropXml = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      setStatus('error');
      setMessage('Please upload a valid XML file.');
      return;
    }
    if (acceptedFiles && acceptedFiles[0]) {
      const selectedFile = acceptedFiles[0];
      setXmlFile(selectedFile);
      setStatus('idle');
      setMessage('');
      setXmlErrors([]);
      setPreviewTab('xml');

      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = parseZUGFeRD(reader.result as string);
          setXmlData(data);
        } catch (err) {
          console.error('Failed to parse XML:', err);
        }
      };
      reader.readAsText(selectedFile);
    }
  }, []);


  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setStatus('idle');
    setUploadProgress(0);
    setXmlErrors([]);
    const formData = new FormData();
    formData.append('file', file);
    if (xmlFile) {
      formData.append('xmlFile', xmlFile);
    }

    try {
      const response = await axios.post('/api/v1/convert', formData, {
        responseType: 'blob',
        timeout: 600000, // 10 minutes timeout
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || progressEvent.loaded));
          setUploadProgress(percentCompleted);
        },
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const originalName = file.name.replace('.pdf', '');
      link.setAttribute('download', `${originalName}_a3.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      let currentStatus: 'success' | 'error' = 'success';
      let currentMessage = 'PDF successfully converted to PDF/A-3!';
      let decodedErrors: ValidationError[] = [];

      const validationErrorsHeader = response.headers['x-xml-validation-errors'];
      if (validationErrorsHeader) {
        try {
          decodedErrors = JSON.parse(atob(validationErrorsHeader));
          setXmlErrors(decodedErrors);
          const hasErrors = decodedErrors.some((e: ValidationError) => e.type === 'ERROR' || e.type === 'FATAL');
          currentStatus = hasErrors ? 'error' : 'success';
          currentMessage = hasErrors 
            ? 'PDF converted, but ZUGFeRD validation failed with errors.' 
            : 'PDF converted with some validation notices.';
        } catch (e) {
          console.error('Failed to parse validation errors header', e);
        }
      }

      setStatus(currentStatus);
      setMessage(currentMessage);
      setToastContent({
        title: currentStatus === 'success' ? 'Conversion Successful' : 'Conversion Warning',
        description: currentMessage,
        variant: currentStatus === 'success' ? 'success' : 'error'
      });
      setToastOpen(true);
      
      // Update recent conversions
      const newConversion: RecentConversion = {
        id: Math.random().toString(36).substr(2, 9),
        filename: file.name,
        date: new Date().toLocaleString(),
        status: currentStatus,
        message: currentMessage,
        errors: decodedErrors
      };
      const updated = [newConversion, ...recentConversions].slice(0, 5);
      setRecentConversions(updated);
      localStorage.setItem('recentConversions', JSON.stringify(updated));

    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string; error?: string; errors?: (string | ValidationError)[] }>;
      console.error(axiosError);
      setStatus('error');
      
      if (axiosError.code === 'ECONNABORTED') {
        const msg = 'Request timed out. The file might be too large or the server is busy.';
        setMessage(msg);
        setToastContent({ title: 'Connection Timeout', description: msg, variant: 'error' });
        setToastOpen(true);
        return;
      }

      if (axiosError.response?.status === 429) {
        const msg = 'Too many requests. Please wait a moment before trying again.';
        setMessage(msg);
        setToastContent({ title: 'Rate Limit Exceeded', description: msg, variant: 'error' });
        setToastOpen(true);
        return;
      }
      
      if (axiosError.response && axiosError.response.data instanceof Blob) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errorData = JSON.parse(reader.result as string);
            const msg = errorData.message || (errorData as { error?: string }).error || 'Failed to convert PDF. Please try again.';
            setMessage(msg);
            setToastContent({ title: 'Conversion Failed', description: msg, variant: 'error' });
            setToastOpen(true);
            
            let errors: ValidationError[] = [];
            if (errorData.errors) {
              if (Array.isArray(errorData.errors) && errorData.errors.length > 0 && typeof errorData.errors[0] === 'object') {
                errors = errorData.errors as unknown as ValidationError[];
              } else if (Array.isArray(errorData.errors)) {
                errors = errorData.errors.map((val: string | ValidationError) => {
                  if (typeof val === 'string') {
                    return {
                      line: 0,
                      column: 0,
                      message: val,
                      type: 'ERROR'
                    } as ValidationError;
                  }
                  return val;
                });
              }
              setXmlErrors(errors);
            }

            // Update recent conversions for error case
            const newConversion: RecentConversion = {
              id: Math.random().toString(36).substr(2, 9),
              filename: file.name,
              date: new Date().toLocaleString(),
              status: 'error',
              message: msg,
              errors: errors
            };
            const updated = [newConversion, ...recentConversions].slice(0, 5);
            setRecentConversions(updated);
            localStorage.setItem('recentConversions', JSON.stringify(updated));

          } catch {
            const msg = 'Failed to convert PDF. Please try again.';
            setMessage(msg);
            setToastContent({ title: 'Error', description: msg, variant: 'error' });
            setToastOpen(true);
          }
        };
        reader.readAsText(axiosError.response.data);
      } else {
        const errorData = axiosError.response?.data as { message?: string; error?: string; errors?: (string | ValidationError)[] };
        const msg = errorData?.message || errorData?.error || 'Failed to convert PDF. Please try again.';
        setMessage(msg);
        setToastContent({ title: 'Conversion Failed', description: msg, variant: 'error' });
        setToastOpen(true);
        
        let errors: ValidationError[] = [];
        if (errorData?.errors) {
          if (Array.isArray(errorData.errors) && errorData.errors.length > 0 && typeof errorData.errors[0] === 'object') {
            errors = errorData.errors as unknown as ValidationError[];
          } else if (Array.isArray(errorData.errors)) {
            errors = errorData.errors.map((val: string | ValidationError) => {
              if (typeof val === 'string') {
                return {
                  line: 0,
                  column: 0,
                  message: val,
                  type: 'ERROR'
                } as ValidationError;
              }
              return val;
            });
          }
          setXmlErrors(errors);
        }

        // Update recent conversions for error case
        const newConversion: RecentConversion = {
          id: Math.random().toString(36).substr(2, 9),
          filename: file.name,
          date: new Date().toLocaleString(),
          status: 'error',
          message: msg,
          errors: errors
        };
        const updated = [newConversion, ...recentConversions].slice(0, 5);
        setRecentConversions(updated);
        localStorage.setItem('recentConversions', JSON.stringify(updated));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Toast.Provider swipeDirection="right">
      <div className="min-h-screen bg-background-primary p-[1rem_1rem_2rem] md:p-[2rem_1.5rem_3rem]">
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 sm:mb-10 pb-6 border-b border-border-tertiary gap-4">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-text-primary rounded-lg flex items-center justify-center text-background-primary shrink-0 transition-colors">
                <Icon icon="ti:file-invoice" className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[18px] font-bold tracking-[-0.3px] text-text-primary">ZUGFeRD Converter</div>
                <div className="text-[11px] font-medium tracking-[1.5px] uppercase text-text-tertiary mt-1">
                  PDF/A-3 · ISO 19005-3 · Factur-X 2.2
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 self-start sm:self-auto">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="w-10 h-10 rounded-lg border border-border-tertiary flex items-center justify-center text-text-secondary hover:bg-background-secondary transition-colors"
              title="Toggle theme"
            >
              <Icon icon={darkMode ? "ti:sun" : "ti:moon"} className="text-lg" />
            </button>
            <div className="bg-background-success text-text-success text-[11px] font-semibold tracking-[0.5px] px-2.5 py-1 rounded-[20px] flex items-center gap-1.5 transition-colors">
              <Icon icon="ti:shield-check" className="text-[13px]" />
              GDPR Compliant
            </div>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 lg:gap-6 items-start">
          {/* Left Column */}
          <div className="flex flex-col gap-4">
            <div className="zu-section-label">Document processing</div>
            
            <div className="grid grid-cols-1 gap-4">
              <FileUpload 
                file={file}
                onDrop={onDropPdf}
                accept={{ 'application/pdf': ['.pdf'] }}
                title="Drop your source PDF here"
                description="Standard invoice PDF · any version"
                num="01"
              />

              <FileUpload 
                file={xmlFile}
                onDrop={onDropXml}
                accept={{ 'text/xml': ['.xml'] }}
                title="Upload ZUGFeRD XML data"
                description="Factur-X / ZUGFeRD structured data"
                num="02"
              />
            </div>

            {loading && (
              <div className="w-full h-[3px] bg-border-tertiary rounded-[2px] overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  className="bg-text-primary h-full rounded-[2px]" 
                />
              </div>
            )}

            <StatusDisplay 
              status={status}
              message={message}
              xmlErrors={xmlErrors}
            />

            <button
              disabled={!file || !xmlFile || loading}
              onClick={handleUpload}
              className="btn-generate"
            >
              {loading ? (
                <>
                  <Icon icon="ti:loader-2" className="text-[20px] animate-spin" />
                  <div className="flex flex-col items-start">
                    <span>Processing…</span>
                    <span className="text-[11px] font-medium opacity-60 tracking-[0.5px] mt-0.5">
                      Embedding XML · Validating
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <Icon icon="ti:bolt" className="text-[20px]" />
                  <div className="flex flex-col items-start">
                    <span>Generate PDF/A-3</span>
                    <span className="text-[11px] font-medium opacity-60 tracking-[0.5px] mt-0.5">
                      ZUGFeRD 2.2 · Compliant archive
                    </span>
                  </div>
                </>
              )}
            </button>
          </div>

          {/* Right Column (Sidebar) */}
          <div className="flex flex-col gap-4">
            <div className="sidebar-card">
              <div className="zu-section-label">Compliance spec</div>
              <div className="flex flex-col">
                {[
                  { key: 'Standard', val: 'ISO 19005-3', ok: true },
                  { key: 'Profile', val: 'PDF/A-3b', ok: true },
                  { key: 'ZUGFeRD', val: 'v2.2 EN16931', ok: true },
                  { key: 'Attachment', val: 'factur-x.xml', ok: false },
                  { key: 'Conformance', val: 'XRECHNUNG', ok: true },
                ].map((spec, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border-tertiary last:border-none text-[12px]">
                    <span className="text-text-secondary font-medium">{spec.key}</span>
                    <span className={cn("font-semibold font-mono-dm text-[11px]", spec.ok ? "text-text-success" : "text-text-primary")}>
                      {spec.val}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="sidebar-card">
              <div className="zu-section-label">Preview</div>
              <div className={cn(
                "bg-background-secondary rounded-[12px] h-[200px] flex flex-col items-center justify-center gap-2 border border-border-tertiary",
                (pdfPreview || xmlData) && "bg-background-success border-border-success"
              )}>
                {(pdfPreview || xmlData) ? (
                  <>
                    <Icon icon="ti:file-check" className="text-[36px] text-text-success" />
                    <p className="text-[12px] text-text-success font-medium">Document ready</p>
                    <button 
                      onClick={() => setPreviewTab(previewTab === 'pdf' ? 'xml' : 'pdf')}
                      className="mt-2 text-[10px] font-bold uppercase tracking-widest text-text-success/70 hover:text-text-success"
                    >
                      Switch to {previewTab === 'pdf' ? 'XML' : 'PDF'}
                    </button>
                  </>
                ) : (
                  <>
                    <Icon icon="ti:file-unknown" className="text-[36px] text-text-tertiary" />
                    <p className="text-[12px] text-text-tertiary font-medium">No document selected</p>
                  </>
                )}
              </div>
            </div>

            <div className="sidebar-card">
              <div className="zu-section-label">Recent activity</div>
              <div className="flex flex-col gap-0.5">
                {recentConversions.length > 0 ? (
                  recentConversions.map(conv => (
                    <div 
                      key={conv.id} 
                      onClick={() => {
                        setStatus(conv.status);
                        setMessage(conv.message || (conv.status === 'success' ? 'Conversion successful' : 'Conversion failed'));
                        setXmlErrors(conv.errors || []);
                      }}
                      className="flex items-center gap-2.5 p-[10px_12px] rounded-[10px] hover:bg-background-secondary transition-colors cursor-pointer group"
                    >
                      <div className={cn("w-[7px] h-[7px] rounded-full shrink-0", conv.status === 'success' ? "bg-green-500" : "bg-red-500")} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-text-primary truncate">{conv.filename}</div>
                        <div className="text-[11px] text-text-tertiary font-mono-dm mt-0.5">{conv.date}</div>
                      </div>
                      <div className={cn(
                        "text-[11px] font-semibold px-2 py-0.5 rounded-[20px]",
                        conv.status === 'success' ? "bg-background-success text-text-success" : "bg-background-danger text-text-danger"
                      )}>
                        {conv.status}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-[12px] text-text-tertiary text-center py-4">No recent activity</div>
                )}
              </div>
            </div>
          </div>
        </main>

        <footer className="mt-10 pt-4 border-t border-border-tertiary flex flex-col sm:flex-row items-center justify-between text-[11px] text-text-tertiary gap-4">
          <span>© 2026 AS-Soft Business Solutions</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-text-secondary transition-colors font-medium">GDPR Compliant</a>
            <a href="#" className="hover:text-text-secondary transition-colors font-medium">Terms of Service</a>
            <a href="#" className="hover:text-text-secondary transition-colors font-medium">Support</a>
          </div>
        </footer>

        <Toast.Root
          className={cn(
            "fixed bottom-4 right-4 z-[100] flex flex-col gap-1 w-80 p-4 rounded-xl shadow-2xl animate-in slide-in-from-right-full duration-300",
            toastContent.variant === 'success' ? "bg-text-primary text-background-primary" : "bg-background-danger text-text-danger border border-text-danger/20"
          )}
          open={toastOpen}
          onOpenChange={setToastOpen}
        >
          <Toast.Title className="text-sm font-bold flex items-center gap-2">
            <Icon icon={toastContent.variant === 'success' ? "ti:circle-check" : "ti:alert-triangle"} className="text-lg" />
            {toastContent.title}
          </Toast.Title>
          <Toast.Description className="text-xs font-medium opacity-80 leading-relaxed">
            {toastContent.description}
          </Toast.Description>
          <Toast.Close className="absolute top-2 right-2 opacity-50 hover:opacity-100 transition-opacity">
            <Icon icon="ti:x" />
          </Toast.Close>
        </Toast.Root>
        <Toast.Viewport />
      </div>
    </Toast.Provider>
  );
}

export default App;
