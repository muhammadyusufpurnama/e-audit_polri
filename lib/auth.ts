// lib/auth.ts
import type { DivisiKey } from "./divisi";

export type UserRole = "admin" | "operasional" | "sdm" | "logistik" | "keuangan";

export interface User {
  username: string;
  password: string; // Di production, gunakan hash!
  nama: string;
  role: UserRole;
  allowedDivisi: DivisiKey[];
}

// Daftar user (di production, simpan di database)
export const USERS: User[] = [
  {
    username: "admin",
    password: "admin123",
    nama: "Administrator",
    role: "admin",
    allowedDivisi: ["operasional", "sdm", "logistik", "keuangan"],
  },
  {
    username: "opr",
    password: "opr123",
    nama: "Petugas Operasional",
    role: "operasional",
    allowedDivisi: ["operasional"],
  },
  {
    username: "sdm",
    password: "sdm123",
    nama: "Petugas SDM",
    role: "sdm",
    allowedDivisi: ["sdm"],
  },
  {
    username: "log",
    password: "log123",
    nama: "Petugas Logistik",
    role: "logistik",
    allowedDivisi: ["logistik"],
  },
  {
    username: "keu",
    password: "keu123",
    nama: "Petugas Keuangan",
    role: "keuangan",
    allowedDivisi: ["keuangan"],
  },
];

export function authenticate(username: string, password: string): User | null {
  const user = USERS.find(
    (u) => u.username === username && u.password === password
  );
  return user || null;
}

// Simpan session di localStorage
const SESSION_KEY = "eaudit_session";

export function saveSession(user: User): void {
  if (typeof window === "undefined") return;
  const { password, ...safeUser } = user; // jangan simpan password
  localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
}

export function getSession(): Omit<User, "password"> | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}