// lib/ai/extractNorms.ts
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
// KONFIGURASI GROQ
// ==========================================
const GROQ_MODEL = "openai/gpt-oss-120b";
const CHUNK_SIZE = 5000; 
const CHUNK_DELAY_MS = 6000;

// ==========================================
// SYSTEM PROMPT
// ==========================================
const SYSTEM_PROMPT = `Anda adalah AI AUDIT REGULATORY EXPERT.

TUGAS: Ekstrak NORMA dan ATURAN AUDIT dari teks peraturan secara terperinci.

## DEFINISI NORMA
Norma adalah ketentuan dalam peraturan yang mengandung:
- kewajiban, larangan
- batas waktu, batas nilai
- persyaratan, dokumen wajib
- prosedur, approval, otorisasi
- kualifikasi, jumlah, persentase, nominal
- standar tertentu, bukti/dokumen yang harus tersedia

## FORMAT OUTPUT (HANYA JSON, tanpa markdown):
{
  "regulation": {
    "type": "Peraturan Menteri",
    "number": "039",
    "year": "2024",
    "title": "Standar Biaya Masukan"
  },
  "norms": [
    {
      "criteria": "Nilai",
      "article": "1",
      "paragraph": null,
      "originalText": "Teks asli dari dokumen",
      "rules": [
        {
          "parameter": "Parameter audit",
          "operator": "<=",
          "numericValue": 10,
          "unit": "%",
          "condition": "Kondisi aturan",
          "inspectionIndicator": "Indikator pemeriksaan",
          "ruleType": "PERCENTAGE"
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
1. Ekstrak norma penting sebanyak yang ditemukan di bagian teks ini.
2. Pasal WAJIB ada. Ayat boleh null jika tidak ada.
3. Original text WAJIB diambil PERSIS dari dokumen.
4. Keluarkan HANYA JSON valid tanpa penjelasan tambahan.`;

// ==========================================
// MAIN FUNCTION (GROQ CHUNKED PROCESSING)
// ==========================================
export async function extractNormsWithAI(
  text: string,
  divisiLabel: string
): Promise<AIExtractionResult> {
  const groqKey = process.env.GROQ_API_KEY;

  if (!groqKey) {
    throw new Error("GROQ_API_KEY belum disetel di file .env.local");
  }

  const groq = new Groq({ apiKey: groqKey });

  console.log(
    `[AI] Memproses dokumen ${divisiLabel} (${text.length} chars) menggunakan Groq (${GROQ_MODEL}) per section...`
  );

  // Pecah teks menjadi beberapa bagian (section)
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += CHUNK_SIZE) {
    chunks.push(text.slice(i, i + CHUNK_SIZE));
  }

  console.log(`[AI] Dokumen dipecah menjadi ${chunks.length} bagian.`);

  const allNorms: AINorm[] = [];
  let regulationMeta = { type: "", number: "", year: "", title: "" };

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`[AI] Memproses Bagian ${i + 1} dari ${chunks.length}...`);

    let success = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const completion = await groq.chat.completions.create({
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: `[Bagian ${i + 1} dari ${chunks.length}]\n\n${chunk}`,
            },
          ],
          model: GROQ_MODEL,
          temperature: 0.2,
          max_tokens: 4000,
        });

        const responseText = completion.choices[0]?.message?.content || "{}";
        const parsed = parseAIResponse(responseText);

        if (!regulationMeta.type && parsed.regulation.type) {
          regulationMeta = parsed.regulation;
        }

        if (parsed.norms.length > 0) {
          allNorms.push(...parsed.norms);
          console.log(`[AI] ✓ Bagian ${i + 1} sukses: ${parsed.norms.length} norma ditemukan.`);
        } else {
          console.log(`[AI] ℹ Bagian ${i + 1} tidak menghasilkan norma (mungkin bagian tabel/lampiran).`);
        }

        success = true;
        break;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[AI] Gagal percobaan ${attempt} di bagian ${i + 1}: ${msg}`);
        await new Promise((r) => setTimeout(r, 4000));
      }
    }

    if (!success) {
      console.warn(`[AI] ⚠ Bagian ${i + 1} dilewati setelah 3 kali percobaan.`);
    }

    if (i < chunks.length - 1) {
      await new Promise((r) => setTimeout(r, CHUNK_DELAY_MS));
    }
  }

  if (allNorms.length === 0) {
    throw new Error("Groq tidak berhasil mengekstraksi norma dari dokumen.");
  }

  console.log(`[AI] Selesai! Total keseluruhan terkumpul: ${allNorms.length} norma.`);

  return {
    regulation: regulationMeta,
    norms: allNorms,
  };
}

// ==========================================
// PARSER JSON
// ==========================================
function parseAIResponse(raw: string): AIExtractionResult {
  let cleaned = raw
    .replace(/^```(?:json|markdown|md)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) {
    return {
      regulation: { type: "", number: "", year: "", title: "" },
      norms: [],
    };
  }

  const jsonStr = cleaned.slice(start, end + 1);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    try {
      parsed = JSON.parse(jsonrepair(jsonStr));
    } catch {
      return {
        regulation: { type: "", number: "", year: "", title: "" },
        norms: [],
      };
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