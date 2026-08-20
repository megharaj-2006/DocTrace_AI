import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getInvoiceById, getInvoiceAnalysis, getInvoiceAnalysisHistory, analyzeInvoice } from "../api/invoiceApi";

const RiskBadge = ({ risk }) => {
  if (!risk) return null;
  const styles = {
    RED: "bg-red-100 text-red-600 border border-red-200",
    AMBER: "bg-amber-100 text-amber-600 border border-amber-200",
    LOW: "bg-green-100 text-green-600 border border-green-200",
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${styles[risk] || "bg-gray-100 text-gray-500"}`}>{risk}</span>;
};

const ScoreBar = ({ score }) => {
  const color = score >= 0.955 ? "#ef4444" : score >= 0.90 ? "#f59e0b" : "#22c55e";
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
      <div className="h-1.5 rounded-full" style={{ width: `${score * 100}%`, backgroundColor: color }} />
    </div>
  );
};

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [isHistoricalAnalysis, setIsHistoricalAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const inv = await getInvoiceById(id);
        setInvoice(inv);
        // Try to get analysis — may not exist yet
        try {
          const anal = await getInvoiceAnalysis(id);
          setAnalysis(anal);
          setIsHistoricalAnalysis(false);
        } catch {
          // Try to get history if latest analysis doesn't exist
          try {
            const history = await getInvoiceAnalysisHistory(id);
            if (history && history.length > 0) {
              // Show the most recent analysis from history
              setAnalysis(history[0]);
              setIsHistoricalAnalysis(true);
            } else {
              setAnalysis(null);
              setIsHistoricalAnalysis(false);
              setAnalysisError("No AI analysis available for this document.");
            }
          } catch {
            setAnalysis(null);
            setIsHistoricalAnalysis(false);
            setAnalysisError("No AI analysis available for this document.");
          }
        }
      } catch (err) {
        setError("Failed to load invoice details.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const result = await analyzeInvoice(id);
      setAnalysis(result);
      setAnalysisError("");
    } catch (err) {
      setAnalysisError("Failed to analyze document. Please try again.");
      console.error(err);
    } finally {
      setAnalyzing(false);
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

  if (error || !invoice) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-600 text-sm">
        {error || "Invoice not found."}
        <button onClick={() => navigate("/invoices")} className="ml-3 text-blue-600 underline">Go back</button>
      </div>
    );
  }

  const risk = analysis?.riskLevel || invoice.riskLevel;
  const riskColor = risk === "RED" ? "text-red-500" : risk === "AMBER" ? "text-amber-500" : "text-green-500";
  const riskBg = risk === "RED" ? "bg-red-50" : risk === "AMBER" ? "bg-amber-50" : "bg-green-50";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <button onClick={() => navigate("/invoices")} className="hover:text-blue-500">Invoices</button>
            <span>›</span>
            <span className="text-gray-600">{invoice.documentId}</span>
            <span>›</span>
            <span>Details</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Invoice Detail</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Report
          </button>
          <button onClick={() => navigate("/invoices")} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
            ← Back
          </button>
        </div>
      </div>

      {/* Doc Summary */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-7 h-7 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-800 text-sm">{invoice.documentId}</p>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded font-medium">{invoice.status}</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">🏥 {invoice.providerName || "—"}</p>
              <p className="text-xs text-gray-400">{invoice.createdAt ? new Date(invoice.createdAt).toLocaleString() : "—"}</p>
            </div>
          </div>

          {analysis && (
            <>
              <div className="h-14 w-px bg-gray-100" />
              <div className={`flex items-center gap-3 px-5 py-3 rounded-xl ${riskBg}`}>
                <div>
                  <p className="text-xs text-gray-500">Risk Level</p>
                  <p className={`text-lg font-bold ${riskColor}`}>{risk}</p>
                </div>
              </div>
              <div className="h-14 w-px bg-gray-100" />
              <div className="text-center">
                <p className="text-xs text-gray-500">Fraud Score</p>
                <p className={`text-3xl font-bold ${riskColor}`}>{analysis.fraudScore?.toFixed(3)}</p>
              </div>
              <div className="h-14 w-px bg-gray-100" />
              <div className="text-center">
                <p className="text-xs text-gray-500">Confidence</p>
                <p className="text-3xl font-bold text-blue-500">{analysis.confidence?.toFixed(3)}</p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          {/* Analysis Results */}
          {analysis ? (
            <>
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-800">AI Analysis Result</h3>
                      {isHistoricalAnalysis && (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-xs rounded font-medium">Previous</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Analyzed {analysis.analyzedAt ? new Date(analysis.analyzedAt).toLocaleString() : "just now"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <RiskBadge risk={risk} />
                    {isHistoricalAnalysis && (
                      <button
                        onClick={handleAnalyze}
                        disabled={analyzing}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {analyzing ? "Analyzing..." : "Re-analyze"}
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-400">Fraud score</p>
                    <p className={`mt-1 text-xl font-bold ${riskColor}`}>{(analysis.fraudScore * 100).toFixed(1)}%</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-400">Confidence</p>
                    <p className="mt-1 text-xl font-bold text-blue-500">{(analysis.confidence * 100).toFixed(1)}%</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-400">Similar documents</p>
                    <p className="mt-1 text-xl font-bold text-gray-800">{analysis.matchedDocuments?.length || 0}</p>
                  </div>
                </div>
              </div>

              {/* Reasons */}
              {analysis.reasons?.length > 0 && (
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-800">Reasons</h3>
                  </div>
                  <ul className="space-y-2">
                    {analysis.reasons.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-gray-400 mt-0.5">•</span>{r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Matched Documents */}
              {analysis.matchedDocuments?.length > 0 && (
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-800 mb-4">Top Matched Documents</h3>
                  <table className="w-full">
                    <thead>
                      <tr className="text-xs text-gray-400 border-b border-gray-100">
                        <th className="text-left pb-2 font-medium">Rank</th>
                        <th className="text-left pb-2 font-medium">Document ID</th>
                        <th className="text-left pb-2 font-medium">Similarity</th>
                        <th className="text-left pb-2 font-medium">Risk</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {analysis.matchedDocuments.map((m, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="py-3 text-xs text-gray-500">{i + 1}</td>
                          <td className="py-3 text-xs text-blue-600 font-medium">{m.matchedDocumentId || m.documentId}</td>
                          <td className="py-3 w-40">
                            <span className={`text-xs font-bold ${m.similarity >= 0.955 ? "text-red-500" : m.similarity >= 0.90 ? "text-amber-500" : "text-green-500"}`}>
                              {m.similarity?.toFixed(3)}
                            </span>
                            <ScoreBar score={m.similarity} />
                          </td>
                          <td className="py-3"><RiskBadge risk={m.riskLevel || (m.similarity >= 0.955 ? "RED" : m.similarity >= 0.90 ? "AMBER" : "LOW")} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12a9 9 0 11-18 0 9 9 0 0118 0m-9 5a4 4 0 100-8 4 4 0 000 8z" />
              </svg>
              <p className="text-gray-500 font-medium text-sm">Ready for AI Analysis</p>
              <p className="text-gray-400 text-xs mt-2 max-w-sm mx-auto">This document has been uploaded but hasn't been analyzed yet. Click the button below to run AI analysis and get fraud detection results.</p>
              {analysisError && <p className="mt-2 text-xs text-amber-600">{analysisError}</p>}
              <button 
                onClick={handleAnalyze}
                disabled={analyzing}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {analyzing ? "Analyzing..." : "Start Analysis"}
              </button>
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Document Details</h3>
            <div className="space-y-2.5">
              {[
                { label: "Document ID", value: invoice.documentId },
                { label: "File Name", value: invoice.originalFilename },
                { label: "File Size", value: invoice.fileSize ? `${(invoice.fileSize / 1024).toFixed(1)} KB` : "—" },
                { label: "Content Type", value: invoice.contentType },
                { label: "Status", value: invoice.status },
                { label: "Provider", value: invoice.providerName || "—" },
                { label: "Uploaded", value: invoice.createdAt ? new Date(invoice.createdAt).toLocaleString() : "—" },
              ].map((item) => (
                <div key={item.label} className="flex items-start justify-between">
                  <span className="text-xs text-gray-400">{item.label}</span>
                  <span className="text-xs text-gray-700 font-medium text-right max-w-[55%] break-all">{item.value || "—"}</span>
                </div>
              ))}
            </div>
          </div>

          {analysis && (
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Thresholds</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-red-500" /><span className="text-xs text-gray-600">Red ≥ 0.955</span></div>
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /><span className="text-xs text-gray-600">Amber ≥ 0.90</span></div>
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-green-500" /><span className="text-xs text-gray-600">Low &lt; 0.90</span></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
