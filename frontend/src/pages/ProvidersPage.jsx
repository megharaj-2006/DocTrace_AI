import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import { getProviders, getProviderInvoices, createProvider } from "../api/providerApi";

export default function ProvidersPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const isAdmin = user?.role === "ADMIN" || user?.roles?.includes("ROLE_ADMIN");

  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Add Provider Modal State (Admin)
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    registrationNumber: "",
    email: "",
    phone: "",
    address: "",
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

  // Provider Invoices Modal State
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [providerInvoices, setProviderInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);

  const loadProviders = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getProviders(page, 10);
      if (data && data.content) {
        setProviders(data.content);
        setTotalPages(data.totalPages || 1);
        setTotalElements(data.totalElements || 0);
      } else if (Array.isArray(data)) {
        setProviders(data);
        setTotalPages(1);
        setTotalElements(data.length);
      }
    } catch (err) {
      setError("Failed to load healthcare providers directory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProviders();
  }, [page]);

  const handleOpenInvoices = async (provider) => {
    setSelectedProvider(provider);
    setInvoicesLoading(true);
    try {
      const data = await getProviderInvoices(provider.id, 0, 20);
      if (data && data.content) {
        setProviderInvoices(data.content);
      } else if (Array.isArray(data)) {
        setProviderInvoices(data);
      } else {
        setProviderInvoices([]);
      }
    } catch {
      setProviderInvoices([]);
    } finally {
      setInvoicesLoading(false);
    }
  };

  const handleCreateProvider = async (e) => {
    e.preventDefault();
    if (!addForm.name.trim()) {
      setAddError("Provider name is required.");
      return;
    }
    setAddLoading(true);
    setAddError("");
    try {
      await createProvider(addForm);
      setShowAddModal(false);
      setAddForm({ name: "", registrationNumber: "", email: "", phone: "", address: "" });
      loadProviders();
    } catch (err) {
      setAddError(err.response?.data?.message || "Failed to create provider.");
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Healthcare Providers Directory</h1>
          <p className="text-sm text-slate-500 mt-1">
            Registered hospitals, diagnostic centers, and clinics issuing medical reimbursement invoices.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadProviders}
            disabled={loading}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          {isAdmin && (
            <button
              onClick={() => {
                setAddError("");
                setShowAddModal(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Provider
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadProviders} className="underline font-semibold cursor-pointer">Retry</button>
        </div>
      )}

      {/* Providers Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400">
            <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs">Loading providers directory...</p>
          </div>
        ) : providers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Provider ID</th>
                  <th className="py-3 px-4">Facility Name</th>
                  <th className="py-3 px-4">Registration #</th>
                  <th className="py-3 px-4">Contact Email</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {providers.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700">PRV-{p.id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{p.name}</td>
                    <td className="py-3 px-4 text-slate-600">{p.registrationNumber || "—"}</td>
                    <td className="py-3 px-4 text-slate-600">{p.email || "—"}</td>
                    <td className="py-3 px-4 text-slate-600">{p.phone || "—"}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenInvoices(p)}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                      >
                        View Invoices
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400">
            <svg className="w-10 h-10 mx-auto text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="text-sm font-semibold text-slate-600">No healthcare providers registered yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Providers are automatically detected and linked during invoice AI analysis, or can be added by an administrator.
            </p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
            >
              Previous
            </button>
            <span className="text-slate-500">
              Page <span className="font-semibold">{page + 1}</span> of <span className="font-semibold">{totalPages}</span>
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Provider Invoices Modal */}
      {selectedProvider && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">{selectedProvider.name}</h3>
                <p className="text-xs text-slate-500">
                  {selectedProvider.registrationNumber ? `Reg #${selectedProvider.registrationNumber}` : "Registered Healthcare Facility"}
                </p>
              </div>
              <button
                onClick={() => setSelectedProvider(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {invoicesLoading ? (
              <div className="py-10 text-center text-xs text-slate-400">Loading linked invoices...</div>
            ) : providerInvoices.length > 0 ? (
              <div className="space-y-2">
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
                    {providerInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="py-2.5 font-mono font-medium text-slate-800">{inv.documentId}</td>
                        <td className="py-2.5 text-slate-600 truncate max-w-[180px]">{inv.originalFilename}</td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => {
                              setSelectedProvider(null);
                              navigate(`/invoices/${inv.id}`);
                            }}
                            className="text-blue-600 font-semibold hover:underline cursor-pointer"
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
              <div className="py-10 text-center text-xs text-slate-400">
                No invoices currently linked to this provider.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin Add Provider Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-800 mb-1">Add Healthcare Provider</h3>
            <p className="text-xs text-slate-500 mb-4">
              Register a hospital, clinic, or lab to track template consistency and claim legitimacy.
            </p>

            {addError && (
              <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs">
                {addError}
              </div>
            )}

            <form onSubmit={handleCreateProvider} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Facility Name *</label>
                <input
                  type="text"
                  required
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="e.g. Manipal Hospital Bangalore"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Registration / Tax ID</label>
                <input
                  type="text"
                  value={addForm.registrationNumber}
                  onChange={(e) => setAddForm({ ...addForm, registrationNumber: e.target.value })}
                  placeholder="e.g. REG-HOSP-2026-99"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Email</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  placeholder="billing@manipal.org"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={addForm.phone}
                  onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                  placeholder="+91 80 2502 4444"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition cursor-pointer"
                >
                  {addLoading ? "Saving..." : "Save Provider"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}