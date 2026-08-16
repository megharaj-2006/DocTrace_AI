import { useEffect, useState } from "react";
import { getAuditLogs } from "../api/auditLogApi";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const data = await getAuditLogs();
        setLogs(data.content || []);
      } catch (err) {
        setError(err.response?.status === 403
          ? "Audit logs are available to administrators only."
          : "Failed to load audit logs.");
      } finally {
        setLoading(false);
      }
    };
    loadLogs();
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Audit Logs</h1>
        <p className="text-sm text-gray-400 mt-0.5">Recent application and investigation activity</p>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        {loading ? <div className="p-6 text-sm text-gray-400">Loading audit logs…</div>
          : logs.length === 0 ? <div className="p-10 text-center text-sm text-gray-400">No audit activity recorded yet.</div>
          : <table className="w-full">
              <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-400">
                <tr><th className="px-5 py-3 font-medium">Time</th><th className="px-5 py-3 font-medium">Action</th><th className="px-5 py-3 font-medium">Entity</th><th className="px-5 py-3 font-medium">Details</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm text-gray-600">
                {logs.map((log) => <tr key={log.id}>
                  <td className="px-5 py-3 text-xs text-gray-400">{log.createdAt ? new Date(log.createdAt).toLocaleString() : "—"}</td>
                  <td className="px-5 py-3 font-medium text-gray-700">{log.action}</td>
                  <td className="px-5 py-3">{log.entityType}{log.entityId ? ` #${log.entityId}` : ""}</td>
                  <td className="px-5 py-3">{log.details || "—"}</td>
                </tr>)}
              </tbody>
            </table>}
      </div>
    </div>
  );
}
