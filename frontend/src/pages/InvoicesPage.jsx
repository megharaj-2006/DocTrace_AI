import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getInvoices, uploadInvoice, analyzeInvoice, searchInvoices } from "../api/invoiceApi";

const RiskBadge = ({ risk }) => {
  if (!risk) return <span className="text-gray-300 text-xs">—</span>;
  const styles = {
    RED: "bg-red-100 text-red-600 border border-red-200",
    AMBER: "bg-amber-100 text-amber-600 border border-amber-200",
    LOW: "bg-green-100 text-green-600 border border-green-200",
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${styles[risk] || "bg-gray-100 text-gray-500"}`}>{risk}</span>;
};

const StatusBadge = ({ status }) => {
  const styles = {
    ANALYZED: "bg-green-50 text-green-600 border border-green-200",
    ANALYZING: "bg-purple-50 text-purple-600 border border-purple-200 animate-pulse",
    UPLOADED: "bg-blue-50 text-blue-600 border border-blue-200",
    PROCESSED: "bg-green-50 text-green-600",
    PENDING: "bg-yellow-50 text-yellow-600",
    FAILED: "bg-red-50 text-red-500 border border-red-200",
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[status?.toUpperCase()] || "bg-gray-100 text-gray-500"}`}>{status}</span>;
};

export default function InvoicesPage() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [documentId, setDocumentId] = useState("");
  const [provider, setProvider] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [analyzingId, setAnalyzingId] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      let data;
      if (search.trim()) {
        data = await searchInvoices(search.trim(), page, 10);
      } else {
        data = await getInvoices(page, 10);
      }
      
      if (Array.isArray(data)) {
        setInvoices(data);
        setTotalPages(1);
        setTotalElements(data.length);
      } else {
        setInvoices(data.content || data.invoices || []);
        setTotalPages(data.totalPages || 1);
        setTotalElements(data.totalElements || (data.content?.length || 0));
      }
    } catch (err) {
      setError("Failed to load invoices from backend.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInvoices();
    }, 250);
    return () => clearTimeout(timer);
  }, [page, search]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      if (!documentId) {
        setDocumentId("INV-" + Math.random().toString(36).substring(2, 9).toUpperCase());
      }
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (!documentId) {
        setDocumentId("INV-" + Math.random().toString(36).substring(2, 9).toUpperCase());
      }
    }
  };

  // Upload and immediately trigger AI analysis
  const handleUploadAndAnalyze = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadError("");
    setUploadSuccess("");
    setUploadStep("Step 1/3: Storing invoice file...");

    try {
      // 1. Upload file
      const uploaded = await uploadInvoice(selectedFile, documentId, provider);
      const invoiceId = uploaded.id;

      setUploadStep("Step 2/3: Running AI template similarity analysis...");
      
      // 2. Trigger AI analysis immediately
      try {
        const analysisResult = await analyzeInvoice(invoiceId);
        setUploadStep("Step 3/3: Complete! Redirecting to results...");
        setUploadSuccess(`Analysis complete! Risk Level: ${analysisResult.riskLevel}, Fraud Score: ${analysisResult.fraudScore?.toFixed(3)}`);
        
        // Short pause to display success, then open analysis detail immediately
        setTimeout(() => {
          navigate(`/invoices/${invoiceId}`);
        }, 900);
      } catch (analErr) {
        console.error("Analysis failed after upload", analErr);
        setUploadError("Invoice uploaded, but AI analysis failed: " + (analErr.response?.data?.message || analErr.message));
        fetchInvoices();
      }

      setSelectedFile(null);
      setDocumentId("");
      setProvider("");
    } catch (err) {
      const msg = err.response?.data?.message || "Upload failed. Please check backend connection.";
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  };

  // Manual Trigger for existing unanalyzed invoice
  const handleRunAnalysis = async (e, id) => {
    e.stopPropagation();
    setAnalyzingId(id);
    try {
      await analyzeInvoice(id);
      await fetchInvoices();
      navigate(`/invoices/${id}`);
    } catch (err) {
      alert("Analysis failed: " + (err.response?.data?.message || err.message));
    } finally {
      setAnalyzingId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Invoices</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage, upload and analyze medical invoices for template reuse</p>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          {showUpload ? "Close Upload" : "Upload & Analyze"}
        </button>
      </div>

      {/* Success banner */}
      {uploadSuccess && (
        <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
          <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-semibold">{uploadSuccess}</p>
            <p className="text-xs text-green-600">Opening full analysis view...</p>
          </div>
        </div>
      )}

      {/* Upload Panel */}
      {showUpload && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-800">Upload & Analyze Medical Invoice</h3>
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">AI Pipeline: Upload → Feature Extraction → Qdrant Match → Fraud Risk</span>
          </div>

          {uploadError && (
            <div className="mb-4 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{uploadError}</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-4">
              {/* Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition cursor-pointer ${
                  dragOver ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-400 bg-gray-50/50"
                }`}
                onClick={() => document.getElementById("fileInput").click()}
              >
                <svg className="w-10 h-10 text-blue-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {selectedFile ? (
                  <div>
                    <p className="text-blue-600 font-semibold text-sm">{selectedFile.name}</p>
                    <p className="text-gray-400 text-xs mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready to analyze</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-700 font-medium text-sm">Drag & drop your medical invoice here</p>
                    <p className="text-gray-400 text-xs mt-1">or click to browse files</p>
                    <p className="text-gray-400 text-[11px] mt-2">Supported: PDF, PNG, JPG, JPEG (Max 20MB)</p>
                  </div>
                )}
                <input id="fileInput" type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileInput} />
              </div>

              {/* Document ID + Provider Optional Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Document Identifier (Auto-generated if blank)</label>
                  <input
                    type="text"
                    value={documentId}
                    onChange={(e) => setDocumentId(e.target.value)}
                    placeholder="e.g. INV-2026-0001"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Provider / Hospital Name (Optional)</label>
                  <input
                    type="text"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    placeholder="e.g. Apollo Hospitals"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                onClick={handleUploadAndAnalyze}
                disabled={uploading || !selectedFile}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-3 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 shadow-sm"
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>{uploadStep}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Upload & Trigger AI Analysis Now</span>
                  </>
                )}
              </button>
            </div>

            {/* AI Analysis Workflow Preview */}
            <div className="bg-gray-50 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">AI Intelligence Pipeline</h4>
                <div className="space-y-2.5 text-xs text-gray-600">
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold mt-0.5">1</span>
                    <span><strong>Preprocessing:</strong> Document rendering, OCR bounding box filtering and layout tokenization.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold mt-0.5">2</span>
                    <span><strong>Embedding:</strong> Visual & spatial template vector generation.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold mt-0.5">3</span>
                    <span><strong>Vector Search:</strong> Qdrant similarity lookup across historical invoices.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold mt-0.5">4</span>
                    <span><strong>Risk Scoring:</strong> Fraud score calculation & explanation generation.</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-gray-400 mt-4 border-t border-gray-200 pt-2">Results will immediately display right after analysis.</p>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search invoices by document ID, provider, or patient name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {error && (
          <div className="px-5 py-3 bg-red-50 text-red-600 text-sm">{error}</div>
        )}
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr className="text-xs text-gray-400">
              <th className="text-left px-5 py-3 font-medium">Document ID</th>
              <th className="text-left px-5 py-3 font-medium">Provider</th>
              <th className="text-left px-5 py-3 font-medium">Created Date</th>
              <th className="text-left px-5 py-3 font-medium">Status</th>
              <th className="text-left px-5 py-3 font-medium">File Name</th>
              <th className="text-right px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  {[...Array(6)].map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-3 bg-gray-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-gray-400 text-sm">
                  No invoices found. Click <strong>Upload & Analyze</strong> to submit your first invoice document.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="hover:bg-gray-50 cursor-pointer transition"
                  onClick={() => navigate(`/invoices/${inv.id}`)}
                >
                  <td className="px-5 py-3.5 text-blue-600 font-semibold text-xs font-mono">
                    {inv.documentId}
                  </td>
                  <td className="px-5 py-3.5 text-gray-700 text-xs font-medium">
                    {inv.providerName || "General / Unassigned"}
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs">
                    {inv.createdAt ? new Date(inv.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs truncate max-w-[180px]">
                    {inv.originalFilename}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      {(inv.status === "UPLOADED" || inv.status === "FAILED") && (
                        <button
                          disabled={analyzingId === inv.id}
                          onClick={(e) => handleRunAnalysis(e, inv.id)}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded text-xs font-medium transition flex items-center gap-1"
                        >
                          {analyzingId === inv.id ? (
                            <>
                              <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              <span>Analyzing...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              <span>Analyze</span>
                            </>
                          )}
                        </button>
                      )}
                      <button
                        className="px-2 py-1 text-gray-500 hover:text-blue-600 text-xs font-medium hover:bg-gray-100 rounded transition"
                        onClick={() => navigate(`/invoices/${inv.id}`)}
                      >
                        View Details →
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {loading ? "Loading..." : `Showing ${invoices.length} of ${totalElements} invoices`}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="w-7 h-7 rounded text-xs font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-40"
            >
              ‹
            </button>
            {[...Array(Math.min(totalPages, 5))].map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`w-7 h-7 rounded text-xs font-medium ${i === page ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="w-7 h-7 rounded text-xs font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-40"
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}