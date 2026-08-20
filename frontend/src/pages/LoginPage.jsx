import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginApi, registerApi } from "../api/authApi";
import useAuthStore from "../store/authStore";

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Registration Modal State
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regForm, setRegForm] = useState({ fullName: "", email: "", password: "", confirmPassword: "" });
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");

  // JWT Token Direct Login Modal State
  const [showJwtModal, setShowJwtModal] = useState(false);
  const [jwtTokenInput, setJwtTokenInput] = useState("");
  const [jwtError, setJwtError] = useState("");

  // Forgot Password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regForm.fullName || !regForm.email || !regForm.password) {
      setRegError("All fields are required.");
      return;
    }
    if (regForm.password.length < 6) {
      setRegError("Password must be at least 6 characters.");
      return;
    }
    if (regForm.password !== regForm.confirmPassword) {
      setRegError("Passwords do not match.");
      return;
    }
    setRegLoading(true);
    setRegError("");
    setRegSuccess("");
    try {
      await registerApi(regForm.email, regForm.password, regForm.fullName);
      setRegSuccess("Account created successfully! Logging you in...");
      // Automatically log in
      const data = await loginApi(regForm.email, regForm.password);
      const token = data.token || data.accessToken || data.jwt || data.data?.token;
      const user = data.user || data.data?.user || { email: regForm.email, fullName: regForm.fullName };
      setAuth(token, user);
      setTimeout(() => {
        navigate("/dashboard");
      }, 800);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Registration failed. Email may already be registered.";
      setRegError(msg);
    } finally {
      setRegLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await loginApi(form.email, form.password);
      const token = data.token || data.accessToken || data.jwt || data.data?.token;
      const user = data.user || data.data?.user || { email: form.email, fullName: form.email.split("@")[0] };
      setAuth(token, user);
      navigate("/dashboard");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Invalid email or password. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleJwtLogin = (e) => {
    e.preventDefault();
    if (!jwtTokenInput.trim()) {
      setJwtError("Please enter a valid JWT token.");
      return;
    }

    try {
      const token = jwtTokenInput.trim();
      const parts = token.split(".");
      let payloadUser = { email: "investigator@doctrace.ai", fullName: "Authorized Investigator" };
      if (parts.length === 3) {
        try {
          const parsed = JSON.parse(atob(parts[1]));
          payloadUser = {
            email: parsed.sub || parsed.email || parsed.username || "investigator@doctrace.ai",
            fullName: parsed.name || parsed.fullName || parsed.sub || "Authorized User",
            roles: parsed.roles || parsed.authorities || ["ROLE_USER"],
          };
        } catch {
          // Token payload decode fallback
        }
      }
      setAuth(token, payloadUser);
      setShowJwtModal(false);
      navigate("/dashboard");
    } catch {
      setJwtError("Failed to parse token. Please ensure it is a valid JWT.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center p-4 sm:p-6 select-none font-sans">
      {/* MAIN CONTAINER CARD */}
      <div className="w-full max-w-[980px] bg-white rounded-[24px] shadow-2xl overflow-hidden flex flex-col md:flex-row items-stretch border border-slate-200/70">
        
        {/* ================= LEFT PANEL (Brand & Tech Visual Showcase) ================= */}
        <div className="w-full md:w-[48%] bg-gradient-to-br from-[#061a40] via-[#092657] to-[#04122d] text-white p-7 sm:p-8 lg:p-9 flex flex-col justify-between relative overflow-hidden">
          
          {/* Subtle Circuit Tech Background Patterns */}
          <div className="absolute inset-0 pointer-events-none opacity-25">
            <div className="absolute -top-12 -left-12 w-52 h-52 bg-blue-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-6 right-0 w-60 h-60 bg-cyan-500/15 rounded-full blur-3xl" />
            
            {/* Tech Circuit SVG Grid */}
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="circuit-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="1" />
                  <circle cx="50" cy="0" r="1.5" fill="rgba(56, 189, 248, 0.25)" />
                  <circle cx="0" cy="50" r="1.5" fill="rgba(56, 189, 248, 0.25)" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#circuit-grid)" />
              {/* Circuit lines */}
              <path d="M 20 200 H 100 L 140 240 H 260" fill="none" stroke="rgba(56, 189, 248, 0.2)" strokeWidth="1.2" strokeDasharray="3 3" />
              <path d="M 280 160 V 270 L 240 310 H 90" fill="none" stroke="rgba(56, 189, 248, 0.15)" strokeWidth="1.2" />
              <circle cx="140" cy="240" r="2.5" fill="#38bdf8" />
              <circle cx="240" cy="310" r="2.5" fill="#38bdf8" />
            </svg>
          </div>

          {/* Top Brand Header */}
          <div className="relative z-10">
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-3">
              {/* Shield Logo with Document & Magnifier */}
              <div className="relative w-10 h-11 flex items-center justify-center flex-shrink-0">
                <svg className="w-10 h-11 text-blue-500 drop-shadow-[0_4px_10px_rgba(37,99,235,0.6)]" viewBox="0 0 36 40" fill="currentColor">
                  <path d="M18 0L2 6V18C2 28.5 8.8 38.2 18 40C27.2 38.2 34 28.5 34 18V6L18 0Z" fill="url(#shield-grad-login)" stroke="#38bdf8" strokeWidth="1.5" />
                  <defs>
                    <linearGradient id="shield-grad-login" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#2563eb" />
                      <stop offset="100%" stopColor="#0a2864" />
                    </linearGradient>
                  </defs>
                </svg>
                {/* Inside Document Graphic with Magnifier */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-4.5 h-5.5 bg-white rounded-[2px] shadow-sm flex flex-col justify-center px-0.5 gap-0.5">
                    <div className="w-full h-0.5 bg-blue-600 rounded-full" />
                    <div className="w-2.5 h-0.5 bg-blue-400 rounded-full" />
                    <div className="w-full h-0.5 bg-slate-300 rounded-full" />
                    {/* Small Magnifying Glass Badge */}
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full flex items-center justify-center shadow">
                      <svg className="w-2 h-2 text-slate-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                        <circle cx="10" cy="10" r="6" />
                        <path d="M15 15l5 5" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Logo Typography */}
              <span className="text-[22px] font-bold tracking-tight text-white flex items-center gap-1.5">
                DocTrace <span className="text-[#38bdf8] font-bold">AI</span>
              </span>
            </div>

            {/* Main Tagline */}
            <h1 className="text-[20px] sm:text-[21px] font-bold text-white leading-[1.25] mt-5 tracking-tight">
              AI-Powered Medical Document <br />
              Template Intelligence <br />
              for Fraud Detection
            </h1>

            {/* Subtitle Description */}
            <p className="text-blue-100/75 text-[12px] leading-relaxed mt-2.5 max-w-xs">
              Detect suspicious reuse of medical document templates, even when text, names, logos or layout are modified.
            </p>
          </div>

          {/* Central Layered Graphic (Invoice + 3D Shield) */}
          <div className="relative z-10 my-4 sm:my-5 flex justify-center items-center">
            <div className="relative flex items-center justify-center">
              
              {/* Back Layer Sheets */}
              <div className="absolute -right-3 -top-2 w-44 h-44 bg-white/10 rounded-xl backdrop-blur-md transform rotate-6 border border-white/10 pointer-events-none" />
              <div className="absolute -left-2 -top-1 w-44 h-44 bg-white/5 rounded-xl backdrop-blur-sm transform -rotate-3 border border-white/5 pointer-events-none" />

              {/* Main White INVOICE Sheet */}
              <div className="relative w-48 bg-white rounded-xl shadow-[0_16px_36px_-8px_rgba(0,0,0,0.5)] p-3.5 text-slate-800 border border-slate-100 z-10 transform transition hover:scale-[1.02] duration-300">
                {/* Invoice Header */}
                <div className="text-center font-bold text-[11px] tracking-wider text-slate-600 pb-1.5 mb-2 border-b border-slate-100">
                  INVOICE
                </div>

                {/* Medical Cross Icon Circle */}
                <div className="flex justify-center mb-2.5">
                  <div className="w-7 h-7 rounded-full bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center shadow-inner">
                    <svg className="w-3.5 h-3.5 text-cyan-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v5.5H5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z" />
                    </svg>
                  </div>
                </div>

                {/* Simulated Invoice Table Rows */}
                <div className="space-y-1.5">
                  <div className="h-1 bg-slate-200 rounded-full w-full" />
                  <div className="h-1 bg-slate-200 rounded-full w-4/5" />
                  <div className="h-1 bg-slate-200 rounded-full w-full" />
                  <div className="h-1 bg-slate-200 rounded-full w-3/4" />
                </div>

                {/* Bottom Total Line */}
                <div className="mt-2.5 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                  <div className="h-1.5 w-1/3 bg-slate-200 rounded-full" />
                  <div className="h-1.5 w-1/4 bg-blue-500 rounded-full" />
                </div>
              </div>

              {/* Overlapping 3D Security Shield Badge */}
              <div className="absolute -bottom-3 -left-4 z-20 transform -rotate-6 transition hover:rotate-0 duration-300">
                <div className="relative w-14 h-16 bg-gradient-to-b from-blue-500 via-blue-600 to-indigo-800 rounded-xl shadow-[0_10px_24px_rgba(29,78,216,0.6)] border-2 border-cyan-300/60 flex items-center justify-center p-3">
                  {/* Padlock Icon */}
                  <svg className="w-7 h-7 text-white drop-shadow-md" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 00-7.5 0v3h7.5z" clipRule="evenodd" />
                  </svg>

                  {/* Verification Checkmark Badge */}
                  <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 bg-cyan-400 rounded-full border-2 border-[#092657] flex items-center justify-center shadow-md">
                    <svg className="w-2.5 h-2.5 text-slate-950 font-bold" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Bottom 4 Feature Items (Horizontal Columns) */}
          <div className="relative z-10 pt-3 border-t border-white/10 mt-auto">
            <div className="grid grid-cols-4 gap-1.5 text-center">
              
              {/* Feature 1: Smart Document Analysis */}
              <div className="flex flex-col items-center group">
                <div className="w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-cyan-300 mb-1 group-hover:bg-cyan-500/20 group-hover:scale-105 transition">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                    <path d="M8 11h6" strokeLinecap="round" strokeDasharray="1 2" />
                  </svg>
                </div>
                <span className="text-[10px] leading-tight text-blue-100/90 font-medium">
                  Smart Document<br />Analysis
                </span>
              </div>

              {/* Feature 2: Template Similarity Search */}
              <div className="flex flex-col items-center group">
                <div className="w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-cyan-300 mb-1 group-hover:bg-cyan-500/20 group-hover:scale-105 transition">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-[10px] leading-tight text-blue-100/90 font-medium">
                  Template Similarity<br />Search
                </span>
              </div>

              {/* Feature 3: Risk Scoring Engine */}
              <div className="flex flex-col items-center group">
                <div className="w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-cyan-300 mb-1 group-hover:bg-cyan-500/20 group-hover:scale-105 transition">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round" />
                    <circle cx="12" cy="17" r="0.5" fill="currentColor" />
                  </svg>
                </div>
                <span className="text-[10px] leading-tight text-blue-100/90 font-medium">
                  Risk Scoring<br />Engine
                </span>
              </div>

              {/* Feature 4: Investigator Dashboard */}
              <div className="flex flex-col items-center group">
                <div className="w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-cyan-300 mb-1 group-hover:bg-cyan-500/20 group-hover:scale-105 transition">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="7" r="4" />
                    <path d="M5.5 21a6.5 6.5 0 0113 0" strokeLinecap="round" />
                  </svg>
                </div>
                <span className="text-[10px] leading-tight text-blue-100/90 font-medium">
                  Investigator<br />Dashboard
                </span>
              </div>

            </div>
          </div>

        </div>


        {/* ================= RIGHT PANEL (Login Form) ================= */}
        <div className="w-full md:w-[52%] bg-white p-7 sm:p-9 lg:p-10 flex flex-col justify-between">
          
          {/* Top Security Badge */}
          <div className="flex justify-end mb-4 sm:mb-6">
            <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <svg className="w-3.5 h-3.5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Secure • Reliable • Intelligent</span>
            </div>
          </div>

          {/* Form Content */}
          <div className="max-w-md w-full mx-auto my-auto">
            {/* Header */}
            <h2 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight mb-1">
              Welcome Back!
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mb-5 font-normal">
              Sign in to your account to continue
            </p>

            {/* Error Message */}
            {error && (
              <div className="mb-4 px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Email / Username Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email / Username
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="7" r="4" />
                      <path d="M5.5 21a6.5 6.5 0 0113 0" strokeLinecap="round" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Enter your email or username"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 transition shadow-xs"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 transition shadow-xs"
                  />
                  {/* Password Show/Hide Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 transition p-1"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Forgot Password Link */}
                <div className="flex justify-end mt-1.5">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline transition"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] active:bg-[#1e40af] disabled:bg-blue-400 text-white font-medium py-2.5 rounded-lg text-sm transition shadow-sm hover:shadow flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" strokeLinecap="round" />
                      <polyline points="10 17 15 12 10 7" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="15" y1="12" x2="3" y2="12" strokeLinecap="round" />
                    </svg>
                    <span>Login</span>
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-2.5">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400 font-normal">or</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Login with JWT Token Button */}
              <button
                type="button"
                onClick={() => {
                  setJwtError("");
                  setShowJwtModal(true);
                }}
                className="w-full bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 hover:border-blue-400 text-slate-700 hover:text-blue-700 font-medium py-2.5 rounded-lg text-sm transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4 text-blue-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Login with JWT Token</span>
              </button>

            </form>
          </div>

          {/* Footer Register Link */}
          <div className="text-center mt-5 pt-2">
            <p className="text-xs text-slate-500 font-normal">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setRegError("");
                  setRegSuccess("");
                  setShowRegisterModal(true);
                }}
                className="text-blue-600 font-medium hover:text-blue-700 hover:underline ml-0.5 cursor-pointer"
              >
                Register here
              </button>
            </p>
          </div>

        </div>

      </div>

      {/* ================= USER REGISTRATION MODAL ================= */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="8.5" cy="7" r="4" />
                    <line x1="20" y1="8" x2="20" y2="14" />
                    <line x1="23" y1="11" x2="17" y2="11" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  Create a DocTrace Account
                </h3>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              Register as a user to submit medical claim documents for AI template integrity and fraud analysis.
            </p>

            {regError && (
              <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs">
                {regError}
              </div>
            )}

            {regSuccess && (
              <div className="mb-3 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs">
                {regSuccess}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={regForm.fullName}
                  onChange={(e) => setRegForm({ ...regForm, fullName: e.target.value })}
                  placeholder="Dr. Jane Doe"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Work Email Address
                </label>
                <input
                  type="email"
                  required
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  placeholder="jane.doe@hospital.org"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password (min. 6 chars)
                </label>
                <input
                  type="password"
                  required
                  value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={regForm.confirmPassword}
                  onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={regLoading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                >
                  {regLoading ? "Registering..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= JWT TOKEN LOGIN MODAL ================= */}
      {showJwtModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  Authenticate with JWT Token
                </h3>
              </div>
              <button
                onClick={() => setShowJwtModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              Paste a valid Bearer JWT authentication token to authenticate directly as an investigator without entering credentials.
            </p>

            {jwtError && (
              <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs">
                {jwtError}
              </div>
            )}

            <form onSubmit={handleJwtLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  JWT Token
                </label>
                <textarea
                  rows={4}
                  value={jwtTokenInput}
                  onChange={(e) => {
                    setJwtTokenInput(e.target.value);
                    setJwtError("");
                  }}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full p-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowJwtModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition cursor-pointer"
                >
                  Apply & Enter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= FORGOT PASSWORD MODAL ================= */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">
              Reset Password
            </h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              For security reasons, password resets are handled by your organization's security administrator. Please contact your system admin.
            </p>
            <button
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
