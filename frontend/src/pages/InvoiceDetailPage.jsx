import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getInvoiceById, getInvoiceAnalysis, analyzeInvoice, downloadInvoiceFile } from "../api/invoiceApi";

const RiskBadge = ({ risk }) => {
  if (!risk) return <span className="text-gray-300 text-xs">—</span>;
  const styles = {
    RED: "bg-red-100 text-red-600 border border-red-200",
    AMBER: "bg-amber-100 text-amber-600 border border-amber-200",
    LOW: "bg-green-100 text-green-600 border border-green-200",
  };
  return <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${styles[risk] || "bg-gray-100 text-gray-500"}`}>{risk}</span>;
};

const getRiskFromSimilarity = (sim) => {
  if (sim >= 0.955) return "RED";
  if (sim >= 0.90) return "AMBER";
  return "LOW";
};

const ScoreBar = ({ score }) => {
  const color = score >= 0.955 ? "#ef4444" : score >= 0.90 ? "#f59e0b" : "#22c55e";
  const pct = Math.min(100, Math.max(0, (score || 0) * 100));
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 mt-1 overflow-hidden">
      <div
        className="h-2 rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
};

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const inv = await getInvoiceById(id);
      setInvoice(inv);
      try {
        const anal = await getInvoiceAnalysis(id);
        setAnalysis(anal);
      } catch {
        // Analysis not yet run for this document
        setAnalysis(null);
      }
    } catch (err) {
      setError("Failed to load invoice details from backend.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    setActionSuccess("");
    setError("");
    try {
      const result = await analyzeInvoice(id);
      // Immediately display results
      setAnalysis(result);
      setInvoice((prev) => ({ ...prev, status: "ANALYZED" }));
      setActionSuccess("AI analysis completed successfully! Results updated below.");
      setTimeout(() => setActionSuccess(""), 4000);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Analysis failed.";
      setError(`Analysis error: ${msg}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDownload = async () => {
    try {
      const blob = await downloadInvoiceFile(id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", invoice?.originalFilename || `invoice-${invoice?.documentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      alert("Download failed: " + (err.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-100 rounded animate-pulse" />
        <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error && !invoice) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-600 text-sm">
        {error}
        <button onClick={() => navigate("/invoices")} className="ml-3 text-blue-600 underline font-medium">Return to Invoices</button>
      </div>
    );
  }

  const risk = analysis?.riskLevel;
  const riskColor = risk === "RED" ? "text-red-500" : risk === "AMBER" ? "text-amber-500" : "text-green-500";
  const riskBg = risk === "RED" ? "bg-red-50 border-red-200" : risk === "AMBER" ? "bg-amber-50 border-amber-200" : "bg-green-50 border-green-200";

  return (
    <div className="space-y-5">
      {/* Breadcrumb Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <button onClick={() => navigate("/invoices")} className="hover:text-blue-500">Invoices</button>
            <span>›</span>
            <span className="text-gray-600 font-mono">{invoice.documentId}</span>
            <span>›</span>
            <span>AI Template Intelligence</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <span>Invoice Analysis</span>
            <span className="text-xs font-mono font-normal px-2.5 py-1 bg-gray-100 text-gray-600 rounded">
              ID: {invoice.id}
            </span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunAnalysis}
            disabled={analyzing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-sm font-semibold transition shadow-sm"
          >
            {analyzing ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Analyzing AI Model...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>{analysis ? "Re-run Analysis" : "Run AI Analysis"}</span>
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download File
          </button>
          <button onClick={() => navigate("/invoices")} className="px-3 py-2 border border-gray-200 bg-white text-gray-700 rounded-lg text-sm hover:bg-gray-50">
            ← Back
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Top Banner / Analysis Summary */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-3 flex-1 min-w-[240px]">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-gray-800 text-base font-mono">{invoice.documentId}</p>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded font-semibold border border-blue-100">{invoice.status}</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">🏥 Provider: <strong>{invoice.providerName || "General / Unassigned"}</strong></p>
              <p className="text-xs text-gray-400">Uploaded: {invoice.createdAt ? new Date(invoice.createdAt).toLocaleString() : "—"}</p>
            </div>
          </div>

          {analysis ? (
            <>
              <div className="h-14 w-px bg-gray-100 hidden md:block" />
              <div className={`flex items-center gap-3 px-5 py-3 rounded-xl border ${riskBg}`}>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Risk Level</p>
                  <p className={`text-xl font-extrabold ${riskColor}`}>{analysis.riskLevel}</p>
                </div>
              </div>
              <div className="h-14 w-px bg-gray-100 hidden md:block" />
              <div className="text-center min-w-[100px]">
                <p className="text-xs text-gray-500 font-medium">Fraud Score</p>
                <p className={`text-3xl font-extrabold ${riskColor}`}>{analysis.fraudScore?.toFixed(3)}</p>
              </div>
              <div className="h-14 w-px bg-gray-100 hidden md:block" />
              <div className="text-center min-w-[100px]">
                <p className="text-xs text-gray-500 font-medium">AI Confidence</p>
                <p className="text-3xl font-extrabold text-blue-600">{(analysis.confidence * 100)?.toFixed(1)}%</p>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 px-4 py-3 rounded-xl text-yellow-800 text-xs">
              <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-semibold">Analysis not yet performed</p>
                <p className="text-yellow-600">Click &quot;Run AI Analysis&quot; above to compute template similarity.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Analysis Section */}
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-4">
          {analysis ? (
            <>
              {/* Suspicion Reasons */}
              {analysis.reasons && analysis.reasons.length > 0 && (
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-bold text-gray-800">Template Similarity Explanations & Signals</h3>
                  </div>
                  <ul className="space-y-2 mt-2">
                    {analysis.reasons.map((reason, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-gray-700 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                        <span className="text-red-500 font-bold">•</span>
                        <span className="leading-relaxed">{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Matched Documents */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-800">Top Matched Template Invoices</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Invoices in database with matching structural vectors</p>
                  </div>
                  <span className="text-xs bg-blue-50 text-blue-600 font-semibold px-2 py-1 rounded">
                    {analysis.matchedDocuments?.length || 0} Matches Found
                  </span>
                </div>

                {analysis.matchedDocuments && analysis.matchedDocuments.length > 0 ? (
                  <table className="w-full">
                    <thead>
                      <tr className="text-xs text-gray-400 border-b border-gray-100 pb-2">
                        <th className="text-left pb-2 font-medium">Rank</th>
                        <th className="text-left pb-2 font-medium">Matched Document ID</th>
                        <th className="text-left pb-2 font-medium">Similarity Score</th>
                        <th className="text-left pb-2 font-medium">Risk Signal</th>
                        <th className="text-right pb-2 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {analysis.matchedDocuments.map((m, idx) => {
                        const matchedDocId = m.matchedDocumentId || m.documentId || "UNKNOWN";
                        const docRisk = getRiskFromSimilarity(m.similarity);
                        return (
                          <tr key={idx} className="hover:bg-gray-50 transition">
                            <td className="py-3 text-xs text-gray-400 font-mono">#{idx + 1}</td>
                            <td className="py-3 text-xs font-bold text-blue-600 font-mono">
                              {matchedDocId}
                            </td>
                            <td className="py-3 w-44">
                              <div className="flex items-center justify-between text-xs font-mono font-bold">
                                <span>{(m.similarity * 100).toFixed(1)}%</span>
                                <span className="text-[11px] text-gray-400 font-normal">({m.similarity?.toFixed(3)})</span>
                              </div>
                              <ScoreBar score={m.similarity} />
                            </td>
                            <td className="py-3">
                              <RiskBadge risk={docRisk} />
                            </td>
                            <td className="py-3 text-right">
                              {m.matchedInvoiceId ? (
                                <button
                                  onClick={() => navigate(`/invoices/${m.matchedInvoiceId}`)}
                                  className="text-xs text-blue-600 hover:underline font-medium"
                                >
                                  Inspect →
                                </button>
                              ) : (
                                <span className="text-xs text-gray-400">Template Vector</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-8 text-center text-gray-400 text-xs bg-gray-50 rounded-lg">
                    No similar template reuse matches detected above similarity threshold.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl p-10 shadow-sm border border-gray-100 text-center">
              <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-800">Ready to Analyze</h3>
              <p className="text-gray-400 text-xs mt-1 max-w-sm mx-auto">
                Trigger our multi-modal AI intelligence engine to compute template layout similarities and detect possible fraud.
              </p>
              <button
                onClick={handleRunAnalysis}
                disabled={analyzing}
                className="mt-4 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition shadow-sm"
              >
                {analyzing ? "Analyzing..." : "Analyze Document Now"}
              </button>
            </div>
          )}
        </div>

        {/* Right Info Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Invoice Details</h3>
            <div className="space-y-2.5 text-xs">
              {[
                { label: "Document ID", value: invoice.documentId, isMono: true },
                { label: "Original Filename", value: invoice.originalFilename },
                { label: "File Size", value: invoice.fileSize ? `${(invoice.fileSize / 1024).toFixed(1)} KB` : "—" },
                { label: "Content Type", value: invoice.contentType },
                { label: "Status", value: invoice.status },
                { label: "Provider", value: invoice.providerName || "General" },
                { label: "Uploaded By User", value: `#${invoice.uploadedById}` },
                { label: "Created At", value: invoice.createdAt ? new Date(invoice.createdAt).toLocaleString() : "—" },
              ].map((item) => (
                <div key={item.label} className="flex items-start justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-400">{item.label}</span>
                  <span className={`text-gray-700 font-medium text-right max-w-[55%] break-all ${item.isMono ? "font-mono text-blue-600" : ""}`}>
                    {item.value || "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Detection Thresholds</h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-red-50 text-red-700">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="font-semibold">RED (High Risk)</span>
                </div>
                <span className="font-mono font-bold">≥ 0.955</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-amber-50 text-amber-700">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="font-semibold">AMBER (Suspicious)</span>
                </div>
                <span className="font-mono font-bold">0.90 – 0.955</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-green-50 text-green-700">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span className="font-semibold">LOW (Standard)</span>
                </div>
                <span className="font-mono font-bold">&lt; 0.90</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}