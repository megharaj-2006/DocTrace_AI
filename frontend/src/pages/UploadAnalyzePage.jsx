import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

// Mock Recent Uploads Data matching reference
const recentUploadsData = [
  {
    id: "1",
    filename: "INV-2036-1249.pdf",
    type: "pdf",
    dateTime: "29 May 2026 • 02:34 PM",
    status: "Analyzed",
    statusColor: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  {
    id: "2",
    filename: "INV-2036-1248.pdf",
    type: "pdf",
    dateTime: "29 May 2026 • 01:51 PM",
    status: "Analyzing",
    statusColor: "bg-blue-50 text-blue-700 border-blue-100",
  },
  {
    id: "3",
    filename: "INV-2036-1247.jpg",
    type: "image",
    dateTime: "29 May 2026 • 11:22 AM",
    status: "Uploaded",
    statusColor: "bg-slate-100 text-slate-700 border-slate-200",
  },
  {
    id: "4",
    filename: "INV-2036-1246.pdf",
    type: "pdf",
    dateTime: "28 May 2026 • 04:18 PM",
    status: "Analyzed",
    statusColor: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  {
    id: "5",
    filename: "INV-2036-1245.png",
    type: "image",
    dateTime: "28 May 2026 • 03:45 PM",
    status: "Uploaded",
    statusColor: "bg-slate-100 text-slate-700 border-slate-200",
  },
];

// Mock Providers List
const mockProviders = [
  "Apollo Hospitals",
  "City Care Clinic",
  "Sunrise Diagnostics",
  "Metro Health Center",
  "HealthPlus Clinic",
  "CarePoint Medical",
  "Apex Healthcare",
];

// Upload Guidelines Checklist
const uploadGuidelines = [
  "Clear and readable documents",
  "All pages should be visible",
  "Supported formats: PDF, JPG, PNG",
  "Maximum file size: 20 MB",
  "Ensure document is not password protected",
  "Best results with high-quality scans or images",
];

export default function UploadAnalyzePage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [documentId, setDocumentId] = useState("");
  const [provider, setProvider] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!documentId) {
        setDocumentId(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      if (!documentId) {
        setDocumentId(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile && !documentId) {
      alert("Please select a file and provide a Document ID.");
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setUploadSuccess(true);
      setTimeout(() => {
        navigate("/invoices");
      }, 1200);
    }, 1000);
  };

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-10 font-sans text-slate-800">
      
      {/* ================= TOP HEADER ================= */}
      <div className="flex items-center justify-between pt-1 pb-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Upload & Analyze Document
          </h1>
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-medium">
            <Link to="/invoices" className="hover:text-slate-600 transition">Invoices</Link>
            <span>›</span>
            <span className="text-slate-600 font-semibold">Upload & Analyze</span>
          </div>
        </div>

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

      {/* ================= MAIN TWO-COLUMN LAYOUT ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ================= LEFT COLUMN: UPLOAD & ANALYSIS CARD ================= */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-200/70">
          
          {/* Horizontal Stepper Progress Indicator */}
          <div className="flex items-center justify-center gap-3 sm:gap-6 pb-6 border-b border-slate-100">
            {/* Step 1 */}
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#2563eb] text-white text-xs font-bold flex items-center justify-center shadow-xs">
                1
              </span>
              <span className="text-xs font-bold text-[#2563eb] tracking-tight">
                Upload Document
              </span>
            </div>

            {/* Separator Line */}
            <div className="w-8 sm:w-16 h-px bg-slate-200" />

            {/* Step 2 */}
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 border border-slate-200 text-xs font-semibold flex items-center justify-center">
                2
              </span>
              <span className="text-xs font-medium text-slate-400 tracking-tight">
                Analysis
              </span>
            </div>

            {/* Separator Line */}
            <div className="w-8 sm:w-16 h-px bg-slate-200" />

            {/* Step 3 */}
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 border border-slate-200 text-xs font-semibold flex items-center justify-center">
                3
              </span>
              <span className="text-xs font-medium text-slate-400 tracking-tight">
                Results
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleFormSubmit} className="mt-6 space-y-6">
            
            {/* Drag and Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                isDragging
                  ? "border-blue-500 bg-blue-50/50 scale-[0.99]"
                  : selectedFile
                  ? "border-emerald-300 bg-emerald-50/20"
                  : "border-slate-300/80 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/20"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Cloud Upload Icon */}
              <div className="w-16 h-16 text-blue-500 mb-3 flex items-center justify-center">
                <svg className="w-16 h-16 drop-shadow-xs" viewBox="0 0 64 64" fill="none" stroke="currentColor">
                  <path
                    d="M48 42C54.6274 42 60 36.6274 60 30C60 23.7533 55.2343 18.6186 49.1627 18.058C47.8864 9.17228 40.2458 2.33334 31 2.33334C22.6105 2.33334 15.5393 7.97334 13.4354 15.688C6.01258 16.8913 0.333344 23.328 0.333344 31.0667C0.333344 39.5167 7.18334 46.3667 15.6333 46.3667H22"
                    stroke="#3b82f6"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M32 26V58M32 26L22 36M32 26L42 36"
                    stroke="#2563eb"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* Drag & Drop Title */}
              <p className="text-base font-bold text-slate-800">
                {selectedFile ? selectedFile.name : "Drag & drop your file here"}
              </p>

              {/* or label */}
              <p className="text-xs text-slate-400 my-2 font-normal">or</p>

              {/* Browse Files Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="inline-flex items-center gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] active:bg-[#1e40af] text-white text-xs font-semibold py-2.5 px-5 rounded-lg transition shadow-xs cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>Browse Files</span>
              </button>

              {/* Formats Info */}
              <p className="text-xs text-slate-400 mt-4">
                Supported formats: PDF, JPG, PNG (Max 20MB)
              </p>
            </div>

            {/* Document Details Section */}
            <div className="pt-2">
              <h2 className="text-sm font-bold text-slate-900 mb-4">
                Document Details
              </h2>

              <div className="space-y-4">
                {/* Document ID */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                    <span>Document ID</span>
                    <span className="text-red-500">*</span>
                    <span
                      title="Unique identification code for this invoice document"
                      className="w-3.5 h-3.5 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 border border-slate-300 text-[10px] inline-flex items-center justify-center cursor-help"
                    >
                      ⓘ
                    </span>
                  </label>
                  <input
                    type="text"
                    value={documentId}
                    onChange={(e) => setDocumentId(e.target.value)}
                    placeholder="Enter unique document ID"
                    required
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 transition shadow-xs"
                  />
                  <p className="text-[11px] text-slate-400 mt-1 font-normal">
                    Provide a unique identifier for this document
                  </p>
                </div>

                {/* Provider Dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Provider <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={provider}
                      onChange={(e) => setProvider(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 transition shadow-xs appearance-none pr-10 cursor-pointer"
                    >
                      <option value="" disabled>Select Provider</option>
                      {mockProviders.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Upload & Analyze Document Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] active:bg-[#1e40af] disabled:bg-blue-400 text-white text-sm font-semibold py-3 px-6 rounded-xl transition shadow-sm cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Processing Document...</span>
                  </>
                ) : uploadSuccess ? (
                  <>
                    <svg className="w-4 h-4 text-emerald-300" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Document Queued for Analysis!</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span>Upload & Analyze Document</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>


        {/* ================= RIGHT COLUMN: GUIDELINES & RECENT UPLOADS ================= */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Card 1: Upload Guidelines */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/70">
            <div className="flex items-center gap-1.5 mb-4">
              <h2 className="text-sm font-bold text-slate-900">
                Upload Guidelines
              </h2>
              <span
                title="Guidelines for highest fraud detection accuracy"
                className="w-3.5 h-3.5 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 border border-slate-300 text-[10px] inline-flex items-center justify-center cursor-help"
              >
                ⓘ
              </span>
            </div>

            <ul className="space-y-3">
              {uploadGuidelines.map((guideline, index) => (
                <li key={index} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium leading-tight">
                  <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                    <svg className="w-2.5 h-2.5 stroke-current" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span>{guideline}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Card 2: Recent Uploads */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/70">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900">
                Recent Uploads
              </h2>
              <Link
                to="/invoices"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                View All
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {recentUploadsData.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/invoices`)}
                  className="py-3 flex items-center justify-between hover:bg-slate-50/80 rounded-xl px-1 transition-colors cursor-pointer group"
                >
                  {/* Left: Icon & Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Document Icon Badge */}
                    {item.type === "pdf" ? (
                      <div className="w-8 h-8 rounded-lg bg-red-500 text-white flex flex-col items-center justify-center flex-shrink-0 shadow-2xs">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
                          <path d="M14 2v6h6" fill="rgba(255,255,255,0.7)" />
                        </svg>
                        <span className="text-[7px] font-black tracking-tighter leading-none mt-0.5">PDF</span>
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={1.8} />
                          <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 15l-5-5L5 21" />
                        </svg>
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate group-hover:text-blue-600 transition">
                        {item.filename}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {item.dateTime}
                      </p>
                    </div>
                  </div>

                  {/* Right: Status Badge & Chevron */}
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${item.statusColor}`}>
                      {item.status}
                    </span>
                    <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
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
