import { FileRejection } from 'react-dropzone';
import { useState, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import { Icon } from '@iconify/react';
import { FileUpload } from './components/FileUpload';
import { PDFPreview } from './components/PDFPreview';
import { XMLPreview } from './components/XMLPreview';
import { StatusDisplay } from './components/StatusDisplay';
import { cn } from './components/lib/utils';
import { parseZUGFeRD, ZUGFeRDData } from './components/lib/zugferdParser';
import { motion, AnimatePresence } from 'framer-motion';

export interface ValidationError {
  line: number;
  column: number;
  message: string;
  type: 'ERROR' | 'FATAL' | 'WARNING';
}

interface RecentConversion {
  id: string;
  filename: string;
  date: string;
  status: 'success' | 'error';
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

  const handleReset = () => {
    setFile(null);
    setXmlFile(null);
    setLoading(false);
    setStatus('idle');
    setMessage('');
    setUploadProgress(0);
    setXmlErrors([]);
    setPdfPreview(null);
    setXmlData(null);
    setPreviewTab('pdf');
  };

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

      const validationErrorsHeader = response.headers['x-xml-validation-errors'];
      if (validationErrorsHeader) {
        try {
          const decodedErrors = JSON.parse(atob(validationErrorsHeader));
          setXmlErrors(decodedErrors);
          currentStatus = 'error'; // Show red status but file was downloaded
          currentMessage = 'PDF converted, but ZUGFeRD XML validation failed.';
        } catch (e) {
          console.error('Failed to parse validation errors header', e);
        }
      }

      setStatus(currentStatus);
      setMessage(currentMessage);
      
      // Update recent conversions
      const newConversion: RecentConversion = {
        id: Math.random().toString(36).substr(2, 9),
        filename: file.name,
        date: new Date().toLocaleString(),
        status: currentStatus
      };
      const updated = [newConversion, ...recentConversions].slice(0, 5);
      setRecentConversions(updated);
      localStorage.setItem('recentConversions', JSON.stringify(updated));

    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string; errors?: string[] }>;
      console.error(axiosError);
      setStatus('error');
      
      if (axiosError.response && axiosError.response.data instanceof Blob) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errorData = JSON.parse(reader.result as string);
            setMessage(errorData.message || 'Failed to convert PDF. Please try again.');
            if (errorData.errors) {
              if (Array.isArray(errorData.errors) && errorData.errors.length > 0 && typeof errorData.errors[0] === 'object') {
                setXmlErrors(errorData.errors as unknown as ValidationError[]);
              } else if (Array.isArray(errorData.errors)) {
                setXmlErrors(errorData.errors.map((msg: string) => ({
                  line: 0,
                  column: 0,
                  message: msg,
                  type: 'ERROR'
                })));
              }
            }
          } catch {
            setMessage('Failed to convert PDF. Please try again.');
          }
        };
        reader.readAsText(axiosError.response.data);
      } else {
        const errorData = axiosError.response?.data;
        setMessage(errorData?.message || 'Failed to convert PDF. Please try again.');
        if (errorData?.errors) {
          // If errors is an array of objects matching ValidationError
          if (Array.isArray(errorData.errors) && errorData.errors.length > 0 && typeof errorData.errors[0] === 'object') {
            setXmlErrors(errorData.errors as unknown as ValidationError[]);
          } else if (Array.isArray(errorData.errors)) {
            // Fallback for simple string errors
            setXmlErrors(errorData.errors.map((msg: string) => ({
              line: 0,
              column: 0,
              message: msg,
              type: 'ERROR'
            })));
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 md:p-8 selection:bg-brand-gold/30">
      <div className="max-w-6xl w-full">
        <header className="mb-12 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-navy text-white rounded-full text-xs font-bold uppercase tracking-widest mb-4">
              <Icon icon="solar:shield-check-bold" className="w-4 h-4 text-brand-gold" />
              ISO 19005-3 Compliant
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-brand-navy leading-none tracking-tighter uppercase italic">
              PDF<span className="text-brand-gold">/</span>A-3 <br />
              <span className="text-brand-blue">Converter</span>
            </h1>
          </div>
          <p className="text-slate-500 font-medium max-w-xs md:text-right">
            Secure, professional-grade ZUGFeRD 2.2 validation and PDF/A-3 generation.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-6 bg-white p-8 rounded-3xl shadow-layered border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-6">
              <div>
                <h3 className="text-xl font-bold text-brand-navy leading-tight tracking-tight uppercase">Document Processing</h3>
                <p className="text-slate-400 text-sm font-medium">Standard PDF to ZUGFeRD compliance.</p>
              </div>
              {(file || xmlFile) && (
                <button
                  onClick={handleReset}
                  className="p-2 bg-slate-100 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all text-slate-400 flex items-center gap-1 group/clear"
                >
                  <Icon icon="solar:trash-bin-minimalistic-bold" className="w-5 h-5" />
                </button>
              )}
            </div>

            <FileUpload 
              file={file}
              onDrop={onDropPdf}
              accept={{ 'application/pdf': ['.pdf'] }}
              title="1. Source PDF"
              description="Drop your standard PDF here"
            />

            <FileUpload 
              file={xmlFile}
              onDrop={onDropXml}
              accept={{ 'text/xml': ['.xml'] }}
              title="2. ZUGFeRD XML"
              description="Upload Factur-X/ZUGFeRD data"
            />

            {loading && (
              <div className="space-y-3 pt-4">
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    className="bg-brand-navy h-full shadow-[0_0_15px_rgba(15,23,42,0.3)]" 
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest">Processing Data</span>
                  <span className="text-xs font-black text-brand-navy">{uploadProgress}%</span>
                </div>
              </div>
            )}

            <button
              disabled={!file || loading}
              onClick={handleUpload}
              className="btn-primary w-full py-5 text-lg flex items-center justify-center gap-3 relative overflow-hidden group shadow-xl shadow-brand-navy/10"
            >
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center"
                  >
                    <Icon icon="solar:spinner-bold" className="w-6 h-6 mr-3 animate-spin" />
                    <span>{uploadProgress < 100 ? 'Uploading...' : 'Finalizing Compliance...'}</span>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="idle"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center"
                  >
                    <Icon icon="solar:magic-stick-bold-duotone" className="w-6 h-6 text-brand-gold" />
                    <span className="uppercase tracking-wide">Generate Compliant PDF/A-3</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            <StatusDisplay 
              status={status}
              message={message}
              xmlErrors={xmlErrors}
            />

            {recentConversions.length > 0 && (
              <div className="pt-6 border-t border-border">
                <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4">Recent Conversions</h4>
                <div className="space-y-3">
                  {recentConversions.map(conv => (
                    <div key={conv.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50 transition-colors hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          conv.status === 'success' ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"
                        )}>
                          <Icon icon={conv.status === 'success' ? "solar:check-circle-bold" : "solar:info-circle-bold"} className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground truncate max-w-[150px]">{conv.filename}</p>
                          <p className="text-[10px] text-muted-foreground font-medium">{conv.date}</p>
                        </div>
                      </div>
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-tight px-2 py-0.5 rounded-md",
                        conv.status === 'success' ? "text-green-600 bg-green-50" : "text-amber-600 bg-amber-50"
                      )}>
                        {conv.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="sticky top-8 space-y-8">
            <div className="bg-card/80 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-layered border border-border/50 h-full min-h-[400px]">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <div className="w-2 h-8 bg-primary rounded-full"></div>
                    Document Preview
                 </h3>
                 {(pdfPreview || xmlData) && (
                   <div className="flex bg-muted p-1 rounded-xl">
                     <button
                       onClick={() => setPreviewTab('pdf')}
                       className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${previewTab === 'pdf' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                     >
                       PDF
                     </button>
                     <button
                       onClick={() => setPreviewTab('xml')}
                       className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${previewTab === 'xml' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                     >
                       XML Data
                     </button>
                   </div>
                 )}
               </div>
               
               {previewTab === 'pdf' ? (
                 pdfPreview ? (
                   <PDFPreview 
                     pdfPreview={pdfPreview}
                     onRemove={() => {
                       setPdfPreview(null);
                       setFile(null);
                       setStatus('idle');
                     }}
                   />
                 ) : (
                   <div className="h-[500px] border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-muted-foreground bg-muted/20 animate-in fade-in duration-500">
                      <Icon icon="solar:document-linear" className="w-16 h-16 mb-4 opacity-20" />
                      <p className="text-base font-bold text-foreground">No PDF selected</p>
                      <p className="text-sm mt-1">Upload a PDF to see a live preview</p>
                   </div>
                 )
               ) : (
                 xmlData ? (
                   <XMLPreview 
                     data={xmlData}
                     onRemove={() => {
                       setXmlData(null);
                       setXmlFile(null);
                       setPreviewTab('pdf');
                     }}
                   />
                 ) : (
                   <div className="h-[500px] border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-muted-foreground bg-muted/20 animate-in fade-in duration-500">
                      <Icon icon="solar:xml-linear" className="w-16 h-16 mb-4 opacity-20" />
                      <p className="text-base font-bold text-foreground">No XML data</p>
                      <p className="text-sm mt-1">Upload a ZUGFeRD XML to preview data</p>
                   </div>
                 )
               )}
            </div>
            
            {xmlData && (
              <div className="bg-card p-10 rounded-3xl shadow-layered border border-border animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-2xl font-black text-foreground mb-6 uppercase tracking-tight flex items-center gap-2">
                  <Icon icon="solar:bill-list-bold-duotone" className="text-primary w-8 h-8" />
                  Invoice Summary
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Invoice Number</p>
                    <p className="text-lg font-bold text-foreground">{xmlData.header.id}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Date</p>
                    <p className="text-lg font-bold text-foreground">{xmlData.header.date}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Vendor</p>
                    <p className="text-lg font-bold text-foreground">{xmlData.header.sellerName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Amount</p>
                    <p className="text-2xl font-black text-primary">
                      {xmlData.header.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {xmlData.header.currency}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <footer className="mt-16 text-muted-foreground text-sm pb-8 font-medium">
        © 2026 AS-Soft Business Solutions • Secure Document Archiving
      </footer>
    </div>
  );
}

export default App;
