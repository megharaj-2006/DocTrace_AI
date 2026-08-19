import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAlerts, assignAlert, resolveAlert, dismissAlert } from "../api/alertApi";

const RiskBadge = ({ risk }) => {
  if (!risk) return <span className="text-gray-300 text-xs">—</span>;
  const styles = {
    RED: "bg-red-100 text-red-600 border border-red-200",
    AMBER: "bg-amber-100 text-amber-600 border border-amber-200",
    LOW: "bg-green-100 text-green-600 border border-green-200",
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${styles[risk] || "bg-gray-100 text-gray-500"}`}>{risk}</span>;
};

const StatusBadge = ({ status }) => {
  const styles = {
    NEW: "bg-blue-50 text-blue-600 border border-blue-200 font-bold",
    IN_REVIEW: "bg-purple-50 text-purple-600 border border-purple-200",
    INVESTIGATING: "bg-amber-50 text-amber-600 border border-amber-200",
    DISMISSED: "bg-gray-100 text-gray-500 border border-gray-200",
    RESOLVED: "bg-green-50 text-green-600 border border-green-200 font-semibold",
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[status?.toUpperCase()] || "bg-gray-100 text-gray-500"}`}>{status}</span>;
};

export default function AlertsPage() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Modal action states
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [actionType, setActionType] = useState(null); // "resolve" | "dismiss"
  const [actionNotes, setActionNotes] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const riskFilter = activeTab === "All" ? null : activeTab;
      const data = await getAlerts(page, 10, riskFilter);
      setAlerts(data.content || []);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      setError("Failed to load fraud alerts from backend.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [page, activeTab]);

  const handleAssign = async (alertId) => {
    try {
      await assignAlert(alertId);
      setSuccess(`Alert assigned to you successfully.`);
      setTimeout(() => setSuccess(""), 3000);
      fetchAlerts();
    } catch (err) {
      alert("Failed to assign alert: " + (err.response?.data?.message || err.message));
    }
  };

  const handleActionSubmit = async () => {
    if (!selectedAlert || !actionType) return;
    setSubmittingAction(true);
    try {
      if (actionType === "resolve") {
        await resolveAlert(selectedAlert.id, actionNotes || "Confirmed template fraud");
        setSuccess(`Alert ALT-${String(selectedAlert.id).padStart(6, "0")} marked as RESOLVED.`);
      } else if (actionType === "dismiss") {
        await dismissAlert(selectedAlert.id, actionNotes || "False positive template match");
        setSuccess(`Alert ALT-${String(selectedAlert.id).padStart(6, "0")} marked as DISMISSED.`);
      }
      setTimeout(() => setSuccess(""), 3000);
      setSelectedAlert(null);
      setActionType(null);
      setActionNotes("");
      fetchAlerts();
    } catch (err) {
      alert("Action failed: " + (err.response?.data?.message || err.message));
    } finally {
      setSubmittingAction(false);
    }
  };

  const tabs = [
    { label: "All Alerts", key: "All" },
    { label: "High Risk (RED)", key: "RED" },
    { label: "Suspicious (AMBER)", key: "AMBER" },
    { label: "Standard (LOW)", key: "LOW" },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Fraud Alerts &amp; Workflow</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage, assign, and resolve suspicious document template alerts</p>
        </div>
      </div>

      {success && (
        <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="px-4 py-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">{error}</div>
      )}

      {/* Main Alerts Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tabs */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-gray-100">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => { setActiveTab(t.key); setPage(0); }}
              className={`px-3 py-2 text-xs font-semibold rounded-t border-b-2 transition ${
                activeTab === t.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <table className="w-full">
          <thead className="bg-gray-50">
            <tr className="text-xs text-gray-400">
              <th className="text-left px-5 py-3 font-medium">Alert ID</th>
              <th className="text-left px-5 py-3 font-medium">Document ID</th>
              <th className="text-left px-5 py-3 font-medium">Risk Level</th>
              <th className="text-left px-5 py-3 font-medium">Fraud Score</th>
              <th className="text-left px-5 py-3 font-medium">AI Confidence</th>
              <th className="text-left px-5 py-3 font-medium">Status</th>
              <th className="text-left px-5 py-3 font-medium">Assigned To</th>
              <th className="text-right px-5 py-3 font-medium">Workflow Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  {[...Array(8)].map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-3 bg-gray-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : alerts.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-gray-400 text-sm">
                  No alerts found under selected filter.
                </td>
              </tr>
            ) : (
              alerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3.5 text-gray-700 font-mono font-medium text-xs">
                    ALT-{String(alert.id).padStart(6, "0")}
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => navigate(`/invoices/${alert.invoiceId}`)}
                      className="text-blue-600 hover:underline text-xs font-mono font-bold"
                    >
                      {alert.documentId}
                    </button>
                  </td>
                  <td className="px-5 py-3.5"><RiskBadge risk={alert.riskLevel} /></td>
                  <td className="px-5 py-3.5 text-gray-800 text-xs font-mono font-bold">
                    {alert.fraudScore?.toFixed(3) ?? "—"}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 text-xs font-mono">
                    {alert.confidence ? `${(alert.confidence * 100).toFixed(1)}%` : "—"}
                  </td>
                  <td className="px-5 py-3.5"><StatusBadge status={alert.status} /></td>
                  <td className="px-5 py-3.5 text-xs text-gray-600">
                    {alert.assignedTo || <span className="text-gray-400 italic">Unassigned</span>}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {!alert.assignedTo && alert.status === "NEW" && (
                        <button
                          onClick={() => handleAssign(alert.id)}
                          className="px-2 py-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded transition font-medium"
                        >
                          Claim
                        </button>
                      )}
                      {alert.status !== "RESOLVED" && alert.status !== "DISMISSED" && (
                        <>
                          <button
                            onClick={() => { setSelectedAlert(alert); setActionType("resolve"); }}
                            className="px-2 py-1 text-xs bg-green-50 text-green-700 hover:bg-green-100 rounded transition font-medium"
                          >
                            Resolve
                          </button>
                          <button
                            onClick={() => { setSelectedAlert(alert); setActionType("dismiss"); }}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 rounded transition font-medium"
                          >
                            Dismiss
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => navigate(`/invoices/${alert.invoiceId}`)}
                        className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition font-medium"
                      >
                        Inspect →
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {loading ? "Loading..." : `Showing ${alerts.length} of ${totalElements} alerts`}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="w-7 h-7 rounded text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-40"
            >‹</button>
            {[...Array(Math.min(totalPages, 5))].map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`w-7 h-7 rounded text-xs font-medium ${i === page ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}
              >{i + 1}</button>
            ))}
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="w-7 h-7 rounded text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-40"
            >›</button>
          </div>
        </div>
      </div>

      {/* Action Dialog Modal */}
      {selectedAlert && actionType && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-gray-800">
              {actionType === "resolve" ? "Resolve Fraud Alert" : "Dismiss Alert as False Positive"}
            </h3>
            <p className="text-xs text-gray-500">
              Document: <strong>{selectedAlert.documentId}</strong> • Fraud Score: <strong>{selectedAlert.fraudScore?.toFixed(3)}</strong>
            </p>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {actionType === "resolve" ? "Resolution Notes / Investigation Summary" : "Dismissal Reason"}
              </label>
              <textarea
                rows={3}
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder={actionType === "resolve" ? "e.g. Confirmed duplicate template with altered patient names." : "e.g. Authorized franchise hospital using standard bill format."}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => { setSelectedAlert(null); setActionType(null); }}
                className="px-4 py-2 text-xs border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleActionSubmit}
                disabled={submittingAction}
                className={`px-4 py-2 text-xs text-white rounded-lg font-semibold transition ${
                  actionType === "resolve" ? "bg-green-600 hover:bg-green-700" : "bg-gray-700 hover:bg-gray-800"
                }`}
              >
                {submittingAction ? "Submitting..." : actionType === "resolve" ? "Confirm Resolution" : "Confirm Dismissal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}