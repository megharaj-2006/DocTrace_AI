import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getProviders, getProviderInvoices } from "../api/providerApi";

const StatusBadge = ({ status }) => {
  const styles = {
    ANALYZED: "bg-green-50 text-green-600 border border-green-200",
    ANALYZING: "bg-purple-50 text-purple-600",
    UPLOADED: "bg-blue-50 text-blue-600",
    FAILED: "bg-red-50 text-red-500",
  };
  return <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${styles[status] || "bg-gray-100 text-gray-500"}`}>{status}</span>;
};

export default function ProvidersPage() {
  const navigate = useNavigate();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [providerInvoices, setProviderInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
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
      if (list.length > 0 && !selected) {
        setSelected(list[0]);
      }
    } catch (err) {
      setError("Failed to load healthcare providers.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [page]);

  useEffect(() => {
    if (selected?.id) {
      const loadInvoices = async () => {
        setLoadingInvoices(true);
        try {
          const invData = await getProviderInvoices(selected.id, 0, 10);
          setProviderInvoices(invData.content || []);
        } catch (err) {
          console.error("Failed to load provider invoices", err);
          setProviderInvoices([]);
        } finally {
          setLoadingInvoices(false);
        }
      };
      loadInvoices();
    }
  }, [selected?.id]);

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
          <h1 className="text-2xl font-bold text-gray-800">Healthcare Providers &amp; Hospitals</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage and inspect billings by healthcare provider</p>
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
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-blue-500 w-56"
            />
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Registered Providers", value: loading ? "—" : totalElements, sub: "Live in system", color: "bg-blue-50", iconColor: "text-blue-500" },
          { label: "Active Hospitals & Clinics", value: loading ? "—" : providers.length, sub: "In current page", color: "bg-green-50", iconColor: "text-green-500" },
          { label: "Selected Provider Invoices", value: loadingInvoices ? "—" : providerInvoices.length, sub: selected ? selected.name : "Select provider", color: "bg-purple-50", iconColor: "text-purple-500" },
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
              <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-3 gap-5">
        {/* Providers Table (2 cols) */}
        <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">All Providers</h3>
            <span className="text-xs text-gray-400">Click row to inspect provider invoices</span>
          </div>

          {error && <div className="px-5 py-3 bg-red-50 text-red-600 text-sm">{error}</div>}

          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-xs text-gray-400">
                <th className="text-left px-5 py-3 font-medium">Provider Name</th>
                <th className="text-left px-5 py-3 font-medium">Reg. Number</th>
                <th className="text-left px-5 py-3 font-medium">Contact</th>
                <th className="text-right px-5 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(4)].map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-3 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-gray-400 text-sm">
                    No providers found.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setSelected(p)}
                    className={`cursor-pointer hover:bg-gray-50 transition ${selected?.id === p.id ? "bg-blue-50/70 border-l-4 border-blue-600" : ""}`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-800">{p.name}</p>
                          <p className="text-[11px] text-gray-400">{p.email || "No email"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-mono text-gray-600">{p.registrationNumber || `PRV-${p.id}`}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">{p.phone || "—"}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button className="text-xs text-blue-600 hover:underline font-medium">
                        Select →
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

        {/* Selected Provider Details & Invoices (1 col) */}
        <div className="space-y-4">
          {selected ? (
            <>
              {/* Provider Info Card */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Provider Profile</h3>
                <div className="space-y-2 text-xs">
                  <p className="text-base font-bold text-gray-800">{selected.name}</p>
                  <p className="text-gray-500">📍 {selected.address || "Address not provided"}</p>
                  <p className="text-gray-500">📞 {selected.phone || "Phone not provided"}</p>
                  <p className="text-gray-500 font-mono">Reg: {selected.registrationNumber || `PRV-${selected.id}`}</p>
                </div>
              </div>

              {/* Provider Linked Invoices */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-800">Linked Invoices</h3>
                  <span className="text-xs text-blue-600 font-semibold">{providerInvoices.length} Found</span>
                </div>

                {loadingInvoices ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
                    ))}
                  </div>
                ) : providerInvoices.length > 0 ? (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {providerInvoices.map((inv) => (
                      <div
                        key={inv.id}
                        onClick={() => navigate(`/invoices/${inv.id}`)}
                        className="p-2.5 bg-gray-50 hover:bg-blue-50/60 rounded-lg border border-gray-100 cursor-pointer transition flex items-center justify-between"
                      >
                        <div>
                          <p className="text-xs font-mono font-bold text-blue-600">{inv.documentId}</p>
                          <p className="text-[11px] text-gray-400">{inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : "—"}</p>
                        </div>
                        <StatusBadge status={inv.status} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-gray-400 bg-gray-50 rounded-lg">
                    No invoices recorded for this provider.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center text-xs text-gray-400">
              Select a provider from the table to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}