import { NavLink, useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";

const navItems = [
  {
    path: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
  },
  {
    path: "/upload",
    label: "Upload & Analyze",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
        />
      </svg>
    ),
  },
  {
    path: "/invoices",
    label: "Invoices",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
  {
    path: "/analysis",
    label: "Analysis",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
  },
  {
    path: "/similar",
    label: "Similar Documents",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
        />
      </svg>
    ),
  },
  {
    path: "/alerts",
    label: "Alerts",
    badge: 3,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
    ),
  },
  {
    path: "/providers",
    label: "Providers",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </svg>
    ),
  },
  {
    path: "/reports",
    label: "Reports",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
  {
    path: "/users",
    label: "Users",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    ),
  },
  {
    path: "/audit-logs",
    label: "Audit Logs",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
    ),
  },
  {
    path: "/settings",
    label: "Settings",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="w-[230px] min-h-screen bg-[#071638] flex flex-col fixed left-0 top-0 z-50 select-none shadow-xl border-r border-slate-800/40">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 py-6">
        {/* Shield Logo with Document & Magnifier */}
        <div className="relative w-9 h-10 flex items-center justify-center flex-shrink-0">
          <svg className="w-9 h-10 text-blue-500 drop-shadow-[0_2px_8px_rgba(37,99,235,0.6)]" viewBox="0 0 36 40" fill="currentColor">
            <path d="M18 0L2 6V18C2 28.5 8.8 38.2 18 40C27.2 38.2 34 28.5 34 18V6L18 0Z" fill="url(#shield-grad-sidebar)" stroke="#38bdf8" strokeWidth="1.5" />
            <defs>
              <linearGradient id="shield-grad-sidebar" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#0a2864" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-4 h-5 bg-white rounded-[2px] shadow-xs flex flex-col justify-center px-0.5 gap-0.5">
              <div className="w-full h-0.5 bg-blue-600 rounded-full" />
              <div className="w-2 h-0.5 bg-blue-400 rounded-full" />
              <div className="w-full h-0.5 bg-slate-300 rounded-full" />
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-cyan-400 rounded-full flex items-center justify-center shadow">
                <svg className="w-1.5 h-1.5 text-slate-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                  <circle cx="10" cy="10" r="6" />
                  <path d="M15 15l5 5" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Logo Typography */}
        <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1">
          DocTrace <span className="text-[#38bdf8] font-bold">AI</span>
        </span>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative ${
                isActive
                  ? "bg-[#2563eb] text-white shadow-md font-semibold"
                  : "text-slate-300/80 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            <span className="flex-shrink-0">{item.icon}</span>
            <span>{item.label}</span>
            {item.badge && (
              <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center shadow-xs">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Profile Section at Bottom */}
      <div className="p-3 border-t border-white/10">
        <div
          onClick={handleLogout}
          className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-white/10 transition cursor-pointer"
          title="Click to logout"
        >
          <div className="w-9 h-9 rounded-full bg-slate-300/30 border border-white/20 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            <svg className="w-5 h-5 text-slate-200" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2a5 5 0 100 10 5 5 0 000-10zm-7 18a7 7 0 0114 0H5z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-left overflow-hidden flex-1">
            <p className="text-white text-xs font-semibold truncate leading-tight">
              {user?.fullName || "Investigator"}
            </p>
            <p className="text-slate-400 text-[11px] truncate leading-tight">
              {user?.email || "investigator@doctrace.ai"}
            </p>
          </div>
          <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
