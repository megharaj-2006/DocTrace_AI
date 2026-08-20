import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import { uploadInvoice, analyzeInvoice, getInvoices } from "../api/invoiceApi";
import { getProviders } from "../api/providerApi";

const uploadGuidelines = [
  "Supported formats: PDF, JPG, JPEG, PNG",
  "Maximum file size: 20 MB",
  "Ensure document is clear, flat, and not password-protected",
  "Medical invoices only (bills, receipts, discharge summaries)",
  "AI will automatically extract layout, OCR text, and structural fingerprints",
];

export default function UploadAnalyzePage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [recentUploads, setRecentUploads] = useState([]);
  const [providers, setProviders] = useState([]);
  
  // Pipeline status states
  const [statusStep, setStatusStep] = useState(null); // 'UPLOADING' | 'ANALYZING' | 'SUCCESS' | null
  const [error, setError] = useState("");
  const [resultInvoiceId, setResultInvoiceId] = useState(null);

  const loadData = async () => {
    try {
      const [invRes, provRes] = await Promise.allSettled([
        getInvoices(0, 5),
        getProviders(),
      ]);
      if (invRes.status === "fulfilled" && invRes.value?.content) {
        setRecentUploads(invRes.value.content);
      }
      if (provRes.status === "fulfilled" && Array.isArray(provRes.value)) {
        setProviders(provRes.value);
      }
    } catch {
      // Non-critical fallback
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setError("");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setError("");
    }
  };

  const handleUploadAndAnalyze = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Please select a medical invoice file to upload.");
      return;
    }

    setError("");
    setStatusStep("UPLOADING");

    try {
      // 1. Upload invoice
      const invoiceData = await uploadInvoice(selectedFile);
      const invoiceId = invoiceData.id || invoiceData.data?.id;

      if (!invoiceId) {
        throw new Error("Failed to receive invoice identifier from storage service.");
      }

      setResultInvoiceId(invoiceId);
      setStatusStep("ANALYZING");

      // 2. Trigger AI analysis
      await analyzeInvoice(invoiceId);

      setStatusStep("SUCCESS");
      setTimeout(() => {
        navigate(`/invoices/${invoiceId}`);
      }, 1000);

    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || "Upload and analysis failed.";
      setError(msg);
      setStatusStep(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Upload & Analyze Document</h1>
        <p className="text-sm text-slate-500 mt-1">
          Submit medical claim documents for automated AI template extraction, structural fingerprinting, and fraud detection.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="font-semibold cursor-pointer">✕</button>
        </div>
      )}

      {statusStep && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-xs flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          <div>
            <p className="font-bold">
              {statusStep === "UPLOADING"
                ? "Step 1/2: Storing invoice binary in durable repository..."
                : statusStep === "ANALYZING"
                ? "Step 2/2: Executing AI Pipeline (OCR, Layout Analysis, DINOv2 768-D & Qdrant Search)..."
                : "Analysis Complete! Redirecting to inspection report..."}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Drag & Drop Upload Zone */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs">
            <form onSubmit={handleUploadAndAnalyze}>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition ${
                  isDragging
                    ? "border-blue-500 bg-blue-50/50"
                    : selectedFile
                    ? "border-emerald-400 bg-emerald-50/20"
                    : "border-slate-300 hover:border-blue-400 bg-slate-50/50"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                />

                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>

                {selectedFile ? (
                  <div>
                    <p className="text-sm font-bold text-slate-800">{selectedFile.name}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type || "Document"}
                    </p>
                    <p className="text-xs text-emerald-600 font-semibold mt-2">
                      ✓ File selected and ready for analysis
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-bold text-slate-700">
                      Drag & Drop invoice here or <span className="text-blue-600 underline">Browse Files</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Supports PDF, JPG, PNG up to 20 MB
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-5 flex items-center justify-end gap-3">
                {selectedFile && (
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                  >
                    Clear Selection
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!selectedFile || !!statusStep}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-2 transition cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {statusStep ? "Processing Pipeline..." : "Upload & Run Analysis"}
                </button>
              </div>
            </form>
          </div>

          {/* Recent Uploads Table */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-800">Your Recent Invoices</h2>
              <button
                onClick={() => navigate("/invoices")}
                className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                View All →
              </button>
            </div>

            {recentUploads.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-medium">
                      <th className="pb-2">Document ID</th>
                      <th className="pb-2">Filename</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentUploads.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/60">
                        <td className="py-2.5 font-mono font-medium text-slate-800">{inv.documentId}</td>
                        <td className="py-2.5 text-slate-600 truncate max-w-[160px]">{inv.originalFilename}</td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            inv.status === "ANALYZED" ? "bg-emerald-50 text-emerald-700" :
                            inv.status === "ANALYZING" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-700"
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => navigate(`/invoices/${inv.id}`)}
                            className="text-blue-600 hover:underline font-semibold cursor-pointer"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                No previous uploads found for your account.
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Guidelines & System Information */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Upload Guidelines
            </h3>
            <ul className="space-y-2 text-xs text-slate-600">
              {uploadGuidelines.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-white mb-2">AI Detection Intelligence</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              DocTrace AI extracts content-invariant visual embeddings (DINOv2 ViT-B/14) and 128-dimensional spatial occupancy grids to identify structural template clones across different healthcare providers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
