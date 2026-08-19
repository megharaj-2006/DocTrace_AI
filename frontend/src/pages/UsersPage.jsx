import { useState } from "react";
import { Link } from "react-router-dom";
import useAuthStore from "../store/authStore";

// Mock 10 Users Dataset matching reference design
const initialUsers = [
  {
    id: "USR-001",
    name: "Investigator",
    isCurrentUser: true,
    email: "investigator@doctrace.ai",
    initials: "IN",
    avatarBg: "bg-blue-100 text-blue-600",
    role: "Investigator",
    department: "Fraud Investigation",
    status: "Active",
    lastActiveDate: "29 May 2026",
    lastActiveTime: "02:35 PM",
    joinedOn: "12 Jan 2024",
    phone: "+91 98765 43210",
  },
  {
    id: "USR-002",
    name: "Arjun Singh",
    isCurrentUser: false,
    email: "arjun.singh@doctrace.ai",
    initials: "AR",
    avatarBg: "bg-emerald-100 text-emerald-700",
    role: "Investigator",
    department: "Fraud Investigation",
    status: "Active",
    lastActiveDate: "29 May 2026",
    lastActiveTime: "01:15 PM",
    joinedOn: "18 Feb 2024",
    phone: "+91 98765 43211",
  },
  {
    id: "USR-003",
    name: "Priya Sharma",
    isCurrentUser: false,
    email: "priya.sharma@doctrace.ai",
    initials: "PR",
    avatarBg: "bg-purple-100 text-purple-700",
    role: "Analyst",
    department: "Data Analysis",
    status: "Active",
    lastActiveDate: "29 May 2026",
    lastActiveTime: "11:22 AM",
    joinedOn: "05 Mar 2024",
    phone: "+91 98765 43212",
  },
  {
    id: "USR-004",
    name: "Rohan Kumar",
    isCurrentUser: false,
    email: "rohan.kumar@doctrace.ai",
    initials: "RK",
    avatarBg: "bg-amber-100 text-amber-700",
    role: "Analyst",
    department: "Data Analysis",
    status: "Active",
    lastActiveDate: "29 May 2026",
    lastActiveTime: "10:05 AM",
    joinedOn: "22 Mar 2024",
    phone: "+91 98765 43213",
  },
  {
    id: "USR-005",
    name: "Sneha Mehta",
    isCurrentUser: false,
    email: "sneha.mehta@doctrace.ai",
    initials: "SM",
    avatarBg: "bg-yellow-100 text-yellow-700",
    role: "Viewer",
    department: "Compliance",
    status: "Active",
    lastActiveDate: "28 May 2026",
    lastActiveTime: "04:45 PM",
    joinedOn: "10 Apr 2024",
    phone: "+91 98765 43214",
  },
  {
    id: "USR-006",
    name: "Deepak Patel",
    isCurrentUser: false,
    email: "deepak.patel@doctrace.ai",
    initials: "DP",
    avatarBg: "bg-teal-100 text-teal-700",
    role: "Investigator",
    department: "Fraud Investigation",
    status: "Active",
    lastActiveDate: "28 May 2026",
    lastActiveTime: "03:30 PM",
    joinedOn: "15 Apr 2024",
    phone: "+91 98765 43215",
  },
  {
    id: "USR-007",
    name: "Neha Joshi",
    isCurrentUser: false,
    email: "neha.joshi@doctrace.ai",
    initials: "NJ",
    avatarBg: "bg-rose-100 text-rose-700",
    role: "Analyst",
    department: "Data Analysis",
    status: "Active",
    lastActiveDate: "28 May 2026",
    lastActiveTime: "02:10 PM",
    joinedOn: "02 May 2024",
    phone: "+91 98765 43216",
  },
  {
    id: "USR-008",
    name: "Amit Soni",
    isCurrentUser: false,
    email: "amit.soni@doctrace.ai",
    initials: "AS",
    avatarBg: "bg-cyan-100 text-cyan-700",
    role: "Viewer",
    department: "Compliance",
    status: "Inactive",
    lastActiveDate: "20 May 2026",
    lastActiveTime: "09:15 AM",
    joinedOn: "18 May 2024",
    phone: "+91 98765 43217",
  },
  {
    id: "USR-009",
    name: "Karan Bansal",
    isCurrentUser: false,
    email: "karan.bansal@doctrace.ai",
    initials: "KB",
    avatarBg: "bg-emerald-100 text-emerald-700",
    role: "Investigator",
    department: "Fraud Investigation",
    status: "Active",
    lastActiveDate: "19 May 2026",
    lastActiveTime: "11:30 AM",
    joinedOn: "01 Jun 2024",
    phone: "+91 98765 43218",
  },
  {
    id: "USR-010",
    name: "Pooja Tiwari",
    isCurrentUser: false,
    email: "pooja.tiwari@doctrace.ai",
    initials: "PT",
    avatarBg: "bg-violet-100 text-violet-700",
    role: "Analyst",
    department: "Data Analysis",
    status: "Inactive",
    lastActiveDate: "15 May 2026",
    lastActiveTime: "05:20 PM",
    joinedOn: "12 Jun 2024",
    phone: "+91 98765 43219",
  },
];

// Recent Activity Items for Selected User
const mockUserActivity = [
  {
    id: "1",
    title: "Logged in to the system",
    dateTime: "29 May 2026, 02:35 PM",
    iconBg: "bg-emerald-50 text-emerald-600",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  {
    id: "2",
    title: "Analyzed document INV-2036-1250.pdf",
    dateTime: "29 May 2026, 02:20 PM",
    iconBg: "bg-blue-50 text-blue-600",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: "3",
    title: "Updated risk level for INV-2036-1249.pdf",
    dateTime: "29 May 2026, 01:45 PM",
    iconBg: "bg-amber-50 text-amber-500",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  {
    id: "4",
    title: "Exported report - May 2026",
    dateTime: "29 May 2026, 01:30 PM",
    iconBg: "bg-purple-50 text-purple-600",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    ),
  },
];

// Role Pill Component
const RolePill = ({ role }) => {
  if (role === "Investigator") {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-100">
        Investigator
      </span>
    );
  }
  if (role === "Analyst") {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-600 border border-purple-100">
        Analyst
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
      Viewer
    </span>
  );
};

export default function UsersPage() {
  const user = useAuthStore((state) => state.user);

  const [activeTab, setActiveTab] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(initialUsers[0]);

  // Filter users by tab, role, and search
  const filteredUsers = initialUsers.filter((u) => {
    if (activeTab === "INVESTIGATOR" && u.role !== "Investigator") return false;
    if (activeTab === "ANALYST" && u.role !== "Analyst") return false;
    if (activeTab === "VIEWER" && u.role !== "Viewer") return false;
    if (roleFilter !== "All" && u.role !== roleFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.department.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-10 font-sans text-slate-800">
      
      {/* ================= TOP HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1 pb-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Users
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Manage system users and their access
          </p>
        </div>

        {/* Top Right Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <svg
              className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8.5 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 w-52 shadow-2xs transition"
            />
          </div>

          {/* Filters Button */}
          <button
            onClick={() => {}}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold py-2 px-3 rounded-lg shadow-2xs transition cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            <span>Filters</span>
          </button>

          {/* Add User Button */}
          <button
            onClick={() => alert("Add User Modal / Form")}
            className="inline-flex items-center gap-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] active:bg-[#1e40af] text-white text-xs font-semibold py-2 px-3.5 rounded-lg shadow-xs transition cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Add User</span>
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

      {/* ================= FIVE TOP STAT CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        
        {/* Card 1: Total Users */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/70 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-slate-500 leading-tight">Total Users</p>
            <p className="text-2xl font-bold text-slate-900 leading-tight mt-0.5">42</p>
            <p className="text-[10px] font-semibold text-emerald-600 mt-0.5">↑ 12% from last month</p>
          </div>
        </div>

        {/* Card 2: Active Users */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/70 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-slate-500 leading-tight">Active Users</p>
            <p className="text-2xl font-bold text-slate-900 leading-tight mt-0.5">36</p>
            <p className="text-[10px] font-semibold text-emerald-600 mt-0.5">85.7% of total</p>
          </div>
        </div>

        {/* Card 3: Investigators */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/70 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-slate-500 leading-tight">Investigators</p>
            <p className="text-2xl font-bold text-slate-900 leading-tight mt-0.5">28</p>
            <p className="text-[10px] font-semibold text-amber-500 mt-0.5">66.7% of total</p>
          </div>
        </div>

        {/* Card 4: Analysts */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/70 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-slate-500 leading-tight">Analysts</p>
            <p className="text-2xl font-bold text-slate-900 leading-tight mt-0.5">10</p>
            <p className="text-[10px] font-semibold text-purple-600 mt-0.5">23.8% of total</p>
          </div>
        </div>

        {/* Card 5: Inactive Users */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/70 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-slate-500 leading-tight">Inactive Users</p>
            <p className="text-2xl font-bold text-slate-900 leading-tight mt-0.5">6</p>
            <p className="text-[10px] font-semibold text-red-500 mt-0.5">14.3% of total</p>
          </div>
        </div>

      </div>

      {/* ================= MAIN CONTENT: ALL USERS TABLE + USER DETAILS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ================= LEFT SECTION: ALL USERS TABLE (LG: 8 COLS) ================= */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200/70 space-y-4">
          
          {/* Header Tabs & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            
            {/* Tabs */}
            <div className="flex items-center gap-4 overflow-x-auto pb-1 sm:pb-0 text-xs font-semibold">
              <button
                onClick={() => setActiveTab("ALL")}
                className={`pb-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
                  activeTab === "ALL"
                    ? "border-blue-600 text-blue-600 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                All Users (42)
              </button>

              <button
                onClick={() => setActiveTab("INVESTIGATOR")}
                className={`pb-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
                  activeTab === "INVESTIGATOR"
                    ? "border-blue-600 text-blue-600 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Investigators (28)
              </button>

              <button
                onClick={() => setActiveTab("ANALYST")}
                className={`pb-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
                  activeTab === "ANALYST"
                    ? "border-blue-600 text-blue-600 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Analysts (10)
              </button>

              <button
                onClick={() => setActiveTab("VIEWER")}
                className={`pb-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
                  activeTab === "VIEWER"
                    ? "border-blue-600 text-blue-600 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Viewers (4)
              </button>
            </div>

            {/* Right Controls: Role & Columns */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <div className="relative">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold py-1.5 pl-2.5 pr-6 rounded-lg shadow-2xs focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="All">Role: All</option>
                  <option value="Investigator">Investigator</option>
                  <option value="Analyst">Analyst</option>
                  <option value="Viewer">Viewer</option>
                </select>
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <button
                onClick={() => {}}
                className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold py-1.5 px-3 rounded-lg shadow-2xs transition cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
                <span>Columns</span>
              </button>
            </div>

          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10.5px] font-semibold text-slate-500">
                  <th className="pb-3 pr-1 font-bold whitespace-nowrap">User</th>
                  <th className="pb-3 px-1 font-bold whitespace-nowrap">Role</th>
                  <th className="pb-3 px-1 font-bold whitespace-nowrap">Department</th>
                  <th className="pb-3 px-1 font-bold text-center whitespace-nowrap">Status</th>
                  <th className="pb-3 px-1 font-bold whitespace-nowrap">Last Active</th>
                  <th className="pb-3 px-1 font-bold whitespace-nowrap">Joined On</th>
                  <th className="pb-3 pl-1 font-bold text-center whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const isSelected = selectedUser.id === u.id;
                  return (
                    <tr
                      key={u.id}
                      onClick={() => setSelectedUser(u)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-blue-50/50" : "hover:bg-slate-50/80"
                      }`}
                    >
                      {/* User Avatar + Name + Email */}
                      <td className="py-3 pr-1 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${u.avatarBg}`}>
                            {u.initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 text-xs">
                                {u.name}
                              </span>
                              {u.isCurrentUser && (
                                <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role Pill */}
                      <td className="py-3 px-1 whitespace-nowrap">
                        <RolePill role={u.role} />
                      </td>

                      {/* Department */}
                      <td className="py-3 px-1 text-slate-700 text-[11px] whitespace-nowrap">
                        {u.department}
                      </td>

                      {/* Status Pill */}
                      <td className="py-3 px-1 text-center whitespace-nowrap">
                        {u.status === "Active" ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200">
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Last Active */}
                      <td className="py-3 px-1 whitespace-nowrap">
                        <p className="font-medium text-slate-800 text-[10.5px]">{u.lastActiveDate}</p>
                        <p className="text-[9.5px] text-slate-400">{u.lastActiveTime}</p>
                      </td>

                      {/* Joined On */}
                      <td className="py-3 px-1 text-slate-600 text-[11px] whitespace-nowrap">
                        {u.joinedOn}
                      </td>

                      {/* Actions */}
                      <td className="py-3 pl-1 text-center whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          className="p-1 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                          title="Options"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="5" r="2" />
                            <circle cx="12" cy="12" r="2" />
                            <circle cx="12" cy="19" r="2" />
                          </svg>
                        </button>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer Pagination */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-slate-400 font-medium">
              Showing 1 to 10 of 42 users
            </p>

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
              <button className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer">
                ›
              </button>
            </div>
          </div>

        </div>


        {/* ================= RIGHT SECTION: USER DETAILS & RECENT ACTIVITY (LG: 4 COLS) ================= */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Card 1: User Details */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/70 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              User Details
            </h3>

            {/* Avatar & Name Banner */}
            <div className="flex items-center gap-3.5 pb-3 border-b border-slate-100">
              <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-bold flex-shrink-0">
                {selectedUser.initials}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-slate-900 text-sm truncate">
                    {selectedUser.name}
                  </h4>
                  {selectedUser.isCurrentUser && (
                    <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-blue-50 text-blue-600 border border-blue-100 flex-shrink-0">
                      You
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {selectedUser.email}
                </p>
                <div className="mt-1.5">
                  {selectedUser.status === "Active" ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200">
                      Inactive
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* User Metadata Grid */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <span>👤</span>
                  <span>Role</span>
                </span>
                <span className="font-semibold text-slate-800">{selectedUser.role}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <span>🏛️</span>
                  <span>Department</span>
                </span>
                <span className="font-semibold text-slate-800">{selectedUser.department}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <span>📅</span>
                  <span>Joined On</span>
                </span>
                <span className="font-semibold text-slate-800">{selectedUser.joinedOn}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <span>🕒</span>
                  <span>Last Active</span>
                </span>
                <span className="font-semibold text-slate-800">
                  {selectedUser.lastActiveDate}, {selectedUser.lastActiveTime}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <span>📞</span>
                  <span>Phone</span>
                </span>
                <span className="font-semibold text-slate-800">{selectedUser.phone}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 pt-2">
              <button
                onClick={() => alert(`Viewing full profile for ${selectedUser.name}`)}
                className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs py-2 px-3 rounded-xl transition shadow-2xs text-center cursor-pointer"
              >
                View Profile
              </button>
              <button
                onClick={() => alert(`Editing user: ${selectedUser.name}`)}
                className="flex-1 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold text-xs py-2 px-3 rounded-xl transition shadow-xs text-center flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>✏️</span>
                <span>Edit User</span>
              </button>
            </div>
          </div>

          {/* Card 2: Recent Activity */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/70 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Recent Activity
              </h3>
              <button
                onClick={() => {}}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {mockUserActivity.map((act) => (
                <div key={act.id} className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${act.iconBg}`}>
                    {act.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 leading-tight">
                      {act.title}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {act.dateTime}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}