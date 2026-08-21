import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import useAuthStore from "../store/authStore";
import { getSimilarInvoices, getInvoiceById, getInvoices } from "../api/invoiceApi";

export default function SimilarDocumentsPage() {
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const [searchParams] = useSearchParams();
  const activeInvoiceId = paramId || searchParams.get("invoiceId");

  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [similarDocs, setSimilarDocs] = useState([]);
  const [allInvoices, setAllInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      if (activeInvoiceId) {
        const [invRes, simRes] = await Promise.allSettled([
          getInvoiceById(activeInvoiceId),
          getSimilarInvoices(activeInvoiceId),
        ]);

        if (invRes.status === "fulfilled") {
          setCurrentInvoice(invRes.value);
        }
        if (simRes.status === "fulfilled" && Array.isArray(simRes.value)) {
          setSimilarDocs(simRes.value);
        } else {
          setSimilarDocs([]);
        }
      } else {
        // Load available analyzed invoices to choose from
        const data = await getInvoices(0, 25);
        if (data && data.content) {
          setAllInvoices(data.content.filter((inv) => inv.status === "ANALYZED"));
        }
      }
    } catch (err) {
      setError("Failed to load similar document comparisons from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeInvoiceId]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Template Similarity Inspector</h1>
          <p className="text-sm text-slate-500 mt-1">
            Explore nearest-neighbor document layout and visual template matches retrieved from Qdrant vector database.
          </p>
        </div>
        {activeInvoiceId && (
          <button
            onClick={() => navigate(`/invoices/${activeInvoiceId}`)}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            ← Back to Invoice Detail
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadData} className="underline font-semibold cursor-pointer">Retry</button>
        </div>
      )}

      {/* When viewing a specific invoice comparison */}
      {activeInvoiceId ? (
        <div className="space-y-6">
          {/* Query Document Metadata Card */}
          {currentInvoice && (
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  Target Query Document
                </span>
                <h3 className="text-base font-bold text-slate-800 mt-1.5 font-mono">
                  {currentInvoice.documentId}
                </h3>
                <p className="text-xs text-slate-500">
                  {currentInvoice.originalFilename} • Provider: {currentInvoice.providerName || "Unassigned"}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Corpus Matches Found</span>
                <span className="text-xl font-bold text-slate-800">{similarDocs.length}</span>
              </div>
            </div>
          )}

          {/* Matched Documents Grid */}
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400 bg-white rounded-xl border border-slate-200/80">
              <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs">Querying Qdrant visual & structural vector collections...</p>
            </div>
          ) : similarDocs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {similarDocs.map((doc, idx) => {
                const simPercent = (doc.similarity * 100).toFixed(1);
                const isHighRisk = doc.similarity >= 0.955;
                const isAmber = doc.similarity >= 0.90 && doc.similarity < 0.955;

                return (
                  <div
                    key={idx}
                    className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-xs font-bold text-slate-800 truncate">
                          {doc.matchedDocumentId || `DOC-${doc.id}`}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isHighRisk
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : isAmber
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {isHighRisk ? "RED" : isAmber ? "AMBER" : "LOW"}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Cosine Similarity:</span>
                          <span className="font-bold text-slate-800">{simPercent}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Score Value:</span>
                          <span className="font-mono">{doc.similarity?.toFixed(4)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
                      {doc.matchedInvoiceId ? (
                        <button
                          onClick={() => navigate(`/invoices/${doc.matchedInvoiceId}`)}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                        >
                          Inspect Matched Invoice →
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Corpus Template Reference</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center text-slate-400 bg-white rounded-xl border border-slate-200/80 p-6">
              <svg className="w-10 h-10 mx-auto text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-semibold text-slate-600">No suspicious template similarities found</p>
              <p className="text-xs text-slate-400 mt-1">
                This claim invoice has an original template structure with no nearest-neighbor clones in the vector corpus.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Standalone Selector Screen when loaded without specific document ID */
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-800 mb-2">Select an Invoice to Inspect Similarities</h2>
          <p className="text-xs text-slate-500 mb-4">
            Choose any analyzed medical claim from the list below to compare its visual layout against historical templates.
          </p>

          {allInvoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-medium">
                    <th className="pb-2">Document ID</th>
                    <th className="pb-2">Original Filename</th>
                    <th className="pb-2">Provider</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="py-3 font-mono font-medium text-slate-800">{inv.documentId}</td>
                      <td className="py-3 text-slate-600">{inv.originalFilename}</td>
                      <td className="py-3 text-slate-600">{inv.providerName || "Unassigned"}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => navigate(`/invoices/${inv.id}/similar`)}
                          className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold rounded-lg transition cursor-pointer"
                        >
                          Compare Templates →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              No analyzed invoices found. Upload a claim invoice first.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
