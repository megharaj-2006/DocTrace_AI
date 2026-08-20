import { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar
} from "recharts";
import useAuthStore from "../store/authStore";
import { getReportSummary } from "../api/reportApi";

export default function ReportsPage() {
  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [report, setReport] = useState({
    totalInvoices: 0,
    analyzedInvoices: 0,
    pendingInvoices: 0,
    totalAlerts: 0,
    resolvedAlerts: 0,
    redRiskCount: 0,
    amberRiskCount: 0,
    lowRiskCount: 0,
    averageFraudScore: 0.0,
    averageConfidence: 0.0,
    fraudScoreDistribution: {},
    topProviders: [],
    docsOverTime: [],
  });

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getReportSummary();
      if (data) {
        setReport(data);
      }
    } catch (err) {
      setError("Failed to load aggregate report data from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalRiskCount = report.redRiskCount + report.amberRiskCount + report.lowRiskCount;
  const riskPieData = [
    {
      name: "RED Risk (≥ 0.955)",
      value: report.redRiskCount,
      percentage: totalRiskCount > 0 ? ((report.redRiskCount / totalRiskCount) * 100).toFixed(1) + "%" : "0%",
      color: "#ef4444",
    },
    {
      name: "AMBER Risk (0.90 - 0.955)",
      value: report.amberRiskCount,
      percentage: totalRiskCount > 0 ? ((report.amberRiskCount / totalRiskCount) * 100).toFixed(1) + "%" : "0%",
      color: "#f59e0b",
    },
    {
      name: "LOW Risk (< 0.90)",
      value: report.lowRiskCount,
      percentage: totalRiskCount > 0 ? ((report.lowRiskCount / totalRiskCount) * 100).toFixed(1) + "%" : "0%",
      color: "#22c55e",
    },
  ];

  const scoreBarData = Object.entries(report.fraudScoreDistribution || {}).map(([range, count]) => ({
    range,
    count,
  }));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">System Analytics & Audit Reports</h1>
          <p className="text-sm text-slate-500 mt-1">
            Aggregate surveillance report on medical invoice volume, template reuse rates, and healthcare provider risk profiles.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print / Export Report
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadData} className="underline font-semibold cursor-pointer">Retry</button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total Invoices</p>
          <p className="text-xl font-bold text-slate-800 mt-1">{report.totalInvoices}</p>
          <span className="text-[11px] text-slate-400">{report.analyzedInvoices} analyzed</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total Fraud Alerts</p>
          <p className="text-xl font-bold text-amber-600 mt-1">{report.totalAlerts}</p>
          <span className="text-[11px] text-slate-400">{report.resolvedAlerts} resolved</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase">Avg Fraud Score</p>
          <p className="text-xl font-bold text-slate-800 mt-1">{(report.averageFraudScore * 100).toFixed(1)}%</p>
          <span className="text-[11px] text-slate-400">Score Range [0, 1]</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase">AI Confidence</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">{(report.averageConfidence * 100).toFixed(1)}%</p>
          <span className="text-[11px] text-slate-400">Model Certainty</span>
        </div>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Documents Over Time Line Chart */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-1">Documents Ingested Over Time</h3>
          <p className="text-xs text-slate-500 mb-4">Daily volume of claim submissions (last 7 days)</p>
          <div className="h-56 w-full">
            {report.docsOverTime && report.docsOverTime.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={report.docsOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: "8px", color: "#fff", fontSize: "12px" }} />
                  <Line type="monotone" dataKey="docs" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">No trend data available</div>
            )}
          </div>
        </div>

        {/* Right: Fraud Score Distribution Histogram */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-1">Fraud Score Distribution</h3>
          <p className="text-xs text-slate-500 mb-4">Frequency breakdown across fraud suspicion score buckets</p>
          <div className="h-56 w-full">
            {scoreBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="range" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: "8px", color: "#fff", fontSize: "12px" }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">No score distribution data</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Risk Breakdown Donut + Provider Risk Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Breakdown Donut */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">Risk Level Classification</h3>
            <p className="text-xs text-slate-500 mb-4">Overall distribution of claim integrity risk</p>
            <div className="h-44 relative flex items-center justify-center">
              {totalRiskCount > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={riskPieData} innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
                      {riskPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: "8px", color: "#fff", fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-slate-400">No analyzed claims</div>
              )}
            </div>
          </div>

          <div className="space-y-2 mt-4 pt-3 border-t border-slate-100">
            {riskPieData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-semibold text-slate-800">{item.percentage} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Provider Risk Matrix (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-1">Healthcare Provider Risk Profiles</h3>
          <p className="text-xs text-slate-500 mb-4">Hospital facility claim volume and template risk concentrations</p>
          {report.topProviders && report.topProviders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-medium">
                    <th className="pb-2">Provider Facility</th>
                    <th className="pb-2">Total Invoices</th>
                    <th className="pb-2">High Risk (RED)</th>
                    <th className="pb-2 text-right">Avg Fraud Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.topProviders.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 font-semibold text-slate-800">{p.name}</td>
                      <td className="py-2.5 text-slate-600">{p.totalDocs} docs</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.highRiskDocs > 0 ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"
                        }`}>
                          {p.highRiskDocs}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-mono font-semibold text-slate-700">
                        {(p.avgScore * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              No provider risk statistics available yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}