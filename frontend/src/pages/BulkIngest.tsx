import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { UploadCloud, FileSpreadsheet, CheckCircle, AlertTriangle } from 'lucide-react';

const BulkIngest = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Mock data for preview
  const [previewData, setPreviewData] = useState<any[]>([]);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelection = (selectedFile: File) => {
    setFile(selectedFile);
    // Mock parsing the CSV for preview
    setPreviewData([
      { id: 1, title: 'Water leakage in Ward 4', district: 'Ranchi', status: 'Valid' },
      { id: 2, title: 'Broken streetlights on Main Rd', district: 'Ranchi', status: 'Valid' },
      { id: 3, title: 'Garbage dump near school', district: 'Bokaro', status: 'Missing Data' },
    ]);
  };

  const handleUpload = () => {
    setUploading(true);
    // Mock API call since bulk ingest API isn't explicitly defined yet
    setTimeout(() => {
      setUploading(false);
      setSuccess(true);
    }, 2000);
  };

  return (
    <div className="flex h-screen w-screen bg-[#f3f6f4] font-sans text-gray-900">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-y-auto relative">
        <header className="flex items-center justify-between px-10 py-8 bg-white border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 m-0">Bulk Ingestion Portal</h2>
            <p className="text-sm text-gray-500 mt-1">Upload CSV/Excel templates to batch process civic issues.</p>
          </div>
          <span className="px-3 py-1 bg-red-100 text-red-700 font-bold text-xs uppercase rounded">
            Govt / Admin Only
          </span>
        </header>

        <div className="p-10 max-w-5xl mx-auto w-full">
          {success ? (
            <div className="bg-white p-10 rounded-2xl border border-green-200 shadow-sm text-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Batch Processed Successfully!</h2>
              <p className="text-gray-600 mb-6">2 records were submitted to AI for classification.</p>
              <button onClick={() => { setSuccess(false); setFile(null); setPreviewData([]); }} className="px-6 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-hover">
                Upload Another File
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                
                {/* Upload Area */}
                <div 
                  className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors cursor-pointer ${file ? 'bg-teal-50 border-primary/50' : 'bg-white border-gray-300 hover:bg-gray-50'}`}
                  onDragOver={e => e.preventDefault()}
                  onDrop={handleFileDrop}
                  onClick={() => document.getElementById('fileUpload')?.click()}
                >
                  <input type="file" id="fileUpload" className="hidden" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={e => e.target.files && handleFileSelection(e.target.files[0])} />
                  
                  {file ? (
                    <>
                      <FileSpreadsheet size={48} className="mx-auto text-primary mb-4" />
                      <p className="font-bold text-primary mb-1">{file.name}</p>
                      <p className="text-sm text-primary/70">{(file.size / 1024).toFixed(2)} KB • Ready for processing</p>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={48} className="mx-auto text-gray-400 mb-4" />
                      <p className="font-bold text-gray-700 mb-1">Drag and drop your CSV/Excel file here</p>
                      <p className="text-sm text-gray-500">or click to browse from your computer</p>
                    </>
                  )}
                </div>

                {/* Data Preview */}
                {previewData.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <h3 className="font-bold text-gray-900">Data Preview</h3>
                      <span className="text-xs text-gray-500 font-medium">Showing first 3 rows</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-white border-b border-gray-100">
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Title</th>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">District</th>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Validation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {previewData.map(row => (
                            <tr key={row.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.title}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{row.district}</td>
                              <td className="px-6 py-4 text-sm">
                                {row.status === 'Valid' ? (
                                  <span className="text-green-600 font-bold bg-green-50 px-2.5 py-1 rounded">Valid</span>
                                ) : (
                                  <span className="text-red-600 font-bold bg-red-50 px-2.5 py-1 rounded flex items-center gap-1 w-max"><AlertTriangle size={14}/> {row.status}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Sidebar */}
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-4">Instructions</h3>
                  <ul className="text-sm text-gray-600 space-y-3 mb-6">
                    <li>1. Download the standard CSV template.</li>
                    <li>2. Fill in the problem descriptions and locations.</li>
                    <li>3. Upload the file to preview the data.</li>
                    <li>4. Submit to automatically route all entries through AI classification.</li>
                  </ul>
                  <button className="w-full py-2.5 px-4 text-sm font-bold text-primary bg-teal-50 border border-primary/20 rounded-xl hover:bg-teal-100 transition-colors">
                    Download Template
                  </button>
                </div>

                <button 
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className="w-full py-4 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors shadow-sm"
                >
                  {uploading ? 'Processing Batch...' : 'Process & Submit'}
                </button>
              </div>

            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default BulkIngest;
