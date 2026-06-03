import React, { useState } from 'react';
import axios from 'axios';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from './lib/utils';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [xmlFile, setXmlFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus('idle');
      setMessage('');
    }
  };

  const handleXmlFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setXmlFile(e.target.files[0]);
      setStatus('idle');
      setMessage('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setStatus('idle');
    const formData = new FormData();
    formData.append('file', file);
    if (xmlFile) {
      formData.append('xmlFile', xmlFile);
    }

    try {
      const response = await axios.post('/api/v1/convert', formData, {
        responseType: 'blob',
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
          } catch (e) {
            setMessage('Failed to convert PDF. Please try again.');
          }
        };
        reader.readAsText(err.response.data);
      } else {
        setMessage(err.response?.data?.message || 'Failed to convert PDF. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">PDF to PDF/A-3 (ZUGFeRD)</h1>
          <p className="text-gray-600">Upload both PDF and XML files to create a ZUGFeRD-compliant invoice.</p>
        </div>

        <div className="space-y-6">
          <label
            htmlFor="file-upload"
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer block",
              file ? "border-primary bg-primary/5" : "border-gray-300 hover:border-primary"
            )}
          >
            <input
              id="file-upload"
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileChange}
            />
            {file ? (
              <div className="flex flex-col items-center">
                <FileText className="w-12 h-12 text-primary mb-2" />
                <span className="text-sm font-medium text-gray-900">{file.name}</span>
                <span className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="w-12 h-12 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-900">Step 1: Upload PDF</span>
                <span className="text-xs text-gray-500">Only PDF files are supported</span>
              </div>
            )}
          </label>

          <label
            htmlFor="xml-upload"
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer block",
              xmlFile ? "border-primary bg-primary/5" : "border-gray-300 hover:border-primary"
            )}
          >
            <input
              id="xml-upload"
              type="file"
              accept=".xml"
              className="hidden"
              onChange={handleXmlFileChange}
            />
            {xmlFile ? (
              <div className="flex flex-col items-center">
                <FileText className="w-12 h-12 text-primary mb-2" />
                <span className="text-sm font-medium text-gray-900">{xmlFile.name}</span>
                <span className="text-xs text-gray-500">{(xmlFile.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="w-12 h-12 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-900">Step 2: Upload ZUGFeRD XML</span>
                <span className="text-xs text-gray-500">Only XML files are supported</span>
              </div>
            )}
          </label>

          <button
            disabled={!file || !xmlFile || loading}
            onClick={handleUpload}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Converting...
              </>
            ) : (
              'Convert PDF & XML'
            )}
          </button>

          {status !== 'idle' && (
            <div
              className={cn(
                "p-4 rounded-lg flex items-start",
                status === 'success' ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              )}
            >
              {status === 'success' ? (
                <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
              )}
              <span className="text-sm font-medium">{message}</span>
            </div>
          )}
        </div>
      </div>
      
      <footer className="mt-8 text-gray-400 text-sm">
        AS-Soft Business Solutions
      </footer>
    </div>
  );
}

export default App;
