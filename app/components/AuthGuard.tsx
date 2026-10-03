// app/components/AuthGuard.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, type User } from "@/lib/auth";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: (user: Omit<User, "password">) => React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [user, setUser] = useState<Omit<User, "password"> | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    setUser(session);
    setChecking(false);
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm text-gray-500">Memeriksa sesi...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <>{children(user)}</>;
}