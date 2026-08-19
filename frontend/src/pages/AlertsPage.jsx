import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import useAuthStore from "../store/authStore";

// 10 Mock Alert Rows matching reference screenshot exactly
const initialAlertRows = [
  {
    id: "ALT-2026-0087",
    docName: "INV-2036-1250.pdf",
    pages: "2 pages",
    provider: "Apollo Hospitals",
    riskLevel: "RED",
    score: "0.982",
    scoreColor: "text-red-600 font-bold",
    detectedOn: "29 May 2026",
    detectedTime: "02:35 PM",
    status: "New",
    statusStyle: "bg-blue-50 text-blue-600 border border-blue-100",
  },
  {
    id: "ALT-2026-0086",
    docName: "INV-2036-1249.pdf",
    pages: "2 pages",
    provider: "City Care Clinic",
    riskLevel: "AMBER",
    score: "0.931",
    scoreColor: "text-amber-600 font-bold",
    detectedOn: "29 May 2026",
    detectedTime: "01:51 PM",
    status: "In Review",
    statusStyle: "bg-amber-50 text-amber-600 border border-amber-100",
  },
  {
    id: "ALT-2026-0085",
    docName: "INV-2036-1248.pdf",
    pages: "1 page",
    provider: "Sunrise Diagnostics",
    riskLevel: "AMBER",
    score: "0.912",
    scoreColor: "text-amber-600 font-bold",
    detectedOn: "29 May 2026",
    detectedTime: "11:22 AM",
    status: "New",
    statusStyle: "bg-blue-50 text-blue-600 border border-blue-100",
  },
  {
    id: "ALT-2026-0084",
    docName: "INV-2036-1238.pdf",
    pages: "2 pages",
    provider: "Metro Health Center",
    riskLevel: "RED",
    score: "0.965",
    scoreColor: "text-red-600 font-bold",
    detectedOn: "28 May 2026",
    detectedTime: "04:18 PM",
    status: "Investigating",
    statusStyle: "bg-purple-50 text-purple-600 border border-purple-100",
  },
  {
    id: "ALT-2026-0083",
    docName: "INV-2036-1231.pdf",
    pages: "2 pages",
    provider: "HealthPlus Clinic",
    riskLevel: "AMBER",
    score: "0.907",
    scoreColor: "text-amber-600 font-bold",
    detectedOn: "28 May 2026",
    detectedTime: "03:05 PM",
    status: "In Review",
    statusStyle: "bg-amber-50 text-amber-600 border border-amber-100",
  },
  {
    id: "ALT-2026-0082",
    docName: "INV-2036-1225.pdf",
    pages: "1 page",
    provider: "Apollo Hospitals",
    riskLevel: "LOW",
    score: "0.756",
    scoreColor: "text-emerald-600 font-bold",
    detectedOn: "28 May 2026",
    detectedTime: "11:40 AM",
    status: "Closed",
    statusStyle: "bg-slate-100 text-slate-600 border border-slate-200",
  },
  {
    id: "ALT-2026-0081",
    docName: "INV-2036-1220.pdf",
    pages: "2 pages",
    provider: "City Care Clinic",
    riskLevel: "LOW",
    score: "0.642",
    scoreColor: "text-emerald-600 font-bold",
    detectedOn: "27 May 2026",
    detectedTime: "09:16 PM",
    status: "Closed",
    statusStyle: "bg-slate-100 text-slate-600 border border-slate-200",
  },
  {
    id: "ALT-2026-0080",
    docName: "INV-2036-1212.pdf",
    pages: "2 pages",
    provider: "Sunrise Diagnostics",
    riskLevel: "AMBER",
    score: "0.901",
    scoreColor: "text-amber-600 font-bold",
    detectedOn: "27 May 2026",
    detectedTime: "02:28 PM",
    status: "New",
    statusStyle: "bg-blue-50 text-blue-600 border border-blue-100",
  },
  {
    id: "ALT-2026-0079",
    docName: "INV-2036-1208.pdf",
    pages: "1 page",
    provider: "Metro Health Center",
    riskLevel: "RED",
    score: "0.973",
    scoreColor: "text-red-600 font-bold",
    detectedOn: "27 May 2026",
    detectedTime: "11:08 AM",
    status: "Investigating",
    statusStyle: "bg-purple-50 text-purple-600 border border-purple-100",
  },
  {
    id: "ALT-2026-0078",
    docName: "INV-2036-1195.pdf",
    pages: "2 pages",
    provider: "HealthPlus Clinic",
    riskLevel: "LOW",
    score: "0.588",
    scoreColor: "text-emerald-600 font-bold",
    detectedOn: "26 May 2026",
    detectedTime: "08:50 PM",
    status: "Closed",
    statusStyle: "bg-slate-100 text-slate-600 border border-slate-200",
  },
];

// Line Chart Data matching reference curve
const alertsOverTimeData = [
  { date: "30 Apr", red: 25, amber: 15, low: 8 },
  { date: "7 May", red: 32, amber: 22, low: 10 },
  { date: "14 May", red: 48, amber: 28, low: 14 },
  { date: "21 May", red: 58, amber: 35, low: 18 },
  { date: "28 May", red: 68, amber: 42, low: 22 },
];

// Donut Chart Data
const riskDonutData = [
  { name: "Red", value: 23, percentage: "26.4%", color: "#ef4444", range: "≥ 0.955" },
  { name: "Amber", value: 41, percentage: "47.1%", color: "#f59e0b", range: "0.90 - 0.955" },
  { name: "Low", value: 23, percentage: "26.4%", color: "#10b981", range: "< 0.90" },
];

// Top Providers by Alerts Data
const topProvidersAlerts = [
  { name: "Apollo Hospitals", count: 26, color: "bg-red-500", width: "95%" },
  { name: "City Care Clinic", count: 18, color: "bg-amber-500", width: "68%" },
  { name: "Sunrise Diagnostics", count: 14, color: "bg-amber-400", width: "52%" },
  { name: "Metro Health Center", count: 11, color: "bg-emerald-600", width: "42%" },
  { name: "HealthPlus Clinic", count: 8, color: "bg-emerald-500", width: "30%" },
];

// Custom Risk Badge
const RiskBadge = ({ level }) => {
  if (level === "RED") {
    return (
      <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-red-50 text-red-600 border border-red-200">
        RED
      </span>
    );
  }
  if (level === "AMBER") {
    return (
      <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
        AMBER
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
      LOW
    </span>
  );
};

export default function AlertsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [activeTab, setActiveTab] = useState("ALL");
  const [timeRange, setTimeRange] = useState("Last 30 Days");

  // Filter alerts by active tab
  const filteredAlerts = initialAlertRows.filter((item) => {
    if (activeTab === "RED") return item.riskLevel === "RED";
    if (activeTab === "AMBER") return item.riskLevel === "AMBER";
    if (activeTab === "LOW") return item.riskLevel === "LOW";
    return true;
  });

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-10 font-sans text-slate-800">
      
      {/* ================= TOP HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1 pb-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Alerts
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Monitor and manage fraud alerts
          </p>
        </div>

        {/* Top Right Controls */}
        <div className="flex items-center gap-4">
          {/* Notification Bell */}
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

      {/* ================= FOUR TOP STAT CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Alerts */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/70 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0">
            <div className="w-7 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white shadow-xs">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Alerts</p>
            <p className="text-2xl font-bold text-slate-900 leading-tight mt-0.5">87</p>
            <p className="text-[11px] font-semibold text-red-500 mt-0.5 flex items-center gap-0.5">
              <span>↑</span>
              <span>35.3% from last month</span>
            </p>
          </div>
        </div>

        {/* Card 2: Red Alerts */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/70 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0">
            <div className="w-7 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white shadow-xs">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Red Alerts</p>
            <p className="text-2xl font-bold text-slate-900 leading-tight mt-0.5">23</p>
            <p className="text-[11px] font-semibold text-red-500 mt-0.5 flex items-center gap-0.5">
              <span>↑</span>
              <span>53.3% from last month</span>
            </p>
          </div>
        </div>

        {/* Card 3: Amber Alerts */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/70 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0">
            <div className="w-7 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-white shadow-xs">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Amber Alerts</p>
            <p className="text-2xl font-bold text-slate-900 leading-tight mt-0.5">41</p>
            <p className="text-[11px] font-semibold text-amber-500 mt-0.5 flex items-center gap-0.5">
              <span>↑</span>
              <span>28.1% from last month</span>
            </p>
          </div>
        </div>

        {/* Card 4: Low Alerts */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/70 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <div className="w-7 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-xs">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Low Alerts</p>
            <p className="text-2xl font-bold text-slate-900 leading-tight mt-0.5">23</p>
            <p className="text-[11px] font-semibold text-emerald-600 mt-0.5 flex items-center gap-0.5">
              <span>↓</span>
              <span>17.8% from last month</span>
            </p>
          </div>
        </div>

      </div>

      {/* ================= MAIN CONTENT: TABLE (LEFT) + CHARTS (RIGHT) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ================= LEFT SECTION: ALERTS TABLE (LG: 8 COLS) ================= */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/70 space-y-4">
          
          {/* Filter Tabs & Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            
            {/* Tabs */}
            <div className="flex items-center gap-3.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-semibold">
              <button
                onClick={() => setActiveTab("ALL")}
                className={`pb-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
                  activeTab === "ALL"
                    ? "border-blue-600 text-blue-600 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                All Alerts (87)
              </button>

              <button
                onClick={() => setActiveTab("RED")}
                className={`pb-2 border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === "RED"
                    ? "border-red-600 text-red-600 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-red-600 inline-block" />
                <span>Red (23)</span>
              </button>

              <button
                onClick={() => setActiveTab("AMBER")}
                className={`pb-2 border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === "AMBER"
                    ? "border-amber-500 text-amber-600 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                <span>Amber (41)</span>
              </button>

              <button
                onClick={() => setActiveTab("LOW")}
                className={`pb-2 border-b-2 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === "LOW"
                    ? "border-emerald-600 text-emerald-600 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                <span>Low (23)</span>
              </button>
            </div>

            {/* Right Controls: Filters & Date */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => {}}
                className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold py-1.5 px-3 rounded-lg shadow-2xs transition cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                <span>Filters</span>
              </button>

              <div className="relative">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold py-1.5 pl-2.5 pr-6 rounded-lg shadow-2xs focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="Last 30 Days">Last 30 Days</option>
                  <option value="Last 7 Days">Last 7 Days</option>
                  <option value="Last 90 Days">Last 90 Days</option>
                  <option value="All Time">All Time</option>
                </select>
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

          </div>

          {/* Table with responsive column widths */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10.5px] font-semibold text-slate-500">
                  <th className="pb-2.5 pr-1 font-bold whitespace-nowrap">Alert ID</th>
                  <th className="pb-2.5 px-1 font-bold whitespace-nowrap">Document</th>
                  <th className="pb-2.5 px-1 font-bold whitespace-nowrap">Provider</th>
                  <th className="pb-2.5 px-1 font-bold text-center whitespace-nowrap">Risk Level</th>
                  <th className="pb-2.5 px-1 font-bold text-center whitespace-nowrap">Score</th>
                  <th className="pb-2.5 px-1 font-bold whitespace-nowrap">Detected On</th>
                  <th className="pb-2.5 px-1 font-bold text-center whitespace-nowrap">Status</th>
                  <th className="pb-2.5 pl-1 font-bold text-center whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAlerts.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Alert ID */}
                    <td className="py-2.5 pr-1 font-semibold text-slate-700 text-[10.5px] whitespace-nowrap">
                      {row.id}
                    </td>

                    {/* Document */}
                    <td className="py-2.5 px-1 whitespace-nowrap">
                      <p className="font-bold text-slate-900 text-[11px]">{row.docName}</p>
                      <p className="text-[9.5px] text-slate-400">{row.pages}</p>
                    </td>

                    {/* Provider */}
                    <td className="py-2.5 px-1 text-slate-700 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-[11px]">
                        <span className="text-blue-500 text-xs">🏛️</span>
                        <span>{row.provider}</span>
                      </div>
                    </td>

                    {/* Risk Level */}
                    <td className="py-2.5 px-1 text-center whitespace-nowrap">
                      <RiskBadge level={row.riskLevel} />
                    </td>

                    {/* Score */}
                    <td className={`py-2.5 px-1 text-center text-[11px] whitespace-nowrap ${row.scoreColor}`}>
                      {row.score}
                    </td>

                    {/* Detected On */}
                    <td className="py-2.5 px-1 whitespace-nowrap">
                      <p className="font-medium text-slate-800 text-[10.5px]">{row.detectedOn}</p>
                      <p className="text-[9.5px] text-slate-400">{row.detectedTime}</p>
                    </td>

                    {/* Status Pill */}
                    <td className="py-2.5 px-1 text-center whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${row.statusStyle}`}>
                        {row.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 pl-1 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => navigate("/analysis")}
                          className="p-1 text-slate-400 hover:text-blue-600 transition cursor-pointer"
                          title="View analysis details"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {}}
                          className="p-0.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                          title="More options"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="5" r="2" />
                            <circle cx="12" cy="12" r="2" />
                            <circle cx="12" cy="19" r="2" />
                          </svg>
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1.5">
              <button className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer">
                ‹
              </button>
              <button className="w-7 h-7 rounded-lg bg-[#2563eb] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                1
              </button>
              <button className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer">
                2
              </button>
              <button className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer">
                3
              </button>
              <button className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer">
                4
              </button>
              <button className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer">
                5
              </button>
              <span className="text-slate-400 text-xs px-1">...</span>
              <button className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer">
                9
              </button>
              <button className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer">
                ›
              </button>
            </div>

            <p className="text-xs text-slate-400 font-medium">
              Showing 1-10 of 87 alerts
            </p>
          </div>

        </div>


        {/* ================= RIGHT SECTION: 3 CARDS (LG: 4 COLS) ================= */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Card 1: Alerts Over Time Chart */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/70">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Alerts Over Time
              </h3>
              
              <div className="relative">
                <select className="bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-semibold py-1 pl-2.5 pr-6 rounded-md focus:outline-none appearance-none cursor-pointer">
                  <option>Daily</option>
                  <option>Weekly</option>
                  <option>Monthly</option>
                </select>
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-end gap-3 text-[10px] font-semibold text-slate-500 mb-2">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span>Red</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Amber</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Low</span>
              </span>
            </div>

            {/* Line Chart */}
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={alertsOverTimeData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 80]}
                    ticks={[0, 20, 40, 60, 80]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "11px",
                      border: "none",
                      padding: "6px 10px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="red"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#ef4444" }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="amber"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#f59e0b" }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="low"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#10b981" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card 2: Alerts by Risk Level Donut */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/70">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Alerts by Risk Level
            </h3>

            <div className="flex items-center gap-4">
              {/* Donut Chart */}
              <div className="w-28 h-28 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskDonutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={32}
                      outerRadius={50}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {riskDonutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend with Metrics */}
              <div className="space-y-2 flex-1 text-xs">
                {riskDonutData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="font-semibold text-slate-700">
                        {item.name} <span className="text-[10px] text-slate-400 font-normal">({item.range})</span>
                      </span>
                    </div>
                    <span className="font-bold text-slate-800 text-[11px]">
                      {item.value} ({item.percentage})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 3: Top Providers by Alerts */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/70">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Top Providers by Alerts
              </h3>
            </div>

            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 pb-2 border-b border-slate-100">
              <span>Provider</span>
              <span>Alerts</span>
            </div>

            <div className="divide-y divide-slate-100">
              {topProvidersAlerts.map((prov) => (
                <div key={prov.name} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-800 truncate">
                      {prov.name}
                    </p>
                    {/* Horizontal Bar */}
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5">
                      <div className={`h-full rounded-full ${prov.color}`} style={{ width: prov.width }} />
                    </div>
                  </div>

                  <span className="text-xs font-bold text-slate-900 flex-shrink-0 w-6 text-right">
                    {prov.count}
                  </span>
                </div>
              ))}
            </div>

            {/* Bottom View All Link */}
            <div className="mt-3 pt-2 text-right">
              <Link
                to="/providers"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>View All Providers</span>
                <span>→</span>
              </Link>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}