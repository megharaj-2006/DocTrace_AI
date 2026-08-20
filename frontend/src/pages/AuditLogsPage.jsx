import { useState } from "react";
import { Link } from "react-router-dom";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import useAuthStore from "../store/authStore";

// Mock 10 Audit Log Rows matching reference design
const initialAuditLogs = [
  {
    id: "LOG-1001",
    date: "29 May 2026",
    time: "02:35 PM",
    user: {
      name: "Investigator",
      email: "investigator@doctrace.ai",
      initials: "IN",
      avatarBg: "bg-blue-100 text-blue-600",
    },
    action: "UPLOADED",
    actionStyle: "bg-emerald-50 text-emerald-700 border-emerald-200",
    module: "Documents",
    moduleIcon: "📁",
    resource: "INV-2036-1250.pdf",
    details: "Document uploaded for analysis",
    ipAddress: "192.168.1.45",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (Chrome/125.0.0.0)",
    sessionId: "sess_8f2d4a6b7c9e4f1a",
  },
  {
    id: "LOG-1002",
    date: "29 May 2026",
    time: "02:32 PM",
    user: {
      name: "Investigator",
      email: "investigator@doctrace.ai",
      initials: "IN",
      avatarBg: "bg-blue-100 text-blue-600",
    },
    action: "ANALYZED",
    actionStyle: "bg-blue-50 text-blue-600 border-blue-100",
    module: "Analysis",
    moduleIcon: "📈",
    resource: "INV-2036-1250.pdf",
    details: "Document analysis completed",
    ipAddress: "192.168.1.45",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (Chrome/125.0.0.0)",
    sessionId: "sess_8f2d4a6b7c9e4f1a",
  },
  {
    id: "LOG-1003",
    date: "29 May 2026",
    time: "02:30 PM",
    user: {
      name: "Investigator",
      email: "investigator@doctrace.ai",
      initials: "IN",
      avatarBg: "bg-blue-100 text-blue-600",
    },
    action: "ALERT CREATED",
    actionStyle: "bg-red-50 text-red-600 border-red-200",
    module: "Alerts",
    moduleIcon: "🔔",
    resource: "ALT-2026-0087",
    details: "High risk alert generated (Risk Score: 0.982)",
    ipAddress: "192.168.1.45",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (Chrome/125.0.0.0)",
    sessionId: "sess_8f2d4a6b7c9e4f1a",
  },
  {
    id: "LOG-1004",
    date: "29 May 2026",
    time: "01:51 PM",
    user: {
      name: "Arjun Singh",
      email: "arjun.singh@doctrace.ai",
      initials: "AR",
      avatarBg: "bg-emerald-100 text-emerald-700",
    },
    action: "STATUS UPDATED",
    actionStyle: "bg-amber-50 text-amber-700 border-amber-200",
    module: "Alerts",
    moduleIcon: "🔔",
    resource: "ALT-2026-0086",
    details: "Status changed to In Review",
    ipAddress: "192.168.1.52",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    sessionId: "sess_3b4c5d6e7f8a9b0c",
  },
  {
    id: "LOG-1005",
    date: "29 May 2026",
    time: "11:22 AM",
    user: {
      name: "Priya Sharma",
      email: "priya.sharma@doctrace.ai",
      initials: "PR",
      avatarBg: "bg-purple-100 text-purple-700",
    },
    action: "COMMENT ADDED",
    actionStyle: "bg-purple-50 text-purple-600 border-purple-100",
    module: "Documents",
    moduleIcon: "📁",
    resource: "INV-2036-1248.pdf",
    details: "Added comment to document",
    ipAddress: "192.168.1.48",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    sessionId: "sess_1a2b3c4d5e6f7a8b",
  },
  {
    id: "LOG-1006",
    date: "29 May 2026",
    time: "04:18 PM",
    user: {
      name: "Investigator",
      email: "investigator@doctrace.ai",
      initials: "IN",
      avatarBg: "bg-blue-100 text-blue-600",
    },
    action: "STATUS UPDATED",
    actionStyle: "bg-amber-50 text-amber-700 border-amber-200",
    module: "Alerts",
    moduleIcon: "🔔",
    resource: "ALT-2026-0084",
    details: "Status changed to Investigating",
    ipAddress: "192.168.1.45",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    sessionId: "sess_8f2d4a6b7c9e4f1a",
  },
  {
    id: "LOG-1007",
    date: "28 May 2026",
    time: "03:05 PM",
    user: {
      name: "Sneha Mehta",
      email: "sneha.mehta@doctrace.ai",
      initials: "SM",
      avatarBg: "bg-yellow-100 text-yellow-700",
    },
    action: "STATUS UPDATED",
    actionStyle: "bg-amber-50 text-amber-700 border-amber-200",
    module: "Alerts",
    moduleIcon: "🔔",
    resource: "ALT-2026-0083",
    details: "Status changed to In Review",
    ipAddress: "192.168.1.50",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    sessionId: "sess_9c8b7a6f5e4d3c2b",
  },
  {
    id: "LOG-1008",
    date: "28 May 2026",
    time: "03:05 PM",
    user: {
      name: "Investigator",
      email: "investigator@doctrace.ai",
      initials: "IN",
      avatarBg: "bg-blue-100 text-blue-600",
    },
    action: "DOCUMENT CLOSED",
    actionStyle: "bg-slate-100 text-slate-700 border-slate-200",
    module: "Documents",
    moduleIcon: "📁",
    resource: "INV-2036-1225.pdf",
    details: "Document review completed",
    ipAddress: "192.168.1.45",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    sessionId: "sess_8f2d4a6b7c9e4f1a",
  },
  {
    id: "LOG-1009",
    date: "29 May 2026",
    time: "11:40 AM",
    user: {
      name: "Arjun Singh",
      email: "arjun.singh@doctrace.ai",
      initials: "AR",
      avatarBg: "bg-emerald-100 text-emerald-700",
    },
    action: "DOCUMENT CLOSED",
    actionStyle: "bg-slate-100 text-slate-700 border-slate-200",
    module: "Documents",
    moduleIcon: "📁",
    resource: "INV-2036-1220.pdf",
    details: "Document review completed",
    ipAddress: "192.168.1.52",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    sessionId: "sess_3b4c5d6e7f8a9b0c",
  },
  {
    id: "LOG-1010",
    date: "27 May 2026",
    time: "02:28 PM",
    user: {
      name: "Priya Sharma",
      email: "priya.sharma@doctrace.ai",
      initials: "PR",
      avatarBg: "bg-purple-100 text-purple-700",
    },
    action: "ALERT CREATED",
    actionStyle: "bg-red-50 text-red-600 border-red-200",
    module: "Alerts",
    moduleIcon: "🔔",
    resource: "ALT-2026-0080",
    details: "Medium risk alert generated (0.901)",
    ipAddress: "192.168.1.48",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    sessionId: "sess_1a2b3c4d5e6f7a8b",
  },
];

// Activity by Module Donut Data
const moduleActivityData = [
  { name: "Documents", count: "642 (51.4%)", value: 642, color: "#2563eb" },
  { name: "Alerts", count: "312 (25.0%)", value: 312, color: "#ef4444" },
  { name: "Analysis", count: "156 (12.5%)", value: 156, color: "#10b981" },
  { name: "Users", count: "84 (6.7%)", value: 84, color: "#f59e0b" },
  { name: "Others", count: "54 (4.4%)", value: 54, color: "#8b5cf6" },
];

export default function AuditLogsPage() {
  const user = useAuthStore((state) => state.user);

  const [dateRange, setDateRange] = useState("01 May 2026 - 29 May 2026");
  const [userFilter, setUserFilter] = useState("All Users");
  const [actionFilter, setActionFilter] = useState("All Actions");
  const [moduleFilter, setModuleFilter] = useState("All Modules");
  const [selectedLog, setSelectedLog] = useState(initialAuditLogs[0]);
  const [rowsPerPage, setRowsPerPage] = useState("10");

  // Filter logs
  const filteredLogs = initialAuditLogs.filter((log) => {
    if (userFilter !== "All Users" && log.user.name !== userFilter) return false;
    if (actionFilter !== "All Actions" && log.action !== actionFilter) return false;
    if (moduleFilter !== "All Modules" && log.module !== moduleFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-10 font-sans text-slate-800">
      
      {/* ================= TOP HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1 pb-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Audit Logs
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Track and review all system activities
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
              1
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

      {/* ================= FILTER TOOLBAR ================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/70 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Selector */}
          <div className="relative">
            <button className="inline-flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold py-1.5 px-3 rounded-lg shadow-2xs transition cursor-pointer">
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth={2} />
                <line x1="16" y1="2" x2="16" y2="6" strokeWidth={2} strokeLinecap="round" />
                <line x1="8" y1="2" x2="8" y2="6" strokeWidth={2} strokeLinecap="round" />
                <line x1="3" y1="10" x2="21" y2="10" strokeWidth={2} />
              </svg>
              <span>{dateRange}</span>
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* User Dropdown */}
          <div className="relative">
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold py-1.5 pl-3 pr-7 rounded-lg shadow-2xs focus:outline-none appearance-none cursor-pointer"
            >
              <option value="All Users">👤 All Users</option>
              <option value="Investigator">Investigator</option>
              <option value="Arjun Singh">Arjun Singh</option>
              <option value="Priya Sharma">Priya Sharma</option>
              <option value="Sneha Mehta">Sneha Mehta</option>
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Action Dropdown */}
          <div className="relative">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold py-1.5 pl-3 pr-7 rounded-lg shadow-2xs focus:outline-none appearance-none cursor-pointer"
            >
              <option value="All Actions">▦ All Actions</option>
              <option value="UPLOADED">UPLOADED</option>
              <option value="ANALYZED">ANALYZED</option>
              <option value="ALERT CREATED">ALERT CREATED</option>
              <option value="STATUS UPDATED">STATUS UPDATED</option>
              <option value="COMMENT ADDED">COMMENT ADDED</option>
              <option value="DOCUMENT CLOSED">DOCUMENT CLOSED</option>
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Module Dropdown */}
          <div className="relative">
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold py-1.5 pl-3 pr-7 rounded-lg shadow-2xs focus:outline-none appearance-none cursor-pointer"
            >
              <option value="All Modules">㗊 All Modules</option>
              <option value="Documents">Documents</option>
              <option value="Analysis">Analysis</option>
              <option value="Alerts">Alerts</option>
              <option value="Users">Users</option>
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {}}
            className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold py-1.5 px-3 rounded-lg shadow-2xs transition cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            <span>Filters</span>
          </button>

          <button
            onClick={() => alert("Exporting audit logs...")}
            className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold py-1.5 px-3 rounded-lg shadow-2xs transition cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Export Logs</span>
          </button>
        </div>
      </div>

      {/* ================= FOUR TOP STAT CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Activities */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/70 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <div className="w-7 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-xs">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Activities</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 leading-tight">1,248</span>
              <span className="text-[11px] font-semibold text-emerald-600">↑ 18.7%</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">vs 01 Apr - 30 Apr 2026</p>
          </div>
        </div>

        {/* Card 2: Active Users */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/70 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <div className="w-7 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-xs">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Active Users</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 leading-tight">36</span>
              <span className="text-[11px] font-semibold text-emerald-600">↑ 12.5%</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">vs previous period</p>
          </div>
        </div>

        {/* Card 3: Critical Actions */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/70 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <div className="w-7 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white shadow-xs">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Critical Actions</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 leading-tight">24</span>
              <span className="text-[11px] font-semibold text-red-500">↑ 26.3%</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Require attention</p>
          </div>
        </div>

        {/* Card 4: Failed Attempts */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/70 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0">
            <div className="w-7 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-white shadow-xs">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Failed Attempts</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 leading-tight">8</span>
              <span className="text-[11px] font-semibold text-emerald-600">↓ 11.1%</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Security events</p>
          </div>
        </div>

      </div>

      {/* ================= MAIN CONTENT: AUDIT LOGS TABLE + RIGHT PANEL ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ================= LEFT SECTION: AUDIT LOGS TABLE (LG: 8 COLS) ================= */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200/70 space-y-4">
          
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Audit Log Entries (1,248)
          </h2>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10.5px] font-semibold text-slate-500">
                  <th className="pb-3 pr-1 font-bold whitespace-nowrap">Date & Time ↓</th>
                  <th className="pb-3 px-1 font-bold whitespace-nowrap">User</th>
                  <th className="pb-3 px-1 font-bold whitespace-nowrap">Action</th>
                  <th className="pb-3 px-1 font-bold whitespace-nowrap">Module</th>
                  <th className="pb-3 px-1 font-bold whitespace-nowrap">Resource</th>
                  <th className="pb-3 px-1 font-bold whitespace-nowrap">Details</th>
                  <th className="pb-3 pl-1 font-bold whitespace-nowrap">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => {
                  const isSelected = selectedLog.id === log.id;
                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-blue-50/50" : "hover:bg-slate-50/80"
                      }`}
                    >
                      {/* Date & Time */}
                      <td className="py-2.5 pr-1 whitespace-nowrap">
                        <p className="font-medium text-slate-800 text-[10.5px]">{log.date}</p>
                        <p className="text-[9.5px] text-slate-400">{log.time}</p>
                      </td>

                      {/* User */}
                      <td className="py-2.5 px-1 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0 ${log.user.avatarBg}`}>
                            {log.user.initials}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-[11px] leading-tight">
                              {log.user.name}
                            </p>
                            <p className="text-[9.5px] text-slate-400">
                              {log.user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Action Pill */}
                      <td className="py-2.5 px-1 whitespace-nowrap">
                        <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold border ${log.actionStyle}`}>
                          {log.action}
                        </span>
                      </td>

                      {/* Module */}
                      <td className="py-2.5 px-1 text-slate-700 text-[10.5px] whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <span>{log.moduleIcon}</span>
                          <span>{log.module}</span>
                        </div>
                      </td>

                      {/* Resource */}
                      <td className="py-2.5 px-1 font-mono text-slate-600 text-[10.5px] whitespace-nowrap">
                        {log.resource}
                      </td>

                      {/* Details */}
                      <td className="py-2.5 px-1 text-slate-700 text-[10.5px] whitespace-nowrap max-w-[150px] truncate" title={log.details}>
                        {log.details}
                      </td>

                      {/* IP Address */}
                      <td className="py-2.5 pl-1 font-mono text-slate-500 text-[10.5px] whitespace-nowrap">
                        {log.ipAddress}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer Pagination */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <p className="text-xs text-slate-400 font-medium">
              Showing 1 to 10 of 1,248 entries
            </p>

            <div className="flex items-center gap-1.5 self-center sm:self-auto">
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
                125
              </button>
              <button className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer">
                ›
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 self-end sm:self-auto">
              <span>Rows per page:</span>
              <div className="relative">
                <select
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold py-1 pl-2 pr-5 rounded-md focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

        </div>


        {/* ================= RIGHT SECTION: LOG DETAILS + ACTIVITY BY MODULE (LG: 4 COLS) ================= */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Card 1: Log Details */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/70 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Log Details
              </h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${selectedLog.actionStyle}`}>
                {selectedLog.action}
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-500 font-medium flex items-center gap-1.5 flex-shrink-0">
                  <span>🕒</span>
                  <span>Date & Time</span>
                </span>
                <span className="font-semibold text-slate-800 text-right">
                  {selectedLog.date}, {selectedLog.time}
                </span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-500 font-medium flex items-center gap-1.5 flex-shrink-0">
                  <span>👤</span>
                  <span>User</span>
                </span>
                <div className="text-right">
                  <p className="font-bold text-slate-900">{selectedLog.user.name}</p>
                  <p className="text-[10px] text-slate-400">{selectedLog.user.email}</p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <span>📁</span>
                  <span>Module</span>
                </span>
                <span className="font-semibold text-slate-800">{selectedLog.module}</span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <span>📄</span>
                  <span>Resource</span>
                </span>
                <span className="font-mono text-slate-800 text-[11px] font-semibold">{selectedLog.resource}</span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <span>🌐</span>
                  <span>IP Address</span>
                </span>
                <span className="font-mono text-slate-800 text-[11px]">{selectedLog.ipAddress}</span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-500 font-medium flex items-center gap-1.5 flex-shrink-0">
                  <span>💻</span>
                  <span>User Agent</span>
                </span>
                <span className="text-[10px] text-slate-600 text-right max-w-[180px] break-words">
                  {selectedLog.userAgent}
                </span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-500 font-medium flex items-center gap-1.5 flex-shrink-0">
                  <span>📝</span>
                  <span>Details</span>
                </span>
                <span className="font-medium text-slate-800 text-right max-w-[180px]">
                  {selectedLog.details}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <span>🔑</span>
                  <span>Session ID</span>
                </span>
                <span className="font-mono text-slate-600 text-[10.5px]">{selectedLog.sessionId}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Activity by Module */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/70">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Activity by Module
            </h3>

            <div className="flex items-center gap-4">
              {/* Donut Chart */}
              <div className="w-28 h-28 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={moduleActivityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={48}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {moduleActivityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend Breakdown */}
              <div className="space-y-1.5 flex-1 text-xs">
                {moduleActivityData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="font-semibold text-slate-700 text-[11px]">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-800 text-[10.5px]">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom View All Link */}
            <div className="mt-4 pt-2.5 border-t border-slate-100 text-right">
              <Link
                to="/reports"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Audit Report</span>
                <span>→</span>
              </Link>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
