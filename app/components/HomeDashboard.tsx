// app/components/HomeDashboard.tsx
"use client";

import {
  useRef,
  useState,
  useEffect,
  type ElementType,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  Upload,
  FileText,
  Download,
  Loader2,
  Users,
  Truck,
  Wallet,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  FileImage,
  FileSpreadsheet,
  X,
  RefreshCw,
  Sparkles,
  Eye,
  Trash2,
  Settings,
} from "lucide-react";
import {
  DIVISI_LIST,
  type DivisiKey,
  type DivisiConfig,
} from "@/lib/divisi";
import { LhaTemplate } from "./LhaTemplate";
import { generateLhaDocx } from "@/lib/generateDocx";
import type { BarisTemuan, LhaMetadata } from "@/lib/prompts";

// ---------- Helper ----------
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function getFileIcon(name: string, type: string) {
  if (type.startsWith("image/")) return FileImage;
  if (type === "application/pdf" || name.endsWith(".pdf"))
    return FileSpreadsheet;
  return FileText;
}

const ICON_MAP: Record<
  "Settings" | "Users" | "Truck" | "Wallet",
  ElementType
> = {
  Settings,
  Users,
  Truck,
  Wallet,
};

const emptyMetadata: LhaMetadata = {
  aspek: "-",
  bidang: "-",
  auditi: "-",
  tanggal: "-",
};

// ---------- Tipe State ----------
interface DivisiState {
  file: File | null;
  loading: boolean;
  rows: BarisTemuan[];
  metadata: LhaMetadata | null;
  error: string;
  provider: string;
}

const createInitialState = (): DivisiState => ({
  file: null,
  loading: false,
  rows: [],
  metadata: null,
  error: "",
  provider: "",
});

// ---------- Preview File Component ----------
function FilePreview({
  file,
  warna,
  onRemove,
}: {
  file: File;
  warna: { bg: string; border: string; text: string; accent: string };
  onRemove: () => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [txtContent, setTxtContent] = useState<string>("");
  const Icon = getFileIcon(file.name, file.type);

  const isImage = file.type.startsWith("image/");
  const isPDF =
    file.type === "application/pdf" || file.name.endsWith(".pdf");
  const isTxt = file.type === "text/plain" || file.name.endsWith(".txt");

  useEffect(() => {
    if (isImage || isPDF) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    if (isTxt) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = (e.target?.result as string) || "";
        setTxtContent(text.split("\n").slice(0, 20).join("\n"));
      };
      reader.readAsText(file);
    }
  }, [file, isImage, isPDF, isTxt]);

  return (
    <div
      className={`rounded-xl border-2 ${warna.border} ${warna.bg} overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300`}
    >
      <div className="flex items-center gap-3 p-4 border-b border-white/50">
        <div
          className={`w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm ${warna.text}`}
        >
          <Icon className="w-6 h-6" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">
            {file.name}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-600">
              {formatBytes(file.size)}
            </span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-600">
              {file.type || "unknown"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-white/70 rounded-lg">
            <CheckCircle2 className={`w-3.5 h-3.5 ${warna.text}`} />
            <span className={`text-xs font-medium ${warna.text}`}>Siap</span>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="p-2 rounded-lg hover:bg-white/70 text-gray-500 hover:text-red-600 transition-colors"
            title="Hapus file"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white">
        {isImage && previewUrl && (
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Preview Gambar
              </span>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt={file.name}
              className="max-h-72 w-auto mx-auto rounded-lg shadow-md border border-gray-200"
            />
          </div>
        )}

        {isPDF && previewUrl && (
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Preview PDF
              </span>
            </div>
            <iframe
              src={previewUrl}
              className="w-full h-80 rounded-lg border border-gray-200"
              title="Preview PDF"
            />
          </div>
        )}

        {isTxt && (
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Preview Teks (20 baris pertama)
              </span>
            </div>
            <pre className="text-xs text-gray-700 bg-gray-50 p-3 rounded-lg max-h-60 overflow-auto whitespace-pre-wrap border border-gray-200">
              {txtContent || "Memuat..."}
            </pre>
          </div>
        )}

        {!isImage && !isPDF && !isTxt && (
          <div className="p-6 text-center text-sm text-gray-500">
            Preview tidak tersedia untuk tipe file ini.
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Props ----------
interface HomeDashboardProps {
  allowedDivisi: DivisiConfig[];
  defaultDivisi: DivisiKey;
  userName?: string;
  userRole?: string;
}

// ---------- Komponen Utama ----------
export default function HomeDashboard({
  allowedDivisi,
  defaultDivisi,
}: HomeDashboardProps) {
  const [activeDivisi, setActiveDivisi] = useState<DivisiKey>(defaultDivisi);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [exportingWord, setExportingWord] = useState(false);

  // Bangun state awal HANYA untuk divisi yang diizinkan
  const buildInitialStates = (): Record<DivisiKey, DivisiState> => {
    const base: Record<string, DivisiState> = {};
    // Selalu sediakan 4 slot supaya type-safe, tapi yang diisi hanya yang allowed
    (["operasional", "sdm", "logistik", "keuangan"] as DivisiKey[]).forEach(
      (k) => {
        base[k] = createInitialState();
      }
    );
    return base as Record<DivisiKey, DivisiState>;
  };

  const [states, setStates] = useState<Record<DivisiKey, DivisiState>>(
    buildInitialStates
  );

  const operasionalRef = useRef<HTMLDivElement>(null);
  const sdmRef = useRef<HTMLDivElement>(null);
  const logistikRef = useRef<HTMLDivElement>(null);
  const keuanganRef = useRef<HTMLDivElement>(null);

  const reportRefs: Record<DivisiKey, React.RefObject<HTMLDivElement | null>> =
    {
      operasional: operasionalRef,
      sdm: sdmRef,
      logistik: logistikRef,
      keuangan: keuanganRef,
    };

  const current = states[activeDivisi];
  const activeConfig =
    allowedDivisi.find((d) => d.key === activeDivisi) ?? allowedDivisi[0];

  // Safety: kalau activeConfig undefined (harusnya tidak terjadi)
  if (!activeConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="text-gray-700 font-semibold">
            Anda tidak memiliki akses ke divisi manapun.
          </p>
          <p className="text-sm text-gray-500">
            Hubungi administrator untuk mendapatkan akses.
          </p>
        </div>
      </div>
    );
  }

  const ActiveIcon = ICON_MAP[activeConfig.icon];

  const updateState = (divisi: DivisiKey, patch: Partial<DivisiState>) => {
    setStates((prev) => ({
      ...prev,
      [divisi]: { ...prev[divisi], ...patch },
    }));
  };

  const handleDivisiChange = (key: DivisiKey) => {
    setActiveDivisi(key);
    setSidebarOpen(false);
  };

  // ---------- File handlers ----------
  const acceptFile = (f: File) => {
    updateState(activeDivisi, {
      file: f,
      error: "",
      rows: [],
      metadata: null,
    });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) acceptFile(f);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) acceptFile(f);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const removeFile = () => {
    updateState(activeDivisi, { file: null, error: "" });
  };

  // ---------- Submit Analisis ----------
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!current.file) {
      updateState(activeDivisi, { error: "Pilih file terlebih dahulu!" });
      return;
    }

    updateState(activeDivisi, {
      loading: true,
      error: "",
      rows: [],
      metadata: null,
    });

    try {
      const formData = new FormData();
      formData.append("file", current.file);
      formData.append("divisi", activeDivisi);

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      console.log("=== API RESPONSE ===");
      console.log(data);

      if (!res.ok) {
        throw new Error(data.error || "Gagal memproses dokumen");
      }

      const rows: BarisTemuan[] = Array.isArray(data.rows) ? data.rows : [];
      if (rows.length === 0) {
        throw new Error(
          "AI tidak mengembalikan data temuan. Coba lagi atau ganti model AI."
        );
      }

      updateState(activeDivisi, {
        rows,
        metadata: data.metadata ?? emptyMetadata,
        provider: data.provider ?? "",
      });
    } catch (err) {
      console.error("Submit error:", err);
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      updateState(activeDivisi, { error: msg });
    } finally {
      updateState(activeDivisi, { loading: false });
    }
  };

  // ---------- Export Markdown ----------
  const handleExportMarkdown = () => {
    if (current.rows.length === 0) return;
    const meta = current.metadata ?? emptyMetadata;

    const metaBlock =
      `ASPEK    : ${meta.aspek}\n` +
      `BIDANG   : ${meta.bidang}\n` +
      `AUDITI   : ${meta.auditi}\n` +
      `TANGGAL  : ${meta.tanggal}\n\n`;

    const header =
      "| NO | TEMUAN | KODE TEMUAN | KRITERIA | SEBAB | AKIBAT | REKOMENDASI |\n" +
      "|----|--------|-------------|----------|-------|--------|-------------|\n";

    const body = current.rows
      .map((r) =>
        [
          r.no,
          r.temuan.replace(/\n/g, "<br>").replace(/\|/g, "/"),
          r.kodeTemuan,
          r.kriteria.replace(/\n/g, "<br>").replace(/\|/g, "/"),
          r.sebab.replace(/\n/g, "<br>").replace(/\|/g, "/"),
          r.akibat.replace(/\n/g, "<br>").replace(/\|/g, "/"),
          r.rekomendasi.replace(/\n/g, "<br>").replace(/\|/g, "/"),
        ]
          .map((c) => ` ${c} `)
          .join("|")
          .replace(/^/, "|")
          .replace(/$/, "|")
      )
      .join("\n");

    const content =
      `# TABULASI TEMUAN HASIL PELAKSANAAN AUDIT\n\n` +
      `${metaBlock}${header}${body}\n`;

    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `laporan_${activeDivisi}_${
      current.file?.name || "dokumen"
    }.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ---------- Export Word ----------
  const handleExportWord = async () => {
    if (current.rows.length === 0) return;
    setExportingWord(true);

    try {
      console.log("=== DATA ROWS YANG AKAN DI-EXPORT ===");
      console.log(JSON.stringify(current.rows, null, 2));
      console.log("Jumlah rows:", current.rows.length);

      const filename = `laporan_${activeDivisi}_${
        current.file?.name?.replace(/\.[^/.]+$/, "") || "dokumen"
      }`;
      await generateLhaDocx(
        current.rows,
        filename,
        current.metadata ?? undefined
      );
    } catch (wordErr) {
      console.error("Gagal mengekspor Word:", wordErr);
      alert(
        "Gagal mengekspor Word: " +
          (wordErr instanceof Error ? wordErr.message : String(wordErr))
      );
    } finally {
      setExportingWord(false);
    }
  };

  // ---------- Export PDF ----------
  const handleExportPDF = async () => {
    const ref = reportRefs[activeDivisi];
    if (!ref.current || current.rows.length === 0) return;

    try {
      const html2pdfModule = (await import("html2pdf.js")).default;
      const options = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `laporan_${activeDivisi}_${
          current.file?.name?.replace(/\.[^/.]+$/, "") || "dokumen"
        }.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          windowWidth: 1200,
        },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "landscape" as const,
        },
        pagebreak: { mode: ["css", "legacy"] },
      };
      await html2pdfModule().set(options).from(ref.current).save();
    } catch (pdfErr) {
      console.error("Gagal mengekspor PDF:", pdfErr);
      window.print();
    }
  };

  const resetDivisi = () => updateState(activeDivisi, createInitialState());

  // Statistik (hanya untuk divisi yang diizinkan)
  const totalSelesai = allowedDivisi.filter(
    (d) => states[d.key]?.rows.length > 0
  ).length;
  const totalFile = allowedDivisi.filter((d) => states[d.key]?.file).length;

  // Gradient per divisi
  const gradientMap: Record<DivisiKey, string> = {
    operasional: "from-blue-500 to-cyan-500",
    sdm: "from-green-500 to-emerald-500",
    logistik: "from-orange-500 to-amber-500",
    keuangan: "from-purple-500 to-pink-500",
  };
  const activeGradient = gradientMap[activeDivisi];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 flex">
      {/* ============ OVERLAY MOBILE ============ */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ============ SIDEBAR ============ */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-40
          h-screen w-72 shrink-0
          bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800
          text-white
          flex flex-col
          shadow-2xl
          transform transition-transform duration-300
          ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        {/* Brand */}
        <div className="h-20 flex items-center gap-3 px-5 border-b border-white/10 shrink-0">
          <div className="relative">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-900 animate-pulse" />
          </div>
          <div className="leading-tight">
            <h1 className="text-base font-bold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
              E-Audit Analyzer
            </h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">
              Legal Compliance AI
            </p>
          </div>
        </div>

        {/* Statistik */}
        <div className="px-4 pt-4 grid grid-cols-2 gap-2 shrink-0">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur">
            <div className="flex items-center gap-1.5 text-blue-300 mb-1">
              <FileText className="w-3.5 h-3.5" />
              <span className="text-[10px] font-semibold uppercase tracking-wide">
                File
              </span>
            </div>
            <p className="text-xl font-bold">
              {totalFile}
              <span className="text-sm text-slate-400 font-normal">
                /{allowedDivisi.length}
              </span>
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur">
            <div className="flex items-center gap-1.5 text-green-300 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="text-[10px] font-semibold uppercase tracking-wide">
                Selesai
              </span>
            </div>
            <p className="text-xl font-bold">
              {totalSelesai}
              <span className="text-sm text-slate-400 font-normal">
                /{allowedDivisi.length}
              </span>
            </p>
          </div>
        </div>

        {/* Label */}
        <div className="px-5 pt-5 pb-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {allowedDivisi.length > 1 ? "Pilih Divisi" : "Divisi Anda"}
          </p>
        </div>

        {/* Menu — HANYA divisi yang diizinkan */}
        <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto pb-4">
          {allowedDivisi.map((div, idx) => {
            const Icon = ICON_MAP[div.icon];
            const isActive = activeDivisi === div.key;
            const divState = states[div.key];
            const hasResult = divState.rows.length > 0;
            const hasFile = !!divState.file;
            const gradient = gradientMap[div.key];

            return (
              <button
                key={div.key}
                onClick={() => handleDivisiChange(div.key)}
                style={{ animationDelay: `${idx * 60}ms` }}
                className={`
                  group w-full flex items-center gap-3 px-3 py-3 rounded-xl
                  text-left transition-all duration-300 relative overflow-hidden
                  animate-in fade-in slide-in-from-left-2
                  ${
                    isActive
                      ? `bg-gradient-to-r ${gradient} shadow-lg scale-[1.02]`
                      : "hover:bg-white/5 hover:translate-x-1"
                  }
                `}
              >
                <div
                  className={`
                    w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all
                    ${
                      isActive
                        ? "bg-white/20 backdrop-blur"
                        : "bg-white/5 group-hover:bg-white/10"
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {div.nama.replace("Divisi ", "")}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {hasResult
                      ? `✓ ${divState.rows.length} temuan`
                      : hasFile
                      ? "File siap dianalisis"
                      : "Belum ada file"}
                  </p>
                </div>

                {hasResult && (
                  <div className="shrink-0 w-5 h-5 rounded-full bg-green-400 flex items-center justify-center shadow-lg shadow-green-400/50">
                    <CheckCircle2 className="w-3 h-3 text-slate-900" />
                  </div>
                )}
                {hasFile && !hasResult && (
                  <div className="shrink-0 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 shrink-0">
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>Powered by Gemini + Groq AI</span>
          </div>
        </div>
      </aside>

      {/* ============ MAIN ============ */}
      <div className="flex-1 min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-gray-200 h-14 flex items-center px-4 gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Buka menu"
          >
            <svg
              className="w-6 h-6 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <span className="font-semibold text-gray-900">E-Audit Analyzer</span>
        </header>

        {/* Content */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
          {/* Hero Header */}
          <div
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${activeGradient} p-6 sm:p-8 text-white shadow-xl animate-in fade-in slide-in-from-top-4 duration-500`}
          >
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

            <div className="relative flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0 shadow-lg">
                <ActiveIcon className="w-7 h-7" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold mb-1">
                  {activeConfig.nama}
                </h1>
                <p className="text-white/90 text-sm sm:text-base">
                  {activeConfig.deskripsi}
                </p>
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur rounded-full text-xs">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{activeConfig.contohDokumen}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Upload Card */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-lg ${activeConfig.warna.bg} flex items-center justify-center ${activeConfig.warna.text}`}
              >
                <Upload className="w-4 h-4" />
              </div>
              <h2 className="font-semibold text-gray-900">Unggah Dokumen</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Dropzone */}
              {!current.file ? (
                <label
                  htmlFor={`file-upload-${activeDivisi}`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`
                    cursor-pointer flex flex-col items-center justify-center gap-3
                    border-2 border-dashed rounded-2xl p-8 sm:p-10
                    transition-all duration-300 text-center
                    ${
                      dragActive
                        ? `${activeConfig.warna.border} ${activeConfig.warna.bg} scale-[1.02] shadow-lg`
                        : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                    }
                  `}
                >
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                    id={`file-upload-${activeDivisi}`}
                  />

                  <div
                    className={`
                      w-16 h-16 rounded-2xl flex items-center justify-center
                      transition-all duration-300
                      ${
                        dragActive
                          ? `${activeConfig.warna.button} text-white scale-110 rotate-6`
                          : `${activeConfig.warna.bg} ${activeConfig.warna.text}`
                      }
                    `}
                  >
                    <Upload className="w-7 h-7" />
                  </div>

                  <div>
                    <p className="text-base font-semibold text-gray-900">
                      {dragActive
                        ? "Lepaskan file di sini! 🎯"
                        : "Klik atau seret file ke sini"}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      untuk dianalisis di {activeConfig.nama}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                    {["PDF", "PNG", "JPG", "TXT"].map((fmt) => (
                      <span
                        key={fmt}
                        className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-md"
                      >
                        {fmt}
                      </span>
                    ))}
                  </div>

                  <p className="text-xs text-gray-400 mt-1">
                    Maks. ukuran file 10MB
                  </p>
                </label>
              ) : (
                <FilePreview
                  file={current.file}
                  warna={activeConfig.warna}
                  onRemove={removeFile}
                />
              )}

              {/* Error */}
              {current.error && (
                <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-xl animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{current.error}</span>
                </div>
              )}

              {/* Action buttons */}
              {current.file && (
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={current.loading || !current.file}
                    className={`
                      flex-1 relative overflow-hidden
                      bg-gradient-to-r ${activeGradient}
                      text-white font-semibold py-3 px-4 rounded-xl
                      flex items-center justify-center gap-2
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-all duration-300
                      hover:shadow-lg hover:scale-[1.01]
                      active:scale-[0.99]
                    `}
                  >
                    {current.loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Menganalisis...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>Analisis Sekarang</span>
                      </>
                    )}
                  </button>

                  <label
                    htmlFor={`file-upload-${activeDivisi}`}
                    className="px-4 py-3 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Ganti File</span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.txt"
                      onChange={handleFileChange}
                      className="hidden"
                      id={`file-upload-${activeDivisi}`}
                    />
                  </label>

                  {(current.file || current.rows.length > 0) &&
                    !current.loading && (
                      <button
                        type="button"
                        onClick={resetDivisi}
                        className="px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-red-200 flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Reset</span>
                      </button>
                    )}
                </div>
              )}

              {/* Progress bar */}
              {current.loading && (
                <div className="pt-1">
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${activeGradient}`}
                      style={{
                        width: "60%",
                        animation: "loading 1.5s ease-in-out infinite",
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    AI sedang menganalisis dokumen Anda... mohon tunggu
                  </p>
                </div>
              )}
            </form>
          </div>

          {/* Hasil Analisis — TEMPLATE LHA */}
          {current.rows.length > 0 && (
            <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${activeGradient} flex items-center justify-center shadow-md`}
                  >
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                      Hasil Analisis — LHA
                    </h2>
                    {current.provider && (
                      <p className="text-xs text-gray-500">
                        Diproses oleh{" "}
                        <span className="font-semibold text-gray-700">
                          {current.provider}
                        </span>{" "}
                        · {current.rows.length} temuan
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {/* Tombol Word */}
                  <button
                    onClick={handleExportWord}
                    disabled={exportingWord}
                    className="flex items-center gap-1.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2 px-3 rounded-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {exportingWord ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">
                      {exportingWord ? "Menyiapkan..." : "Word"}
                    </span>
                    <span className="sm:hidden">DOCX</span>
                  </button>

                  {/* Tombol Markdown */}
                  <button
                    onClick={handleExportMarkdown}
                    className="flex items-center gap-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-3 rounded-lg transition-all hover:scale-105"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Markdown</span>
                    <span className="sm:hidden">MD</span>
                  </button>

                  {/* Tombol PDF */}
                  <button
                    onClick={handleExportPDF}
                    className={`
                      flex items-center gap-1.5 text-sm font-medium py-2 px-3 rounded-lg
                      bg-gradient-to-r ${activeGradient} text-white
                      transition-all hover:shadow-lg hover:scale-105
                    `}
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Cetak / PDF</span>
                    <span className="sm:hidden">PDF</span>
                  </button>
                </div>
              </div>

              {/* Wrapper scroll horizontal untuk template LHA */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-2 sm:p-4 overflow-x-auto">
                <div
                  className="mx-auto bg-white shadow-sm"
                  style={{ minWidth: "1000px" }}
                >
                  <LhaTemplate
                    ref={reportRefs[activeDivisi]}
                    metadata={current.metadata ?? emptyMetadata}
                    rows={current.rows}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!current.file && current.rows.length === 0 && (
            <div className="text-center py-8 animate-in fade-in duration-700">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-100 text-sm text-gray-500">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span>Pilih file terlebih dahulu untuk memulai analisis</span>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Global style untuk animasi */}
      <style jsx global>{`
        @keyframes loading {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(300%);
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slide-in-from-top-2 {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slide-in-from-top-4 {
          from {
            opacity: 0;
            transform: translateY(-16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slide-in-from-bottom-4 {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slide-in-from-left-2 {
          from {
            opacity: 0;
            transform: translateX(-8px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-in {
          animation-duration: 0.5s;
          animation-fill-mode: both;
        }
        .fade-in {
          animation-name: fade-in;
        }
        .slide-in-from-top-2 {
          animation-name: slide-in-from-top-2;
        }
        .slide-in-from-top-4 {
          animation-name: slide-in-from-top-4;
        }
        .slide-in-from-bottom-4 {
          animation-name: slide-in-from-bottom-4;
        }
        .slide-in-from-left-2 {
          animation-name: slide-in-from-left-2;
        }
      `}</style>
    </div>
  );
}