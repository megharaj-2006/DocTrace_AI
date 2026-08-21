import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import { getAnalyses } from "../api/invoiceApi";

export default function AnalysisPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAnalyses();
      if (data && data.content) {
        setAnalyses(data.content);
      } else if (Array.isArray(data)) {
        setAnalyses(data);
      }
    } catch (err) {
      setError("Failed to load AI analysis records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredAnalyses = analyses.filter((item) => {
    if (riskFilter === "ALL") return true;
    return item.riskLevel === riskFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">AI Analysis Registry</h1>
          <p className="text-sm text-slate-500 mt-1">
            Global ledger of all executed invoice layout, DINOv2 vision embedding, and template similarity inferences.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition cursor-pointer"
        >
          <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadData} className="underline font-semibold cursor-pointer">Retry</button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-600">Filter by Risk:</span>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All Analysis Results</option>
            <option value="RED">RED (High Suspicion)</option>
            <option value="AMBER">AMBER (Medium Risk)</option>
            <option value="LOW">LOW (Legitimate / Clean)</option>
          </select>
        </div>

        <span className="text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-700">{filteredAnalyses.length}</span> analysis runs
        </span>
      </div>

      {/* Analysis Records Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400">
            <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs">Loading analysis registry...</p>
          </div>
        ) : filteredAnalyses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Analysis ID</th>
                  <th className="py-3 px-4">Invoice / Document</th>
                  <th className="py-3 px-4">Risk Level</th>
                  <th className="py-3 px-4">Fraud Score</th>
                  <th className="py-3 px-4">Confidence</th>
                  <th className="py-3 px-4">Matched Docs</th>
                  <th className="py-3 px-4">Analyzed At</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAnalyses.map((ar) => (
                  <tr key={ar.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono text-slate-500">#{ar.id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {ar.documentId || `Invoice #${ar.invoiceId}`}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          ar.riskLevel === "RED"
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : ar.riskLevel === "AMBER"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {ar.riskLevel}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                      {ar.fraudScore?.toFixed(4)}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {ar.confidence ? `${(ar.confidence * 100).toFixed(1)}%` : "N/A"}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {ar.matchedDocuments ? ar.matchedDocuments.length : 0} matches
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {ar.analyzedAt ? new Date(ar.analyzedAt).toLocaleString() : "N/A"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => navigate(`/invoices/${ar.invoiceId || ar.documentId}`)}
                        className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold rounded-lg transition cursor-pointer"
                      >
                        Inspect Result →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400">
            <p className="text-sm font-semibold text-slate-600">No analysis records found</p>
            <p className="text-xs text-slate-400 mt-1">Upload and analyze medical claim documents to populate this registry.</p>
          </div>
        )}
      </div>
    </div>
  );
}
