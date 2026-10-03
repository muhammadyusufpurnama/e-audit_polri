"use client";

import { forwardRef } from "react";
import type { BarisTemuan, LhaMetadata } from "@/lib/prompts";

interface Props {
  metadata?: LhaMetadata;
  rows: BarisTemuan[];
}

function MultiLine({ text }: { text: string }) {
  if (!text) return null;
  const lines = text.split("\n").filter((l) => l.trim() !== "");
  if (lines.length === 0) return null;

  return (
    <>
      {lines.map((line, i) => (
        <div key={i} style={{ marginBottom: "0.15rem" }}>
          {line}
        </div>
      ))}
    </>
  );
}

export const LhaTemplate = forwardRef<HTMLDivElement, Props>(
  ({ metadata, rows }, ref) => {
    // Nilai metadata dengan fallback default
    const valAspek =
      metadata?.aspek && metadata.aspek !== "-"
        ? metadata.aspek
        : "................................";
    const valBidang =
      metadata?.bidang && metadata.bidang !== "-"
        ? metadata.bidang
        : "................................";
    const valAuditi =
      metadata?.auditi && metadata.auditi !== "-"
        ? metadata.auditi
        : "................................";
    const valTanggal =
      metadata?.tanggal && metadata.tanggal !== "-"
        ? metadata.tanggal
        : "................................";

    return (
      <div
        ref={ref}
        className="lha-template bg-white text-black"
        style={{
          fontFamily: '"Arial Narrow", Arial, sans-serif', // DISESUAIKAN KE ARIAL NARROW
          fontSize: "10pt",
          lineHeight: 1.3,
          padding: "24px 28px",
          color: "#000",
        }}
      >
        {/* ============ HEADER RAHASIA ============ */}
        <div
          style={{
            textAlign: "center",
            fontSize: "11pt",
            fontWeight: "bold",
            letterSpacing: "0.4em",
            marginBottom: "24px",
          }}
        >
          R A H A S I A
        </div>

        {/* ============ KOP + METADATA (3 BAGIAN SAMARATA) ============ */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr", // 3 Bagian sama rata (~33.33%)
            alignItems: "end",
            marginBottom: "24px",
            gap: "16px",
          }}
        >
          {/* BAGIAN 1: KOP SURAT (DENGAN GARIS BAWAH / BOTTOM BORDER) */}
          <div
            style={{
              textAlign: "center",
              fontWeight: "bold",
              fontSize: "11pt",
              lineHeight: 1.35,
              textTransform: "uppercase",
              paddingBottom: "6px",
              borderBottom: "1.5px solid #000",
            }}
          >
            <div>KEPOLISIAN NEGARA REPUBLIK INDONESIA</div>
            <div>DAERAH JAWA TIMUR</div>
            <div>INSPEKTORAT PENGAWASAN DAERAH</div>
          </div>

          {/* BAGIAN 2: KOSONG */}
          <div></div>

          {/* BAGIAN 3: METADATA (DENGAN GARIS BAWAH SEJAJAR) */}
          <div
            style={{
              fontSize: "10pt",
              paddingBottom: "6px",
              borderBottom: "1.5px solid #000",
            }}
          >
            <table
              style={{
                borderCollapse: "collapse",
                width: "100%",
                lineHeight: 1.4,
              }}
            >
              <tbody>
                <tr>
                  <td
                    style={{
                      fontWeight: "bold",
                      width: "75px",
                      verticalAlign: "top",
                    }}
                  >
                    ASPEK
                  </td>
                  <td style={{ width: "12px", verticalAlign: "top" }}>:</td>
                  <td style={{ verticalAlign: "top" }}>{valAspek}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: "bold", verticalAlign: "top" }}>
                    BIDANG
                  </td>
                  <td style={{ verticalAlign: "top" }}>:</td>
                  <td style={{ verticalAlign: "top" }}>{valBidang}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: "bold", verticalAlign: "top" }}>
                    AUDITI
                  </td>
                  <td style={{ verticalAlign: "top" }}>:</td>
                  <td style={{ verticalAlign: "top" }}>{valAuditi}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: "bold", verticalAlign: "top" }}>
                    TANGGAL
                  </td>
                  <td style={{ verticalAlign: "top" }}>:</td>
                  <td style={{ verticalAlign: "top" }}>{valTanggal}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ============ JUDUL UTAMA ============ */}
        <div
          style={{
            textAlign: "center",
            fontWeight: "bold",
            fontSize: "12pt",
            marginBottom: "20px",
            textTransform: "uppercase",
            textDecoration: "underline", // UNDERLINE SESUAI DOCX
          }}
        >
          TABULASI TEMUAN HASIL PELAKSANAAN AUDIT
        </div>

        {/* ============ TABEL UTAMA TEMUAN ============ */}
        <div style={{ overflowX: "auto" }}>
          <table
            className="lha-table"
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "10pt",
              border: "1px solid #000",
            }}
          >
            <thead>
              <tr>
                <th style={thStyle(3.5)}>NO</th>
                <th style={thStyle(22)}>TEMUAN</th>
                <th style={thStyle(7)}>
                  KODE
                  <br />
                  TEMUAN
                </th>
                <th style={thStyle(14)}>KRITERIA</th>
                <th style={thStyle(12)}>SEBAB</th>
                <th style={thStyle(11)}>AKIBAT</th>
                <th style={thStyle(30.5)}>REKOMENDASI</th>
              </tr>
              <tr>
                <th style={thNumStyle()}>1</th>
                <th style={thNumStyle()}>2</th>
                <th style={thNumStyle()}>3</th>
                <th style={thNumStyle()}>4</th>
                <th style={thNumStyle()}>5</th>
                <th style={thNumStyle()}>6</th>
                <th style={thNumStyle()}>7</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} style={{ pageBreakInside: "avoid" }}>
                  <td style={tdStyle("center")}>{row.no || "-"}</td>
                  <td style={tdStyle("left")}>
                    <MultiLine text={row.temuan} />
                  </td>
                  <td style={tdStyle("center")}>
                    <MultiLine text={row.kodeTemuan} />
                  </td>
                  <td style={tdStyle("left")}>
                    <MultiLine text={row.kriteria} />
                  </td>
                  <td style={tdStyle("left")}>
                    <MultiLine text={row.sebab} />
                  </td>
                  <td style={tdStyle("left")}>
                    <MultiLine text={row.akibat} />
                  </td>
                  <td style={tdStyle("left")}>
                    <MultiLine text={row.rekomendasi} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ============ FOOTER TANDA TANGAN ============ */}
        <div
          style={{
            marginTop: "32px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            fontSize: "10pt",
            pageBreakInside: "avoid", // MENCEGAH BAGIAN TTD TERSEPARASI DENGAN OTOMATIS
          }}
        >
          {/* KIRI */}
          <div style={{ textAlign: "center" }}>
            <div>MENGETAHUI KETUA TIM II</div>
            {/* Jeda Enter Penyeimbang Baris Kanan */}
            <div style={{ height: "18px" }} />
            <div style={{ height: "65px" }} />
            <div style={{ fontWeight: "normal" }}>
              ____________________________________
            </div>
          </div>

          {/* KANAN */}
          <div style={{ textAlign: "center" }}>
            <div>Surabaya, ..........................</div>
            <div>PEMERIKSA</div>
            <div style={{ height: "65px" }} />
            <div style={{ fontWeight: "normal" }}>
              ____________________________________
            </div>
          </div>
        </div>
      </div>
    );
  }
);

LhaTemplate.displayName = "LhaTemplate";

function thStyle(widthPercent: number): React.CSSProperties {
  return {
    border: "1px solid #000",
    padding: "5px 4px",
    backgroundColor: "#d9d9d9",
    fontWeight: "bold",
    fontSize: "10pt",
    textAlign: "center",
    width: `${widthPercent}%`,
    textTransform: "uppercase",
    verticalAlign: "middle",
  };
}

function thNumStyle(): React.CSSProperties {
  return {
    border: "1px solid #000",
    padding: "3px 4px",
    backgroundColor: "#d9d9d9",
    fontWeight: "normal",
    fontSize: "10pt",
    textAlign: "center",
    verticalAlign: "middle",
  };
}

function tdStyle(align: "left" | "center"): React.CSSProperties {
  return {
    border: "1px solid #000",
    padding: "5px 6px",
    verticalAlign: "top",
    textAlign: align,
    fontSize: "10pt",
    lineHeight: 1.35,
  };
}