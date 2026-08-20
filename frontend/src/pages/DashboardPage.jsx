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

// Mock KPI metrics matching reference
const kpiData = [
  {
    title: "Total Invoices",
    value: "12,458",
    change: "↑ 12.3% from last month",
    color: "bg-[#2563eb]",
    titleColor: "text-slate-500",
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
  {
    title: "Analyzed Invoices",
    value: "8,943",
    change: "↑ 18.7% from last month",
    color: "bg-[#16a34a]",
    titleColor: "text-slate-500",
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        />
      </svg>
    ),
  },
  {
    title: "Amber Alerts",
    value: "312",
    change: "↑ 8.2% from last month",
    color: "bg-[#f59e0b]",
    titleColor: "text-amber-600",
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
    ),
  },
  {
    title: "Red Alerts",
    value: "87",
    change: "↑ 37.1% from last month",
    color: "bg-[#dc2626]",
    titleColor: "text-red-600",
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
  },
];

// Donut Chart Data
const riskDistribution = [
  { name: "Low Risk ( < 0.90 )", percentage: "69.6%", value: 69.6, color: "#22c55e" },
  { name: "Amber ( 0.90 - 0.955 )", percentage: "24.7%", value: 24.7, color: "#f59e0b" },
  { name: "Red ( ≥ 0.955 )", percentage: "5.7%", value: 5.7, color: "#ef4444" },
];

// Line Chart Data with distinct smooth coordinates
const alertsTimeline = [
  { day: "01 May", date: "01 May", amber: 52, red: 14 },
  { day: "03 May", date: "", amber: 45, red: 12 },
  { day: "05 May", date: "", amber: 70, red: 30 },
  { day: "06 May", date: "06 May", amber: 50, red: 15 },
  { day: "08 May", date: "", amber: 125, red: 48 },
  { day: "11 May", date: "11 May", amber: 72, red: 22 },
  { day: "13 May", date: "", amber: 48, red: 12 },
  { day: "15 May", date: "", amber: 80, red: 35 },
  { day: "16 May", date: "16 May", amber: 58, red: 18 },
  { day: "18 May", date: "", amber: 92, red: 32 },
  { day: "21 May", date: "21 May", amber: 138, red: 54 },
  { day: "23 May", date: "", amber: 75, red: 25 },
  { day: "25 May", date: "", amber: 45, red: 12 },
  { day: "26 May", date: "26 May", amber: 70, red: 22 },
  { day: "28 May", date: "", amber: 85, red: 30 },
  { day: "30 May", date: "", amber: 62, red: 18 },
  { day: "31 May", date: "31 May", amber: 108, red: 52 },
];

// Recent Alerts Table Data
const recentAlertsData = [
  {
    invoiceId: "INV-2036-1250",
    provider: "Apollo Hospitals",
    riskLevel: "RED",
    score: "0.982",
    date: "29 May 2026",
  },
  {
    invoiceId: "INV-2036-1249",
    provider: "City Care Clinic",
    riskLevel: "AMBER",
    score: "0.931",
    date: "29 May 2026",
  },
  {
    invoiceId: "INV-2036-1248",
    provider: "Sunrise Diagnostics",
    riskLevel: "AMBER",
    score: "0.912",
    date: "29 May 2026",
  },
  {
    invoiceId: "INV-2036-1247",
    provider: "Metro Health Center",
    riskLevel: "LOW",
    score: "0.612",
    date: "29 May 2026",
  },
  {
    invoiceId: "INV-2036-1246",
    provider: "HealthPlus Clinic",
    riskLevel: "LOW",
    score: "0.421",
    date: "28 May 2026",
  },
];

// Top Providers Table Data
const topProvidersData = [
  { name: "Apollo Hospitals", invoices: "2,145", redAlerts: 23 },
  { name: "City Care Clinic", invoices: "1,876", redAlerts: 16 },
  { name: "Sunrise Diagnostics", invoices: "1,432", redAlerts: 14 },
  { name: "Metro Health Center", invoices: "1,128", redAlerts: 9 },
  { name: "HealthPlus Clinic", invoices: "982", redAlerts: 6 },
];

// Full Width Recent Invoices Table Data
const recentInvoicesData = [
  {
    docId: "INV-2036-1250.pdf",
    provider: "Apollo Hospitals",
    uploadDate: "29 May 2026, 02:35 PM",
    status: "Analyzed",
    riskLevel: "RED",
    score: "0.982",
  },
  {
    docId: "INV-2036-1249.pdf",
    provider: "City Care Clinic",
    uploadDate: "29 May 2026, 01:45 PM",
    status: "Analyzed",
    riskLevel: "AMBER",
    score: "0.931",
  },
  {
    docId: "INV-2036-1248.pdf",
    provider: "Sunrise Diagnostics",
    uploadDate: "29 May 2026, 11:22 AM",
    status: "Analyzed",
    riskLevel: "AMBER",
    score: "0.912",
  },
  {
    docId: "INV-2036-1247.pdf",
    provider: "Metro Health Center",
    uploadDate: "29 May 2026, 10:05 AM",
    status: "Analyzed",
    riskLevel: "LOW",
    score: "0.612",
  },
  {
    docId: "INV-2036-1246.pdf",
    provider: "HealthPlus Clinic",
    uploadDate: "28 May 2026, 04:18 PM",
    status: "Processed",
    riskLevel: "LOW",
    score: "0.421",
  },
];

// Custom Risk Badge Component
const RiskBadge = ({ level }) => {
  if (level === "RED") {
    return (
      <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold bg-red-50 text-red-600 border border-red-200 uppercase tracking-wider">
        RED
      </span>
    );
  }
  if (level === "AMBER") {
    return (
      <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-600 border border-amber-200 uppercase tracking-wider">
        AMBER
      </span>
    );
  }
  return (
    <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 uppercase tracking-wider">
      LOW
    </span>
  );
};

// Custom Status Badge Component
const StatusBadge = ({ status }) => {
  if (status === "Analyzed") {
    return (
      <span className="inline-block px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
        Analyzed
      </span>
    );
  }
  return (
    <span className="inline-block px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
      Processed
    </span>
  );
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-10 font-sans text-slate-800">
      
      {/* ================= TOP HEADER ================= */}
      <div className="flex items-center justify-between pt-1 pb-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Dashboard
        </h1>

        {/* Top Right Controls: Notification & User Profile */}
        <div className="flex items-center gap-4">
          {/* Notification Bell with Badge */}
          <button className="relative p-2 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100 transition cursor-pointer">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-xs">
              3
            </span>
          </button>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2 cursor-pointer pl-1 py-1 pr-2 rounded-full hover:bg-slate-100 transition">
            <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-600 text-sm font-bold flex-shrink-0">
              <svg className="w-4 h-4 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2a5 5 0 100 10 5 5 0 000-10zm-7 18a7 7 0 0114 0H5z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-slate-800">
              {user?.fullName || "Investigator"}
            </span>
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* ================= 4 KPI CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/70 hover:shadow-md transition-shadow flex items-center gap-4"
          >
            {/* Square Icon Badge */}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs ${kpi.color}`}>
              {kpi.icon}
            </div>

            {/* Numbers & Labels */}
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold ${kpi.titleColor}`}>
                {kpi.title}
              </p>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
                {kpi.value}
              </h3>
              <p className="text-[11px] font-medium text-emerald-600 mt-0.5 flex items-center gap-0.5">
                {kpi.change}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ================= ANALYTICS SECTION (CHARTS) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Risk Distribution Donut Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/70 flex flex-col justify-between">
          <h2 className="text-sm font-bold text-slate-900 mb-2">
            Risk Distribution
          </h2>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 my-auto py-2">
            {/* Donut Chart */}
            <div className="w-40 h-40 relative flex items-center justify-center flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={70}
                    strokeWidth={0}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {riskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend Column */}
            <div className="flex-1 w-full space-y-3.5 sm:pl-2">
              {riskDistribution.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-2.5 whitespace-nowrap">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-semibold text-slate-700">
                      {item.name}
                    </span>
                  </div>
                  <span className="font-bold text-slate-900 whitespace-nowrap">
                    {item.percentage}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Total Count */}
          <div className="pt-2 text-right">
            <span className="text-xs font-bold text-slate-800">
              Total: 8,943
            </span>
          </div>
        </div>

        {/* Alerts Over Time Line Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/70 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900">
              Alerts Over Time
            </h2>
            {/* Custom Legend */}
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                <span>Amber</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626]" />
                <span>Red</span>
              </div>
            </div>
          </div>

          <div className="w-full h-48 sm:h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={alertsTimeline} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  ticks={["01 May", "06 May", "11 May", "16 May", "21 May", "26 May", "31 May"]}
                />
                <YAxis
                  domain={[0, 200]}
                  ticks={[0, 50, 100, 150, 200]}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    fontSize: "12px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="amber"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#f59e0b", stroke: "#f59e0b" }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="red"
                  stroke="#dc2626"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#dc2626", stroke: "#dc2626" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ================= TWO MIDDLE DATA TABLES ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Left Table: Recent Alerts */}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/70">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">
              Recent Alerts
            </h2>
            <button
              onClick={() => navigate("/alerts")}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              View All Alerts →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-700">
                  <th className="pb-2.5 font-bold whitespace-nowrap">Invoice ID</th>
                  <th className="pb-2.5 font-bold whitespace-nowrap">Provider</th>
                  <th className="pb-2.5 font-bold text-center whitespace-nowrap">Risk Level</th>
                  <th className="pb-2.5 font-bold text-center whitespace-nowrap">Score</th>
                  <th className="pb-2.5 font-bold text-right whitespace-nowrap">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {recentAlertsData.map((alert, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 font-medium text-slate-800 whitespace-nowrap">
                      {alert.invoiceId}
                    </td>
                    <td className="py-3 text-slate-700 whitespace-nowrap">
                      {alert.provider}
                    </td>
                    <td className="py-3 text-center whitespace-nowrap">
                      <RiskBadge level={alert.riskLevel} />
                    </td>
                    <td className="py-3 font-semibold text-slate-700 text-center whitespace-nowrap">
                      {alert.score}
                    </td>
                    <td className="py-3 text-right text-slate-600 font-medium whitespace-nowrap">
                      {alert.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Table: Top Providers by Invoices */}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/70">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">
              Top Providers by Invoices
            </h2>
            <button
              onClick={() => navigate("/providers")}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              View All Providers →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-700">
                  <th className="pb-2.5 font-bold whitespace-nowrap">Provider</th>
                  <th className="pb-2.5 font-bold text-right whitespace-nowrap">Invoices</th>
                  <th className="pb-2.5 font-bold text-right whitespace-nowrap">Red Alerts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {topProvidersData.map((provider, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 flex items-center gap-2 text-slate-800 font-medium whitespace-nowrap">
                      <div className="w-6 h-6 rounded bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <span>{provider.name}</span>
                    </td>
                    <td className="py-3 text-right font-medium text-slate-800 whitespace-nowrap">
                      {provider.invoices}
                    </td>
                    <td className="py-3 text-right font-medium text-slate-800 whitespace-nowrap">
                      {provider.redAlerts}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ================= FULL WIDTH RECENT INVOICES TABLE ================= */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/70">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-900">
            Recent Invoices
          </h2>
          <button
            onClick={() => navigate("/invoices")}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
          >
            View All Invoices →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-700">
                <th className="pb-2.5 font-bold whitespace-nowrap">Document ID</th>
                <th className="pb-2.5 font-bold whitespace-nowrap">Provider</th>
                <th className="pb-2.5 font-bold whitespace-nowrap">Upload Date</th>
                <th className="pb-2.5 font-bold text-center whitespace-nowrap">Status</th>
                <th className="pb-2.5 font-bold text-center whitespace-nowrap">Risk Level</th>
                <th className="pb-2.5 font-bold text-center whitespace-nowrap">Score</th>
                <th className="pb-2.5 font-bold text-center whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {recentInvoicesData.map((inv, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 font-medium text-slate-800 whitespace-nowrap">
                    {inv.docId}
                  </td>
                  <td className="py-3 text-slate-700 whitespace-nowrap">
                    {inv.provider}
                  </td>
                  <td className="py-3 text-slate-600 font-medium whitespace-nowrap">
                    {inv.uploadDate}
                  </td>
                  <td className="py-3 text-center whitespace-nowrap">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="py-3 text-center whitespace-nowrap">
                    <RiskBadge level={inv.riskLevel} />
                  </td>
                  <td className="py-3 font-semibold text-slate-700 text-center whitespace-nowrap">
                    {inv.score}
                  </td>
                  <td className="py-3 text-center whitespace-nowrap">
                    <button
                      onClick={() => navigate(`/invoices`)}
                      className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition inline-flex items-center justify-center cursor-pointer shadow-2xs border border-blue-100"
                      title="View invoice details"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}