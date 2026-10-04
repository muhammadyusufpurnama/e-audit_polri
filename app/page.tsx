// app/page.tsx
"use client";

import { AuthGuard } from "./components/AuthGuard";
import HomeDashboard from "./components/HomeDashboard";
import AdminDashboard from "./components/AdminDashboard";
import { useRouter } from "next/navigation";
import { clearSession } from "@/lib/auth";
import { LogOut, User as UserIcon, ShieldCheck } from "lucide-react";
import { DIVISI_LIST } from "@/lib/divisi";

export default function Page() {
  const router = useRouter();

  const handleLogout = () => {
    clearSession();
    router.replace("/login");
  };

  return (
    <AuthGuard>
      {(user) => {
        const allowedDivisi = DIVISI_LIST.filter((d) =>
          user.allowedDivisi.includes(d.key)
        );

        const isAdmin = user.role === "admin";

        return (
          <div className="relative">
            {/* Info user + logout */}
            <div className="fixed top-3 right-3 z-50 flex items-center gap-2 bg-white/90 backdrop-blur border border-gray-200 rounded-xl shadow-lg p-2 pr-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                  isAdmin
                    ? "bg-gradient-to-br from-amber-500 to-orange-600"
                    : "bg-gradient-to-br from-blue-500 to-purple-600"
                }`}
              >
                {isAdmin ? (
                  <ShieldCheck className="w-4 h-4" />
                ) : (
                  <UserIcon className="w-4 h-4" />
                )}
              </div>
              <div className="hidden sm:block leading-tight">
                <p className="text-xs font-semibold text-gray-900">
                  {user.nama}
                </p>
                <p
                  className={`text-[10px] uppercase tracking-wide font-bold ${
                    isAdmin ? "text-amber-600" : "text-gray-500"
                  }`}
                >
                  {user.role}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {isAdmin ? (
              <AdminDashboard user={user} />
            ) : (
              <HomeDashboard
                allowedDivisi={allowedDivisi}
                defaultDivisi={allowedDivisi[0]?.key ?? "operasional"}
              />
            )}
          </div>
        );
      }}
    </AuthGuard>
  );
}