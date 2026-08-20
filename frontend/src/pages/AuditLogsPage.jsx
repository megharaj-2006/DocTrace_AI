import { useState, useEffect } from "react";
import useAuthStore from "../store/authStore";
import { getAuditLogs } from "../api/auditLogApi";

export default function AuditLogsPage() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "ADMIN" || user?.roles?.includes("ROLE_ADMIN");

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [actionFilter, setActionFilter] = useState("ALL");

  const loadLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAuditLogs(page, 25);
      if (data && data.content) {
        setLogs(data.content);
        setTotalPages(data.totalPages || 1);
        setTotalElements(data.totalElements || 0);
      } else if (Array.isArray(data)) {
        setLogs(data);
        setTotalPages(1);
        setTotalElements(data.length);
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setError("Access Restricted: Viewing system audit logs requires System Administrator (ADMIN) privileges.");
      } else {
        setError("Failed to load audit logs from server.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [page]);

  const filteredLogs = logs.filter((log) => {
    if (actionFilter === "ALL") return true;
    return log.action?.toUpperCase().includes(actionFilter);
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">System Audit Logs</h1>
          <p className="text-sm text-slate-500 mt-1">
            Immutable system event ledger tracking user actions, AI analysis executions, and fraud alert triages.
          </p>
        </div>
        <button
          onClick={loadLogs}
          disabled={loading}
          className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition cursor-pointer"
        >
          <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Logs
        </button>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="font-semibold">{error}</p>
            <p className="mt-1 text-amber-700">
              Only authenticated System Administrators (ADMIN) are permitted to inspect full system audit trails.
            </p>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-600">Filter Event Action:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All Actions</option>
            <option value="UPLOAD">Invoice Uploads</option>
            <option value="ANALYSIS">AI Analyses</option>
            <option value="ALERT">Alert Status Changes</option>
            <option value="REGISTER">User Registrations</option>
            <option value="PASSWORD">Password Updates</option>
            <option value="ROLE">Role Updates</option>
          </select>
        </div>

        <div className="text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-700">{filteredLogs.length}</span> of{" "}
          <span className="font-semibold text-slate-700">{totalElements}</span> total events
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400">
            <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs">Loading audit ledger from database...</p>
          </div>
        ) : filteredLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Event ID</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">User / Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity Target</th>
                  <th className="py-3 px-4">Details / Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono text-slate-500">#{log.id}</td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString() : "N/A"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 block">
                        {log.userName || log.userEmail || "System"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{log.userEmail}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {log.entityType ? `${log.entityType} (${log.entityId || "N/A"})` : "—"}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={log.details}>
                      {log.details || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400">
            <p className="text-sm font-semibold text-slate-600">No audit log records found</p>
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
    </div>
  );
}
