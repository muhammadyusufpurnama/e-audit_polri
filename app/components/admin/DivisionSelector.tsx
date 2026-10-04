// app/components/admin/DivisionSelector.tsx
"use client";

import {
  Settings,
  Users,
  Truck,
  Wallet,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import type { Division } from "@/types/audit";

const ICON_MAP: Record<string, React.ElementType> = {
  Settings,
  Users,
  Truck,
  Wallet,
};

const GRADIENT_MAP: Record<string, string> = {
  operasional: "from-cyan-500 to-blue-600",
  sdm: "from-emerald-500 to-green-600",
  logistik: "from-orange-500 to-amber-600",
  keuangan: "from-purple-500 to-pink-600",
};

interface Props {
  divisions: Division[];
  selectedDivision: Division | null;
  onSelect: (div: Division) => void;
}

export default function DivisionSelector({
  divisions,
  onSelect,
}: Props) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
            Master Data Peraturan
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Pilih Divisi
        </h1>
        <p className="text-slate-400 text-sm max-w-2xl">
          Pilih divisi untuk mengelola peraturan, menganalisis norma, dan
          membuat aturan audit otomatis menggunakan AI.
        </p>
      </div>

      {/* Divisions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {divisions.map((div) => {
          const Icon = ICON_MAP[div.icon] ?? Settings;
          const gradient =
            GRADIENT_MAP[div.key] ?? "from-slate-500 to-slate-600";
          const regCount = div._count?.regulations ?? 0;

          return (
            <button
              key={div.id}
              onClick={() => onSelect(div)}
              className="group relative overflow-hidden rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 p-5 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-cyan-500/10"
            >
              <div
                className={`absolute -top-16 -right-16 w-32 h-32 rounded-full bg-gradient-to-br ${gradient} opacity-20 blur-3xl group-hover:opacity-40 transition-opacity`}
              />

              <div className="relative">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg mb-4`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>

                <h3 className="text-lg font-bold text-white mb-1">
                  {div.name}
                </h3>
                <p className="text-xs text-slate-400 mb-4 line-clamp-2">
                  {div.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {regCount > 0 ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-green-400" />
                        <span className="text-xs text-green-400 font-semibold">
                          {regCount} peraturan
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-slate-600" />
                        <span className="text-xs text-slate-500">
                          Belum ada file
                        </span>
                      </>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}