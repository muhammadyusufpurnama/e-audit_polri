// app/components/AdminDashboard.tsx
"use client";

import { useState, useEffect } from "react";
import {
  ShieldCheck,
  Upload,
  Database,
  LayoutDashboard,
  FileSearch,
  ClipboardList,
  X,
  Menu,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import type { User } from "@/lib/auth";
import type { Division } from "@/types/audit";

// The project uses the admin folder naming conventions below for the individual views.
// Import the concrete files that exist in this project, not a non-existent generated name.
import DivisionSelector from "./admin/DivisionSelector";
import UploadForm from "./admin/UploadForm";
import DraftReview from "./admin/DraftReview";
import AuditLogView from "./admin/AuditLogView";

type AdminMenu =
  | "dashboard"
  | "upload"
  | "draft"
  | "master"
  | "audit-log";

interface AdminDashboardProps {
  user: Omit<User, "password">;
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const [activeMenu, setActiveMenu] = useState<AdminMenu>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<Division | null>(
    null
  );
  const [loadingDivisions, setLoadingDivisions] = useState(true);

  // Load divisions dari API
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/divisions");
        const data = await res.json();
        setDivisions(data.divisions ?? []);
      } catch (err) {
        console.error("Gagal load divisions:", err);
      } finally {
        setLoadingDivisions(false);
      }
    })();
  }, []);

  const menus: {
    key: AdminMenu;
    label: string;
    desc: string;
    icon: React.ElementType;
  }[] = [
    {
      key: "dashboard",
      label: "Dashboard",
      desc: "Overview sistem",
      icon: LayoutDashboard,
    },
    {
      key: "upload",
      label: "Upload Peraturan",
      desc: "Upload & analisis AI",
      icon: Upload,
    },
    {
      key: "draft",
      label: "Draft Review",
      desc: "Review hasil AI",
      icon: FileSearch,
    },
    {
      key: "master",
      label: "Master Data",
      desc: "Data approved",
      icon: Database,
    },
    {
      key: "audit-log",
      label: "Audit Log",
      desc: "Riwayat aktivitas",
      icon: ClipboardList,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex">
      {/* Overlay Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-40
          h-screen w-72 shrink-0
          bg-slate-950/95 backdrop-blur-xl border-r border-slate-800
          text-white flex flex-col shadow-2xl
          transform transition-transform duration-300
          ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        {/* Brand */}
        <div className="h-20 flex items-center gap-3 px-5 border-b border-slate-800 shrink-0">
          <div className="relative">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-slate-950 animate-pulse" />
          </div>
          <div className="leading-tight">
            <h1 className="text-base font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
              Admin Panel
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">
              Regulatory AI
            </p>
          </div>
        </div>

        {/* Admin Info */}
        <div className="px-4 pt-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{user.nama}</p>
              <p className="text-[10px] text-amber-400 uppercase tracking-wider font-bold">
                Administrator
              </p>
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="px-5 pt-5 pb-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Menu Utama
          </p>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto pb-4">
          {menus.map((menu) => {
            const Icon = menu.icon;
            const isActive = activeMenu === menu.key;
            return (
              <button
                key={menu.key}
                onClick={() => {
                  setActiveMenu(menu.key);
                  setSidebarOpen(false);
                }}
                className={`
                  group w-full flex items-center gap-3 px-3 py-3 rounded-xl
                  text-left transition-all duration-300
                  ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 shadow-lg shadow-cyan-500/10"
                      : "hover:bg-slate-900/60 border border-transparent"
                  }
                `}
              >
                <div
                  className={`
                    w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all
                    ${
                      isActive
                        ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30"
                        : "bg-slate-900 text-slate-400 group-hover:text-cyan-400"
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-semibold truncate ${
                      isActive ? "text-cyan-300" : "text-slate-200"
                    }`}
                  >
                    {menu.label}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {menu.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 shrink-0">
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span>System online</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-20 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800 h-14 flex items-center px-4 gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-6 h-6 text-slate-300" />
          </button>
          <span className="font-semibold text-white">Admin Panel</span>
        </header>

        {/* Content */}
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {loadingDivisions ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
            </div>
          ) : (
            <>
              {activeMenu === "dashboard" && (
                <DivisionSelector
                  divisions={divisions}
                  selectedDivision={selectedDivision}
                  onSelect={(div) => {
                    setSelectedDivision(div);
                    setActiveMenu("upload");
                  }}
                />
              )}

              {activeMenu === "upload" && (
                <UploadForm
                  divisions={divisions}
                  defaultDivision={selectedDivision}
                  onSuccess={() => {
                    setActiveMenu("draft");
                  }}
                />
              )}

              {activeMenu === "draft" && <DraftReview divisions={divisions} />}

              {activeMenu === "master" && (
                <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                  <h2 className="text-xl font-bold text-white">Master Data</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    Approved regulatory data will appear here.
                  </p>
                </section>
              )}

              {activeMenu === "audit-log" && <AuditLogView />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}