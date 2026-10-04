// lib/parser/pdfParser.ts
import pdfParse from "pdf-parse-new";

export interface ParseResult {
  text: string;
  pageCount: number;
  info?: Record<string, unknown>;
}

export async function parsePDF(buffer: Buffer): Promise<ParseResult> {
  const data = await pdfParse(buffer);
  return {
    text: normalizeText(data.text),
    pageCount: data.numpages,
    info: data.info,
  };
}

// Normalisasi teks: hapus whitespace berlebih, normalize line breaks
export function normalizeText(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[^\S\n]+$/gm, "")
    .trim();
}