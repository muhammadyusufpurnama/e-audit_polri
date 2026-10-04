// lib/validators/normValidator.ts
import type { AINorm, AIRule, AIExtractionResult } from "@/lib/ai/extractNorms";

const VALID_OPERATORS = [
  "=",
  "!=",
  ">",
  "<",
  ">=",
  "<=",
  "IN",
  "NOT IN",
  "CONTAINS",
];

const VALID_RULE_TYPES = [
  "NUMERIC",
  "TEXT",
  "DOCUMENT",
  "DATE",
  "BOOLEAN",
  "PERCENTAGE",
  "CURRENCY",
];

const VALID_CRITERIA = [
  "Dokumen",
  "Waktu",
  "Nilai",
  "Prosedur",
  "Persyaratan",
  "Approval",
  "Kualifikasi",
  "Lainnya",
];

export interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
  sanitized: AIExtractionResult;
}

export function validateExtraction(
  data: AIExtractionResult
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validasi regulation
  if (!data.regulation.type) warnings.push("Jenis peraturan kosong");
  if (!data.regulation.number) warnings.push("Nomor peraturan kosong");
  if (!data.regulation.year) warnings.push("Tahun peraturan kosong");
  if (!data.regulation.title) warnings.push("Judul peraturan kosong");

  // Validasi norms
  if (data.norms.length === 0) {
    errors.push("AI tidak menghasilkan norma apapun");
  }

  const sanitizedNorms: AINorm[] = data.norms.map((norm, ni) => {
    // Validasi norm
    if (!norm.article || norm.article.trim() === "") {
      errors.push(`Norma #${ni + 1}: Pasal wajib ada`);
    }
    if (!norm.originalText || norm.originalText.trim() === "") {
      warnings.push(`Norma #${ni + 1}: Original text kosong`);
    }
    if (!VALID_CRITERIA.includes(norm.criteria)) {
      warnings.push(
        `Norma #${ni + 1}: Kriteria "${norm.criteria}" tidak valid, ganti ke "Lainnya"`
      );
      norm.criteria = "Lainnya";
    }

    // Validasi rules
    const sanitizedRules: AIRule[] = norm.rules.map((rule, ri) => {
      if (!rule.parameter || rule.parameter.trim() === "") {
        errors.push(`Norma #${ni + 1} Rule #${ri + 1}: Parameter wajib ada`);
      }
      if (!VALID_OPERATORS.includes(rule.operator)) {
        warnings.push(
          `Norma #${ni + 1} Rule #${ri + 1}: Operator "${rule.operator}" tidak valid, ganti ke "="`
        );
        rule.operator = "=";
      }
      if (!VALID_RULE_TYPES.includes(rule.ruleType)) {
        warnings.push(
          `Norma #${ni + 1} Rule #${ri + 1}: Rule type "${rule.ruleType}" tidak valid, ganti ke "TEXT"`
        );
        rule.ruleType = "TEXT";
      }
      if (
        rule.ruleType === "NUMERIC" &&
        rule.numericValue !== null &&
        typeof rule.numericValue !== "number"
      ) {
        warnings.push(
          `Norma #${ni + 1} Rule #${ri + 1}: numericValue harus angka, di-null-kan`
        );
        rule.numericValue = null;
      }
      if (!rule.condition || rule.condition.trim() === "") {
        warnings.push(`Norma #${ni + 1} Rule #${ri + 1}: Kondisi kosong`);
      }
      if (
        !rule.inspectionIndicator ||
        rule.inspectionIndicator.trim() === ""
      ) {
        warnings.push(
          `Norma #${ni + 1} Rule #${ri + 1}: Indikator pemeriksaan kosong`
        );
      }
      return rule;
    });

    return { ...norm, rules: sanitizedRules };
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    sanitized: {
      regulation: data.regulation,
      norms: sanitizedNorms,
    },
  };
}