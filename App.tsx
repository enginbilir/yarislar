import React, { useState, useCallback } from 'react';
import { CompetitionEntry } from './types';
import { processPdf } from './services/geminiService';
import FileUpload from './components/FileUpload';
import { CsvIcon, TxtIcon, RefreshIcon } from './components/IconComponents';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);
  const [processedData, setProcessedData] = useState<CompetitionEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
    } else {
      setError("Lütfen sadece PDF formatında bir dosya seçin.");
      setFile(null);
    }
  };

  const handleProcessFile = async () => {
    if (!file) {
      setError("Lütfen önce bir dosya seçin.");
      return;
    }
    
    setProcessing(true);
    setError(null);
    setProcessedData(null);
    try {
      const data = await processPdf(file);
      if (data && data.length > 0) {
        setProcessedData(data);
      } else {
        setError("PDF dosyasından veri okunamadı. Lütfen dosyanın formatını kontrol edin.");
      }
    } catch (err: any) {
      setError(err.message || "Bilinmeyen bir hata oluştu.");
    } finally {
      setProcessing(false);
    }
  };

  const generateCsvContent = useCallback((): string => {
    if (!processedData) return '';
    return processedData
      .map(entry => `${entry.binici},${entry.kulup},${entry.atinAdi},"${entry.yukseklik}"`)
      .join('\n');
  }, [processedData]);

  const generateTxtContent = useCallback((): string => {
    if (!processedData) return '';
    return processedData
      .map(entry => `${entry.binici} - ${entry.atinAdi} - ${entry.kulup}`)
      .join('\n');
  }, [processedData]);

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const bom = "\uFEFF"; // UTF-8 BOM
    const blob = new Blob([bom + content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setFile(null);
    setProcessedData(null);
    setError(null);
    setProcessing(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-100">
      <div className="w-full max-w-2xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800">Yarış Listesi Dönüştürücü</h1>
          <p className="text-slate-500 mt-2">PDF'den CSV ve TXT'ye kolayca geçin.</p>
        </header>

        <main className="bg-white p-8 rounded-2xl shadow-lg transition-all duration-300">
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
              <p className="font-bold">Hata!</p>
              <p>{error}</p>
            </div>
          )}

          {!processedData ? (
            <div className="space-y-6">
              <FileUpload 
                onFileSelect={handleFileSelect} 
                processing={processing} 
                selectedFile={file} 
              />
              <button
                onClick={handleProcessFile}
                disabled={!file || processing}
                className="w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300"
              >
                {processing ? 'İşleniyor...' : 'Dosyayı İşle'}
              </button>
            </div>
          ) : (
            <div className="text-center space-y-6">
                <div className="p-4 bg-green-50 border-green-200 border rounded-lg">
                    <h2 className="text-2xl font-semibold text-green-800">İşlem Başarılı!</h2>
                    <p className="text-green-600 mt-1">{processedData.length} kayıt başarıyla işlendi.</p>
                </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => downloadFile(generateCsvContent(), 'sonuclar.csv', 'text/csv;charset=utf-8;')}
                  className="flex items-center justify-center w-full bg-emerald-500 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-300"
                >
                  <CsvIcon className="w-5 h-5 mr-2" />
                  CSV İndir
                </button>
                <button
                  onClick={() => downloadFile(generateTxtContent(), 'sonuclar.txt', 'text/plain;charset=utf-8;')}
                  className="flex items-center justify-center w-full bg-sky-500 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all duration-300"
                >
                  <TxtIcon className="w-5 h-5 mr-2" />
                  TXT İndir
                </button>
              </div>
              <button
                onClick={handleReset}
                className="flex items-center justify-center w-full bg-slate-500 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all duration-300"
                >
                  <RefreshIcon className="w-5 h-5 mr-2" />
                  Yeni Dosya Yükle
              </button>
            </div>
          )}
        </main>
        
         <footer className="text-center mt-8 text-slate-400 text-sm">
            <p>&copy; {new Date().getFullYear()} - AI Destekli PDF Dönüştürücü</p>
        </footer>
      </div>
    </div>
  );
};

export default App;