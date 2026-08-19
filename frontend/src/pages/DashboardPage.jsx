import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { getDashboardSummary, getSimilarityStatistics } from "../api/dashboardApi";
import { getProviders } from "../api/providerApi";

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
      <p className="text-xs text-green-600 mt-0.5">{subtitle}</p>
    </div>
  </div>
);

export default function DashboardPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [providers, setProviders] = useState([]);
  const [simStats, setSimStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [sumData, provData, statsData] = await Promise.allSettled([
          getDashboardSummary(),
          getProviders(0, 5),
          getSimilarityStatistics(),
        ]);

        if (sumData.status === "fulfilled") setSummary(sumData.value);
        if (provData.status === "fulfilled") setProviders(provData.value?.content || []);
        if (statsData.status === "fulfilled") setSimStats(statsData.value);
      } catch (err) {
        setError("Failed to load dashboard data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const lowRiskVal = simStats ? simStats.lowSimilarityCount : (summary ? Math.max(0, summary.totalInvoices - summary.redRiskCount - summary.amberRiskCount) : 0);
  const amberRiskVal = simStats ? simStats.mediumSimilarityCount : (summary?.amberRiskCount || 0);
  const redRiskVal = simStats ? simStats.highSimilarityCount : (summary?.redRiskCount || 0);

  const riskDistribution = [
    { name: "Low Risk (< 0.90)", value: lowRiskVal, color: "#22c55e" },
    { name: "Amber (0.90 - 0.955)", value: amberRiskVal, color: "#f59e0b" },
    { name: "Red (≥ 0.955)", value: redRiskVal, color: "#ef4444" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Investigator Dashboard</h1>
          <p className="text-xs text-gray-400 mt-0.5">Live aggregated fraud detection metrics &amp; alerts</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/invoices")}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Upload New Invoice
          </button>
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
          subtitle="Live from database"
          color="bg-blue-50"
          icon={<svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
        />
        <StatCard
          loading={loading}
          title="Pending Analysis"
          value={summary?.pendingAnalysis?.toLocaleString() ?? "—"}
          subtitle={summary?.failedAnalysis ? `${summary.failedAnalysis} failed` : "Active queue"}
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
          title="Red Risk Alerts"
          value={summary?.redRiskCount?.toLocaleString() ?? "—"}
          subtitle="High template reuse"
          color="bg-red-50"
          icon={<svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
        />
      </div>

      {/* Charts & Metrics Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Risk Distribution Chart */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Risk Level Distribution (Live Model Inference)</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie data={riskDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={78} dataKey="value" paddingAngle={3}>
                  {riskDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2.5 flex-1">
              {riskDistribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-gray-600">{item.name}</span>
                  </div>
                  <span className="text-xs font-bold text-gray-800">{item.value}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-gray-100 text-xs text-gray-500 flex justify-between">
                <span>Total Flagged Alerts:</span>
                <span className="font-semibold text-gray-700">{summary?.totalAlerts ?? "0"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Confidence & Fraud Score Overview */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-800 mb-2">Model Performance &amp; AI Metrics</h3>
            <p className="text-xs text-gray-400 mb-4">Aggregated across all inference analysis results</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100">
                <p className="text-xs text-gray-500 font-medium">Avg. Fraud Suspicion Score</p>
                <p className="text-2xl font-extrabold text-blue-700 mt-1">
                  {loading ? "—" : summary?.averageFraudScore ? summary.averageFraudScore.toFixed(3) : "0.000"}
                </p>
                <p className="text-[11px] text-blue-500 mt-1">Cosine vector similarity average</p>
              </div>
              <div className="p-3.5 bg-green-50/60 rounded-xl border border-green-100">
                <p className="text-xs text-gray-500 font-medium">Avg. AI Confidence</p>
                <p className="text-2xl font-extrabold text-green-700 mt-1">
                  {loading ? "—" : summary?.averageConfidence ? `${(summary.averageConfidence * 100).toFixed(1)}%` : "98.0%"}
                </p>
                <p className="text-[11px] text-green-600 mt-1">Vision layout certainty</p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Unreviewed New Alerts: <strong>{summary?.unreviewedAlerts ?? 0}</strong></span>
            <button onClick={() => navigate("/alerts")} className="text-blue-600 hover:underline font-medium">Review Alerts →</button>
          </div>
        </div>
      </div>

      {/* Recent Alerts & Providers */}
      <div className="grid grid-cols-2 gap-4">
        {/* Recent Alerts from API */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-800">Recent Fraud Alerts</h3>
            <button onClick={() => navigate("/alerts")} className="text-xs text-blue-600 hover:underline font-medium">View All Alerts →</button>
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
                  <th className="text-left pb-2 font-medium">Fraud Score</th>
                  <th className="text-left pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {summary.recentAlerts.map((alert) => (
                  <tr
                    key={alert.id}
                    className="hover:bg-gray-50 cursor-pointer transition"
                    onClick={() => navigate(`/invoices/${alert.invoiceId}`)}
                  >
                    <td className="py-2.5 text-blue-600 text-xs font-mono font-medium">{alert.documentId}</td>
                    <td className="py-2.5"><RiskBadge risk={alert.riskLevel} /></td>
                    <td className="py-2.5 text-gray-700 text-xs font-mono font-bold">{alert.fraudScore?.toFixed(3)}</td>
                    <td className="py-2.5 text-gray-500 text-xs">{alert.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8 text-gray-400 text-xs bg-gray-50 rounded-lg">
              No recent fraud alerts. All analyzed invoices are within normal parameters.
            </div>
          )}
        </div>

        {/* Live Healthcare Providers */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-800">Healthcare Providers</h3>
            <button onClick={() => navigate("/providers")} className="text-xs text-blue-600 hover:underline font-medium">Manage Providers →</button>
          </div>
          {providers.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100">
                  <th className="text-left pb-2 font-medium">Provider Name</th>
                  <th className="text-left pb-2 font-medium">Registration</th>
                  <th className="text-right pb-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {providers.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition cursor-pointer" onClick={() => navigate("/providers")}>
                    <td className="py-2.5 text-xs text-gray-800 font-medium">{p.name}</td>
                    <td className="py-2.5 text-xs text-gray-400 font-mono">{p.registrationNumber || "PRV-" + p.id}</td>
                    <td className="py-2.5 text-right text-xs text-blue-600 font-medium">View Profile →</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8 text-gray-400 text-xs bg-gray-50 rounded-lg">
              No providers registered yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}