import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar
} from "recharts";
import useAuthStore from "../store/authStore";

// Line Chart Data: Documents Over Time
const docsOverTimeData = [
  { date: "1 May", docs: 85 },
  { date: "6 May", docs: 125 },
  { date: "11 May", docs: 80 },
  { date: "16 May", docs: 155 },
  { date: "21 May", docs: 120 },
  { date: "26 May", docs: 175 },
  { date: "29 May", docs: 140 },
];

// Donut Chart Data: Risk Level Distribution
const riskDistData = [
  { name: "Red (≥ 0.955)", count: "356 (12.5%)", value: 356, color: "#ef4444" },
  { name: "Amber (0.90 - 0.955)", count: "587 (20.6%)", value: 587, color: "#f59e0b" },
  { name: "Yellow (0.80 - 0.90)", count: "1,248 (43.9%)", value: 1248, color: "#eab308" },
  { name: "Green (< 0.80)", count: "651 (22.9%)", value: 651, color: "#10b981" },
];

// Bar Chart Data: Fraud Score Distribution
const fraudScoreDistData = [
  { range: "0 - 0.2", docs: 156 },
  { range: "0.2 - 0.4", docs: 368 },
  { range: "0.4 - 0.6", docs: 642 },
  { range: "0.6 - 0.8", docs: 812 },
  { range: "0.8 - 1.0", docs: 864 },
];

// Top Providers Table Data
const topProvidersData = [
  {
    name: "Apollo Hospitals",
    icon: "➕",
    docs: "2,842",
    highRisk: "356 (12.5%)",
    avgScore: "0.78",
    trend: "↑ 12.5%",
    trendColor: "text-emerald-600",
  },
  {
    name: "City Care Clinic",
    icon: "❤️",
    docs: "1,932",
    highRisk: "198 (10.2%)",
    avgScore: "0.65",
    trend: "↑ 8.3%",
    trendColor: "text-emerald-600",
  },
  {
    name: "Sunrise Diagnostics",
    icon: "☀️",
    docs: "1,643",
    highRisk: "142 (8.6%)",
    avgScore: "0.58",
    trend: "↑ 6.7%",
    trendColor: "text-emerald-600",
  },
  {
    name: "Metro Health Center",
    icon: "Ⓜ️",
    docs: "1,287",
    highRisk: "76 (5.9%)",
    avgScore: "0.42",
    trend: "↓ 2.1%",
    trendColor: "text-red-500",
  },
  {
    name: "HealthPlus Clinic",
    icon: "🟢",
    docs: "1,156",
    highRisk: "54 (4.7%)",
    avgScore: "0.35",
    trend: "↑ 3.9%",
    trendColor: "text-emerald-600",
  },
];

// Document Analysis Summary Breakdown
const documentAnalysisSummary = [
  {
    label: "Exact Matches (1.0)",
    count: "186 (6.5%)",
    iconBg: "bg-blue-50 text-blue-600 border border-blue-100",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: "High Similarity (0.90 - 0.99)",
    count: "943 (33.2%)",
    iconBg: "bg-emerald-50 text-emerald-600 border border-emerald-100",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2" />
      </svg>
    ),
  },
  {
    label: "Medium Similarity (0.70 - 0.89)",
    count: "1,248 (43.9%)",
    iconBg: "bg-amber-50 text-amber-600 border border-amber-100",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    ),
  },
  {
    label: "Low Similarity (< 0.70)",
    count: "465 (16.4%)",
    iconBg: "bg-teal-50 text-teal-600 border border-teal-100",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

// Recent Reports List
const recentReportsList = [
  {
    name: "Monthly Analysis Report - May 2026",
    dateTime: "Generated on 29 May 2026, 03:30 PM",
  },
  {
    name: "Fraud Detection Summary - May 2026",
    dateTime: "Generated on 29 May 2026, 03:15 PM",
  },
  {
    name: "Provider Performance Report - May 2026",
    dateTime: "Generated on 29 May 2026, 02:45 PM",
  },
];

const subTabs = ["Overview", "Documents", "Providers", "Fraud Analysis", "Risk Trends", "Activity Log"];

export default function ReportsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [activeTab, setActiveTab] = useState("Overview");
  const [dateRange, setDateRange] = useState("01 May 2026 - 29 May 2026");

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-10 font-sans text-slate-800">
      
      {/* ================= TOP HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1 pb-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Reports
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Insights and analytics from your document analysis
          </p>
        </div>

        {/* Top Right Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range Selector */}
          <button
            onClick={() => {}}
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold py-2 px-3.5 rounded-lg shadow-2xs transition cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth={2} />
              <line x1="16" y1="2" x2="16" y2="6" strokeWidth={2} strokeLinecap="round" />
              <line x1="8" y1="2" x2="8" y2="6" strokeWidth={2} strokeLinecap="round" />
              <line x1="3" y1="10" x2="21" y2="10" strokeWidth={2} />
            </svg>
            <span>{dateRange}</span>
            <svg className="w-3.5 h-3.5 text-slate-400 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Export Report Button */}
          <button
            onClick={() => alert("Exporting report...")}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold py-2 px-3.5 rounded-lg shadow-2xs transition cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Export Report</span>
          </button>

          {/* Notification Bell */}
          <button className="relative p-2 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100 transition cursor-pointer ml-1">
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

      {/* ================= SUB-NAVIGATION TABS ================= */}
      <div className="flex items-center gap-6 border-b border-slate-200 text-xs font-semibold overflow-x-auto">
        {subTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2.5 transition whitespace-nowrap cursor-pointer ${
              activeTab === tab
                ? "border-b-2 border-blue-600 text-blue-600 font-bold"
                : "border-b-2 border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ================= FIVE TOP STAT CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        
        {/* Card 1: Total Documents Analyzed */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/70 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-slate-500 leading-tight">
              Total Documents Analyzed
            </p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 leading-tight">2,842</span>
              <span className="text-[10px] font-bold text-emerald-600">↑ 18.7%</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">vs 01 Apr - 30 Apr 2026</p>
          </div>
        </div>

        {/* Card 2: High Risk Documents */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/70 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-slate-500 leading-tight">
              High Risk Documents
            </p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 leading-tight">356</span>
              <span className="text-[10px] font-bold text-red-500">↑ 22.4%</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">12.5% of total</p>
          </div>
        </div>

        {/* Card 3: Potential Fraud Cases */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/70 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-slate-500 leading-tight">
              Potential Fraud Cases
            </p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 leading-tight">87</span>
              <span className="text-[10px] font-bold text-red-500">↑ 15.3%</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">3.1% of total</p>
          </div>
        </div>

        {/* Card 4: Average Similarity Score */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/70 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-slate-500 leading-tight">
              Average Similarity Score
            </p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 leading-tight">0.68</span>
              <span className="text-[10px] font-bold text-red-500">↓ 4.6%</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">vs previous period</p>
          </div>
        </div>

        {/* Card 5: Unique Providers */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/70 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-slate-500 leading-tight">
              Unique Providers
            </p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 leading-tight">128</span>
              <span className="text-[10px] font-bold text-emerald-600">↑ 9.2%</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Active in system</p>
          </div>
        </div>

      </div>

      {/* ================= MIDDLE ROW: THREE ANALYTICS CHARTS (GRID OF 3) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Documents Over Time */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/70 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-900">
              Documents Over Time
            </h3>
            <div className="relative">
              <select className="bg-slate-50 border border-slate-200 text-slate-700 text-[10.5px] font-semibold py-0.5 pl-2 pr-5 rounded focus:outline-none appearance-none cursor-pointer">
                <option>Daily</option>
                <option>Weekly</option>
                <option>Monthly</option>
              </select>
              <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={docsOverTimeData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 9.5, fill: "#94a3b8" }}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 9.5, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 200]}
                  ticks={[0, 50, 100, 150, 200]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "11px",
                    border: "none",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="docs"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#2563eb" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[10.5px] font-semibold text-slate-500 pt-2 border-t border-slate-50">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>Documents Analyzed</span>
          </div>
        </div>

        {/* Card 2: Risk Level Distribution */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/70 flex flex-col justify-between">
          <h3 className="text-xs font-bold text-slate-900 mb-2">
            Risk Level Distribution
          </h3>

          <div className="flex items-center gap-3">
            {/* Donut Chart with Center Text */}
            <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskDistData}
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={54}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {riskDistData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-sm font-black text-slate-900 leading-tight">2,842</span>
                <span className="text-[9.5px] font-medium text-slate-400">Total</span>
              </div>
            </div>

            {/* Legend Breakdown */}
            <div className="space-y-1.5 flex-1 text-[11px]">
              {riskDistData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 font-medium truncate">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-800 ml-1 text-[10.5px]">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="h-4" />
        </div>

        {/* Card 3: Fraud Score Distribution */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/70 flex flex-col justify-between">
          <h3 className="text-xs font-bold text-slate-900 mb-2">
            Fraud Score Distribution
          </h3>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fraudScoreDistData} margin={{ top: 15, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="range"
                  tick={{ fontSize: 9.5, fill: "#94a3b8" }}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 9.5, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 1000]}
                  ticks={[0, 200, 400, 600, 800, 1000]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "11px",
                    border: "none",
                  }}
                />
                <Bar
                  dataKey="docs"
                  fill="#60a5fa"
                  radius={[3, 3, 0, 0]}
                  label={{ position: "top", fontSize: 9.5, fill: "#475569", fontWeight: "bold" }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[10.5px] font-semibold text-slate-500 pt-2 border-t border-slate-50">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Documents</span>
          </div>
        </div>

      </div>

      {/* ================= BOTTOM ROW: THREE DATA CARDS (GRID OF 3) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Top Providers by Document Count */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/70 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 mb-3">
              Top Providers by Document Count
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-semibold text-slate-500">
                    <th className="pb-2 pr-0.5 font-bold whitespace-nowrap">Provider</th>
                    <th className="pb-2 px-0.5 text-right font-bold whitespace-nowrap">Documents</th>
                    <th className="pb-2 px-0.5 text-right font-bold whitespace-nowrap">High Risk Docs</th>
                    <th className="pb-2 px-0.5 text-center font-bold whitespace-nowrap">Avg Risk Score</th>
                    <th className="pb-2 pl-0.5 text-right font-bold whitespace-nowrap">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topProvidersData.map((p) => (
                    <tr key={p.name} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 pr-0.5 whitespace-nowrap">
                        <div className="flex items-center gap-1 font-medium text-slate-800 text-[10px]">
                          <span className="text-[11px]">{p.icon}</span>
                          <span className="truncate max-w-[85px]">{p.name}</span>
                        </div>
                      </td>
                      <td className="py-2 px-0.5 text-right font-medium text-slate-700 text-[10px] whitespace-nowrap">
                        {p.docs}
                      </td>
                      <td className="py-2 px-0.5 text-right text-red-600 font-semibold text-[10px] whitespace-nowrap">
                        {p.highRisk}
                      </td>
                      <td className="py-2 px-0.5 text-center whitespace-nowrap">
                        <span className="px-1 py-0.2 rounded text-[9.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          {p.avgScore}
                        </span>
                      </td>
                      <td className={`py-2 pl-0.5 text-right font-bold text-[10px] whitespace-nowrap ${p.trendColor}`}>
                        {p.trend}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-center">
            <Link
              to="/providers"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View All Providers</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Card 2: Document Analysis Summary */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/70 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 mb-3">
              Document Analysis Summary
            </h3>

            <div className="space-y-2.5">
              {documentAnalysisSummary.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between p-2.5 bg-slate-50/70 rounded-xl border border-slate-100 hover:bg-slate-100/70 transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${item.iconBg}`}>
                      {item.icon}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-800 truncate">
                      {item.label}
                    </span>
                  </div>

                  <span className="text-[11px] font-bold text-slate-900 whitespace-nowrap ml-2">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-center">
            <Link
              to="/analysis"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View Detailed Analysis</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Card 3: Recent Reports */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/70 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 mb-3">
              Recent Reports
            </h3>

            <div className="space-y-2.5">
              {recentReportsList.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 bg-slate-50/70 rounded-xl border border-slate-100 hover:bg-slate-100/70 transition"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11.5px] font-bold text-slate-800 truncate" title={r.name}>
                        {r.name}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {r.dateTime}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-50 text-red-600 border border-red-200">
                      PDF
                    </span>
                    <button
                      onClick={() => alert(`Downloading ${r.name}...`)}
                      className="p-1 text-slate-400 hover:text-blue-600 transition cursor-pointer"
                      title="Download PDF"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-center">
            <button
              onClick={() => alert("Viewing all generated reports")}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View All Reports</span>
              <span>→</span>
            </button>
          </div>
        </div>

      </div>

      {/* ================= FOOTER NOTE ================= */}
      <div className="flex items-center gap-1.5 text-xs text-slate-400 pt-2 font-medium">
        <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <span>All times are in IST (GMT +5:30)</span>
      </div>

    </div>
  );
}