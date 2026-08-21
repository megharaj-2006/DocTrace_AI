import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import useAuthStore from "../store/authStore";
import { getDashboardSummary, getSimilarityStatistics, getDashboardTrends } from "../api/dashboardApi";
import { getInvoices } from "../api/invoiceApi";

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState({
    totalInvoices: 0,
    pendingAnalysis: 0,
    failedAnalysis: 0,
    totalAlerts: 0,
    unreviewedAlerts: 0,
    redRiskCount: 0,
    amberRiskCount: 0,
    avgFraudScore: 0.0,
    avgConfidence: 0.0,
    recentAlerts: [],
  });
  const [simStats, setSimStats] = useState({ high: 0, medium: 0, low: 0 });
  const [trends, setTrends] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [sumRes, simRes, trendsRes, invRes] = await Promise.allSettled([
        getDashboardSummary(),
        getSimilarityStatistics(),
        getDashboardTrends(),
        getInvoices(0, 5),
      ]);

      if (sumRes.status === "fulfilled") {
        setSummary(sumRes.value);
      }
      if (simRes.status === "fulfilled") {
        setSimStats(simRes.value);
      }
      if (trendsRes.status === "fulfilled" && Array.isArray(trendsRes.value)) {
        setTrends(trendsRes.value);
      }
      if (invRes.status === "fulfilled" && invRes.value?.content) {
        setRecentInvoices(invRes.value.content);
      }
    } catch (err) {
      setError("Failed to load dashboard metrics. Please check network connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalSimCount = simStats.high + simStats.medium + simStats.low;
  const pieData = [
    {
      name: "Low Risk ( < 0.90 )",
      value: simStats.low,
      percentage: totalSimCount > 0 ? ((simStats.low / totalSimCount) * 100).toFixed(1) + "%" : "0%",
      color: "#22c55e",
    },
    {
      name: "Amber ( 0.90 - 0.955 )",
      value: simStats.medium,
      percentage: totalSimCount > 0 ? ((simStats.medium / totalSimCount) * 100).toFixed(1) + "%" : "0%",
      color: "#f59e0b",
    },
    {
      name: "Red ( ≥ 0.955 )",
      value: simStats.high,
      percentage: totalSimCount > 0 ? ((simStats.high / totalSimCount) * 100).toFixed(1) + "%" : "0%",
      color: "#ef4444",
    },
  ];

  const analyzedCount = summary.totalInvoices - summary.pendingAnalysis - summary.failedAnalysis;

  const kpis = [
    {
      title: "Total Invoices",
      value: summary.totalInvoices.toLocaleString(),
      subtitle: `${summary.pendingAnalysis} pending analysis`,
      color: "bg-[#2563eb]",
      titleColor: "text-slate-500",
      icon: (
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      title: "Analyzed Invoices",
      value: Math.max(0, analyzedCount).toLocaleString(),
      subtitle: `Avg Score: ${(summary.avgFraudScore * 100).toFixed(1)}%`,
      color: "bg-[#16a34a]",
      titleColor: "text-slate-500",
      icon: (
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      title: "Amber Alerts",
      value: summary.amberRiskCount.toLocaleString(),
      subtitle: "Potential template match",
      color: "bg-[#f59e0b]",
      titleColor: "text-amber-600",
      icon: (
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
    },
    {
      title: "Red Alerts",
      value: summary.redRiskCount.toLocaleString(),
      subtitle: `${summary.unreviewedAlerts} unreviewed alerts`,
      color: "bg-[#dc2626]",
      titleColor: "text-red-600",
      icon: (
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Executive Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time medical claim invoice template integrity and fraud risk surveillance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button
            onClick={() => navigate("/invoices")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Upload Invoice
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadData} className="underline font-semibold cursor-pointer">Retry</button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <div
            key={index}
            className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wider ${kpi.titleColor}`}>
                  {kpi.title}
                </p>
                <p className="text-2xl font-bold text-slate-800 mt-1.5">{kpi.value}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl ${kpi.color} flex items-center justify-center shadow-xs`}>
                {kpi.icon}
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>{kpi.subtitle}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Risk Analysis Trends */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">Alerts & Fraud Activity Timeline</h2>
              <p className="text-xs text-slate-500">Daily volume of analyzed documents categorized by risk level</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Red Risk
              </span>
              <span className="flex items-center gap-1 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Amber Risk
              </span>
              <span className="flex items-center gap-1 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Low Risk
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            {trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: "8px", color: "#fff", fontSize: "12px" }}
                  />
                  <Line type="monotone" dataKey="red" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="amber" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="low" stroke="#22c55e" strokeWidth={2} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No historical trend data available yet.
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Donut Risk Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800">Risk Level Breakdown</h2>
            <p className="text-xs text-slate-500 mb-4">Distribution across all analyzed medical claims</p>
            
            <div className="h-44 relative flex items-center justify-center">
              {totalSimCount > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: "8px", color: "#fff", fontSize: "12px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-slate-400">No analyzed claims yet</div>
              )}
            </div>
          </div>

          <div className="space-y-2 mt-4 pt-3 border-t border-slate-100">
            {pieData.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-semibold text-slate-800">{item.percentage} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Alerts & Recent Invoices Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Alerts */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-800">Active Fraud Alerts</h2>
            <button
              onClick={() => navigate("/alerts")}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
            >
              View All Alerts →
            </button>
          </div>

          {summary.recentAlerts && summary.recentAlerts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-medium">
                    <th className="pb-2">Document ID</th>
                    <th className="pb-2">Risk</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary.recentAlerts.slice(0, 5).map((alert) => (
                    <tr key={alert.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 font-medium text-slate-800">{alert.documentId || `INV-${alert.invoiceId}`}</td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            alert.riskLevel === "RED"
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {alert.riskLevel}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-600">{alert.status}</td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => navigate(`/invoices/${alert.invoiceId}`)}
                          className="text-blue-600 hover:underline font-semibold cursor-pointer"
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
            <div className="py-8 text-center text-xs text-slate-400">
              No fraud alerts logged in the system.
            </div>
          )}
        </div>

        {/* Recent Invoices */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-800">Recent Claim Invoices</h2>
            <button
              onClick={() => navigate("/invoices")}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
            >
              View Invoices →
            </button>
          </div>

          {recentInvoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-medium">
                    <th className="pb-2">Filename / ID</th>
                    <th className="pb-2">Provider</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 font-medium text-slate-800 truncate max-w-[140px]" title={inv.originalFilename}>
                        {inv.documentId || inv.originalFilename}
                      </td>
                      <td className="py-2.5 text-slate-600">{inv.providerName || "Unassigned"}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          inv.status === "ANALYZED" ? "bg-emerald-50 text-emerald-700" :
                          inv.status === "ANALYZING" ? "bg-blue-50 text-blue-700" :
                          inv.status === "FAILED" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-700"
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => navigate(`/invoices/${inv.id}`)}
                          className="text-blue-600 hover:underline font-semibold cursor-pointer"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No recent invoices found. Upload a claim invoice to begin.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}