// app/api/regulations/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parsePDF } from "@/lib/parser/pdfParser";
import { parseDOCX } from "@/lib/parser/docxParser";
import { extractNormsWithAI } from "@/lib/ai/extractNorms";
import { validateExtraction } from "@/lib/validators/normValidator";

// ==========================================
// ⚙️ KONFIGURASI NEXT.JS
// ==========================================
// WAJIB: pakai Node.js runtime (bukan Edge) supaya bisa akses:
// - pdf-parse-new (pakai fs)
// - mammoth
// - Prisma dengan better-sqlite3 (native module)
export const runtime = "nodejs";

// Naikkan durasi maksimum eksekusi (untuk AI yang kadang lambat)
export const maxDuration = 60;

// Force dynamic — route ini butuh akses database realtime
export const dynamic = "force-dynamic";

// ==========================================
// KONFIGURASI FILE
// ==========================================
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const prismaClient = prisma as any;

// ==========================================
// MAIN HANDLER
// ==========================================
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const divisionId = Number(formData.get("divisionId"));
    const regulationType = String(formData.get("regulationType") ?? "");
    const regulationNumber = String(formData.get("regulationNumber") ?? "");
    const year = String(formData.get("year") ?? "");
    const title = String(formData.get("title") ?? "");

    // ==========================================
    // VALIDASI INPUT
    // ==========================================
    if (!file) {
      return NextResponse.json(
        { error: "File wajib diupload" },
        { status: 400 }
      );
    }
    if (!divisionId) {
      return NextResponse.json(
        { error: "Divisi wajib dipilih" },
        { status: 400 }
      );
    }

    // ⬇️ Pesan error dengan info ukuran aktual
    if (file.size > MAX_FILE_SIZE) {
      const actualMB = (file.size / 1024 / 1024).toFixed(2);
      const maxMB = (MAX_FILE_SIZE / 1024 / 1024).toFixed(0);
      return NextResponse.json(
        {
          error: `File terlalu besar (${actualMB}MB). Maksimal ${maxMB}MB.`,
          fileSize: file.size,
          maxSize: MAX_FILE_SIZE,
        },
        { status: 413 }
      );
    }

    const fileName = file.name.toLowerCase();
    const ext = fileName.split(".").pop() ?? "";
    if (!["pdf", "doc", "docx"].includes(ext)) {
      return NextResponse.json(
        { error: "Format file harus PDF, DOC, atau DOCX" },
        { status: 400 }
      );
    }

    // ==========================================
    // 1. EXTRACT TEXT
    // ==========================================
    console.log(
      `[UPLOAD] Extracting text from "${file.name}" (${(
        file.size /
        1024 /
        1024
      ).toFixed(2)}MB)...`
    );

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let extractedText = "";
    let fileType = "application/pdf";

    if (ext === "pdf") {
      const result = await parsePDF(buffer);
      extractedText = result.text;
      fileType = "application/pdf";
    } else if (ext === "docx") {
      const result = await parseDOCX(buffer);
      extractedText = result.text;
      fileType =
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    } else {
      return NextResponse.json(
        {
          error:
            "Format DOC lama tidak didukung. Gunakan DOCX atau PDF terlebih dahulu.",
        },
        { status: 400 }
      );
    }

    if (!extractedText.trim()) {
      return NextResponse.json(
        {
          error:
            "Dokumen tidak memiliki teks yang dapat dibaca (mungkin hasil scan). Gunakan PDF yang memiliki teks digital.",
        },
        { status: 400 }
      );
    }

    console.log(`[UPLOAD] Extracted ${extractedText.length} chars`);

    // ==========================================
    // 2. SIMPAN REGULATION + DOCUMENT
    // ==========================================
    const division = await prismaClient.division.findUnique({
      where: { id: divisionId },
    });
    if (!division) {
      return NextResponse.json(
        { error: "Divisi tidak ditemukan" },
        { status: 404 }
      );
    }

    const regulation = await prismaClient.regulation.create({
      data: {
        divisionId,
        regulationType: regulationType || "Lainnya",
        regulationNumber: regulationNumber || "-",
        year: year || new Date().getFullYear().toString(),
        title: title || file.name,
        status: "DRAFT",
        documents: {
          create: {
            fileName: file.name,
            fileType,
            fileSize: file.size,
            extractedText,
            uploadStatus: "EXTRACTED",
          },
        },
      },
      include: { documents: true },
    });

    // ==========================================
    // 3. AI EXTRACTION
    // ==========================================
    console.log(
      `[UPLOAD] Memanggil AI extraction (${division.name})...`
    );

    let aiResult;
    try {
      aiResult = await extractNormsWithAI(extractedText, division.name);
    } catch (aiErr) {
      const errMsg =
        aiErr instanceof Error ? aiErr.message : String(aiErr);
      console.error("[UPLOAD] AI gagal:", errMsg);

      await prismaClient.auditLog.create({
        data: {
          action: "ANALYZE",
          targetType: "REGULATION",
          targetId: String(regulation.id),
          description: `AI extraction gagal: ${errMsg}`,
        },
      });

      return NextResponse.json(
        {
          regulation,
          aiError: `AI gagal memproses dokumen: ${errMsg}`,
          normsCreated: 0,
        },
        { status: 200 } // bukan error fatal — regulation tetap tersimpan
      );
    }

    // ==========================================
    // 4. VALIDASI
    // ==========================================
    const validation = validateExtraction(aiResult);

    // ==========================================
    // 5. SIMPAN NORMS + RULES
    // ==========================================
    let normsCreated = 0;
    let rulesCreated = 0;

    for (const norm of validation.sanitized.norms) {
      const normCode = await generateNormCode();
      const normRecord = await prismaClient.norm.create({
        data: {
          regulationId: regulation.id,
          normCode,
          criteria: norm.criteria,
          article: norm.article,
          paragraph: norm.paragraph,
          originalText: norm.originalText,
          status: "REVIEW_REQUIRED",
        },
      });
      normsCreated++;

      for (const rule of norm.rules) {
        const ruleCode = await generateRuleCode();
        await prismaClient.rule.create({
          data: {
            normId: normRecord.id,
            ruleCode,
            operator: rule.operator,
            parameter: rule.parameter,
            condition: rule.condition,
            inspectionIndicator: rule.inspectionIndicator,
            unit: rule.unit ?? "",
            textThreshold: rule.textThreshold ?? "",
            numericValue: rule.numericValue ?? null,
            minimumValue: rule.minimumValue ?? null,
            maximumValue: rule.maximumValue ?? null,
            ruleType: rule.ruleType,
            status: "DRAFT",
          },
        });
        rulesCreated++;
      }
    }

    // ==========================================
    // 6. UPDATE STATUS REGULATION
    // ==========================================
    await prismaClient.regulation.update({
      where: { id: regulation.id },
      data: { status: "REVIEW_REQUIRED" },
    });

    // ==========================================
    // 7. AUDIT LOG
    // ==========================================
    await prismaClient.auditLog.create({
      data: {
        action: "UPLOAD",
        targetType: "REGULATION",
        targetId: String(regulation.id),
        description: `Upload "${title}" — ${normsCreated} norma, ${rulesCreated} aturan`,
      },
    });

    console.log(
      `[UPLOAD] ✓ Selesai: ${normsCreated} norma, ${rulesCreated} aturan`
    );

    return NextResponse.json({
      success: true,
      regulation: { ...regulation, status: "REVIEW_REQUIRED" },
      normsCreated,
      rulesCreated,
      warnings: validation.warnings,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[UPLOAD] Error fatal:", msg);
    return NextResponse.json(
      { error: `Terjadi kesalahan: ${msg}` },
      { status: 500 }
    );
  }
}

// ==========================================
// ID GENERATOR
// ==========================================
async function generateNormCode(): Promise<string> {
  const count = await prismaClient.norm.count();
  return `NORMA-${String(count + 1).padStart(6, "0")}`;
}

async function generateRuleCode(): Promise<string> {
  const count = await prismaClient.rule.count();
  return `ATURAN-${String(count + 1).padStart(6, "0")}`;
}