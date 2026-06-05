import { useState, useEffect } from "react";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { Loader2, ClipboardList, User, Clock, Activity } from "lucide-react";
import { motion } from "motion/react";

export function AuditLogView() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const data = await apiFetch("/api/admin/audit-logs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Failed to fetch logs");
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes("DELETE")) return "text-red-500 bg-red-50 border-red-100";
    if (action.includes("CREATE") || action.includes("ADD")) return "text-emerald-500 bg-emerald-50 border-emerald-100";
    if (action.includes("UPDATE")) return "text-blue-500 bg-blue-50 border-blue-100";
    return "text-brand-dark/60 bg-gray-50 border-gray-100";
  };

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="font-brand text-3xl font-black uppercase tracking-tighter text-brand-dark italic flex items-center gap-3">
          <ClipboardList className="h-8 w-8 text-brand-primary" />
          Audit Log
        </h1>
        <p className="text-xs text-brand-dark/60 uppercase tracking-[0.2em] mt-1">System Activity & Administrative Actions</p>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-widest text-brand-dark/60">Activity Stream</h3>
          <Activity className="h-4 w-4 text-brand-primary animate-pulse" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white text-[10px] uppercase tracking-[0.2em] text-brand-dark/40 border-b border-gray-100">
              <tr>
                <th className="px-8 py-6 font-black">Action / Event</th>
                <th className="px-8 py-6 font-black">Operator</th>
                <th className="px-8 py-6 font-black">Timestamp</th>
                <th className="px-8 py-6 font-black">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-brand-dark/40 italic">
                    No activity recorded in the archives.
                  </td>
                </tr>
              ) : (
                logs.map((log, index) => (
                  <motion.tr 
                    key={log.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 transition-colors group"
                  >
                    <td className="px-8 py-6">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border ${getActionColor(log.action)}`}>
                        {log.action.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-brand-bg flex items-center justify-center text-[10px] font-black text-brand-primary">
                          <User size={12} />
                        </div>
                        <span className="font-bold text-brand-dark">{log.user_id.slice(0, 8)}...</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-brand-dark/60">
                        <Clock size={14} />
                        <span className="font-medium">{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs text-brand-dark/70 max-w-xs truncate" title={log.details}>
                        {log.details || "No additional details provided."}
                      </p>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
