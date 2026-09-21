"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, Search, Lock } from "lucide-react";

interface AuditLogItem {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
  createdAt: string;
  performedBy?: { name: string; email: string; role: string };
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/audit-logs")
      .then((res) => {
        if (!res.ok) throw new Error("Forbidden: Admin access required");
        return res.json();
      })
      .then((data) => setLogs(data.logs || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.entity.toLowerCase().includes(search.toLowerCase()) ||
      (l.details && l.details.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-purple-600" />
            <span>System Security Audit Logs</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable audit record tracking all authentication events, disaster creation, stock allocation, and dispatch actions.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="saas-card p-4 flex items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit trail..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">Loading audit records...</div>
      ) : error ? (
        <div className="saas-card p-6 text-center text-rose-600 text-xs font-semibold">
          {error}
        </div>
      ) : (
        <div className="saas-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Action Event</th>
                  <th className="px-4 py-3">Entity</th>
                  <th className="px-4 py-3">Performed By</th>
                  <th className="px-4 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-bold text-indigo-600">{log.action}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {log.entity} {log.entityId ? `(${log.entityId.slice(0, 8)}...)` : ""}
                    </td>
                    <td className="px-4 py-3">
                      {log.performedBy ? (
                        <div>
                          <p className="font-semibold text-slate-900">{log.performedBy.name}</p>
                          <p className="text-[10px] text-slate-500">{log.performedBy.role}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">System</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                      {log.details || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
