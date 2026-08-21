import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import {
  getAlerts,
  getAlertById,
  assignAlert,
  updateAlertStatus,
  resolveAlert,
  dismissAlert,
} from "../api/alertApi";

export default function AlertsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [riskFilter, setRiskFilter] = useState("ALL");

  // Selected Alert for Details Modal / Action
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionModal, setActionModal] = useState({ type: null, alertId: null }); // type: 'RESOLVE' | 'DISMISS' | 'STATUS'
  const [actionNotes, setActionNotes] = useState("");
  const [newStatus, setNewStatus] = useState("IN_REVIEW");
  const [actionLoading, setActionLoading] = useState(false);

  const isInvestigatorOrAdmin =
    user?.role === "INVESTIGATOR" ||
    user?.role === "ADMIN" ||
    user?.roles?.includes("ROLE_INVESTIGATOR") ||
    user?.roles?.includes("ROLE_ADMIN");

  const loadAlerts = async () => {
    setLoading(true);
    setError("");
    try {
      const risk = riskFilter === "ALL" ? null : riskFilter;
      const status = statusFilter === "ALL" ? null : statusFilter;
      const data = await getAlerts(page, 10, risk, status);
      if (data && data.content) {
        setAlerts(data.content);
        setTotalPages(data.totalPages || 1);
        setTotalElements(data.totalElements || 0);
      } else if (Array.isArray(data)) {
        setAlerts(data);
        setTotalPages(1);
        setTotalElements(data.length);
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setError("Access Restricted: Viewing fraud alerts requires INVESTIGATOR or ADMIN privileges.");
      } else {
        setError("Failed to load fraud alerts. Please verify backend connectivity.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [page, statusFilter, riskFilter]);

  const handleOpenDetail = async (alertId) => {
    setDetailLoading(true);
    try {
      const full = await getAlertById(alertId);
      setSelectedAlert(full);
    } catch (err) {
      // Fallback to table item
      const item = alerts.find((a) => a.id === alertId);
      setSelectedAlert(item);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAssignToMe = async (alertId) => {
    setActionLoading(true);
    try {
      await assignAlert(alertId);
      loadAlerts();
      if (selectedAlert?.id === alertId) {
        handleOpenDetail(alertId);
      }
    } catch (err) {
      alert("Failed to assign alert: " + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleExecuteAction = async () => {
    if (!actionModal.alertId) return;
    setActionLoading(true);
    try {
      if (actionModal.type === "RESOLVE") {
        await resolveAlert(actionModal.alertId, actionNotes || "Claim verified and resolved by investigator.");
      } else if (actionModal.type === "DISMISS") {
        await dismissAlert(actionModal.alertId, actionNotes || "False positive template similarity.");
      } else if (actionModal.type === "STATUS") {
        await updateAlertStatus(actionModal.alertId, newStatus, actionNotes);
      }
      setActionModal({ type: null, alertId: null });
      setActionNotes("");
      loadAlerts();
      if (selectedAlert) setSelectedAlert(null);
    } catch (err) {
      alert("Action failed: " + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Fraud Alert Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Investigate suspicious invoice template reuse, cross-provider imitation, and risk triggers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadAlerts}
            disabled={loading}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Alerts
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="font-semibold">{error}</p>
            {!isInvestigatorOrAdmin && (
              <p className="mt-1 text-amber-700">
                To triage fraud alerts, please log in with an Investigator or Admin account, or request an administrator to promote your role in User Management.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Filter Controls Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-600">Risk Level:</span>
            <select
              value={riskFilter}
              onChange={(e) => {
                setRiskFilter(e.target.value);
                setPage(0);
              }}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="RED">RED Risk</option>
              <option value="AMBER">AMBER Risk</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-600">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">NEW</option>
              <option value="IN_REVIEW">IN_REVIEW</option>
              <option value="INVESTIGATING">INVESTIGATING</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="DISMISSED">DISMISSED</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-700">{alerts.length}</span> of{" "}
          <span className="font-semibold text-slate-700">{totalElements}</span> alerts
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400">
            <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs">Loading fraud alerts from database...</p>
          </div>
        ) : alerts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Alert ID</th>
                  <th className="py-3 px-4">Document / Claim</th>
                  <th className="py-3 px-4">Risk Level</th>
                  <th className="py-3 px-4">Assigned To</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                      ALT-{alert.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-medium text-slate-800">
                          {alert.documentId || `Invoice #${alert.invoiceId}`}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          alert.riskLevel === "RED"
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {alert.riskLevel}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {alert.assignedToName || alert.assignedToEmail || (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                          alert.status === "NEW"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : alert.status === "IN_REVIEW" || alert.status === "INVESTIGATING"
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : alert.status === "RESOLVED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {alert.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {alert.createdAt ? new Date(alert.createdAt).toLocaleString() : "N/A"}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenDetail(alert.id)}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                      >
                        Inspect
                      </button>
                      <button
                        onClick={() => navigate(`/invoices/${alert.invoiceId}`)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                      >
                        Claim Doc
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-semibold text-slate-600">No fraud alerts matching filters</p>
            <p className="text-xs text-slate-400 mt-1">All processed medical claim invoices have passed verification without unresolved risk.</p>
          </div>
        )}

        {/* Pagination Bar */}
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

      {/* Alert Details & Investigation Drawer / Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Fraud Alert Investigation (ALT-{selectedAlert.id})
                </h3>
                <p className="text-xs text-slate-500">
                  Document ID: {selectedAlert.documentId || `INV-${selectedAlert.invoiceId}`}
                </p>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                <div>
                  <span className="text-slate-400 block mb-0.5">Risk Level:</span>
                  <span
                    className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                      selectedAlert.riskLevel === "RED"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {selectedAlert.riskLevel}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Alert Status:</span>
                  <span className="font-semibold text-slate-800">{selectedAlert.status}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Assigned Investigator:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedAlert.assignedToName || selectedAlert.assignedToEmail || "Unassigned"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Detected At:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedAlert.createdAt ? new Date(selectedAlert.createdAt).toLocaleString() : "N/A"}
                  </span>
                </div>
              </div>

              {/* Investigator Actions */}
              <div className="pt-2">
                <h4 className="font-bold text-slate-700 mb-2">Triage & Decision Actions</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleAssignToMe(selectedAlert.id)}
                    disabled={actionLoading}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg font-semibold transition cursor-pointer"
                  >
                    Assign to Me
                  </button>
                  <button
                    onClick={() => setActionModal({ type: "STATUS", alertId: selectedAlert.id })}
                    className="px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-lg font-semibold transition cursor-pointer"
                  >
                    Change Status
                  </button>
                  <button
                    onClick={() => setActionModal({ type: "RESOLVE", alertId: selectedAlert.id })}
                    className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg font-semibold transition cursor-pointer"
                  >
                    Resolve Alert
                  </button>
                  <button
                    onClick={() => setActionModal({ type: "DISMISS", alertId: selectedAlert.id })}
                    className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 rounded-lg font-semibold transition cursor-pointer"
                  >
                    Dismiss Alert
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  onClick={() => navigate(`/invoices/${selectedAlert.invoiceId}`)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition cursor-pointer"
                >
                  View Full Invoice & AI Result →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Notes Modal (Resolve / Dismiss / Status) */}
      {actionModal.type && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-800 mb-1">
              {actionModal.type === "RESOLVE"
                ? "Resolve Fraud Alert"
                : actionModal.type === "DISMISS"
                ? "Dismiss Fraud Alert"
                : "Update Alert Status"}
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              {actionModal.type === "RESOLVE"
                ? "Document your resolution rationale for this medical claim investigation."
                : actionModal.type === "DISMISS"
                ? "State the rationale for dismissing this suspicious template signal."
                : "Select the updated lifecycle state for this alert."}
            </p>

            {actionModal.type === "STATUS" && (
              <div className="mb-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="IN_REVIEW">IN_REVIEW</option>
                  <option value="INVESTIGATING">INVESTIGATING</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="DISMISSED">DISMISSED</option>
                </select>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Investigation / Audit Notes
              </label>
              <textarea
                rows={3}
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Enter detailed investigator notes..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActionModal({ type: null, alertId: null })}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteAction}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition cursor-pointer"
              >
                {actionLoading ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}