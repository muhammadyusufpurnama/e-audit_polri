// lib/ai/extractNorms.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { jsonrepair } from "jsonrepair";

// ==========================================
// TYPES
// ==========================================
export interface AIRule {
  parameter: string;
  operator: string;
  numericValue?: number | null;
  textThreshold?: string | null;
  minimumValue?: number | null;
  maximumValue?: number | null;
  unit?: string | null;
  condition: string;
  inspectionIndicator: string;
  ruleType: string;
}

export interface AINorm {
  criteria: string;
  article: string;
  paragraph: string | null;
  originalText: string;
  rules: AIRule[];
}

export interface AIExtractionResult {
  regulation: {
    type: string;
    number: string;
    year: string;
    title: string;
  };
  norms: AINorm[];
}

// ==========================================
// KONFIGURASI
// ==========================================
// Gemini — context besar, tidak perlu chunking
const GEMINI_MODEL = "gemini-flash-latest"; // fallback chain otomatis
const GEMINI_MAX_CHARS = 500000; // 500k chars ≈ 125k token
const GEMINI_MAX_OUTPUT_TOKENS = 8192;

// Groq — limit ketat 8000 TPM, wajib chunking kecil
const GROQ_MODEL = "llama-3.3-70b-versatile";
const GROQ_MAX_CHARS = 5000; // 5k chars ≈ 1.7k token
const GROQ_MAX_OUTPUT_TOKENS = 2000; // hemat output token
const GROQ_CHUNK_DELAY_MS = 8000; // TPM reset window
const GROQ_RETRY_DELAY_MS = 15000; // tunggu saat rate limit
const GROQ_MAX_RETRY_PER_CHUNK = 3;

// Fallback chain model Gemini — kalau satu deprecated, coba berikutnya
const GEMINI_MODEL_CHAIN = [
  "gemini-flash-latest",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
];

// ==========================================
// SYSTEM PROMPT
// ==========================================
const SYSTEM_PROMPT = `Anda adalah AI AUDIT REGULATORY EXPERT.

TUGAS: Ekstrak NORMA dan ATURAN AUDIT dari teks peraturan.

## DEFINISI NORMA
Norma adalah ketentuan dalam peraturan yang mengandung:
- kewajiban, larangan
- batas waktu, batas nilai
- persyaratan, dokumen wajib
- prosedur, approval, otorisasi
- kualifikasi, jumlah, persentase, nominal
- standar tertentu, bukti/dokumen yang harus tersedia

JANGAN ekstrak seluruh isi peraturan. HANYA bagian yang bisa dijadikan dasar pemeriksaan audit.

## DEFINISI ATURAN
Setiap norma dapat dipecah menjadi 1 atau lebih aturan audit yang terukur.

## FORMAT OUTPUT (HANYA JSON, tanpa markdown):
{
  "regulation": {
    "type": "Peraturan Presiden",
    "number": "16",
    "year": "2018",
    "title": "Pengadaan Barang/Jasa Pemerintah"
  },
  "norms": [
    {
      "criteria": "Waktu",
      "article": "12",
      "paragraph": "1",
      "originalText": "Pengadaan harus diselesaikan paling lambat 7 hari kerja.",
      "rules": [
        {
          "parameter": "Durasi Penyelesaian Pengadaan",
          "operator": "<=",
          "numericValue": 7,
          "unit": "Hari Kerja",
          "condition": "Penyelesaian pengadaan paling lambat 7 hari kerja",
          "inspectionIndicator": "Memeriksa apakah proses pengadaan diselesaikan dalam waktu maksimal 7 hari kerja",
          "ruleType": "NUMERIC"
        }
      ]
    }
  ]
}

## KRITERIA (pilih salah satu):
Dokumen, Waktu, Nilai, Prosedur, Persyaratan, Approval, Kualifikasi, Lainnya

## OPERATOR (pilih salah satu):
=, !=, >, <, >=, <=, IN, NOT IN, CONTAINS

## JENIS ATURAN (pilih salah satu):
NUMERIC, TEXT, DOCUMENT, DATE, BOOLEAN, PERCENTAGE, CURRENCY

## ATURAN PENTING:
1. Pasal WAJIB ada. Ayat boleh null jika tidak ada.
2. Original text WAJIB diambil PERSIS dari dokumen.
3. Jika tidak yakin terhadap suatu nilai, gunakan null. JANGAN mengarang.
4. Maksimal 10 norma per dokumen untuk menghindari output terpotong.
5. Setiap norma minimal 1 aturan, maksimal 5 aturan.
6. Parameter WAJIB ada untuk setiap aturan.

Keluarkan HANYA JSON valid, tanpa penjelasan tambahan.`;

// ==========================================
// MAIN FUNCTION
// ==========================================
export async function extractNormsWithAI(
  text: string,
  divisiLabel: string
): Promise<AIExtractionResult> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  if (!geminiKey && !groqKey) {
    throw new Error(
      "Tidak ada API key AI yang tersedia. Set GEMINI_API_KEY atau GROQ_API_KEY di .env"
    );
  }

  console.log(
    `[AI] Memproses dokumen ${divisiLabel} (${text.length} chars)`
  );

  // ==========================================
  // PRIORITAS 1: GEMINI
  // ==========================================
  if (geminiKey) {
    try {
      const truncated =
        text.length > GEMINI_MAX_CHARS
          ? text.slice(0, GEMINI_MAX_CHARS)
          : text;

      if (text.length > GEMINI_MAX_CHARS) {
        console.warn(
          `[Gemini] Teks dipotong dari ${text.length} → ${GEMINI_MAX_CHARS} chars`
        );
      }

      console.log(`[AI] → Mencoba Gemini...`);
      const result = await extractWithGemini(truncated, geminiKey);
      console.log(`[AI] ✓ Gemini berhasil: ${result.norms.length} norma`);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[AI] ✗ Gemini gagal: ${msg}`);
      console.warn("[AI] → Fallback ke Groq...");
    }
  }

  // ==========================================
  // PRIORITAS 2: GROQ (dengan chunking)
  // ==========================================
  if (groqKey) {
    try {
      console.log(`[AI] → Mencoba Groq (dengan chunking)...`);
      const result = await extractWithGroqChunked(text, groqKey);
      console.log(`[AI] ✓ Groq berhasil: ${result.norms.length} norma`);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[AI] ✗ Groq gagal: ${msg}`);
      throw new Error(
        `Semua AI provider gagal. Detail terakhir: ${msg}`
      );
    }
  }

  throw new Error("Semua AI provider gagal");
}

// ==========================================
// GEMINI EXTRACTION (dengan fallback model chain)
// ==========================================
async function extractWithGemini(
  text: string,
  apiKey: string
): Promise<AIExtractionResult> {
  const genAI = new GoogleGenerativeAI(apiKey);

  let lastError: Error | null = null;

  for (const modelName of GEMINI_MODEL_CHAIN) {
    try {
      console.log(`[Gemini] Mencoba model "${modelName}"...`);

      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
          maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
        },
      });

      const result = await model.generateContent([
        SYSTEM_PROMPT,
        `Berikut teks peraturan:\n\n${text}`,
      ]);

      const responseText = result.response.text();
      console.log(`[Gemini] ✓ Model "${modelName}" berhasil`);
      return parseAIResponse(responseText);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[Gemini] ✗ Model "${modelName}" gagal: ${msg.slice(0, 150)}`);
      lastError = err instanceof Error ? err : new Error(msg);

      // Kalau error bukan karena model deprecated/not found, jangan coba model lain
      if (!msg.includes("404") && !msg.includes("not found") && !msg.includes("no longer available")) {
        throw err;
      }
    }
  }

  throw lastError ?? new Error("Semua model Gemini gagal");
}

// ==========================================
// GROQ EXTRACTION DENGAN CHUNKING
// ==========================================
async function extractWithGroqChunked(
  text: string,
  apiKey: string
): Promise<AIExtractionResult> {
  const groq = new Groq({ apiKey });

  // Pecah teks jadi chunk kecil
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += GROQ_MAX_CHARS) {
    chunks.push(text.slice(i, i + GROQ_MAX_CHARS));
  }

  console.log(
    `[Groq] Teks ${text.length} chars → ${chunks.length} chunk(s) × ${GROQ_MAX_CHARS} chars`
  );

  const allNorms: AINorm[] = [];
  let regulationMeta = { type: "", number: "", year: "", title: "" };
  let skippedChunks = 0;
  let successChunks = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    let success = false;

    for (let attempt = 1; attempt <= GROQ_MAX_RETRY_PER_CHUNK; attempt++) {
      console.log(
        `[Groq] Chunk ${i + 1}/${chunks.length} (attempt ${attempt}/${GROQ_MAX_RETRY_PER_CHUNK})...`
      );

      try {
        const completion = await groq.chat.completions.create({
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content:
                chunks.length > 1
                  ? `Berikut bagian ${i + 1} dari ${chunks.length} dokumen peraturan:\n\n${chunk}\n\nFOKUS pada norma yang ada di bagian ini saja.`
                  : `Berikut teks peraturan:\n\n${chunk}`,
            },
          ],
          model: GROQ_MODEL,
          temperature: 0.2,
          max_tokens: GROQ_MAX_OUTPUT_TOKENS,
        });

        const responseText = completion.choices[0]?.message?.content || "";
        const result = parseAIResponse(responseText);

        if (!regulationMeta.type && result.regulation.type) {
          regulationMeta = result.regulation;
        }

        allNorms.push(...result.norms);
        console.log(
          `[Groq] ✓ Chunk ${i + 1} selesai: ${result.norms.length} norma`
        );
        success = true;
        successChunks++;
        break;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);

        if (msg.includes("rate_limit") || msg.includes("413")) {
          console.warn(
            `[Groq] Rate limit di chunk ${i + 1}, tunggu ${GROQ_RETRY_DELAY_MS / 1000}s...`
          );
          await sleep(GROQ_RETRY_DELAY_MS);
        } else {
          console.warn(
            `[Groq] Chunk ${i + 1} error: ${msg.slice(0, 120)}`
          );
          await sleep(3000);
        }
      }
    }

    if (!success) {
      skippedChunks++;
      console.warn(
        `[Groq] ⚠ Skip chunk ${i + 1} setelah ${GROQ_MAX_RETRY_PER_CHUNK} percobaan`
      );
    }

    // Delay antar chunk (kecuali chunk terakhir)
    if (i < chunks.length - 1) {
      await sleep(GROQ_CHUNK_DELAY_MS);
    }
  }

  console.log(
    `[Groq] Selesai. Total: ${allNorms.length} norma | ${successChunks}/${chunks.length} chunk sukses | ${skippedChunks} chunk skip`
  );

  if (allNorms.length === 0) {
    throw new Error(
      "Groq tidak menghasilkan norma apapun. Semua chunk gagal."
    );
  }

  return { regulation: regulationMeta, norms: allNorms };
}

// ==========================================
// PARSER
// ==========================================
function parseAIResponse(raw: string): AIExtractionResult {
  let cleaned = raw
    .replace(/^```(?:json|markdown|md)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error(
      "AI tidak mengembalikan JSON object. Response awal: " +
        cleaned.slice(0, 200)
    );
  }

  const jsonStr = cleaned.slice(start, end + 1);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    try {
      parsed = JSON.parse(jsonrepair(jsonStr));
    } catch {
      throw new Error("JSON dari AI tidak dapat direpair");
    }
  }

  const obj = parsed as Record<string, unknown>;
  const regulation = (obj.regulation ?? {}) as Record<string, unknown>;
  const normsRaw = Array.isArray(obj.norms) ? obj.norms : [];

  const norms: AINorm[] = normsRaw.map((n) => {
    const norm = (n ?? {}) as Record<string, unknown>;
    const rulesRaw = Array.isArray(norm.rules) ? norm.rules : [];
    return {
      criteria: String(norm.criteria ?? "Lainnya"),
      article: String(norm.article ?? ""),
      paragraph: norm.paragraph ? String(norm.paragraph) : null,
      originalText: String(norm.originalText ?? ""),
      rules: rulesRaw.map((r) => {
        const rule = (r ?? {}) as Record<string, unknown>;
        return {
          parameter: String(rule.parameter ?? ""),
          operator: String(rule.operator ?? "="),
          numericValue:
            typeof rule.numericValue === "number" ? rule.numericValue : null,
          textThreshold: rule.textThreshold ? String(rule.textThreshold) : null,
          minimumValue:
            typeof rule.minimumValue === "number" ? rule.minimumValue : null,
          maximumValue:
            typeof rule.maximumValue === "number" ? rule.maximumValue : null,
          unit: rule.unit ? String(rule.unit) : null,
          condition: String(rule.condition ?? ""),
          inspectionIndicator: String(rule.inspectionIndicator ?? ""),
          ruleType: String(rule.ruleType ?? "TEXT"),
        };
      }),
    };
  });

  return {
    regulation: {
      type: String(regulation.type ?? ""),
      number: String(regulation.number ?? ""),
      year: String(regulation.year ?? ""),
      title: String(regulation.title ?? ""),
    },
    norms,
  };
}

// ==========================================
// UTILS
// ==========================================
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}