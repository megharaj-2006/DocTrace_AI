import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { getAlerts } from "../api/alertApi";

const alertsOverTime = [
  { date: "30 Apr", red: 8, amber: 22, low: 12 },
  { date: "07 May", red: 12, amber: 35, low: 18 },
  { date: "14 May", red: 15, amber: 28, low: 22 },
  { date: "21 May", red: 20, amber: 45, low: 19 },
  { date: "28 May", red: 23, amber: 41, low: 23 },
];

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
    NEW: "bg-blue-50 text-blue-600",
    IN_REVIEW: "bg-purple-50 text-purple-600",
    INVESTIGATING: "bg-amber-50 text-amber-600",
    CLOSED: "bg-gray-100 text-gray-500",
    RESOLVED: "bg-green-50 text-green-600",
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[status?.toUpperCase()] || "bg-gray-100 text-gray-500"}`}>{status}</span>;
};

export default function AlertsPage() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Risk counts derived from alerts
  const redCount = alerts.filter(a => a.riskLevel === "RED").length;
  const amberCount = alerts.filter(a => a.riskLevel === "AMBER").length;
  const lowCount = alerts.filter(a => a.riskLevel === "LOW").length;

  const riskPie = [
    { name: "Red", value: redCount, color: "#ef4444" },
    { name: "Amber", value: amberCount, color: "#f59e0b" },
    { name: "Low", value: lowCount, color: "#22c55e" },
  ];

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const riskFilter = activeTab === "All" ? null : activeTab;
      const data = await getAlerts(page, 10, riskFilter);
      setAlerts(data.content || []);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      setError("Failed to load alerts.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [page, activeTab]);

  const tabs = [
    { label: "All Alerts", key: "All" },
    { label: "Red", key: "RED" },
    { label: "Amber", key: "AMBER" },
    { label: "Low", key: "LOW" },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Alerts</h1>
          <p className="text-sm text-gray-400 mt-0.5">Monitor and manage fraud alerts</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Alerts", value: loading ? "—" : totalElements, sub: "Live from backend", color: "bg-red-50", iconColor: "text-red-500" },
          { label: "Red Alerts", value: loading ? "—" : redCount, sub: "High risk", color: "bg-red-50", iconColor: "text-red-500" },
          { label: "Amber Alerts", value: loading ? "—" : amberCount, sub: "Requires investigation", color: "bg-amber-50", iconColor: "text-amber-500" },
          { label: "Low Alerts", value: loading ? "—" : lowCount, sub: "Low risk", color: "bg-green-50", iconColor: "text-green-500" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-5 flex items-start gap-4 shadow-sm border border-gray-100">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
              <svg className={`w-5 h-5 ${s.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">{s.label}</p>
              {loading ? (
                <div className="h-7 w-12 bg-gray-100 rounded animate-pulse mt-1" />
              ) : (
                <p className="text-2xl font-bold text-gray-800">{s.value}</p>
              )}
              <p className="text-xs text-green-500 mt-0.5">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main + Side */}
      <div className="grid grid-cols-3 gap-4">
        {/* Table */}
        <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center gap-1 px-5 pt-4 border-b border-gray-100">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => { setActiveTab(t.key); setPage(0); }}
                className={`px-3 py-2 text-xs font-medium rounded-t border-b-2 transition ${
                  activeTab === t.key
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="px-5 py-3 bg-red-50 text-red-600 text-sm">{error}</div>
          )}

          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-xs text-gray-400">
                <th className="text-left px-5 py-3 font-medium">Alert ID</th>
                <th className="text-left px-5 py-3 font-medium">Document</th>
                <th className="text-left px-5 py-3 font-medium">Risk</th>
                <th className="text-left px-5 py-3 font-medium">Score</th>
                <th className="text-left px-5 py-3 font-medium">Detected On</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-3 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-400 text-sm">
                    No alerts found. Upload and analyze invoices to generate alerts.
                  </td>
                </tr>
              ) : (
                alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-gray-50 cursor-pointer transition">
                    <td className="px-5 py-3.5 text-gray-700 font-medium text-xs">
                      ALT-{String(alert.id).padStart(6, "0")}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-blue-600 text-xs font-medium">{alert.documentId}</p>
                    </td>
                    <td className="px-5 py-3.5"><RiskBadge risk={alert.riskLevel} /></td>
                    <td className="px-5 py-3.5 text-gray-700 text-xs font-mono">
                      {alert.fraudScore?.toFixed(3) ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs">
                      {alert.createdAt ? new Date(alert.createdAt).toLocaleString() : "—"}
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge status={alert.status} /></td>
                    <td className="px-5 py-3.5">
                      <button
                        className="text-gray-400 hover:text-blue-500"
                        onClick={() => navigate(`/invoices/${alert.invoiceId}`)}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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

        {/* Side Panel */}
        <div className="space-y-4">
          {/* Alerts Over Time */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Alerts Over Time</h3>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={alertsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip />
                <Line type="monotone" dataKey="red" stroke="#ef4444" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="amber" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="low" stroke="#22c55e" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Risk Pie */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Alerts by Risk Level</h3>
            {loading ? (
              <div className="h-24 bg-gray-50 rounded animate-pulse" />
            ) : totalElements === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No alerts yet</p>
            ) : (
              <div className="flex items-center gap-3">
                <ResponsiveContainer width="50%" height={100}>
                  <PieChart>
                    <Pie data={riskPie} cx="50%" cy="50%" innerRadius={28} outerRadius={45} dataKey="value" paddingAngle={2}>
                      {riskPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5">
                  {riskPie.map((item) => (
                    <div key={item.name} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-xs text-gray-500">{item.name}</span>
                      </div>
                      <span className="text-xs font-semibold text-gray-700">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}