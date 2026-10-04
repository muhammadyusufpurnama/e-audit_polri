// lib/parser/docxParser.ts
import mammoth from "mammoth";

export interface ParseResult {
  text: string;
  messages: string[];
}

/**
 * Extract text dari file DOCX menggunakan mammoth.
 * Mammoth mengkonversi DOCX → HTML/raw text dengan baik,
 * termasuk heading, list, dan formatting.
 */
export async function parseDOCX(buffer: Buffer): Promise<ParseResult> {
  try {
    const result = await mammoth.extractRawText({ buffer });

    return {
      text: normalizeText(result.value),
      messages: result.messages.map((m) => m.message),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Gagal parse DOCX: ${msg}`);
  }
}

/**
 * Normalisasi teks hasil ekstraksi:
 * - Samakan line breaks (CRLF/CR → LF)
 * - Hapus trailing whitespace per baris
 * - Rapatkan multiple spaces jadi satu
 * - Batasi max 2 baris kosong berturut-turut
 * - Trim keseluruhan
 */
export function normalizeText(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")         // Windows → Unix
    .replace(/\r/g, "\n")            // Old Mac → Unix
    .replace(/[ \t]+/g, " ")         // Multiple spaces → 1
    .replace(/[ \t]+$/gm, "")        // Trailing whitespace per baris
    .replace(/\n{3,}/g, "\n\n")      // Max 2 newline berturut-turut
    .trim();
}