// app/components/admin/MasterDataTable.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Eye,
  Trash2,
  Loader2,
  Database,
  RefreshCw,
  FileText,
  CheckCircle2,
} from "lucide-react";
import type { Division, Norm } from "@/types/audit";
import NormDetailModal from "./NormDetailModal";

interface Props {
  divisions: Division[];
}

export default function MasterDataTable({ divisions }: Props) {
  const [norms, setNorms] = useState<Norm[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDivisi, setFilterDivisi] = useState<string>("all");
  const [filterTahun, setFilterTahun] = useState<string>("all");
  const [selectedNorm, setSelectedNorm] = useState<Norm | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchNorms = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("status", "APPROVED");
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
  }, [filterDivisi, filterTahun]);

  const years = useMemo(() => {
    const set = new Set<string>();
    norms.forEach((n) => {
      if (n.regulation?.year) set.add(n.regulation.year);
    });
    return Array.from(set).sort().reverse();
  }, [norms]);

  const filtered = useMemo(() => {
    let result = norms;

    if (filterTahun !== "all") {
      result = result.filter((n) => n.regulation?.year === filterTahun);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (n) =>
          n.normCode.toLowerCase().includes(q) ||
          n.article.toLowerCase().includes(q) ||
          n.criteria.toLowerCase().includes(q) ||
          n.regulation?.title.toLowerCase().includes(q) ||
          n.regulation?.regulationNumber.toLowerCase().includes(q)
      );
    }

    return result;
  }, [norms, search, filterTahun]);

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin hapus norma ini dari Master Data?")) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/norms/${id}`, { method: "DELETE" });
      if (res.ok) await fetchNorms();
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Master Data</h1>
            <p className="text-sm text-slate-400">
              Norma & aturan audit yang sudah di-approve
            </p>
          </div>
        </div>
        <button
          onClick={fetchNorms}
          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors border border-slate-800"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
              Total Norma Approved
            </span>
          </div>
          <p className="text-2xl font-bold text-white">{norms.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
              Total Aturan
            </span>
          </div>
          <p className="text-2xl font-bold text-white">
            {norms.reduce((sum, n) => sum + n.rules.length, 0)}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
              Hasil Filter
            </span>
          </div>
          <p className="text-2xl font-bold text-white">{filtered.length}</p>
        </div>
      </div>

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
          value={filterTahun}
          onChange={(e) => setFilterTahun(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700 text-sm text-white outline-none"
        >
          <option value="all">Semua Tahun</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Database className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 font-semibold">
              {norms.length === 0
                ? "Belum ada data yang di-approve"
                : "Tidak ada hasil ditemukan"}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {norms.length === 0
                ? "Approve norma di Draft Review untuk memasukkannya ke Master Data"
                : "Coba ubah filter atau kata kunci"}
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
                      <span className="text-xs font-mono text-emerald-400">
                        {norm.normCode}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-300">
                        {norm.regulation?.division.name ?? "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
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
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedNorm(norm)}
                          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-400"
                          title="Detail"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(norm.id)}
                          disabled={actionLoading === norm.id}
                          className="p-1.5 rounded hover:bg-red-500/10 text-slate-400 hover:text-red-400 disabled:opacity-50"
                          title="Hapus"
                        >
                          {actionLoading === norm.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
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