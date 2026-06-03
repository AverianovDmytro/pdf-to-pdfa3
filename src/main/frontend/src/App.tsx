import { useState, useCallback } from 'react';
import axios from 'axios';
import { Icon } from '@iconify/react';
import { FileUpload } from './components/FileUpload';
import { PDFPreview } from './components/PDFPreview';
import { XMLPreview } from './components/XMLPreview';
import { StatusDisplay } from './components/StatusDisplay';
import { Hero } from './components/layout/Hero';
import { parseZUGFeRD } from './components/lib/zugferdParser';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [xmlFile, setXmlFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [xmlErrors, setXmlErrors] = useState<string[]>([]);
  const [pdfPreview, setPdfPreview] = useState<string | null>(null);
  const [xmlData, setXmlData] = useState<any | null>(null);
  const [previewTab, setPreviewTab] = useState<'pdf' | 'xml'>('pdf');

  const onDropPdf = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
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

  const onDropXml = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
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

      setStatus('success');
      setMessage('PDF successfully converted to PDF/A-3!');
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      
      if (err.response && err.response.data instanceof Blob) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errorData = JSON.parse(reader.result as string);
            setMessage(errorData.message || 'Failed to convert PDF. Please try again.');
            if (errorData.errors) {
              setXmlErrors(errorData.errors);
            }
          } catch (e) {
            setMessage('Failed to convert PDF. Please try again.');
          }
        };
        reader.readAsText(err.response.data);
      } else {
        const errorData = err.response?.data;
        setMessage(errorData?.message || 'Failed to convert PDF. Please try again.');
        if (errorData?.errors) {
          setXmlErrors(errorData.errors);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-8">
      <div className="max-w-5xl w-full">
        <Hero />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-8 bg-card p-10 rounded-3xl shadow-layered border border-border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2 leading-tight">Upload Documents</h3>
                <p className="text-muted-foreground text-base">Provide the source PDF and the corresponding ZUGFeRD XML file.</p>
              </div>
              {(file || xmlFile) && (
                <button
                  onClick={handleReset}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <Icon icon="solar:refresh-linear" className="w-4 h-4" />
                  Clear All
                </button>
              )}
            </div>

            <FileUpload 
              file={file}
              onDrop={onDropPdf}
              accept={{ 'application/pdf': ['.pdf'] }}
              title="Step 1: Source PDF"
              description="Standard PDF document"
            />

            <FileUpload 
              file={xmlFile}
              onDrop={onDropXml}
              accept={{ 'text/xml': ['.xml'] }}
              title="Step 2: ZUGFeRD XML"
              description="Structured invoice data"
            />

            {loading && (
              <div className="space-y-2">
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden shadow-inner">
                  <div 
                    className="bg-primary h-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(var(--primary),0.5)]" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-right font-bold text-muted-foreground uppercase tracking-wider">{uploadProgress}% Complete</p>
              </div>
            )}

            <button
              disabled={!file || !xmlFile || loading}
              onClick={handleUpload}
              className="w-full bg-primary text-primary-foreground py-5 rounded-2xl font-bold hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center text-xl group"
            >
              {loading ? (
                <>
                  <Icon icon="solar:spinner-bold" className="w-6 h-6 mr-3 animate-spin" />
                  {uploadProgress < 100 ? 'Uploading Files...' : 'Processing PDF/A-3...'}
                </>
              ) : (
                <>
                  <span>Step 3: Convert PDF to PDF ZUGFeRD</span>
                </>
              )}
            </button>

            <StatusDisplay 
              status={status}
              message={message}
              xmlErrors={xmlErrors}
            />
          </div>

          <div className="sticky top-8">
            <div className="bg-card p-10 rounded-3xl shadow-layered border border-border h-full min-h-[400px]">
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
