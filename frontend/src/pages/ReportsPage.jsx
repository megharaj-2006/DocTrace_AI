import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar
} from "recharts";

const docsOverTime = [
  { date: "1 May", docs: 85 }, { date: "6 May", docs: 120 },
  { date: "11 May", docs: 95 }, { date: "16 May", docs: 160 },
  { date: "21 May", docs: 130 }, { date: "26 May", docs: 175 },
  { date: "29 May", docs: 145 },
];

const riskDist = [
  { name: "Red (≥0.955)", value: 356, color: "#ef4444" },
  { name: "Amber (0.90-0.955)", value: 587, color: "#f59e0b" },
  { name: "Yellow (0.80-0.90)", value: 1248, color: "#eab308" },
  { name: "Green (<0.80)", value: 651, color: "#22c55e" },
];

const fraudScoreDist = [
  { range: "0-0.2", docs: 156 },
  { range: "0.2-0.4", docs: 368 },
  { range: "0.4-0.6", docs: 642 },
  { range: "0.6-0.8", docs: 812 },
  { range: "0.8-1.0", docs: 864 },
];

const topProviders = [
  { name: "Apollo Hospitals", docs: 2842, highRisk: 356, avgScore: 0.78, trend: "+12.5%" },
  { name: "City Care Clinic", docs: 1932, highRisk: 198, avgScore: 0.65, trend: "+8.3%" },
  { name: "Sunrise Diagnostics", docs: 1643, highRisk: 142, avgScore: 0.58, trend: "+6.7%" },
  { name: "Metro Health Center", docs: 1287, highRisk: 76, avgScore: 0.42, trend: "+2.1%" },
  { name: "HealthPlus Clinic", docs: 1156, highRisk: 54, avgScore: 0.35, trend: "+3.9%" },
];

const analysisSummary = [
  { label: "Exact Matches (1.0)", value: 186, pct: "6.5%", color: "#ef4444" },
  { label: "High Similarity (0.90-0.99)", value: 943, pct: "33.2%", color: "#f59e0b" },
  { label: "Medium Similarity (0.70-0.89)", value: 1248, pct: "43.9%", color: "#eab308" },
  { label: "Low Similarity (<0.70)", value: 465, pct: "16.4%", color: "#22c55e" },
];

const recentReports = [
  { name: "Monthly Analysis Report - May 2026", date: "29 May 2026, 03:30 PM" },
  { name: "Fraud Detection Summary - May 2026", date: "29 May 2026, 03:15 PM" },
  { name: "Provider Performance Report - May 2026", date: "29 May 2026, 02:45 PM" },
];

const tabs = ["Overview", "Documents", "Providers", "Fraud Analysis", "Risk Trends", "Activity Log"];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("Overview");

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
          <p className="text-sm text-gray-400 mt-0.5">Insights and analytics from your document analysis</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            01 May 2026 - 29 May 2026
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Report
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100 px-5 pt-3">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-2 text-xs font-medium border-b-2 transition mr-1 ${
                activeTab === t ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-5">
          {/* Stat Cards */}
          <div className="grid grid-cols-5 gap-4">
            {[
              { label: "Total Documents Analyzed", value: "2,842", sub: "↑ 18.7%", sub2: "vs 01 Apr - 30 Apr 2026" },
              { label: "High Risk Documents", value: "356", sub: "↑ 22.4%", sub2: "12.5% of total" },
              { label: "Potential Fraud Cases", value: "87", sub: "↑ 15.3%", sub2: "3.1% of total" },
              { label: "Average Similarity Score", value: "0.68", sub: "↓ 4.6%", sub2: "vs previous period" },
              { label: "Unique Providers", value: "128", sub: "↑ 9.2%", sub2: "Active in system" },
            ].map((s) => (
              <div key={s.label} className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                <p className="text-2xl font-bold text-gray-800">{s.value}</p>
                <p className={`text-xs font-medium mt-0.5 ${s.sub.startsWith("↓") ? "text-red-400" : "text-green-500"}`}>{s.sub}</p>
                <p className="text-xs text-gray-400">{s.sub2}</p>
              </div>
            ))}
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-3 gap-4">
            {/* Docs Over Time */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-800">Documents Over Time</h3>
                <span className="text-xs bg-white border border-gray-200 px-2 py-0.5 rounded text-gray-500">Daily</span>
              </div>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={docsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="docs" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-1 mt-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-xs text-gray-400">Documents Analyzed</span>
              </div>
            </div>

            {/* Risk Level Distribution */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Risk Level Distribution</h3>
              <div className="flex items-center gap-3">
                <ResponsiveContainer width="50%" height={130}>
                  <PieChart>
                    <Pie data={riskDist} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" paddingAngle={2}>
                      {riskDist.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 flex-1">
                  {riskDist.map((item) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-gray-500 flex-1">{item.name}</span>
                      <span className="text-xs font-semibold text-gray-700">{item.value}</span>
                    </div>
                  ))}
                  <p className="text-xs text-gray-400 pt-1 border-t border-gray-200">Total: 2,842</p>
                </div>
              </div>
            </div>

            {/* Fraud Score Distribution */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Fraud Score Distribution</h3>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={fraudScoreDist}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="range" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Bar dataKey="docs" fill="#93c5fd" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-3 gap-4">
            {/* Top Providers */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-800">Top Providers by Document Count</h3>
                <button className="text-xs text-blue-600 hover:underline">View All Providers →</button>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-gray-400 border-b border-gray-200">
                    <th className="text-left pb-2 font-medium">Provider</th>
                    <th className="text-right pb-2 font-medium">Docs</th>
                    <th className="text-right pb-2 font-medium">High Risk</th>
                    <th className="text-right pb-2 font-medium">Avg Score</th>
                    <th className="text-right pb-2 font-medium">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {topProviders.map((p) => (
                    <tr key={p.name} className="hover:bg-white">
                      <td className="py-2 text-xs text-gray-700 font-medium">{p.name}</td>
                      <td className="py-2 text-xs text-gray-600 text-right">{p.docs.toLocaleString()}</td>
                      <td className="py-2 text-xs text-red-500 font-semibold text-right">{p.highRisk}</td>
                      <td className="py-2 text-xs font-mono text-right" style={{ color: p.avgScore >= 0.7 ? "#ef4444" : p.avgScore >= 0.4 ? "#f59e0b" : "#22c55e" }}>{p.avgScore}</td>
                      <td className="py-2 text-xs text-green-500 text-right">{p.trend}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button className="mt-2 text-xs text-blue-600 hover:underline">View All Providers →</button>
            </div>

            {/* Document Analysis Summary */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Document Analysis Summary</h3>
              <div className="space-y-3">
                {analysisSummary.map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${item.color}20` }}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={item.color}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-600">{item.label}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-gray-800">{item.value}</p>
                      <p className="text-xs text-gray-400">{item.pct}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="mt-3 text-xs text-blue-600 hover:underline">View Detailed Analysis →</button>
            </div>

            {/* Recent Reports */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Recent Reports</h3>
              <div className="space-y-3">
                {recentReports.map((r) => (
                  <div key={r.name} className="flex items-center justify-between gap-3 bg-white rounded-lg p-3 border border-gray-100">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-700 truncate">{r.name}</p>
                        <p className="text-xs text-gray-400">Generated on {r.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="px-1.5 py-0.5 bg-red-50 text-red-400 text-xs rounded font-medium">PDF</span>
                      <button className="text-gray-400 hover:text-blue-500 p-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button className="mt-2 text-xs text-blue-600 hover:underline">View All Reports →</button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-1 text-xs text-gray-400 pt-2 border-t border-gray-100">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            All times are in IST (GMT +5:30)
          </div>
        </div>
      </div>
    </div>
  );
}