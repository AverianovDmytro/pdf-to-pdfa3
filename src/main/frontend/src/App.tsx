import { useState, useCallback } from 'react';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-8">
      <div className="max-w-5xl w-full">
        <Hero />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-8 bg-white p-8 rounded-3xl shadow-layered border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Upload Documents</h3>
                <p className="text-slate-500 text-sm">Provide the source PDF and the corresponding ZUGFeRD XML file.</p>
              </div>
              {(file || xmlFile) && (
                <button
                  onClick={handleReset}
                  className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1"
                >
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
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-primary h-full transition-all duration-300 ease-out" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-right font-medium text-slate-500">{uploadProgress}% Complete</p>
              </div>
            )}

            <button
              disabled={!file || !xmlFile || loading}
              onClick={handleUpload}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center text-lg group"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 mr-3 animate-spin text-accent" />
                  {uploadProgress < 100 ? 'Uploading Files...' : 'Processing PDF/A-3...'}
                </>
              ) : (
                <>
                  <span>Step 3: Convert PDF to PDF ZUGFeRD</span>
                  <Loader2 className="w-5 h-5 ml-3 opacity-0 group-hover:opacity-100 transition-opacity" />
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
            <div className="bg-white p-8 rounded-3xl shadow-layered border border-slate-100 h-full min-h-[400px]">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <div className="w-2 h-6 bg-accent rounded-full"></div>
                    Document Preview
                 </h3>
                 {(pdfPreview || xmlData) && (
                   <div className="flex bg-slate-100 p-1 rounded-xl">
                     <button
                       onClick={() => setPreviewTab('pdf')}
                       className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${previewTab === 'pdf' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                     >
                       PDF
                     </button>
                     <button
                       onClick={() => setPreviewTab('xml')}
                       className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${previewTab === 'xml' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
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
                   <div className="h-[500px] border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 animate-in fade-in duration-500">
                      <Loader2 className="w-12 h-12 mb-4 opacity-20" />
                      <p className="text-sm font-medium">No PDF selected</p>
                      <p className="text-xs mt-1">Upload a PDF to see a live preview</p>
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
                   <div className="h-[500px] border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 animate-in fade-in duration-500">
                      <Loader2 className="w-12 h-12 mb-4 opacity-20" />
                      <p className="text-sm font-medium">No XML data</p>
                      <p className="text-xs mt-1">Upload a ZUGFeRD XML to preview data</p>
                   </div>
                 )
               )}
            </div>
          </div>
        </div>
      </div>
      
      <footer className="mt-16 text-slate-400 text-sm pb-8">
        © 2026 AS-Soft Business Solutions • Secure Document Archiving
      </footer>
    </div>
  );
}

export default App;
