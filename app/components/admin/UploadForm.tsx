// app/components/admin/UploadForm.tsx
"use client";

import { useState, useRef, type ChangeEvent, type FormEvent } from "react";
import {
  Upload,
  FileText,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import type { Division } from "@/types/audit";

const REGULATION_TYPES = [
  "Undang-Undang",
  "Peraturan Pemerintah",
  "Peraturan Presiden",
  "Peraturan Menteri",
  "Peraturan Daerah",
  "Peraturan lainnya",
];

const ANALYSIS_STEPS = [
  "Uploading document...",
  "Extracting text...",
  "Detecting legal structure...",
  "Extracting norms...",
  "Generating audit rules...",
  "Validating result...",
];

interface Props {
  divisions: Division[];
  defaultDivision: Division | null;
  onSuccess: () => void;
}

export default function UploadForm({
  divisions,
  defaultDivision,
  onSuccess,
}: Props) {
  const [divisionId, setDivisionId] = useState<number>(
    defaultDivision?.id ?? divisions[0]?.id ?? 0
  );
  const [regulationType, setRegulationType] = useState(REGULATION_TYPES[0]);
  const [regulationNumber, setRegulationNumber] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    const ext = f.name.toLowerCase().split(".").pop();
    if (!["pdf", "doc", "docx"].includes(ext ?? "")) {
      setError("Format harus PDF, DOC, atau DOCX");
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      setError("File terlalu besar (max 20MB)");
      return;
    }
    setFile(f);
    setError("");
    if (!title) {
      setTitle(f.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!file) return setError("Pilih file peraturan");
    if (!divisionId) return setError("Pilih divisi");
    if (!title.trim()) return setError("Judul peraturan wajib diisi");

    setLoading(true);
    setProgressStep(0);

    // Simulasi progress step (visual feedback)
    const stepInterval = setInterval(() => {
      setProgressStep((s) => Math.min(s + 1, ANALYSIS_STEPS.length - 1));
    }, 1500);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("divisionId", String(divisionId));
      formData.append("regulationType", regulationType);
      formData.append("regulationNumber", regulationNumber);
      formData.append("year", year);
      formData.append("title", title);

      const res = await fetch("/api/regulations/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal memproses dokumen");
      }

      if (data.aiError) {
        setError(data.aiError);
        return;
      }

      setSuccess(
        `Analisis selesai! ${data.normsCreated} norma, ${data.rulesCreated} aturan dibuat.`
      );

      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
          <Upload className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Upload Peraturan</h1>
          <p className="text-sm text-slate-400">
            Sistem akan mengekstrak norma & aturan audit secara otomatis
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5"
      >
        {/* Grid: Divisi + Jenis */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Divisi <span className="text-red-400">*</span>
            </label>
            <select
              value={divisionId}
              onChange={(e) => setDivisionId(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-700 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none text-white text-sm"
            >
              {divisions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Jenis Peraturan <span className="text-red-400">*</span>
            </label>
            <select
              value={regulationType}
              onChange={(e) => setRegulationType(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-700 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none text-white text-sm"
            >
              {REGULATION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Nomor + Tahun */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Nomor Peraturan
            </label>
            <input
              type="text"
              value={regulationNumber}
              onChange={(e) => setRegulationNumber(e.target.value)}
              placeholder="cth: 16"
              className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-700 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none text-white text-sm placeholder:text-slate-600"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Tahun
            </label>
            <input
              type="text"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="2024"
              className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-700 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none text-white text-sm placeholder:text-slate-600"
            />
          </div>
        </div>

        {/* Judul */}
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">
            Judul Peraturan <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="cth: Pengadaan Barang/Jasa Pemerintah"
            className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-700 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none text-white text-sm placeholder:text-slate-600"
          />
        </div>

        {/* File Dropzone */}
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">
            File Peraturan <span className="text-red-400">*</span>
          </label>
          {!file ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDragActive(false);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`
                cursor-pointer flex flex-col items-center justify-center gap-3
                border-2 border-dashed rounded-2xl p-8 text-center
                transition-all duration-300
                ${
                  dragActive
                    ? "border-cyan-500 bg-cyan-500/10 scale-[1.02]"
                    : "border-slate-700 hover:border-cyan-500/50 hover:bg-slate-950/40"
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
              <div
                className={`
                  w-14 h-14 rounded-2xl flex items-center justify-center transition-all
                  ${
                    dragActive
                      ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white scale-110"
                      : "bg-slate-800 text-cyan-400"
                  }
                `}
              >
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  {dragActive
                    ? "Lepaskan file di sini"
                    : "Klik atau seret file ke sini"}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  PDF, DOC, DOCX — Maks 10MB
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-cyan-500/30 bg-cyan-500/5">
              <div className="w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center text-cyan-400 shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {file.name}
                </p>
                <p className="text-xs text-slate-400">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Progress */}
        {loading && (
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            {ANALYSIS_STEPS.map((step, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                {i < progressStep ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                ) : i === progressStep ? (
                  <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
                )}
                <span
                  className={
                    i <= progressStep ? "text-white" : "text-slate-600"
                  }
                >
                  {step}
                </span>
              </div>
            ))}
            {progressStep >= ANALYSIS_STEPS.length - 1 && (
              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2 text-xs font-semibold text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Analysis Complete</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error / Success */}
        {error && (
          <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/30 p-3 rounded-xl">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-start gap-2 text-sm text-green-400 bg-green-500/10 border border-green-500/30 p-3 rounded-xl">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !file}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-cyan-500/30"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Menganalisis...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>UPLOAD & ANALISIS</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}