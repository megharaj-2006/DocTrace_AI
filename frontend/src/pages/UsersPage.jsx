import { useState, useEffect } from "react";
import useAuthStore from "../store/authStore";
import { getAdminUsers, updateUserRole } from "../api/userApi";

export default function UsersPage() {
  const currentUser = useAuthStore((state) => state.user);
  const isAdmin = currentUser?.role === "ADMIN" || currentUser?.roles?.includes("ROLE_ADMIN");

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Role Update State
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [selectedRole, setSelectedRole] = useState("INVESTIGATOR");
  const [roleLoading, setRoleLoading] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAdminUsers(page, 10);
      if (data && data.content) {
        setUsers(data.content);
        setTotalPages(data.totalPages || 1);
        setTotalElements(data.totalElements || 0);
      } else if (Array.isArray(data)) {
        setUsers(data);
        setTotalPages(1);
        setTotalElements(data.length);
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setError("Access Restricted: User & Role administration requires System Administrator (ADMIN) privileges.");
      } else {
        setError("Failed to load user directory.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page]);

  const handleRoleChange = async (userId, newRole) => {
    setRoleLoading(true);
    try {
      await updateUserRole(userId, newRole);
      setUpdatingUserId(null);
      loadUsers();
    } catch (err) {
      alert("Failed to update user role: " + (err.response?.data?.message || err.message));
    } finally {
      setRoleLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">User & Role Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            System identity administration, role-based access control, and investigator privilege provisioning.
          </p>
        </div>
        <button
          onClick={loadUsers}
          disabled={loading}
          className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition cursor-pointer"
        >
          <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Directory
        </button>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="font-semibold">{error}</p>
            <p className="mt-1 text-amber-700">
              Only authenticated System Administrators can view the registered user accounts and modify security roles.
            </p>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400">
            <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs">Loading registered users from database...</p>
          </div>
        ) : users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Current Role</th>
                  <th className="py-3 px-4">Joined On</th>
                  <th className="py-3 px-4 text-right">Role Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const roleStr = u.role || (u.roles && u.roles[0]) || "USER";
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                            {(u.fullName || u.email || "U").substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800 block">{u.fullName || "User"}</span>
                            <span className="text-[11px] text-slate-400 font-mono">ID: {u.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{u.email}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            roleStr === "ADMIN" || roleStr === "ROLE_ADMIN"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : roleStr === "INVESTIGATOR" || roleStr === "ROLE_INVESTIGATOR"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {roleStr.replace("ROLE_", "")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isAdmin ? (
                          <div className="inline-flex items-center gap-1.5">
                            <select
                              value={roleStr.replace("ROLE_", "")}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              disabled={roleLoading}
                              className="px-2 py-1 border border-slate-300 rounded text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                            >
                              <option value="USER">USER</option>
                              <option value="INVESTIGATOR">INVESTIGATOR</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Admin Only</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400">
            <p className="text-sm font-semibold text-slate-600">No users found</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
            >
              Previous
            </button>
            <span className="text-slate-500">
              Page <span className="font-semibold">{page + 1}</span> of <span className="font-semibold">{totalPages}</span>
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}