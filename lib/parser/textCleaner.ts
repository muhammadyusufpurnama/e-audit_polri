// lib/parser/textCleaner.ts

/**
 * Preprocessing teks peraturan sebelum dikirim ke AI.
 *
 * Tujuan:
 * 1. Buang tabel data (SBM, tarif, daftar provinsi, dll)
 * 2. Buang header/footer berulang
 * 3. Rapikan whitespace
 * 4. Pertahankan teks naratif yang mengandung norma
 */

/**
 * Cek apakah sebuah baris kemungkinan bagian dari tabel data.
 * Ciri-ciri:
 * - Banyak angka, simbol mata uang, tanda kurung, tanda hubung
 * - Sedikit huruf alfabet
 * - Panjang > 30 karakter
 */
function isLikelyTableRow(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 20) return false;

  // Hitung rasio karakter "data" vs huruf
  const letters = (trimmed.match(/[a-zA-Z]/g) || []).length;
  const digits = (trimmed.match(/\d/g) || []).length;
  const symbols = (trimmed.match(/[.,()\-–—/:;%Rp$]/g) || []).length;

  // Kalau >50% isinya angka/simbol, ini baris tabel
  const total = trimmed.length;
  const dataRatio = (digits + symbols) / total;
  const letterRatio = letters / total;

  // Baris tabel biasanya: banyak angka, sedikit huruf
  if (dataRatio > 0.4 && letterRatio < 0.5) return true;

  // Baris dengan 5+ pola angka berulang seperti "Rp1.000.000Rp750.000"
  const rpCount = (trimmed.match(/Rp[\d.]+/g) || []).length;
  if (rpCount >= 3) return true;

  // Baris dengan banyak pemisah tabel
  const separators = (trimmed.match(/[|<>]/g) || []).length;
  if (separators >= 3) return true;

  return false;
}

/**
 * Buang header/footer berulang yang muncul di setiap halaman PDF.
 */
function removeRepeatingHeaders(lines: string[]): string[] {
  const freq: Record<string, number> = {};
  const cleaned = lines.map((l) => l.trim());

  for (const line of cleaned) {
    if (line.length < 5 || line.length > 100) continue;
    freq[line] = (freq[line] ?? 0) + 1;
  }

  // Kalau baris muncul >= 3 kali, kemungkinan header/footer
  const repeatingPatterns = new Set(
    Object.entries(freq)
      .filter(([, count]) => count >= 3)
      .map(([line]) => line)
  );

  return lines.filter((l) => !repeatingPatterns.has(l.trim()));
}

/**
 * Ekstrak hanya bagian teks naratif yang mengandung norma.
 *
 * Strategi:
 * - Ambil paragraf yang mengandung kata kunci normatif
 * - Buang baris yang panjang tapi tidak ada kata kunci
 */
const NORMATIVE_KEYWORDS = [
  "wajib",
  "dilarang",
  "harus",
  "paling banyak",
  "paling tinggi",
  "paling lambat",
  "paling rendah",
  "paling sedikit",
  "tidak boleh",
  "tidak diperkenankan",
  "ketentuan",
  "persyaratan",
  "berhak",
  "dapat diberikan",
  "diberikan kepada",
  "ditetapkan",
  "berpedoman",
  "mengacu",
  "sebesar",
  "maksimal",
  "minimal",
  "jumlah",
  "batas",
  "dalam hal",
  "sepanjang",
  "kecuali",
  "apabila",
  "jika",
];

function containsNormativeKeyword(text: string): boolean {
  const lower = text.toLowerCase();
  return NORMATIVE_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Main preprocessing function.
 */
export function preprocessRegulationText(raw: string): {
  cleaned: string;
  stats: {
    originalLength: number;
    cleanedLength: number;
    removedLines: number;
    keptLines: number;
  };
} {
  const originalLength = raw.length;

  // 1. Normalize line breaks
  let text = raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ");

  // 2. Split jadi baris
  let lines = text.split("\n");

  // 3. Buang header/footer berulang
  lines = removeRepeatingHeaders(lines);

  // 4. Buang baris tabel
  const beforeTableFilter = lines.length;
  lines = lines.filter((line) => !isLikelyTableRow(line));
  const afterTableFilter = lines.length;

  // 5. Gabungkan lagi
  text = lines.join("\n");

  // 6. Buang baris kosong berlebih
  text = text
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+$/gm, "")
    .trim();

  // 7. Statistik
  const finalLines = text.split("\n");

  return {
    cleaned: text,
    stats: {
      originalLength,
      cleanedLength: text.length,
      removedLines: beforeTableFilter - afterTableFilter,
      keptLines: finalLines.length,
    },
  };
}

/**
 * Potong teks ke N karakter pertama dengan batas baris penuh.
 */
export function truncateText(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;

  const truncated = text.slice(0, maxChars);
  const lastNewline = truncated.lastIndexOf("\n");

  // Kalau ada baris utuh dalam 200 char terakhir, potong di situ
  if (lastNewline > maxChars - 200) {
    return truncated.slice(0, lastNewline);
  }
  return truncated;
}