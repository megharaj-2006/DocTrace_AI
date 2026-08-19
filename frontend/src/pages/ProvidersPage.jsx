import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

// Mock Providers Dataset matching reference design
const initialProviders = [
  {
    id: "PRV-1001",
    name: "Apollo Hospitals",
    email: "apollo.hospitals@healthcare.in",
    logoColor: "bg-blue-600 text-white",
    logoIcon: "➕",
    documents: "2,842",
    highRiskDocs: "356 (12.5%)",
    highRiskColor: "text-red-600 font-semibold",
    riskScore: 0.78,
    riskBadgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    status: "Active",
    location: "Bangalore, Karnataka",
    joined: "12 Jan 2024",
    medRiskDocs: "587 (20.6%)",
    lowRiskDocs: "1,899 (66.9%)",
  },
  {
    id: "PRV-1002",
    name: "City Care Clinic",
    email: "citycare.clinic@healthcare.in",
    logoColor: "bg-red-500 text-white",
    logoIcon: "❤️",
    documents: "1,932",
    highRiskDocs: "198 (10.2%)",
    highRiskColor: "text-amber-600 font-semibold",
    riskScore: 0.65,
    riskBadgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    status: "Active",
    location: "Mumbai, Maharashtra",
    joined: "05 Feb 2024",
    medRiskDocs: "412 (21.3%)",
    lowRiskDocs: "1,322 (68.4%)",
  },
  {
    id: "PRV-1003",
    name: "Sunrise Diagnostics",
    email: "sunrise.diagnostics@healthcare.in",
    logoColor: "bg-amber-500 text-white",
    logoIcon: "☀️",
    documents: "1,643",
    highRiskDocs: "142 (8.6%)",
    highRiskColor: "text-amber-600 font-semibold",
    riskScore: 0.58,
    riskBadgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    status: "Active",
    location: "Hyderabad, Telangana",
    joined: "18 Mar 2024",
    medRiskDocs: "310 (18.9%)",
    lowRiskDocs: "1,191 (72.5%)",
  },
  {
    id: "PRV-1004",
    name: "Metro Health Center",
    email: "metro.health@healthcare.in",
    logoColor: "bg-indigo-600 text-white",
    logoIcon: "Ⓜ️",
    documents: "1,287",
    highRiskDocs: "76 (5.9%)",
    highRiskColor: "text-amber-600 font-semibold",
    riskScore: 0.42,
    riskBadgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    status: "Active",
    location: "Delhi, NCR",
    joined: "22 Apr 2024",
    medRiskDocs: "215 (16.7%)",
    lowRiskDocs: "996 (77.4%)",
  },
  {
    id: "PRV-1005",
    name: "HealthPlus Clinic",
    email: "healthplus.clinic@healthcare.in",
    logoColor: "bg-emerald-600 text-white",
    logoIcon: "🟢",
    documents: "1,156",
    highRiskDocs: "54 (4.7%)",
    highRiskColor: "text-amber-600 font-semibold",
    riskScore: 0.35,
    riskBadgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    status: "Active",
    location: "Chennai, Tamil Nadu",
    joined: "10 May 2024",
    medRiskDocs: "168 (14.5%)",
    lowRiskDocs: "934 (80.8%)",
  },
  {
    id: "PRV-1006",
    name: "WellCare Hospital",
    email: "wellcare.hospital@healthcare.in",
    logoColor: "bg-cyan-600 text-white",
    logoIcon: "🏥",
    documents: "998",
    highRiskDocs: "28 (2.8%)",
    highRiskColor: "text-emerald-600 font-semibold",
    riskScore: 0.22,
    riskBadgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    status: "Active",
    location: "Pune, Maharashtra",
    joined: "02 Jun 2024",
    medRiskDocs: "94 (9.4%)",
    lowRiskDocs: "876 (87.8%)",
  },
  {
    id: "PRV-1007",
    name: "LifeLine Medical Center",
    email: "lifeline.medical@healthcare.in",
    logoColor: "bg-rose-500 text-white",
    logoIcon: "💗",
    documents: "765",
    highRiskDocs: "16 (2.1%)",
    highRiskColor: "text-emerald-600 font-semibold",
    riskScore: 0.18,
    riskBadgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    status: "Active",
    location: "Kolkata, West Bengal",
    joined: "15 Jun 2024",
    medRiskDocs: "62 (8.1%)",
    lowRiskDocs: "687 (89.8%)",
  },
  {
    id: "PRV-1008",
    name: "CarePoint Clinic",
    email: "carepoint.clinic@healthcare.in",
    logoColor: "bg-teal-600 text-white",
    logoIcon: "🩺",
    documents: "543",
    highRiskDocs: "9 (1.7%)",
    highRiskColor: "text-emerald-600 font-semibold",
    riskScore: 0.12,
    riskBadgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    status: "Active",
    location: "Ahmedabad, Gujarat",
    joined: "28 Jun 2024",
    medRiskDocs: "38 (7.0%)",
    lowRiskDocs: "496 (91.3%)",
  },
];

// Recent Activity Items for Selected Provider
const mockRecentActivity = [
  {
    id: "1",
    title: "New high risk document detected",
    docName: "INV-2036-1250.pdf",
    dateTime: "29 May 2026, 02:35 PM",
    iconBg: "bg-red-50 text-red-500",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: "2",
    title: "Document under review",
    docName: "INV-2036-1249.pdf",
    dateTime: "29 May 2026, 01:51 PM",
    iconBg: "bg-amber-50 text-amber-500",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: "3",
    title: "Document approved",
    docName: "INV-2036-1248.pdf",
    dateTime: "29 May 2026, 11:22 AM",
    iconBg: "bg-emerald-50 text-emerald-600",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  {
    id: "4",
    title: "New document uploaded",
    docName: "INV-2036-1247.pdf",
    dateTime: "29 May 2026, 10:15 AM",
    iconBg: "bg-blue-50 text-blue-500",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
    ),
  },
];

export default function ProvidersPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProvider, setSelectedProvider] = useState(initialProviders[0]);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter providers by search
  const filteredProviders = initialProviders.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-10 font-sans text-slate-800">
      
      {/* ================= TOP HEADER ================= */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pt-1 pb-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Providers
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Manage and monitor healthcare providers
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
              placeholder="Search providers..."
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

          {/* Add Provider Button */}
          <button
            onClick={() => alert("Add Provider Modal / Form")}
            className="inline-flex items-center gap-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] active:bg-[#1e40af] text-white text-xs font-semibold py-2 px-3.5 rounded-lg shadow-xs transition cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Provider</span>
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

      {/* ================= FOUR TOP STAT CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Providers */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/70 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Providers</p>
            <p className="text-2xl font-bold text-slate-900 leading-tight mt-0.5">128</p>
            <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">Active in system</p>
          </div>
        </div>

        {/* Card 2: High Risk Providers */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/70 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">High Risk Providers</p>
            <p className="text-2xl font-bold text-slate-900 leading-tight mt-0.5">23</p>
            <p className="text-[11px] font-semibold text-red-500 mt-0.5">18.0% of total</p>
          </div>
        </div>

        {/* Card 3: Total Documents */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/70 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Documents</p>
            <p className="text-2xl font-bold text-slate-900 leading-tight mt-0.5">15,842</p>
            <p className="text-[11px] font-medium text-slate-400 mt-0.5">Across all providers</p>
          </div>
        </div>

        {/* Card 4: Flagged Documents */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/70 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Flagged Documents</p>
            <p className="text-2xl font-bold text-slate-900 leading-tight mt-0.5">1,246</p>
            <p className="text-[11px] font-medium text-slate-400 mt-0.5">7.9% of total</p>
          </div>
        </div>

      </div>

      {/* ================= MAIN CONTENT: ALL PROVIDERS TABLE + RIGHT SIDEBAR ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ================= LEFT SECTION: ALL PROVIDERS TABLE (LG: 8 COLS) ================= */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200/70 space-y-4">
          
          <h2 className="text-sm font-bold text-slate-900">
            All Providers
          </h2>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-500">
                  <th className="pb-3 pr-1 font-bold whitespace-nowrap">Provider Name</th>
                  <th className="pb-3 px-1 font-bold whitespace-nowrap">Provider ID</th>
                  <th className="pb-3 px-1 font-bold text-right whitespace-nowrap">Documents</th>
                  <th className="pb-3 px-1 font-bold text-right whitespace-nowrap">High Risk Docs</th>
                  <th className="pb-3 px-1 font-bold text-center whitespace-nowrap">Risk Score</th>
                  <th className="pb-3 px-1 font-bold text-center whitespace-nowrap">Status</th>
                  <th className="pb-3 pl-1 font-bold text-center whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProviders.map((prov) => {
                  const isSelected = selectedProvider.id === prov.id;
                  return (
                    <tr
                      key={prov.id}
                      onClick={() => setSelectedProvider(prov)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-blue-50/50" : "hover:bg-slate-50/80"
                      }`}
                    >
                      {/* Provider Name + Email */}
                      <td className="py-3 pr-2 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 text-sm shadow-2xs">
                            {prov.logoIcon}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs hover:text-blue-600 transition">
                              {prov.name}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {prov.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Provider ID */}
                      <td className="py-3 px-2 font-medium text-slate-600 text-[11px] whitespace-nowrap">
                        {prov.id}
                      </td>

                      {/* Documents */}
                      <td className="py-3 px-2 text-right font-medium text-slate-700 whitespace-nowrap">
                        {prov.documents}
                      </td>

                      {/* High Risk Docs */}
                      <td className={`py-3 px-2 text-right whitespace-nowrap ${prov.highRiskColor}`}>
                        {prov.highRiskDocs}
                      </td>

                      {/* Risk Score Pill */}
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10.5px] font-bold border ${prov.riskBadgeColor}`}>
                          {prov.riskScore.toFixed(2)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {prov.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 pl-2 text-center whitespace-nowrap">
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
              Showing 1 to 8 of 128 providers
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
              <span className="text-slate-400 text-xs px-1">...</span>
              <button className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer">
                16
              </button>
              <button className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer">
                ›
              </button>
            </div>
          </div>

        </div>


        {/* ================= RIGHT SECTION: 3 DETAIL CARDS (LG: 4 COLS) ================= */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Card 1: Provider Overview */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/70">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Provider Overview
              </h3>
              <button
                onClick={() => {}}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                View Full Profile →
              </button>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center text-xl flex-shrink-0 shadow-2xs">
                {selectedProvider.logoIcon}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-slate-900 text-sm truncate">
                    {selectedProvider.name}
                  </h4>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex-shrink-0">
                    Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  {selectedProvider.id}
                </p>
                <p className="text-xs text-slate-600 mt-1 truncate">
                  {selectedProvider.email}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  <span>📍</span>
                  <span>{selectedProvider.location}</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                  <span>📅</span>
                  <span>Joined on {selectedProvider.joined}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Risk Summary with Semicircle Gauge */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/70">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Risk Summary
            </h3>

            <div className="flex flex-col sm:flex-row items-center gap-4 pb-3 border-b border-slate-100">
              {/* Semi-circle Gauge SVG */}
              <div className="relative w-36 h-20 flex flex-col items-center justify-end overflow-hidden flex-shrink-0">
                <svg className="w-36 h-36" viewBox="0 0 100 100">
                  {/* Background Track Segments */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#e2e8f0"
                    strokeWidth="8"
                    strokeDasharray="125.6 251.2"
                    transform="rotate(-180 50 50)"
                  />
                  {/* Colored Arc - Green */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth="8"
                    strokeDasharray="40 251.2"
                    strokeDashoffset="0"
                    transform="rotate(-180 50 50)"
                  />
                  {/* Colored Arc - Amber */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#f59e0b"
                    strokeWidth="8"
                    strokeDasharray="40 251.2"
                    strokeDashoffset="-40"
                    transform="rotate(-180 50 50)"
                  />
                  {/* Colored Arc - Red */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#ef4444"
                    strokeWidth="8"
                    strokeDasharray="45.6 251.2"
                    strokeDashoffset="-80"
                    transform="rotate(-180 50 50)"
                  />
                  {/* Needle Indicator */}
                  <line
                    x1="50"
                    y1="50"
                    x2="72"
                    y2="28"
                    stroke="#1e293b"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle cx="50" cy="50" r="4" fill="#1e293b" />
                </svg>

                {/* Score Text in Center */}
                <div className="absolute bottom-0 text-center">
                  <p className="text-xl font-black text-red-600 leading-none">
                    {selectedProvider.riskScore.toFixed(2)}
                  </p>
                  <p className="text-[10px] font-bold text-red-500 leading-tight mt-0.5">
                    High Risk
                  </p>
                </div>
              </div>

              {/* Stats List */}
              <div className="flex-1 space-y-1.5 text-xs w-full">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Total Documents</span>
                  <span className="font-bold text-slate-900">{selectedProvider.documents}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">High Risk Documents</span>
                  <span className="font-bold text-red-600">{selectedProvider.highRiskDocs}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Medium Risk Documents</span>
                  <span className="font-bold text-amber-600">{selectedProvider.medRiskDocs}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Low Risk Documents</span>
                  <span className="font-bold text-emerald-600">{selectedProvider.lowRiskDocs}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Recent Activity */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/70 space-y-4">
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
              {mockRecentActivity.map((act) => (
                <div key={act.id} className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${act.iconBg}`}>
                    {act.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 leading-tight">
                      {act.title}
                    </p>
                    <p className="text-[11px] text-blue-600 font-medium mt-0.5">
                      {act.docName}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {act.dateTime}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Button */}
            <div className="pt-2">
              <button
                onClick={() => navigate("/invoices")}
                className="w-full bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 text-blue-600 font-semibold text-xs py-2.5 rounded-xl transition shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>View Provider Documents</span>
                <span>→</span>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}