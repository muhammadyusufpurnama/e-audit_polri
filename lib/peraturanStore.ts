// lib/peraturanStore.ts

export interface Peraturan {
  id: string;
  divisi: string;
  nama: string;
  nomor: string;
  tahun: string;
  deskripsi: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  uploadedBy: string;
  content?: string; // extracted text content
}

const STORAGE_KEY = "eaudit_peraturan_master";

// Get all peraturan
export function getAllPeraturan(): Peraturan[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Peraturan[];
  } catch {
    return [];
  }
}

// Get peraturan by divisi
export function getPeraturanByDivisi(divisi: string): Peraturan[] {
  return getAllPeraturan().filter((p) => p.divisi === divisi);
}

// Save peraturan baru
export function savePeraturan(peraturan: Peraturan): void {
  if (typeof window === "undefined") return;
  const all = getAllPeraturan();
  all.push(peraturan);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

// Delete peraturan
export function deletePeraturan(id: string): void {
  if (typeof window === "undefined") return;
  const all = getAllPeraturan().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

// Update peraturan
export function updatePeraturan(
  id: string,
  patch: Partial<Peraturan>
): void {
  if (typeof window === "undefined") return;
  const all = getAllPeraturan().map((p) =>
    p.id === id ? { ...p, ...patch } : p
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

// Get peraturan text untuk AI context
export function getPeraturanContext(divisi: string): string {
  const list = getPeraturanByDivisi(divisi);
  if (list.length === 0) return "";

  return list
    .map(
      (p, i) =>
        `--- PERATURAN ${i + 1} ---\n` +
        `Nama: ${p.nama}\n` +
        `Nomor: ${p.nomor} (${p.tahun})\n` +
        `Deskripsi: ${p.deskripsi}\n` +
        (p.content ? `Isi:\n${p.content.slice(0, 5000)}\n` : "")
    )
    .join("\n\n");
}

// Generate ID unik
export function generateId(): string {
  return `peraturan_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}