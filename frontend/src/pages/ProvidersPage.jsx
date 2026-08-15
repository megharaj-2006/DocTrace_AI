import { useState, useEffect } from "react";
import { getProviders } from "../api/providerApi";

const RiskGauge = ({ score }) => {
  if (score === null || score === undefined) return <span className="text-xs text-gray-300">—</span>;
  const color = score >= 0.7 ? "#ef4444" : score >= 0.4 ? "#f59e0b" : "#22c55e";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 bg-gray-100 rounded-full h-1.5">
        <div className="h-1.5 rounded-full" style={{ width: `${score * 100}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-mono" style={{ color }}>{score.toFixed(2)}</span>
    </div>
  );
};

export default function ProvidersPage() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const data = await getProviders(page, 10);
      const list = data.content || [];
      setProviders(list);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
      if (list.length > 0 && !selected) setSelected(list[0]);
    } catch (err) {
      setError("Failed to load providers.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProviders(); }, [page]);

  const filtered = providers.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.registrationNumber?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Providers</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage and monitor healthcare providers</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search providers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 w-56"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Provider
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Providers", value: loading ? "—" : totalElements, sub: "Active in system", color: "bg-blue-50", iconColor: "text-blue-500" },
          { label: "High Risk Providers", value: loading ? "—" : providers.filter(p => (p.riskScore || 0) >= 0.7).length, sub: "18.0% of total", color: "bg-red-50", iconColor: "text-red-500" },
          { label: "Total Documents", value: loading ? "—" : providers.reduce((a, p) => a + (p.documentCount || 0), 0).toLocaleString(), sub: "Across all providers", color: "bg-green-50", iconColor: "text-green-500" },
          { label: "Flagged Documents", value: "—", sub: "7.9% of total", color: "bg-amber-50", iconColor: "text-amber-500" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-5 flex items-start gap-4 shadow-sm border border-gray-100">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
              <svg className={`w-5 h-5 ${s.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">{s.label}</p>
              {loading ? (
                <div className="h-7 w-16 bg-gray-100 rounded animate-pulse mt-1" />
              ) : (
                <p className="text-2xl font-bold text-gray-800">{s.value}</p>
              )}
              <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Table — 2/3 */}
        <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800">All Providers</h3>
          </div>

          {error && <div className="px-5 py-3 bg-red-50 text-red-600 text-sm">{error}</div>}

          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-xs text-gray-400">
                <th className="text-left px-5 py-3 font-medium">Provider Name</th>
                <th className="text-left px-5 py-3 font-medium">Reg. Number</th>
                <th className="text-left px-5 py-3 font-medium">Phone</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-3 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-gray-400 text-sm">
                    No providers found.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setSelected(p)}
                    className={`cursor-pointer hover:bg-gray-50 transition ${selected?.id === p.id ? "bg-blue-50" : ""}`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-800">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">{p.registrationNumber || "—"}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">{p.phone || "—"}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 bg-green-50 text-green-600 text-xs rounded font-medium">Active</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button className="text-gray-400 hover:text-gray-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
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
              Showing {filtered.length} of {totalElements} providers
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
                className="w-7 h-7 rounded text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-40">‹</button>
              {[...Array(Math.min(totalPages, 5))].map((_, i) => (
                <button key={i} onClick={() => setPage(i)}
                  className={`w-7 h-7 rounded text-xs font-medium ${i === page ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}>
                  {i + 1}
                </button>
              ))}
              <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
                className="w-7 h-7 rounded text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-40">›</button>
            </div>
          </div>
        </div>

        {/* Right Panel — 1/3 */}
        <div className="space-y-4">
          {selected ? (
            <>
              {/* Provider Overview */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-800">Provider Overview</h3>
                  <button className="text-xs text-blue-600 hover:underline">View Full Profile →</button>
                </div>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-800">{selected.name}</p>
                      <span className="px-1.5 py-0.5 bg-green-50 text-green-600 text-xs rounded">Active</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{selected.email}</p>
                    {selected.phone && <p className="text-xs text-gray-400">📞 {selected.phone}</p>}
                    {selected.address && <p className="text-xs text-gray-400">📍 {selected.address}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      🗓 Joined {selected.createdAt ? new Date(selected.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 pt-3 border-t border-gray-100">
                  {[
                    { label: "Registration No.", value: selected.registrationNumber || "—" },
                    { label: "Provider ID", value: `PRV-${String(selected.id).padStart(4, "0")}` },
                    { label: "Last Updated", value: selected.updatedAt ? new Date(selected.updatedAt).toLocaleDateString() : "—" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{item.label}</span>
                      <span className="text-xs text-gray-700 font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <button className="w-full text-left px-3 py-2.5 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    View Provider Documents →
                  </button>
                  <button className="w-full text-left px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Provider
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
              <p className="text-gray-400 text-sm">Select a provider to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}