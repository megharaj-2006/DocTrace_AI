import { useState, useEffect } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import useAuthStore from "../store/authStore";
import { getSimilarInvoices, getInvoiceById } from "../api/invoiceApi";

// Realistic 10 Similar Document Cards matching the reference screenshot
const initialSimilarDocuments = [
  {
    id: "INV-2036-0067.pdf",
    provider: "Apollo Hospitals",
    date: "29 Apr 2026",
    similarityScore: 0.982,
    riskLevel: "RED",
    badgeColor: "bg-red-500",
  },
  {
    id: "INV-2036-0058.pdf",
    provider: "Apollo Hospitals",
    date: "21 Apr 2026",
    similarityScore: 0.931,
    riskLevel: "AMBER",
    badgeColor: "bg-amber-500",
  },
  {
    id: "INV-2036-0215.pdf",
    provider: "Apollo Hospitals",
    date: "03 May 2026",
    similarityScore: 0.894,
    riskLevel: "AMBER",
    badgeColor: "bg-amber-500",
  },
  {
    id: "INV-2036-0112.pdf",
    provider: "City Care Clinic",
    date: "14 Apr 2026",
    similarityScore: 0.781,
    riskLevel: "LOW",
    badgeColor: "bg-emerald-600",
  },
  {
    id: "INV-2036-0183.pdf",
    provider: "Sunrise Diagnostics",
    date: "10 Apr 2026",
    similarityScore: 0.612,
    riskLevel: "LOW",
    badgeColor: "bg-emerald-600",
  },
  {
    id: "INV-2036-0033.pdf",
    provider: "Apollo Hospitals",
    date: "18 Apr 2026",
    similarityScore: 0.948,
    riskLevel: "AMBER",
    badgeColor: "bg-amber-500",
  },
  {
    id: "INV-2036-0176.pdf",
    provider: "Metro Health Center",
    date: "12 Apr 2026",
    similarityScore: 0.917,
    riskLevel: "AMBER",
    badgeColor: "bg-amber-500",
  },
  {
    id: "INV-2036-0201.pdf",
    provider: "Apollo Hospitals",
    date: "02 May 2026",
    similarityScore: 0.903,
    riskLevel: "AMBER",
    badgeColor: "bg-amber-500",
  },
  {
    id: "INV-2036-0099.pdf",
    provider: "HealthPlus Clinic",
    date: "17 Apr 2026",
    similarityScore: 0.756,
    riskLevel: "LOW",
    badgeColor: "bg-emerald-600",
  },
  {
    id: "INV-2036-0042.pdf",
    provider: "City Care Clinic",
    date: "09 Apr 2026",
    similarityScore: 0.643,
    riskLevel: "LOW",
    badgeColor: "bg-emerald-600",
  },
];

// Custom Risk Badge Component
const RiskBadge = ({ level }) => {
  if (level === "RED") {
    return (
      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-600 border border-red-200">
        RED
      </span>
    );
  }
  if (level === "AMBER") {
    return (
      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
        AMBER
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
      LOW
    </span>
  );
};

export default function SimilarDocumentsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);

  // Active filter tab state ('ALL', 'HIGH', 'MEDIUM', 'LOW')
  const [activeTab, setActiveTab] = useState("ALL");
  const [sortBy, setSortBy] = useState("score");
  const [scoreRange, setScoreRange] = useState(0.5);
  const [selectedProvider, setSelectedProvider] = useState("All Providers");
  const [selectedFileType, setSelectedFileType] = useState("All Types");
  const [riskFilters, setRiskFilters] = useState({
    red: true,
    amber: true,
    low: true,
  });

  // API State
  const [documents, setDocuments] = useState(initialSimilarDocuments);
  const [loading, setLoading] = useState(false);
  const [refDocId, setRefDocId] = useState(id || searchParams.get("docId") || "INV-2036-1250");

  // Attempt Backend API Integration
  useEffect(() => {
    const fetchApiSimilar = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await getSimilarInvoices(id);
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((item) => ({
            id: item.documentId || item.id || `INV-${item.id}.pdf`,
            provider: item.providerName || item.provider || "Apollo Hospitals",
            date: item.uploadDate || item.date || "29 Apr 2026",
            similarityScore: item.similarityScore || item.score || 0.85,
            riskLevel: item.riskLevel || (item.similarityScore >= 0.955 ? "RED" : item.similarityScore >= 0.9 ? "AMBER" : "LOW"),
            badgeColor: item.similarityScore >= 0.955 ? "bg-red-500" : item.similarityScore >= 0.9 ? "bg-amber-500" : "bg-emerald-600",
          }));
          setDocuments(mapped);
        }
      } catch (err) {
        // Fallback gracefully to mock data
        console.log("Using realistic mock data for Similar Documents.", err?.message);
      } finally {
        setLoading(false);
      }
    };

    fetchApiSimilar();
  }, [id]);

  // Filtered documents calculation
  const filteredDocuments = documents.filter((doc) => {
    // Tab filtering
    if (activeTab === "HIGH" && doc.similarityScore < 0.955) return false;
    if (activeTab === "MEDIUM" && (doc.similarityScore < 0.9 || doc.similarityScore >= 0.955)) return false;
    if (activeTab === "LOW" && doc.similarityScore >= 0.9) return false;

    // Score Range Slider
    if (doc.similarityScore < scoreRange) return false;

    // Checkbox filters
    if (doc.riskLevel === "RED" && !riskFilters.red) return false;
    if (doc.riskLevel === "AMBER" && !riskFilters.amber) return false;
    if (doc.riskLevel === "LOW" && !riskFilters.low) return false;

    // Provider filter
    if (selectedProvider !== "All Providers" && doc.provider !== selectedProvider) return false;

    return true;
  });

  const handleResetFilters = () => {
    setActiveTab("ALL");
    setScoreRange(0.5);
    setSelectedProvider("All Providers");
    setSelectedFileType("All Types");
    setRiskFilters({ red: true, amber: true, low: true });
  };

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-10 font-sans text-slate-800">
      
      {/* ================= TOP HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1 pb-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Similar Documents
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Documents visually similar to {refDocId}
          </p>
        </div>

        {/* Top Right Controls */}
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

      {/* ================= REFERENCE DOCUMENT BANNER CARD ================= */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/70 flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Left Document Identity */}
        <div className="flex items-center gap-3.5 w-full md:w-auto">
          <div className="w-10 h-10 rounded-xl bg-red-500 text-white flex flex-col items-center justify-center flex-shrink-0 shadow-2xs">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
              <path d="M14 2v6h6" fill="rgba(255,255,255,0.7)" />
            </svg>
            <span className="text-[7.5px] font-black tracking-tighter leading-none mt-0.5">PDF</span>
          </div>

          <div>
            <p className="text-[11px] text-blue-600 font-semibold leading-tight">
              Reference Document
            </p>
            <h2 className="text-base font-bold text-slate-900 tracking-tight leading-tight mt-0.5">
              {refDocId}.pdf
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Apollo Hospitals • 29 May 2026
            </p>
          </div>
        </div>

        {/* Center Key Metrics */}
        <div className="flex items-center justify-around w-full md:w-auto md:gap-10 border-y md:border-y-0 md:border-x border-slate-100 py-3 md:py-0 md:px-8">
          {/* Potential Matches */}
          <div className="text-center">
            <p className="text-[11px] font-medium text-slate-400">
              Potential Matches
            </p>
            <p className="text-xl font-bold text-slate-900 leading-tight mt-0.5">
              12
            </p>
            <p className="text-[10px] text-slate-400">
              Found in database
            </p>
          </div>

          {/* Highest Similarity */}
          <div className="text-center">
            <p className="text-[11px] font-medium text-slate-400">
              Highest Similarity
            </p>
            <p className="text-xl font-black text-red-600 leading-tight mt-0.5">
              0.982
            </p>
          </div>

          {/* Risk Level */}
          <div className="text-center">
            <p className="text-[11px] font-medium text-slate-400">
              Risk Level
            </p>
            <div className="mt-1">
              <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded text-xs font-bold bg-red-50 text-red-600 border border-red-200">
                RED
              </span>
            </div>
          </div>
        </div>

        {/* Right Action Button */}
        <div className="w-full md:w-auto text-right">
          <button
            onClick={() => navigate("/analysis")}
            className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 text-blue-600 text-xs font-bold py-2.5 px-4 rounded-xl shadow-2xs transition cursor-pointer"
          >
            <span>View Full Analysis</span>
            <span className="text-sm font-black">→</span>
          </button>
        </div>

      </div>

      {/* ================= FILTER TABS & SORT BAR ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {/* All */}
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "ALL"
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>All Similar Documents</span>
            <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] flex items-center justify-center font-bold">
              12
            </span>
          </button>

          {/* High */}
          <button
            onClick={() => setActiveTab("HIGH")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "HIGH"
                ? "bg-red-50 text-red-700 border border-red-200"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-600 inline-block" />
            <span>High (≥ 0.955)</span>
            <span className="w-4 h-4 rounded-full bg-red-100 text-red-700 text-[10px] flex items-center justify-center font-bold">
              2
            </span>
          </button>

          {/* Medium */}
          <button
            onClick={() => setActiveTab("MEDIUM")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "MEDIUM"
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            <span>Medium (0.90 - 0.955)</span>
            <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-700 text-[10px] flex items-center justify-center font-bold">
              4
            </span>
          </button>

          {/* Low */}
          <button
            onClick={() => setActiveTab("LOW")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "LOW"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
            <span>Low (&lt; 0.90)</span>
            <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 text-[10px] flex items-center justify-center font-bold">
              6
            </span>
          </button>
        </div>

        {/* Sort By Dropdown */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-slate-400 font-medium">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
          >
            <option value="score">Similarity Score</option>
            <option value="date-newest">Date: Newest</option>
            <option value="date-oldest">Date: Oldest</option>
            <option value="risk">Risk Level</option>
          </select>
        </div>

      </div>

      {/* ================= MAIN CONTENT: GRID + FILTERS SIDEBAR ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ================= LEFT/CENTER: 10 SIMILAR DOCUMENT CARDS (LG: 9 COLS) ================= */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* 5-Columns Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3.5">
            {filteredDocuments.map((doc, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-2.5 shadow-2xs border border-slate-200/70 hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between group"
              >
                {/* Top Thumbnail Preview */}
                <div className="relative bg-slate-50 border border-slate-200/60 rounded-lg p-2 aspect-[3/4] flex flex-col justify-between overflow-hidden">
                  
                  {/* Similarity Score Pill Badge on Top Left */}
                  <div className="absolute top-1.5 left-1.5 z-10">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded text-white shadow-2xs ${doc.badgeColor}`}>
                      {doc.similarityScore.toFixed(3)}
                    </span>
                  </div>

                  {/* Simulated Document Layout Lines */}
                  <div className="pt-5 space-y-1 opacity-70">
                    <div className="h-1 bg-slate-300 rounded w-2/3" />
                    <div className="h-0.5 bg-slate-200 rounded w-full" />
                    <div className="h-0.5 bg-slate-200 rounded w-4/5" />
                    <div className="h-0.5 bg-slate-200 rounded w-full" />
                    <div className="h-0.5 bg-slate-200 rounded w-3/4" />
                    <div className="grid grid-cols-3 gap-0.5 pt-2">
                      <div className="h-0.5 bg-slate-200 rounded" />
                      <div className="h-0.5 bg-slate-200 rounded" />
                      <div className="h-0.5 bg-slate-200 rounded" />
                    </div>
                    <div className="grid grid-cols-3 gap-0.5">
                      <div className="h-0.5 bg-slate-200 rounded" />
                      <div className="h-0.5 bg-slate-200 rounded" />
                      <div className="h-0.5 bg-slate-200 rounded" />
                    </div>
                    <div className="grid grid-cols-3 gap-0.5">
                      <div className="h-0.5 bg-slate-200 rounded" />
                      <div className="h-0.5 bg-slate-200 rounded" />
                      <div className="h-0.5 bg-slate-200 rounded" />
                    </div>
                  </div>

                  {/* Bottom Lines */}
                  <div className="pt-2 border-t border-slate-200/50 flex justify-between opacity-60">
                    <div className="h-0.5 bg-slate-300 w-1/3 rounded" />
                    <div className="h-0.5 bg-slate-400 w-1/4 rounded" />
                  </div>
                </div>

                {/* Document Information */}
                <div className="mt-2.5">
                  <p className="text-[11px] font-bold text-slate-900 truncate group-hover:text-blue-600 transition" title={doc.id}>
                    {doc.id}
                  </p>
                  <p className="text-[10.5px] text-slate-500 truncate mt-0.5" title={doc.provider}>
                    {doc.provider}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                    {doc.date}
                  </p>
                </div>

                {/* Card Footer: Risk Badge & View Action */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <RiskBadge level={doc.riskLevel} />

                  <button
                    onClick={() => navigate("/analysis")}
                    className="text-blue-600 hover:text-blue-700 p-1 rounded hover:bg-blue-50 transition cursor-pointer"
                    title="View match analysis"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                </div>

              </div>
            ))}
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
              <button className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer">
                ›
              </button>
            </div>

            <p className="text-xs text-slate-400 font-medium">
              Showing 1-10 of 12 documents
            </p>
          </div>

        </div>


        {/* ================= RIGHT: FILTERS SIDEBAR (LG: 3 COLS) ================= */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Filter Container Card */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/70 space-y-5">
            
            {/* Header with Reset */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                  </svg>
                </div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Filters
                </h3>
              </div>

              <button
                onClick={handleResetFilters}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                Reset
              </button>
            </div>

            {/* Similarity Score Range Slider */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Similarity Score Range
              </label>
              <input
                type="range"
                min="0.50"
                max="1.00"
                step="0.01"
                value={scoreRange}
                onChange={(e) => setScoreRange(parseFloat(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mt-1">
                <span>{scoreRange.toFixed(2)}</span>
                <span>1.00</span>
              </div>
            </div>

            {/* Risk Level Checkboxes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Risk Level
              </label>
              <div className="space-y-2 text-xs">
                {/* Red */}
                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={riskFilters.red}
                      onChange={(e) => setRiskFilters({ ...riskFilters, red: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="w-2 h-2 rounded-full bg-red-600 inline-block" />
                    <span className="text-slate-700 font-medium group-hover:text-slate-900">
                      Red (≥ 0.955)
                    </span>
                  </div>
                  <span className="text-slate-400 font-medium">2</span>
                </label>

                {/* Amber */}
                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={riskFilters.amber}
                      onChange={(e) => setRiskFilters({ ...riskFilters, amber: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                    <span className="text-slate-700 font-medium group-hover:text-slate-900">
                      Amber (0.90 - 0.955)
                    </span>
                  </div>
                  <span className="text-slate-400 font-medium">4</span>
                </label>

                {/* Low */}
                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={riskFilters.low}
                      onChange={(e) => setRiskFilters({ ...riskFilters, low: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                    <span className="text-slate-700 font-medium group-hover:text-slate-900">
                      Low (&lt; 0.90)
                    </span>
                  </div>
                  <span className="text-slate-400 font-medium">6</span>
                </label>
              </div>
            </div>

            {/* Provider Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Provider
              </label>
              <div className="relative">
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-600 appearance-none pr-8 cursor-pointer shadow-2xs"
                >
                  <option value="All Providers">All Providers</option>
                  <option value="Apollo Hospitals">Apollo Hospitals</option>
                  <option value="City Care Clinic">City Care Clinic</option>
                  <option value="Sunrise Diagnostics">Sunrise Diagnostics</option>
                  <option value="Metro Health Center">Metro Health Center</option>
                  <option value="HealthPlus Clinic">HealthPlus Clinic</option>
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Date Range Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Date Range
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-2.5 text-slate-400 pointer-events-none">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth={2} />
                    <line x1="16" y1="2" x2="16" y2="6" strokeWidth={2} strokeLinecap="round" />
                    <line x1="8" y1="2" x2="8" y2="6" strokeWidth={2} strokeLinecap="round" />
                    <line x1="3" y1="10" x2="21" y2="10" strokeWidth={2} />
                  </svg>
                </div>
                <input
                  type="text"
                  readOnly
                  placeholder="Select date range"
                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 cursor-pointer shadow-2xs"
                  onClick={() => alert("Date range picker: May 2026 selected")}
                />
              </div>
            </div>

            {/* File Type Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                File Type
              </label>
              <div className="relative">
                <select
                  value={selectedFileType}
                  onChange={(e) => setSelectedFileType(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-600 appearance-none pr-8 cursor-pointer shadow-2xs"
                >
                  <option value="All Types">All Types</option>
                  <option value="PDF">PDF (.pdf)</option>
                  <option value="Images">Images (.jpg, .png)</option>
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Apply Filters Button */}
            <button
              onClick={() => {}}
              className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] active:bg-[#1e40af] text-white text-xs font-semibold py-2.5 rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
              </svg>
              <span>Apply Filters</span>
            </button>

          </div>

          {/* Bottom Tip Card */}
          <div className="bg-[#f0f7ff] border border-blue-100 rounded-2xl p-4 flex items-start gap-2.5">
            <div className="text-blue-600 mt-0.5 flex-shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-blue-900">
                Tip
              </p>
              <p className="text-[11px] text-blue-800/80 leading-relaxed mt-0.5">
                Higher similarity scores indicate greater visual similarity in template layout, structure and design.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
