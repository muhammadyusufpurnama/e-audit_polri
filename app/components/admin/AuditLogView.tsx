// app/components/admin/AuditLogView.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ClipboardList,
  Search,
  Upload,
  Sparkles,
  Pencil,
  CheckCircle2,
  XCircle,
  Trash2,
  LogIn,
  Loader2,
  RefreshCw,
  Calendar,
  Filter,
} from "lucide-react";
import type { AuditLog } from "@/types/audit";

// ==========================================
// ACTION CONFIG
// ==========================================
const ACTION_CONFIG: Record<
  string,
  {
    label: string;
    color: string;
    bg: string;
    icon: React.ElementType;
  }
> = {
  UPLOAD: {
    label: "Upload",
    color: "text-blue-400",
    bg: "bg-blue-500/20",
    icon: Upload,
  },
  ANALYZE: {
    label: "Analyze",
    color: "text-purple-400",
    bg: "bg-purple-500/20",
    icon: Sparkles,
  },
  EDIT: {
    label: "Edit",
    color: "text-amber-400",
    bg: "bg-amber-500/20",
    icon: Pencil,
  },
  APPROVE: {
    label: "Approve",
    color: "text-green-400",
    bg: "bg-green-500/20",
    icon: CheckCircle2,
  },
  REJECT: {
    label: "Reject",
    color: "text-red-400",
    bg: "bg-red-500/20",
    icon: XCircle,
  },
  DELETE: {
    label: "Delete",
    color: "text-rose-400",
    bg: "bg-rose-500/20",
    icon: Trash2,
  },
  LOGIN: {
    label: "Login",
    color: "text-cyan-400",
    bg: "bg-cyan-500/20",
    icon: LogIn,
  },
};

const DEFAULT_CONFIG = {
  label: "Unknown",
  color: "text-slate-400",
  bg: "bg-slate-500/20",
  icon: ClipboardList,
};

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function AuditLogView() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/audit-logs?limit=200");
      const data = await res.json();
      setLogs(data.logs ?? []);
    } catch (err) {
      console.error("Gagal load audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filtered = useMemo(() => {
    let result = logs;

    if (filterAction !== "all") {
      result = result.filter((l) => l.action === filterAction);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.action.toLowerCase().includes(q) ||
          l.targetType.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.userId.toLowerCase().includes(q)
      );
    }

    return result;
  }, [logs, search, filterAction]);

  // Statistik per action
  const actionStats = useMemo(() => {
    const stats: Record<string, number> = {};
    logs.forEach((l) => {
      stats[l.action] = (stats[l.action] ?? 0) + 1;
    });
    return stats;
  }, [logs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <ClipboardList className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Audit Log</h1>
            <p className="text-sm text-slate-400">
              Riwayat aktivitas admin di sistem
            </p>
          </div>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors border border-slate-800"
        >
          <RefreshCw
            className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Statistik Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
        {Object.entries(ACTION_CONFIG).map(([key, cfg]) => {
          const Icon = cfg.icon;
          const count = actionStats[key] ?? 0;
          return (
            <button
              key={key}
              onClick={() =>
                setFilterAction(filterAction === key ? "all" : key)
              }
              className={`
                p-3 rounded-xl border transition-all text-left
                ${
                  filterAction === key
                    ? "border-cyan-500/50 bg-cyan-500/10 shadow-lg shadow-cyan-500/10"
                    : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                }
              `}
            >
              <div
                className={`w-7 h-7 rounded-lg ${cfg.bg} flex items-center justify-center mb-2`}
              >
                <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                {cfg.label}
              </p>
              <p className="text-lg font-bold text-white mt-0.5">{count}</p>
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari aksi, target, deskripsi, atau user..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700 focus:border-cyan-500 text-sm text-white placeholder:text-slate-600 outline-none"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="pl-10 pr-8 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700 text-sm text-white outline-none appearance-none"
          >
            <option value="all">Semua Aksi</option>
            {Object.entries(ACTION_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>
                {cfg.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Log List */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardList className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 font-semibold">
              {logs.length === 0
                ? "Belum ada aktivitas tercatat"
                : "Tidak ada hasil ditemukan"}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {logs.length === 0
                ? "Aktivitas admin akan otomatis tercatat di sini"
                : "Coba ubah kata kunci atau filter"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {filtered.map((log) => {
              const cfg = ACTION_CONFIG[log.action] ?? DEFAULT_CONFIG;
              const Icon = cfg.icon;
              return (
                <div
                  key={log.id}
                  className="p-4 hover:bg-slate-800/30 transition-colors flex items-start gap-3"
                >
                  <div
                    className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}
                  >
                    <Icon className={`w-5 h-5 ${cfg.color}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}
                      >
                        {cfg.label}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">
                        {log.targetType}
                        {log.targetId && ` #${log.targetId}`}
                      </span>
                      {log.userId && log.userId !== "system" && (
                        <span className="text-[10px] text-slate-500">
                          oleh <strong className="text-slate-400">{log.userId}</strong>
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed">
                      {log.description}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-slate-500">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDateTime(log.createdAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        {filtered.length > 0 && (
          <div className="p-3 border-t border-slate-800 text-center text-xs text-slate-500">
            Menampilkan {filtered.length} dari {logs.length} log
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// HELPER
// ==========================================
function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}