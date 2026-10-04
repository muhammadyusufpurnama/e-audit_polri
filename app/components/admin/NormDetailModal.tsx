// app/components/admin/NormDetailModal.tsx
"use client";

import { useState } from "react";
import {
  X,
  Save,
  Loader2,
  BookOpen,
  FileText,
  Trash2,
  Pencil,
} from "lucide-react";
import type { Norm, Rule } from "@/types/audit";

interface Props {
  norm: Norm;
  onClose: () => void;
  onUpdate: () => void;
}

export default function NormDetailModal({ norm, onClose, onUpdate }: Props) {
  const [editingNorm, setEditingNorm] = useState(false);
  const [savingNorm, setSavingNorm] = useState(false);
  const [criteria, setCriteria] = useState(norm.criteria);
  const [article, setArticle] = useState(norm.article);
  const [paragraph, setParagraph] = useState(norm.paragraph ?? "");
  const [originalText, setOriginalText] = useState(norm.originalText);
  const [rules, setRules] = useState<Rule[]>(norm.rules);

  // ============ SAVE NORM ============
  const handleSaveNorm = async () => {
    setSavingNorm(true);
    try {
      const res = await fetch(`/api/norms/${norm.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          criteria,
          article,
          paragraph: paragraph || null,
          originalText,
        }),
      });
      if (!res.ok) throw new Error("Gagal update norma");
      setEditingNorm(false);
      onUpdate();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    } finally {
      setSavingNorm(false);
    }
  };

  // ============ UPDATE RULE ============
  const handleUpdateRule = async (ruleId: number, patch: Partial<Rule>) => {
    try {
      const res = await fetch(`/api/rules/${ruleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Gagal update rule");
      const data = await res.json();
      setRules((prev) => prev.map((r) => (r.id === ruleId ? data.rule : r)));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    }
  };

  // ============ DELETE RULE ============
  const handleDeleteRule = async (ruleId: number) => {
    if (!confirm("Hapus rule ini?")) return;
    try {
      const res = await fetch(`/api/rules/${ruleId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal hapus rule");
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ============ HEADER ============ */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white">
                Detail Norma — {norm.normCode}
              </h3>
              <p className="text-xs text-slate-400 truncate max-w-md">
                {norm.regulation?.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ============ BODY ============ */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Meta Info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <InfoBox
              label="Divisi"
              value={norm.regulation?.division.name ?? "-"}
            />
            <InfoBox
              label="Peraturan"
              value={`${norm.regulation?.regulationNumber ?? "-"} / ${
                norm.regulation?.year ?? "-"
              }`}
            />
            <InfoBox label="Jenis" value={norm.regulation?.regulationType ?? "-"} />
            <InfoBox
              label="Jumlah Aturan"
              value={`${rules.length} aturan`}
            />
          </div>

          {/* Kriteria & Pasal */}
          <Section title="Kriteria & Pasal" icon={FileText}>
            {editingNorm ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  value={criteria}
                  onChange={(e) => setCriteria(e.target.value)}
                  placeholder="Kriteria"
                  className="px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-700 focus:border-cyan-500 text-sm text-white outline-none"
                />
                <input
                  value={article}
                  onChange={(e) => setArticle(e.target.value)}
                  placeholder="Pasal"
                  className="px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-700 focus:border-cyan-500 text-sm text-white outline-none"
                />
                <input
                  value={paragraph}
                  onChange={(e) => setParagraph(e.target.value)}
                  placeholder="Ayat (opsional)"
                  className="px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-700 focus:border-cyan-500 text-sm text-white outline-none"
                />
              </div>
            ) : (
              <div className="flex flex-wrap gap-4 text-sm">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">
                    Kriteria
                  </span>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-xs font-semibold">
                    {criteria}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">
                    Pasal
                  </span>
                  <span className="text-slate-200 font-semibold">
                    {article}
                  </span>
                </div>
                {paragraph && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">
                      Ayat
                    </span>
                    <span className="text-slate-200 font-semibold">
                      {paragraph}
                    </span>
                  </div>
                )}
              </div>
            )}
          </Section>

          {/* Original Text */}
          <Section title="Original Text (dari peraturan asli)" icon={BookOpen}>
            {editingNorm ? (
              <textarea
                value={originalText}
                onChange={(e) => setOriginalText(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-700 focus:border-cyan-500 text-sm text-white resize-none outline-none"
              />
            ) : (
              <p className="text-sm text-slate-300 italic leading-relaxed">
                "{originalText}"
              </p>
            )}
          </Section>

          {/* Rules */}
          <Section title={`Aturan Audit (${rules.length})`} icon={FileText}>
            <div className="space-y-2">
              {rules.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  Belum ada aturan untuk norma ini
                </p>
              ) : (
                rules.map((rule) => (
                  <RuleCard
                    key={rule.id}
                    rule={rule}
                    onUpdate={(patch) => handleUpdateRule(rule.id, patch)}
                    onDelete={() => handleDeleteRule(rule.id)}
                  />
                ))
              )}
            </div>
          </Section>
        </div>

        {/* ============ FOOTER ============ */}
        <div className="p-4 border-t border-slate-800 flex justify-end gap-2 shrink-0">
          {editingNorm ? (
            <>
              <button
                onClick={() => {
                  setCriteria(norm.criteria);
                  setArticle(norm.article);
                  setParagraph(norm.paragraph ?? "");
                  setOriginalText(norm.originalText);
                  setEditingNorm(false);
                }}
                className="px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSaveNorm}
                disabled={savingNorm}
                className="px-4 py-2 text-sm bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg flex items-center gap-2 disabled:opacity-50 hover:shadow-lg hover:shadow-cyan-500/30 transition-all"
              >
                {savingNorm ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Simpan
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditingNorm(true)}
              className="px-4 py-2 text-sm bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg flex items-center gap-2 hover:shadow-lg hover:shadow-cyan-500/30 transition-all"
            >
              <Pencil className="w-4 h-4" />
              Edit Norma
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// SUB-COMPONENTS
// ==========================================
function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
        {label}
      </p>
      <p className="text-sm text-white mt-1 truncate">{value}</p>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3.5 h-3.5 text-cyan-400" />
        <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
          {title}
        </h4>
      </div>
      <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800">
        {children}
      </div>
    </div>
  );
}

function RuleCard({
  rule,
  onUpdate,
  onDelete,
}: {
  rule: Rule;
  onUpdate: (patch: Partial<Rule>) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(rule);

  const save = () => {
    onUpdate(form);
    setEditing(false);
  };

  return (
    <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-2">
        <span className="text-xs font-mono text-amber-400 font-semibold">
          {rule.ruleCode}
        </span>
        <div className="flex gap-1">
          {editing ? (
            <>
              <button
                onClick={save}
                className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
              >
                Simpan
              </button>
              <button
                onClick={() => {
                  setForm(rule);
                  setEditing(false);
                }}
                className="text-xs px-2 py-1 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 transition-colors"
              >
                Batal
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="text-xs px-2 py-1 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={onDelete}
                className="p-1 rounded text-red-400 hover:bg-red-500/10 transition-colors"
                title="Hapus rule"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <div className="space-y-2 text-xs">
          <input
            value={form.parameter}
            onChange={(e) => setForm({ ...form, parameter: e.target.value })}
            placeholder="Parameter"
            className="w-full px-2 py-1.5 rounded bg-slate-950/60 border border-slate-700 text-white outline-none focus:border-cyan-500"
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              value={form.operator}
              onChange={(e) => setForm({ ...form, operator: e.target.value })}
              placeholder="Operator"
              className="px-2 py-1.5 rounded bg-slate-950/60 border border-slate-700 text-white outline-none focus:border-cyan-500"
            />
            <input
              type="number"
              value={form.numericValue ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  numericValue: e.target.value ? Number(e.target.value) : null,
                })
              }
              placeholder="Nilai"
              className="px-2 py-1.5 rounded bg-slate-950/60 border border-slate-700 text-white outline-none focus:border-cyan-500"
            />
            <input
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              placeholder="Satuan"
              className="px-2 py-1.5 rounded bg-slate-950/60 border border-slate-700 text-white outline-none focus:border-cyan-500"
            />
          </div>
          <input
            value={form.ruleType}
            onChange={(e) => setForm({ ...form, ruleType: e.target.value })}
            placeholder="Rule Type (NUMERIC/TEXT/DOCUMENT/...)"
            className="w-full px-2 py-1.5 rounded bg-slate-950/60 border border-slate-700 text-white outline-none focus:border-cyan-500"
          />
          <textarea
            value={form.condition}
            onChange={(e) => setForm({ ...form, condition: e.target.value })}
            placeholder="Kondisi"
            rows={2}
            className="w-full px-2 py-1.5 rounded bg-slate-950/60 border border-slate-700 text-white resize-none outline-none focus:border-cyan-500"
          />
          <textarea
            value={form.inspectionIndicator}
            onChange={(e) =>
              setForm({ ...form, inspectionIndicator: e.target.value })
            }
            placeholder="Indikator Pemeriksaan"
            rows={2}
            className="w-full px-2 py-1.5 rounded bg-slate-950/60 border border-slate-700 text-white resize-none outline-none focus:border-cyan-500"
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          <Field label="Parameter" value={form.parameter} />
          <Field label="Operator" value={form.operator} />
          <Field
            label="Nilai"
            value={
              form.numericValue !== null
                ? `${form.numericValue} ${form.unit}`
                : form.textThreshold || "-"
            }
          />
          <Field label="Jenis Aturan" value={form.ruleType} />
          <div className="col-span-2">
            <Field label="Kondisi" value={form.condition} />
          </div>
          <div className="col-span-2">
            <Field
              label="Indikator Pemeriksaan"
              value={form.inspectionIndicator}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-slate-500 uppercase font-bold">
        {label}
      </p>
      <p className="text-slate-300 mt-0.5">{value || "-"}</p>
    </div>
  );
}