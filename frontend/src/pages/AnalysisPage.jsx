import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

// Mock Matched Documents Table Data
const mockMatchedDocs = [
  {
    rank: 1,
    documentId: "INV-2036-0067",
    provider: "Apollo Hospitals",
    similarityScore: "0.982",
    riskLevel: "RED",
    matchedPages: "2/2",
    scoreColor: "text-red-600 font-bold",
  },
  {
    rank: 2,
    documentId: "INV-2036-0058",
    provider: "Apollo Hospitals",
    similarityScore: "0.931",
    riskLevel: "AMBER",
    matchedPages: "2/2",
    scoreColor: "text-amber-600 font-bold",
  },
  {
    rank: 3,
    documentId: "INV-2036-0215",
    provider: "Apollo Hospitals",
    similarityScore: "0.894",
    riskLevel: "AMBER",
    matchedPages: "1/2",
    scoreColor: "text-amber-600 font-bold",
  },
  {
    rank: 4,
    documentId: "INV-2036-0112",
    provider: "City Care Clinic",
    similarityScore: "0.781",
    riskLevel: "LOW",
    matchedPages: "1/2",
    scoreColor: "text-emerald-600 font-bold",
  },
  {
    rank: 5,
    documentId: "INV-2036-0183",
    provider: "Sunrise Diagnostics",
    similarityScore: "0.612",
    riskLevel: "LOW",
    matchedPages: "1/1",
    scoreColor: "text-emerald-600 font-bold",
  },
];

// Custom Risk Badge
const RiskBadge = ({ level }) => {
  if (level === "RED") {
    return (
      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[10.5px] font-bold bg-red-50 text-red-600 border border-red-200">
        RED
      </span>
    );
  }
  if (level === "AMBER") {
    return (
      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[10.5px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
        AMBER
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[10.5px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
      LOW
    </span>
  );
};

export default function AnalysisPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [zoomLevel, setZoomLevel] = useState(100);
  const [currentPage, setCurrentPage] = useState("1");
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownload = () => {
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-10 font-sans text-slate-800">
      
      {/* ================= TOP HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1 pb-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Analysis Result
          </h1>
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-medium">
            <Link to="/analysis" className="hover:text-slate-600 transition">Analysis</Link>
            <span>›</span>
            <span className="text-slate-600 font-semibold">INV-2036-1250</span>
            <span>›</span>
            <span className="text-slate-600 font-semibold">Results</span>
          </div>
        </div>

        {/* Top Right Controls & Actions */}
        <div className="flex items-center gap-3">
          {/* Download Report Button */}
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold py-2 px-3.5 rounded-lg shadow-2xs transition cursor-pointer"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>{downloadSuccess ? "Report Downloaded!" : "Download Report"}</span>
          </button>

          {/* Back to Analysis Button */}
          <button
            onClick={() => navigate("/upload")}
            className="inline-flex items-center gap-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] active:bg-[#1e40af] text-white text-xs font-semibold py-2 px-3.5 rounded-lg shadow-xs transition cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Back to Analysis</span>
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

      {/* ================= MAIN TWO-COLUMN LAYOUT ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ================= LEFT SECTION (WIDER ~ 66%) ================= */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* Card 1: Main Document Header & Metric Summary */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/70">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-4 border-b border-slate-100">
              
              {/* Document Identity */}
              <div className="flex items-start gap-3.5 flex-shrink-0">
                {/* Red PDF Icon Badge */}
                <div className="w-10 h-10 rounded-xl bg-red-500 text-white flex flex-col items-center justify-center flex-shrink-0 shadow-2xs">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
                    <path d="M14 2v6h6" fill="rgba(255,255,255,0.7)" />
                  </svg>
                  <span className="text-[7.5px] font-black tracking-tighter leading-none mt-0.5">PDF</span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 whitespace-nowrap">
                      INV-2036-1250.pdf
                    </h2>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Analyzed
                    </span>
                  </div>
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mt-1">
                    <span className="text-blue-600">🏛️</span>
                    <span>Apollo Hospitals</span>
                  </p>
                  <p className="text-[11.5px] text-slate-400 font-medium mt-0.5 whitespace-nowrap">
                    29 May 2026 • 02:35 PM • 2 pages
                  </p>
                </div>
              </div>

              {/* Four Key Metrics Columns */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 sm:gap-7 pt-2 xl:pt-0">
                
                {/* Metric 1: Risk Level */}
                <div className="text-center xl:text-left">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    Risk Level
                  </p>
                  <div className="mt-1.5 flex items-center justify-center xl:justify-start">
                    <div className="w-8 h-9 bg-red-600 rounded-lg flex items-center justify-center text-white shadow-xs">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Metric 2: Fraud Score */}
                <div className="text-center xl:text-left">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    Fraud Score
                  </p>
                  <p className="text-xl sm:text-2xl font-black text-red-600 mt-0.5 leading-tight">
                    0.982
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                    (High Similarity)
                  </p>
                </div>

                {/* Metric 3: Confidence */}
                <div className="text-center xl:text-left">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    Confidence
                  </p>
                  <p className="text-xl sm:text-2xl font-black text-emerald-600 mt-0.5 leading-tight">
                    0.97
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                    (High)
                  </p>
                </div>

                {/* Metric 4: Analyzed On */}
                <div className="text-center xl:text-left">
                  <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider whitespace-nowrap">
                    Analyzed On
                  </p>
                  <p className="text-xs font-bold text-slate-800 mt-1 leading-tight whitespace-nowrap">
                    29 May 2026
                  </p>
                  <p className="text-[10.5px] text-slate-500 font-medium whitespace-nowrap">
                    02:35 PM
                  </p>
                </div>

              </div>

            </div>

            {/* Soft Pink/Red Reasons Box */}
            <div className="mt-4 bg-[#fff1f2] border border-red-100 rounded-xl p-3.5 sm:p-4 text-xs">
              <div className="flex items-center gap-1.5 text-red-600 font-bold mb-2">
                <svg className="w-4 h-4 text-red-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>Reasons</span>
              </div>
              <ul className="space-y-1.5 text-slate-700 pl-1 font-normal">
                <li className="flex items-start gap-1.5">
                  <span className="text-slate-400">•</span>
                  <span>High visual similarity with document <strong className="font-semibold text-slate-900">'INV-2036-0067'</strong> (score: 0.982)</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-slate-400">•</span>
                  <span>Template layout, structure, font patterns and positions are highly similar</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-slate-400">•</span>
                  <span>Detected potential reuse of document template</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Card 2: Top Matched Documents Table */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/70">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900">
                Top Matched Documents
              </h2>
              <button
                onClick={() => navigate("/invoices")}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-700">
                    <th className="pb-2.5 font-bold whitespace-nowrap">Rank</th>
                    <th className="pb-2.5 font-bold whitespace-nowrap">Document ID</th>
                    <th className="pb-2.5 font-bold whitespace-nowrap">Provider</th>
                    <th className="pb-2.5 font-bold text-center whitespace-nowrap">Similarity Score</th>
                    <th className="pb-2.5 font-bold text-center whitespace-nowrap">Risk Level</th>
                    <th className="pb-2.5 font-bold text-center whitespace-nowrap">Matched Pages</th>
                    <th className="pb-2.5 font-bold text-center whitespace-nowrap">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {mockMatchedDocs.map((item) => (
                    <tr key={item.rank} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 font-semibold text-slate-700 whitespace-nowrap">
                        {item.rank}
                      </td>
                      <td className="py-3 font-medium text-slate-900 whitespace-nowrap">
                        {item.documentId}
                      </td>
                      <td className="py-3 text-slate-700 whitespace-nowrap">
                        {item.provider}
                      </td>
                      <td className={`py-3 text-center whitespace-nowrap ${item.scoreColor}`}>
                        {item.similarityScore}
                      </td>
                      <td className="py-3 text-center whitespace-nowrap">
                        <RiskBadge level={item.riskLevel} />
                      </td>
                      <td className="py-3 text-center text-slate-600 font-semibold whitespace-nowrap">
                        {item.matchedPages}
                      </td>
                      <td className="py-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => alert(`Viewing comparison with ${item.documentId}`)}
                          className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition inline-flex items-center justify-center cursor-pointer shadow-2xs border border-blue-100"
                          title="View match comparison"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
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

          {/* Card 3: Page-wise Similarity */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/70">
            <h2 className="text-sm font-bold text-slate-900 mb-3.5">
              Page-wise Similarity
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Page 1 Box */}
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs font-bold text-slate-800">Page 1</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">Score</span>
                </div>

                <div className="flex items-baseline justify-between mt-2.5">
                  <span className="text-xs text-slate-600 font-normal">
                    Best Match: <strong className="font-semibold text-slate-800">INV-2036-0067 (Page 1)</strong>
                  </span>
                  <span className="text-lg font-black text-red-600">
                    0.976
                  </span>
                </div>

                {/* Progress bar line */}
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-3">
                  <div className="bg-red-500 h-full rounded-full" style={{ width: "97.6%" }} />
                </div>
              </div>

              {/* Page 2 Box */}
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs font-bold text-slate-800">Page 2</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">Score</span>
                </div>

                <div className="flex items-baseline justify-between mt-2.5">
                  <span className="text-xs text-slate-600 font-normal">
                    Best Match: <strong className="font-semibold text-slate-800">INV-2036-0067 (Page 2)</strong>
                  </span>
                  <span className="text-lg font-black text-red-600">
                    0.988
                  </span>
                </div>

                {/* Progress bar line */}
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-3">
                  <div className="bg-red-500 h-full rounded-full" style={{ width: "98.8%" }} />
                </div>
              </div>

            </div>
          </div>

          {/* Card 4: Analysis Metadata (Bottom Row) */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/70">
            <h2 className="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wider">
              Analysis Metadata
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
              
              {/* Item 1: Analysis ID */}
              <div className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1 text-[11px]">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="whitespace-nowrap">Analysis ID</span>
                </div>
                <p className="font-bold text-slate-800 text-[11px] truncate" title="ANL-2026-1250-5621">
                  ANL-2026-1250-5621
                </p>
              </div>

              {/* Item 2: Model */}
              <div className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1 text-[11px]">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  </svg>
                  <span className="whitespace-nowrap">Model</span>
                </div>
                <p className="font-bold text-slate-800 text-[11px] truncate">
                  DINOv2-base
                </p>
              </div>

              {/* Item 3: Vector Dimension */}
              <div className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1 text-[11px]">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                  </svg>
                  <span className="whitespace-nowrap">Vector Dim</span>
                </div>
                <p className="font-bold text-slate-800 text-[11px]">
                  768
                </p>
              </div>

              {/* Item 4: Search Top-K */}
              <div className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1 text-[11px]">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="whitespace-nowrap">Search Top-K</span>
                </div>
                <p className="font-bold text-slate-800 text-[11px]">
                  5
                </p>
              </div>

              {/* Item 5: Thresholds */}
              <div className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1 text-[11px]">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <circle cx="12" cy="12" r="9" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <span className="whitespace-nowrap">Thresholds</span>
                </div>
                <div className="space-y-0.5 text-[10px] font-bold">
                  <p className="text-red-600 flex items-center gap-1 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 inline-block" />
                    Red ≥ 0.955
                  </p>
                  <p className="text-amber-600 flex items-center gap-1 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                    Amber ≥ 0.90
                  </p>
                </div>
              </div>

              {/* Item 6: Processing Time */}
              <div className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1 text-[11px]">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <circle cx="12" cy="12" r="9" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 7v5l3 3" />
                  </svg>
                  <span className="whitespace-nowrap">Proc Time</span>
                </div>
                <p className="font-bold text-slate-800 text-[11px]">
                  8.73 sec
                </p>
              </div>

            </div>
          </div>

        </div>


        {/* ================= RIGHT SECTION (PANEL ~ 34%) ================= */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Card 1: Document Preview */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/70 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900">
                Document Preview
              </h2>
              {/* Page Selector Dropdown */}
              <select
                value={currentPage}
                onChange={(e) => setCurrentPage(e.target.value)}
                className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="1">Page 1 of 2</option>
                <option value="2">Page 2 of 2</option>
              </select>
            </div>

            {/* Document Rendered Preview Canvas */}
            <div className="bg-slate-100/70 rounded-xl p-3 border border-slate-200/60 flex items-center justify-center overflow-hidden">
              <div
                className="bg-white w-full rounded-lg shadow-sm border border-slate-200 p-4 text-[9px] font-sans text-slate-800 transition-transform duration-200"
                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "top center" }}
              >
                {/* Invoice Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 bg-blue-600 rounded flex items-center justify-center text-white text-[8px] font-bold">
                      A
                    </div>
                    <span className="font-bold tracking-tight text-slate-900 text-[10px]">
                      APOLLO HOSPITALS
                    </span>
                  </div>
                  <span className="text-[8px] text-slate-400 font-medium">INVOICE</span>
                </div>

                {/* Patient / Doctor Details */}
                <div className="grid grid-cols-2 gap-2 text-[8px] text-slate-600 mb-2.5 bg-slate-50 p-1.5 rounded">
                  <div>
                    <p><span className="font-semibold text-slate-700">Patient:</span> Rajesh Kumar</p>
                    <p><span className="font-semibold text-slate-700">ID:</span> PAT-459712</p>
                    <p><span className="font-semibold text-slate-700">Age/Gender:</span> 45 / Male</p>
                  </div>
                  <div className="text-right">
                    <p><span className="font-semibold text-slate-700">Invoice No:</span> INV-2036-1250</p>
                    <p><span className="font-semibold text-slate-700">Date:</span> 29-05-2026</p>
                    <p><span className="font-semibold text-slate-700">Department:</span> Oncology</p>
                  </div>
                </div>

                {/* Itemized Table */}
                <table className="w-full text-left text-[7.5px] mb-2.5">
                  <thead>
                    <tr className="border-b border-slate-200 font-bold text-slate-700">
                      <th className="pb-1">Description</th>
                      <th className="pb-1 text-center">Qty</th>
                      <th className="pb-1 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    <tr>
                      <td className="py-0.5">Consultation Charges</td>
                      <td className="py-0.5 text-center">1</td>
                      <td className="py-0.5 text-right font-medium">1,500.00</td>
                    </tr>
                    <tr>
                      <td className="py-0.5">X-Ray Chest</td>
                      <td className="py-0.5 text-center">1</td>
                      <td className="py-0.5 text-right font-medium">850.00</td>
                    </tr>
                    <tr>
                      <td className="py-0.5">Complete Blood Count (CBC)</td>
                      <td className="py-0.5 text-center">1</td>
                      <td className="py-0.5 text-right font-medium">450.00</td>
                    </tr>
                    <tr>
                      <td className="py-0.5">Liver Function Test (LFT)</td>
                      <td className="py-0.5 text-center">1</td>
                      <td className="py-0.5 text-right font-medium">950.00</td>
                    </tr>
                    <tr>
                      <td className="py-0.5">Electrolytes</td>
                      <td className="py-0.5 text-center">1</td>
                      <td className="py-0.5 text-right font-medium">650.00</td>
                    </tr>
                    <tr>
                      <td className="py-0.5">Medicines</td>
                      <td className="py-0.5 text-center">1</td>
                      <td className="py-0.5 text-right font-medium">7,250.00</td>
                    </tr>
                    <tr>
                      <td className="py-0.5">Medical Supplies</td>
                      <td className="py-0.5 text-center">1</td>
                      <td className="py-0.5 text-right font-medium">350.00</td>
                    </tr>
                  </tbody>
                </table>

                {/* Subtotal and Total */}
                <div className="border-t border-slate-200 pt-1 text-[8px] space-y-0.5 text-right">
                  <p className="text-slate-500">Total Amount: <span className="font-semibold text-slate-800">12,000.00</span></p>
                  <p className="text-slate-500">Discount: <span className="font-semibold text-slate-800">250.00</span></p>
                  <p className="text-[9px] font-bold text-slate-900 border-t border-slate-200 pt-0.5">Grand Total (₹): 11,750.00</p>
                </div>

                {/* Footer Signature */}
                <div className="mt-4 pt-1 border-t border-slate-100 flex justify-between items-end text-[7px] text-slate-400">
                  <span>Thank you for choosing Apollo Hospitals</span>
                  <span className="border-t border-slate-300 px-2 font-mono">Authorized Signatory</span>
                </div>
              </div>
            </div>

            {/* Bottom Viewer Controls */}
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-slate-500 text-xs">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setZoomLevel(Math.max(75, zoomLevel - 10))}
                  className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition cursor-pointer"
                  title="Zoom Out"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                </button>
                <span className="text-[11px] font-semibold text-slate-700 w-9 text-center">
                  {zoomLevel}%
                </span>
                <button
                  onClick={() => setZoomLevel(Math.min(130, zoomLevel + 10))}
                  className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition cursor-pointer"
                  title="Zoom In"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="11" y1="8" x2="11" y2="14" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                </button>
              </div>

              <button
                onClick={handleDownload}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition cursor-pointer"
                title="Download PDF"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            </div>
          </div>

          {/* Card 2: Document Details */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/70">
            <h2 className="text-sm font-bold text-slate-900 mb-4">
              Document Details
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-50">
                <span className="text-slate-400 font-medium">File Name</span>
                <span className="font-semibold text-slate-800">INV-2036-1250.pdf</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-50">
                <span className="text-slate-400 font-medium">File Size</span>
                <span className="font-semibold text-slate-800">1.24 MB</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-50">
                <span className="text-slate-400 font-medium">File Type</span>
                <span className="font-semibold text-slate-800">PDF</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Total Pages</span>
                <span className="font-semibold text-slate-800">2</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Uploaded By</span>
                <span className="font-semibold text-slate-800">investigator@doctrace.ai</span>
              </div>
              <div className="flex items-center justify-between pt-0.5">
                <span className="text-slate-400 font-medium">Provider</span>
                <span className="font-semibold text-slate-800">Apollo Hospitals</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
