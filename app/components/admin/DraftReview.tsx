// app/components/admin/DraftReview.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  FileSearch,
} from "lucide-react";
import type { Division, Norm } from "@/types/audit";
import NormDetailModal from "./NormDetailModal";

interface Props {
  divisions: Division[];
}

export default function DraftReview({ divisions }: Props) {
  const [norms, setNorms] = useState<Norm[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDivisi, setFilterDivisi] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("REVIEW_REQUIRED");
  const [selectedNorm, setSelectedNorm] = useState<Norm | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchNorms = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (filterDivisi !== "all") params.set("divisionId", filterDivisi);

      const res = await fetch(`/api/norms?${params.toString()}`);
      const data = await res.json();
      setNorms(data.norms ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNorms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterDivisi]);

  const filtered = useMemo(() => {
    if (!search.trim()) return norms;
    const q = search.toLowerCase();
    return norms.filter(
      (n) =>
        n.normCode.toLowerCase().includes(q) ||
        n.article.toLowerCase().includes(q) ||
        n.criteria.toLowerCase().includes(q) ||
        n.regulation?.title.toLowerCase().includes(q)
    );
  }, [norms, search]);

  const handleApprove = async (id: number) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/norms/${id}/approve`, { method: "POST" });
      if (res.ok) {
        await fetchNorms();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm("Yakin ingin reject norma ini?")) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/norms/${id}/reject`, { method: "POST" });
      if (res.ok) {
        await fetchNorms();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin hapus norma ini beserta aturannya?")) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/norms/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchNorms();
      }
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
          <FileSearch className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Draft Review</h1>
          <p className="text-sm text-slate-400">
            Review, edit, dan approve hasil ekstraksi AI
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kode, pasal, kriteria, atau peraturan..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700 focus:border-cyan-500 text-sm text-white placeholder:text-slate-600 outline-none"
          />
        </div>
        <select
          value={filterDivisi}
          onChange={(e) => setFilterDivisi(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700 text-sm text-white outline-none"
        >
          <option value="all">Semua Divisi</option>
          {divisions.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700 text-sm text-white outline-none"
        >
          <option value="REVIEW_REQUIRED">Review Required</option>
          <option value="DRAFT">Draft</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="all">Semua Status</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <FileSearch className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 font-semibold">
              Tidak ada norma untuk direview
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Upload peraturan terlebih dahulu
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800">
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase">
                    ID Norma
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase">
                    Divisi
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase">
                    Kriteria
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase">
                    Pasal/Ayat
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase">
                    Peraturan
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase">
                    Aturan
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((norm) => (
                  <tr
                    key={norm.id}
                    className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-cyan-400">
                        {norm.normCode}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-300">
                        {norm.regulation?.division.name ?? "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-xs font-semibold">
                        {norm.criteria}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      Pasal {norm.article}
                      {norm.paragraph && ` Ayat ${norm.paragraph}`}
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-xs text-slate-300 truncate">
                        {norm.regulation?.title ?? "-"}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {norm.regulation?.regulationNumber} •{" "}
                        {norm.regulation?.year}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold text-amber-400">
                        {norm.rules.length} aturan
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={norm.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedNorm(norm)}
                          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-400"
                          title="Detail"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleApprove(norm.id)}
                          disabled={actionLoading === norm.id}
                          className="p-1.5 rounded hover:bg-green-500/10 text-slate-400 hover:text-green-400 disabled:opacity-50"
                          title="Approve"
                        >
                          {actionLoading === norm.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleReject(norm.id)}
                          disabled={actionLoading === norm.id}
                          className="p-1.5 rounded hover:bg-red-500/10 text-slate-400 hover:text-red-400 disabled:opacity-50"
                          title="Reject"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(norm.id)}
                          disabled={actionLoading === norm.id}
                          className="p-1.5 rounded hover:bg-red-500/10 text-slate-400 hover:text-red-400 disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedNorm && (
        <NormDetailModal
          norm={selectedNorm}
          onClose={() => setSelectedNorm(null)}
          onUpdate={() => {
            fetchNorms();
            setSelectedNorm(null);
          }}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string; icon: React.ElementType }> = {
    DRAFT: {
      color: "bg-slate-500/20 text-slate-300 border-slate-500/30",
      label: "Draft",
      icon: FileSearch,
    },
    REVIEW_REQUIRED: {
      color: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      label: "Review",
      icon: AlertTriangle,
    },
    APPROVED: {
      color: "bg-green-500/20 text-green-300 border-green-500/30",
      label: "Approved",
      icon: CheckCircle2,
    },
    REJECTED: {
      color: "bg-red-500/20 text-red-300 border-red-500/30",
      label: "Rejected",
      icon: XCircle,
    },
  };
  const s = map[status] ?? map.DRAFT;
  const Icon = s.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${s.color}`}
    >
      <Icon className="w-3 h-3" />
      {s.label}
    </span>
  );
}