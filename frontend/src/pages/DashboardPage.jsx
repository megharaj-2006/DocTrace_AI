import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { getDashboardSummary } from "../api/dashboardApi";

const alertsOverTime = [
  { date: "01 May", amber: 45, red: 12 },
  { date: "06 May", amber: 78, red: 23 },
  { date: "11 May", amber: 56, red: 18 },
  { date: "16 May", amber: 90, red: 31 },
  { date: "21 May", amber: 67, red: 22 },
  { date: "26 May", amber: 110, red: 41 },
  { date: "31 May", amber: 85, red: 28 },
];

const topProviders = [
  { name: "Apollo Hospitals", invoices: 2145, red: 23 },
  { name: "City Care Clinic", invoices: 1876, red: 16 },
  { name: "Sunrise Diagnostics", invoices: 1432, red: 14 },
  { name: "Metro Health Center", invoices: 1128, red: 9 },
  { name: "HealthPlus Clinic", invoices: 982, red: 6 },
];

const RiskBadge = ({ risk }) => {
  const styles = {
    RED: "bg-red-100 text-red-600 border border-red-200",
    AMBER: "bg-amber-100 text-amber-600 border border-amber-200",
    LOW: "bg-green-100 text-green-600 border border-green-200",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${styles[risk] || "bg-gray-100 text-gray-500"}`}>
      {risk}
    </span>
  );
};

const StatCard = ({ title, value, subtitle, icon, color, loading }) => (
  <div className="bg-white rounded-xl p-5 flex items-start gap-4 shadow-sm border border-gray-100">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      {loading ? (
        <div className="h-8 w-20 bg-gray-100 rounded animate-pulse mt-1" />
      ) : (
        <p className="text-2xl font-bold text-gray-800 mt-0.5">{value}</p>
      )}
      <p className="text-xs text-green-500 mt-0.5">{subtitle}</p>
    </div>
  </div>
);

export default function DashboardPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await getDashboardSummary();
        setSummary(data);
      } catch (err) {
        setError("Failed to load dashboard data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const riskDistribution = [
    { name: "Low Risk (< 0.90)", value: summary ? Math.max(0, summary.totalInvoices - summary.redRiskCount - summary.amberRiskCount) : 0, color: "#22c55e" },
    { name: "Amber (0.90 - 0.955)", value: summary?.amberRiskCount || 0, color: "#f59e0b" },
    { name: "Red (≥ 0.955)", value: summary?.redRiskCount || 0, color: "#ef4444" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <div className="flex items-center gap-3">
          <button className="relative p-2 text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">I</div>
            <span className="text-sm font-medium text-gray-700">Investigator</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          loading={loading}
          title="Total Invoices"
          value={summary?.totalInvoices?.toLocaleString() ?? "—"}
          subtitle="Live from backend"
          color="bg-blue-50"
          icon={<svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
        />
        <StatCard
          loading={loading}
          title="Pending Analysis"
          value={summary?.pendingAnalysis?.toLocaleString() ?? "—"}
          subtitle="Awaiting processing"
          color="bg-yellow-50"
          icon={<svg className="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          loading={loading}
          title="Amber Alerts"
          value={summary?.amberRiskCount?.toLocaleString() ?? "—"}
          subtitle="Requires investigation"
          color="bg-amber-50"
          icon={<svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>}
        />
        <StatCard
          loading={loading}
          title="Red Alerts"
          value={summary?.redRiskCount?.toLocaleString() ?? "—"}
          subtitle="High risk — act now"
          color="bg-red-50"
          icon={<svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Risk Distribution</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie data={riskDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                  {riskDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 flex-1">
              {riskDistribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-gray-600">{item.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-700">{item.value}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-gray-100 text-xs text-gray-500">
                Total Alerts: {summary?.totalAlerts ?? "—"}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-800">Alerts Over Time</h3>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-amber-400 inline-block" /> Amber</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-500 inline-block" /> Red</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={alertsOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="amber" stroke="#f59e0b" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="red" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Alerts from API */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-800">Recent Alerts</h3>
            <button onClick={() => navigate("/alerts")} className="text-xs text-blue-600 hover:underline">View All Alerts →</button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : summary?.recentAlerts?.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100">
                  <th className="text-left pb-2 font-medium">Document ID</th>
                  <th className="text-left pb-2 font-medium">Risk</th>
                  <th className="text-left pb-2 font-medium">Score</th>
                  <th className="text-left pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {summary.recentAlerts.map((alert) => (
                  <tr key={alert.id} className="text-sm hover:bg-gray-50 cursor-pointer">
                    <td className="py-2.5 text-blue-600 text-xs font-medium">{alert.documentId}</td>
                    <td className="py-2.5"><RiskBadge risk={alert.riskLevel} /></td>
                    <td className="py-2.5 text-gray-700 text-xs font-mono">{alert.fraudScore?.toFixed(3)}</td>
                    <td className="py-2.5 text-gray-500 text-xs">{alert.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">No alerts yet</div>
          )}
        </div>

        {/* Top Providers — still static */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-800">Top Providers by Invoices</h3>
            <button className="text-xs text-blue-600 hover:underline">View All →</button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100">
                <th className="text-left pb-2 font-medium">Provider</th>
                <th className="text-right pb-2 font-medium">Invoices</th>
                <th className="text-right pb-2 font-medium">Red Alerts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {topProviders.map((p) => (
                <tr key={p.name} className="text-sm hover:bg-gray-50">
                  <td className="py-2.5 text-xs text-gray-700">{p.name}</td>
                  <td className="py-2.5 text-right text-xs text-gray-700 font-medium">{p.invoices.toLocaleString()}</td>
                  <td className="py-2.5 text-right text-xs text-red-500 font-semibold">{p.red}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Avg Score */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500">Average Fraud Score</p>
            <p className="text-2xl font-bold text-gray-800">{loading ? "—" : summary?.averageFraudScore?.toFixed(3) ?? "—"}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500">Unreviewed Alerts</p>
            <p className="text-2xl font-bold text-gray-800">{loading ? "—" : summary?.unreviewedAlerts ?? "—"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}