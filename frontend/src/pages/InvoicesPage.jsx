import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getInvoices, uploadInvoice, analyzeInvoice } from "../api/invoiceApi";

const RiskBadge = ({ risk }) => {
  if (!risk) return null;
  const styles = {
    RED: "bg-red-100 text-red-600 border border-red-200",
    AMBER: "bg-amber-100 text-amber-600 border border-amber-200",
    LOW: "bg-green-100 text-green-600 border border-green-200",
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${styles[risk]}`}>{risk}</span>;
};

const StatusBadge = ({ status }) => {
  const styles = {
    ANALYZED: "bg-blue-50 text-blue-600",
    ANALYZING: "bg-purple-50 text-purple-600",
    UPLOADED: "bg-gray-100 text-gray-500",
    PROCESSED: "bg-green-50 text-green-600",
    PENDING: "bg-yellow-50 text-yellow-600",
    FAILED: "bg-red-50 text-red-500",
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
  const [selectedFile, setSelectedFile] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const data = await getInvoices(page, 10);
      // handle both paginated and array responses
      if (Array.isArray(data)) {
        setInvoices(data);
        setTotalPages(1);
      } else {
        setInvoices(data.content || data.invoices || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      setError("Failed to load invoices.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [page]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) setSelectedFile(file);
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadError("");
    setUploadSuccess("");

    try {
      const invoice = await uploadInvoice(selectedFile);
      await analyzeInvoice(invoice.id);
      setUploadSuccess("Invoice uploaded and analyzed successfully.");
      setSelectedFile(null);
      setShowUpload(false);
      fetchInvoices(); // refresh list
    } catch (err) {
      const msg = err.response?.data?.message || "Upload failed. Please try again.";
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  };

  const filtered = invoices.filter(
    (inv) =>
      (inv.documentId || inv.docId || "").toLowerCase().includes(search.toLowerCase()) ||
      (inv.providerName || inv.provider || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Invoices</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage and analyze medical invoices</p>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Upload & Analyze
        </button>
      </div>

      {/* Success message */}
      {uploadSuccess && (
        <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {uploadSuccess}
        </div>
      )}

      {/* Upload Panel */}
      {showUpload && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Upload Document</h3>
          {uploadError && (
            <div className="mb-3 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {uploadError}
            </div>
          )}
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-4">
              {/* Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                className={`border-2 border-dashed rounded-xl p-10 text-center transition cursor-pointer ${
                  dragOver ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-400"
                }`}
                onClick={() => document.getElementById("fileInput").click()}
              >
                <svg className="w-12 h-12 text-blue-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {selectedFile ? (
                  <div>
                    <p className="text-blue-600 font-semibold">{selectedFile.name}</p>
                    <p className="text-gray-400 text-sm mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-700 font-medium">Drag & drop your file here</p>
                    <p className="text-gray-400 text-sm mt-1">or</p>
                    <button className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition">
                      Browse Files
                    </button>
                    <p className="text-gray-400 text-xs mt-3">Supported: PDF, JPG, PNG (Max 20MB)</p>
                  </div>
                )}
                <input id="fileInput" type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileInput} />
              </div>

              <p className="text-xs text-gray-400">A document ID is generated automatically. Provider details can be added during investigation.</p>

              <button
                onClick={handleUpload}
                disabled={uploading || !selectedFile}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-2.5 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Uploading...
                  </>
                ) : "Upload & Analyze Document"}
              </button>
            </div>

            {/* Guidelines */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Upload Guidelines</h4>
              {[
                "Clear and readable documents",
                "All pages should be visible",
                "Supported formats: PDF, JPG, PNG",
                "Maximum file size: 20 MB",
                "Not password protected",
                "High-quality scans preferred",
              ].map((g) => (
                <div key={g} className="flex items-start gap-2 mb-2">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs text-gray-600">{g}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search invoices by ID or provider..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {error && (
          <div className="px-5 py-3 bg-red-50 text-red-600 text-sm">{error}</div>
        )}
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr className="text-xs text-gray-400">
              <th className="text-left px-5 py-3 font-medium">Document ID</th>
              <th className="text-left px-5 py-3 font-medium">Provider</th>
              <th className="text-left px-5 py-3 font-medium">Upload Date</th>
              <th className="text-left px-5 py-3 font-medium">Status</th>
              <th className="text-left px-5 py-3 font-medium">Risk Level</th>
              <th className="text-left px-5 py-3 font-medium">Score</th>
              <th className="text-left px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  {[...Array(7)].map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-3 bg-gray-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-gray-400 text-sm">
                  No invoices found. Upload your first invoice to get started.
                </td>
              </tr>
            ) : (
              filtered.map((inv) => (
                <tr
                  key={inv.id}
                  className="hover:bg-gray-50 cursor-pointer transition"
                  onClick={() => navigate(`/invoices/${inv.id}`)}
                >
                  <td className="px-5 py-3.5 text-blue-600 font-medium text-xs">
                    {inv.documentId || inv.docId}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 text-xs">
                    {inv.providerName || inv.provider}
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs">
                    {inv.uploadedAt ? new Date(inv.uploadedAt).toLocaleString() : inv.date}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="px-5 py-3.5">
                    <RiskBadge risk={inv.riskLevel || inv.risk} />
                  </td>
                  <td className="px-5 py-3.5 text-gray-700 text-xs font-mono">
                    {inv.fraudScore ?? inv.score ?? "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      className="text-gray-400 hover:text-blue-500 transition"
                      onClick={(e) => { e.stopPropagation(); navigate(`/invoices/${inv.id}`); }}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {loading ? "Loading..." : `Showing ${filtered.length} invoices`}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="w-7 h-7 rounded text-xs font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-40"
            >
              ‹
            </button>
            {[...Array(totalPages)].map((_, i) => (
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
              disabled={page === totalPages - 1}
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
