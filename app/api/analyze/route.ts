// app/api/analyze/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse-new";
import { jsonrepair } from "jsonrepair";
import {
  buildSystemPrompt,
  DIVISI_LABEL,
  type LhaResult,
  type BarisTemuan,
  type LhaMetadata,
} from "@/lib/prompts";

// ==========================================
// HELPER: Normalisasi rows
// ==========================================
function normalizeRows(rawRows: unknown[]): BarisTemuan[] {
  return rawRows.map((row, idx) => {
    const r = (row ?? {}) as Partial<BarisTemuan>;
    return {
      no: String(r.no ?? idx + 1),
      temuan: String(r.temuan ?? ""),
      kodeTemuan: String(r.kodeTemuan ?? ""),
      kriteria: String(r.kriteria ?? ""),
      sebab: String(r.sebab ?? ""),
      akibat: String(r.akibat ?? ""),
      rekomendasi: String(r.rekomendasi ?? ""),
    };
  });
}

// ==========================================
// HELPER: Extract JSON dari response AI
// ==========================================
function extractLhaResult(text: string): LhaResult {
  let cleaned = text
    .replace(/^```(?:json|markdown|md)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();

  let start = cleaned.indexOf("{");
  let end = cleaned.lastIndexOf("}");

  // Fallback: cari array [ ... ]
  if (start === -1 || end === -1 || end < start) {
    const arrStart = cleaned.indexOf("[");
    const arrEnd = cleaned.lastIndexOf("]");
    if (arrStart !== -1 && arrEnd !== -1 && arrEnd > arrStart) {
      const arrJson = cleaned.slice(arrStart, arrEnd + 1);
      const arrParsed = JSON.parse(arrJson);
      return {
        metadata: {
          aspek: "-",
          bidang: "-",
          auditi: "-",
          tanggal: "-",
        },
        rows: normalizeRows(arrParsed),
      };
    }
    throw new Error(
      "AI tidak mengembalikan JSON yang valid. Response awal: " +
        cleaned.slice(0, 200)
    );
  }

  const jsonStr = cleaned.slice(start, end + 1);

  // ==========================================
  // COBA 1: JSON.parse biasa
  // ==========================================
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (parseErr) {
    console.warn("⚠️ JSON.parse gagal, coba repair...");
    console.warn(
      "Error asli:",
      parseErr instanceof Error ? parseErr.message : String(parseErr)
    );

    // ==========================================
    // COBA 2: jsonrepair
    // ==========================================
    try {
      const repairedStr = jsonrepair(jsonStr);
      parsed = JSON.parse(repairedStr);
      console.log("✓ Repair via jsonrepair berhasil!");
    } catch (jsonrepairErr) {
      console.warn(
        "jsonrepair gagal:",
        jsonrepairErr instanceof Error
          ? jsonrepairErr.message
          : String(jsonrepairErr)
      );

      // ==========================================
      // COBA 3: Buang row terakhir yang rusak
      // ==========================================
      try {
        const rowsMatch = jsonStr.match(/"rows"\s*:\s*\[/);
        if (rowsMatch && rowsMatch.index !== undefined) {
          const rowsStart = jsonStr.indexOf("[", rowsMatch.index);

          let depth = 0;
          let lastCompleteRow = -1;
          for (let i = rowsStart + 1; i < jsonStr.length; i++) {
            const ch = jsonStr[i];
            if (ch === "{") depth++;
            else if (ch === "}") {
              depth--;
              if (depth === 0) lastCompleteRow = i;
            }
          }

          if (lastCompleteRow > 0) {
            const headPart = jsonStr.slice(0, lastCompleteRow + 1);
            const repaired = headPart + "]}";
            parsed = JSON.parse(repaired);
            console.log(
              "✓ Repair manual berhasil (buang row terakhir yang rusak)!"
            );
          }
        }
      } catch (manualErr) {
        console.warn(
          "Repair manual gagal:",
          manualErr instanceof Error ? manualErr.message : String(manualErr)
        );
      }
    }

    if (!parsed) {
      throw new Error(
        "JSON.parse gagal setelah semua upaya repair. Error asli: " +
          (parseErr instanceof Error ? parseErr.message : String(parseErr))
      );
    }
  }

  // ==========================================
  // VALIDASI STRUKTUR
  // ==========================================
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Hasil AI bukan object JSON.");
  }

  const obj = parsed as Record<string, unknown>;

  const rawRows = Array.isArray(obj.rows) ? obj.rows : [];
  const rawMeta = (obj.metadata ?? {}) as Partial<LhaMetadata>;

  return {
    metadata: {
      aspek: String(rawMeta.aspek ?? "-"),
      bidang: String(rawMeta.bidang ?? "-"),
      auditi: String(rawMeta.auditi ?? "-"),
      tanggal: String(rawMeta.tanggal ?? "-"),
    },
    rows: normalizeRows(rawRows),
  };
}

// ==========================================
// HELPER: Build enriched system prompt dengan peraturan
// ==========================================
function enrichSystemPrompt(
  basePrompt: string,
  peraturanContext: string,
  divisiLabel: string
): string {
  if (!peraturanContext || !peraturanContext.trim()) {
    return basePrompt;
  }

  return (
    basePrompt +
    `\n\n==========================================\n` +
    `PERATURAN & REGULASI REFERENSI — ${divisiLabel.toUpperCase()}\n` +
    `==========================================\n` +
    `Gunakan peraturan-peraturan berikut sebagai DASAR UTAMA dalam menentukan ` +
    `KRITERIA audit. Setiap temuan yang Anda identifikasi HARUS mengacu pada ` +
    `salah satu peraturan di bawah ini (sebutkan nama/nomor peraturan pada kolom KRITERIA).\n\n` +
    peraturanContext +
    `\n\n==========================================\n` +
    `INSTRUKSI PENTING:\n` +
    `1. KRITERIA harus mengutip peraturan yang relevan dari daftar di atas.\n` +
    `2. Jika tidak ada peraturan yang cocok, gunakan prinsip umum good governance.\n` +
    `3. SEBAB harus menjelaskan mengapa pelanggaran terjadi.\n` +
    `4. AKIBAT harus menjelaskan dampak nyata dari temuan.\n` +
    `5. REKOMENDASI harus actionable dan spesifik.\n` +
    `==========================================\n`
  );
}

// ==========================================
// MAIN HANDLER
// ==========================================
export async function POST(req: NextRequest) {
  try {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const groqApiKey = process.env.GROQ_API_KEY;

    if (!geminiApiKey || !groqApiKey) {
      return NextResponse.json(
        { error: "API Key Gemini atau Groq belum lengkap di .env.local" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const divisi = (formData.get("divisi") as string) || "operasional";
    const peraturanContext =
      (formData.get("peraturanContext") as string) || "";

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { error: "File tidak valid atau tidak ditemukan dalam request" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let mimeType = file.type;
    if (!mimeType || mimeType === "") {
      if (file.name.endsWith(".pdf")) mimeType = "application/pdf";
      else if (file.name.endsWith(".txt")) mimeType = "text/plain";
      else if (file.name.endsWith(".png")) mimeType = "image/png";
      else if (file.name.endsWith(".jpg") || file.name.endsWith(".jpeg"))
        mimeType = "image/jpeg";
      else mimeType = "application/pdf";
    }

    const divisiLabel = DIVISI_LABEL[divisi] || "Divisi";
    const basePrompt = buildSystemPrompt(divisi);
    const systemPrompt = enrichSystemPrompt(
      basePrompt,
      peraturanContext,
      divisiLabel
    );

    console.log(
      `[${divisiLabel}] Peraturan context: ${
        peraturanContext ? peraturanContext.length + " chars" : "TIDAK ADA"
      }`
    );

    // ==========================================
    // PERCOBAAN 1: GEMINI
    // ==========================================
    try {
      console.log(`[${divisiLabel}] Mencoba memproses dengan Gemini...`);
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
          maxOutputTokens: 8192,
        },
      });

      const base64Data = buffer.toString("base64");

      const result = await model.generateContent([
        systemPrompt,
        { inlineData: { data: base64Data, mimeType: mimeType } },
      ]);

      const responseText = result.response.text();
      console.log("=== RAW GEMINI (first 300 chars) ===");
      console.log(responseText.slice(0, 300));

      const lhaResult = extractLhaResult(responseText);

      if (lhaResult.rows.length === 0) {
        throw new Error("Gemini tidak mengembalikan rows.");
      }

      console.log(
        `✓ Gemini berhasil. ${lhaResult.rows.length} temuan ditemukan.`
      );

      return NextResponse.json({
        metadata: lhaResult.metadata,
        rows: lhaResult.rows,
        provider: `Gemini (${divisiLabel})`,
      });
    } catch (geminiError: unknown) {
      const geminiMsg =
        geminiError instanceof Error
          ? geminiError.message
          : String(geminiError);
      console.warn(`⚠️ [${divisiLabel}] Gemini gagal. Fallback ke Groq...`);
      console.warn("Detail Error Gemini:", geminiMsg);

      // ==========================================
      // PERCOBAAN 2: GROQ
      // ==========================================
      const groq = new Groq({ apiKey: groqApiKey });
      let extractedText = "";

      if (mimeType === "application/pdf") {
        const pdfData = await pdfParse(buffer);
        extractedText = pdfData.text;
      } else if (mimeType === "text/plain") {
        extractedText = buffer.toString("utf-8");
      } else {
        throw new Error(
          "Gemini sedang bermasalah, dan AI Cadangan (Groq) hanya mendukung format PDF atau TXT."
        );
      }

      if (!extractedText.trim()) {
        throw new Error(
          "Dokumen PDF tidak memiliki teks yang dapat dibaca (mungkin PDF hasil scan)."
        );
      }

      // Batasi panjang teks untuk Groq
      const MAX_CHARS = 20000;
      if (extractedText.length > MAX_CHARS) {
        console.warn(
          `[Groq] Teks terlalu panjang (${extractedText.length} chars). Dipotong jadi ${MAX_CHARS}.`
        );
        extractedText = extractedText.slice(0, MAX_CHARS);
      }

      console.log(
        `[${divisiLabel}] Mengirim ke Groq (${extractedText.length} chars)...`
      );

      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Berikut teks dokumen yang harus dianalisis:\n\n${extractedText}\n\nIngat: keluarkan HANYA JSON object dengan key "metadata" dan "rows". MAKSIMUM 5 temuan. RINGKAS.`,
          },
        ],
        model: "llama3-70b-8192", // <- Disamakan menggunakan versi ini
        temperature: 0.2,
        max_tokens: 6000,
      });

      const responseText = chatCompletion.choices[0]?.message?.content || "";
      console.log("=== RAW GROQ (first 300 chars) ===");
      console.log(responseText.slice(0, 300));

      if (!responseText.trim()) {
        throw new Error("Groq mengembalikan response kosong.");
      }

      const lhaResult = extractLhaResult(responseText);

      if (lhaResult.rows.length === 0) {
        throw new Error("Groq tidak mengembalikan rows.");
      }

      console.log(
        `✓ Groq berhasil. ${lhaResult.rows.length} temuan ditemukan.`
      );

      return NextResponse.json({
        metadata: lhaResult.metadata,
        rows: lhaResult.rows,
        provider: `Groq (${divisiLabel})`,
      });
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("API Route Error Final:", msg);
    return NextResponse.json(
      { error: msg || "Terjadi kesalahan fatal saat memproses dokumen." },
      { status: 500 }
    );
  }
}