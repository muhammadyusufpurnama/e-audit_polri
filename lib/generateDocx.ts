import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  PageNumber,
  PageOrientation,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
  TabStopType,
} from "docx";
import type { BarisTemuan, LhaMetadata } from "@/lib/prompts";

// ========== KONFIGURASI FONT ==========
const FONT = "Arial Narrow";
const FONT_SIZE_BODY = 20; // 10pt
const FONT_SIZE_HEADER = 21; // 10.5pt
const FONT_SIZE_NUMROW = 20; // 10pt
const FONT_SIZE_KOP = 22; // 11pt
const FONT_SIZE_TITLE = 24; // 12pt
const FONT_SIZE_RAHASIA = 22; // 11pt

const HEADER_FILL = "D9D9D9";

// ========== BORDER ==========
const BORDER_LINE = { style: BorderStyle.SINGLE, size: 8, color: "000000" };
const CELL_BORDERS = {
  top: BORDER_LINE,
  bottom: BORDER_LINE,
  left: BORDER_LINE,
  right: BORDER_LINE,
};

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const NO_BORDERS = {
  top: NO_BORDER,
  bottom: NO_BORDER,
  left: NO_BORDER,
  right: NO_BORDER,
  insideHorizontal: NO_BORDER,
  insideVertical: NO_BORDER,
};

// BORDER BAWAH UNTUK KOP & METADATA
const BOTTOM_BORDER_ONLY = {
  top: NO_BORDER,
  bottom: { style: BorderStyle.SINGLE, size: 12, color: "000000" },
  left: NO_BORDER,
  right: NO_BORDER,
};

// ========== DIMENSI A4 LANDSCAPE ==========
const A4_PORTRAIT_W = 11906; // 210 mm
const A4_PORTRAIT_H = 16838; // 297 mm
const A4_LANDSCAPE_W = 16838; // 297 mm
const MARGIN = 720; // 0.5 inch
const CONTENT_WIDTH = A4_LANDSCAPE_W - MARGIN * 2; // 15398 DXA

// LEBAR 3 BAGIAN SAMARATA (MASING-MASING ~33.33%)
const SECTION_33_WIDTH = Math.round(CONTENT_WIDTH / 3); // ~5132 DXA

// LEBAR KOLOM TABEL UTAMA (100% TOTAL)
const COLS = {
  no: Math.round(CONTENT_WIDTH * 0.035),
  temuan: Math.round(CONTENT_WIDTH * 0.22),
  kode: Math.round(CONTENT_WIDTH * 0.07),
  kriteria: Math.round(CONTENT_WIDTH * 0.14),
  sebab: Math.round(CONTENT_WIDTH * 0.12),
  akibat: Math.round(CONTENT_WIDTH * 0.11),
  rekomendasi: Math.round(CONTENT_WIDTH * 0.305),
};

// ========== HELPER ==========
function makeParagraphs(
  text: string,
  opts: { size?: number; bold?: boolean; align?: "left" | "center" } = {}
): Paragraph[] {
  const safeText = text && text.trim() ? text : " ";
  const lines = safeText.split("\n").filter((l) => l.trim() !== "");
  const finalLines = lines.length > 0 ? lines : [" "];

  return finalLines.map(
    (line) =>
      new Paragraph({
        alignment:
          opts.align === "center"
            ? AlignmentType.CENTER
            : AlignmentType.LEFT,
        spacing: { after: 40, line: 240 },
        children: [
          new TextRun({
            text: line,
            font: FONT,
            size: opts.size ?? FONT_SIZE_BODY,
            bold: opts.bold ?? false,
          }),
        ],
      })
  );
}

function makeCell(
  text: string,
  opts: {
    width: number;
    bold?: boolean;
    align?: "left" | "center";
    fill?: string;
    size?: number;
  }
): TableCell {
  return new TableCell({
    borders: CELL_BORDERS,
    width: { size: opts.width, type: WidthType.DXA },
    shading: opts.fill
      ? { fill: opts.fill, type: "clear", color: "auto" }
      : undefined,
    verticalAlign: VerticalAlign.TOP,
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    children: makeParagraphs(text, {
      size: opts.size ?? FONT_SIZE_BODY,
      bold: opts.bold,
      align: opts.align ?? "left",
    }),
  });
}

// ========== GENERATE DOKUMEN LHA DOCX ==========
export async function generateLhaDocx(
  rows: BarisTemuan[],
  filename: string,
  metadata?: LhaMetadata
): Promise<void> {
  // ---------- Header Tabel Baris 1 (Nama Kolom) ----------
  const headerRow1 = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: [
      makeCell("NO", { width: COLS.no, bold: true, align: "center", fill: HEADER_FILL, size: FONT_SIZE_HEADER }),
      makeCell("TEMUAN", { width: COLS.temuan, bold: true, align: "center", fill: HEADER_FILL, size: FONT_SIZE_HEADER }),
      makeCell("KODE\nTEMUAN", { width: COLS.kode, bold: true, align: "center", fill: HEADER_FILL, size: FONT_SIZE_HEADER }),
      makeCell("KRITERIA", { width: COLS.kriteria, bold: true, align: "center", fill: HEADER_FILL, size: FONT_SIZE_HEADER }),
      makeCell("SEBAB", { width: COLS.sebab, bold: true, align: "center", fill: HEADER_FILL, size: FONT_SIZE_HEADER }),
      makeCell("AKIBAT", { width: COLS.akibat, bold: true, align: "center", fill: HEADER_FILL, size: FONT_SIZE_HEADER }),
      makeCell("REKOMENDASI", { width: COLS.rekomendasi, bold: true, align: "center", fill: HEADER_FILL, size: FONT_SIZE_HEADER }),
    ],
  });

  // ---------- Header Tabel Baris 2 (Nomor Kolom 1-7) ----------
  const headerRow2 = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: [
      makeCell("1", { width: COLS.no, align: "center", fill: HEADER_FILL, size: FONT_SIZE_NUMROW }),
      makeCell("2", { width: COLS.temuan, align: "center", fill: HEADER_FILL, size: FONT_SIZE_NUMROW }),
      makeCell("3", { width: COLS.kode, align: "center", fill: HEADER_FILL, size: FONT_SIZE_NUMROW }),
      makeCell("4", { width: COLS.kriteria, align: "center", fill: HEADER_FILL, size: FONT_SIZE_NUMROW }),
      makeCell("5", { width: COLS.sebab, align: "center", fill: HEADER_FILL, size: FONT_SIZE_NUMROW }),
      makeCell("6", { width: COLS.akibat, align: "center", fill: HEADER_FILL, size: FONT_SIZE_NUMROW }),
      makeCell("7", { width: COLS.rekomendasi, align: "center", fill: HEADER_FILL, size: FONT_SIZE_NUMROW }),
    ],
  });

  // ---------- Body Tabel ----------
  const bodyRows = rows.map(
    (row) =>
      new TableRow({
        cantSplit: true,
        children: [
          makeCell(row.no || "-", { width: COLS.no, align: "center" }),
          makeCell(row.temuan || "-", { width: COLS.temuan }),
          makeCell(row.kodeTemuan || "-", { width: COLS.kode, align: "center" }),
          makeCell(row.kriteria || "-", { width: COLS.kriteria }),
          makeCell(row.sebab || "-", { width: COLS.sebab }),
          makeCell(row.akibat || "-", { width: COLS.akibat }),
          makeCell(row.rekomendasi || "-", { width: COLS.rekomendasi }),
        ],
      })
  );

  const mainTable = new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    rows: [headerRow1, headerRow2, ...bodyRows],
  });

  // ---------- Header First Page & Header Page 2+ ----------
  const headerFirstPage = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: "R A H A S I A",
          font: FONT,
          size: FONT_SIZE_RAHASIA,
          bold: true,
        }),
      ],
    }),
  ];

  const headerPage2Plus = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [
        new TextRun({
          children: [PageNumber.CURRENT],
          font: FONT,
          size: FONT_SIZE_RAHASIA,
          bold: true,
        }),
      ],
    }),
  ];

  const footerParagraphs = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "R A H A S I A",
          font: FONT,
          size: FONT_SIZE_RAHASIA,
          bold: true,
        }),
      ],
    }),
  ];

  // Formatting teks isi Metadata
  const valAspek = metadata?.aspek && metadata.aspek !== "-" ? metadata.aspek : "................................";
  const valBidang = metadata?.bidang && metadata.bidang !== "-" ? metadata.bidang : "................................";
  const valAuditi = metadata?.auditi && metadata.auditi !== "-" ? metadata.auditi : "................................";
  const valTanggal = metadata?.tanggal && metadata.tanggal !== "-" ? metadata.tanggal : "................................";

  // ===== TABEL HEADER 3 BAGIAN SAMARATA =====
  const header3SectionTable = new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    borders: NO_BORDERS,
    rows: [
      new TableRow({
        children: [
          // BAGIAN 1: KOP POLRI
          new TableCell({
            width: { size: SECTION_33_WIDTH, type: WidthType.DXA },
            borders: BOTTOM_BORDER_ONLY,
            verticalAlign: VerticalAlign.BOTTOM,
            margins: { top: 40, bottom: 80, left: 40, right: 40 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 20 },
                children: [
                  new TextRun({
                    text: "KEPOLISIAN NEGARA REPUBLIK INDONESIA",
                    font: FONT,
                    size: FONT_SIZE_KOP,
                    bold: true,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 20 },
                children: [
                  new TextRun({
                    text: "DAERAH JAWA TIMUR",
                    font: FONT,
                    size: FONT_SIZE_KOP,
                    bold: true,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 40 },
                children: [
                  new TextRun({
                    text: "INSPEKTORAT PENGAWASAN DAERAH",
                    font: FONT,
                    size: FONT_SIZE_KOP,
                    bold: true,
                  }),
                ],
              }),
            ],
          }),

          // BAGIAN 2: KOSONG
          new TableCell({
            width: { size: SECTION_33_WIDTH, type: WidthType.DXA },
            borders: NO_BORDERS,
            verticalAlign: VerticalAlign.BOTTOM,
            children: [
              new Paragraph({
                children: [],
              }),
            ],
          }),

          // BAGIAN 3: METADATA
          new TableCell({
            width: { size: SECTION_33_WIDTH, type: WidthType.DXA },
            borders: BOTTOM_BORDER_ONLY,
            verticalAlign: VerticalAlign.BOTTOM,
            margins: { top: 40, bottom: 80, left: 40, right: 40 },
            children: [
              new Paragraph({
                spacing: { after: 20, line: 240 },
                tabStops: [{ type: TabStopType.LEFT, position: 1200 }],
                children: [
                  new TextRun({ text: "ASPEK\t: ", font: FONT, size: FONT_SIZE_BODY, bold: true }),
                  new TextRun({ text: valAspek, font: FONT, size: FONT_SIZE_BODY }),
                ],
              }),
              new Paragraph({
                spacing: { after: 20, line: 240 },
                tabStops: [{ type: TabStopType.LEFT, position: 1200 }],
                children: [
                  new TextRun({ text: "BIDANG\t: ", font: FONT, size: FONT_SIZE_BODY, bold: true }),
                  new TextRun({ text: valBidang, font: FONT, size: FONT_SIZE_BODY }),
                ],
              }),
              new Paragraph({
                spacing: { after: 20, line: 240 },
                tabStops: [{ type: TabStopType.LEFT, position: 1200 }],
                children: [
                  new TextRun({ text: "AUDITI\t: ", font: FONT, size: FONT_SIZE_BODY, bold: true }),
                  new TextRun({ text: valAuditi, font: FONT, size: FONT_SIZE_BODY }),
                ],
              }),
              new Paragraph({
                spacing: { after: 40, line: 240 },
                tabStops: [{ type: TabStopType.LEFT, position: 1200 }],
                children: [
                  new TextRun({ text: "TANGGAL\t: ", font: FONT, size: FONT_SIZE_BODY, bold: true }),
                  new TextRun({ text: valTanggal, font: FONT, size: FONT_SIZE_BODY }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // ---------- TABEL TANDA TANGAN YANG TIDAK BISA TERPISAH (CANT SPLIT) ----------
  const signatureTable = new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    borders: NO_BORDERS,
    rows: [
      new TableRow({
        cantSplit: true, // MENJAGA AGAR BARIS TABEL TIDAK TERPOTONG HALAMAN
        children: [
          // SISI KIRI: MENGETAHUI KETUA TIM II
          new TableCell({
            width: { size: Math.round(CONTENT_WIDTH * 0.5), type: WidthType.DXA },
            borders: NO_BORDERS,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 40 },
                keepNext: true,
                children: [
                  new TextRun({
                    text: "MENGETAHUI KETUA TIM II",
                    font: FONT,
                    size: FONT_SIZE_BODY,
                  }),
                ],
              }),
              // Paragraf penyeimbang baris
              new Paragraph({
                spacing: { after: 40 },
                keepNext: true,
                children: [],
              }),
              // Spasi tempat tanda tangan
              new Paragraph({
                spacing: { after: 900 },
                keepNext: true,
                children: [],
              }),
              // Garis Solid Tanda Tangan
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "____________________________________",
                    font: FONT,
                    size: FONT_SIZE_BODY,
                  }),
                ],
              }),
            ],
          }),

          // SISI KANAN: SURABAYA & PEMERIKSA
          new TableCell({
            width: { size: Math.round(CONTENT_WIDTH * 0.5), type: WidthType.DXA },
            borders: NO_BORDERS,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 40 },
                keepNext: true,
                children: [
                  new TextRun({
                    text: "Surabaya, ..........................",
                    font: FONT,
                    size: FONT_SIZE_BODY,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 40 },
                keepNext: true,
                children: [
                  new TextRun({
                    text: "PEMERIKSA",
                    font: FONT,
                    size: FONT_SIZE_BODY,
                  }),
                ],
              }),
              // Spasi tempat tanda tangan
              new Paragraph({
                spacing: { after: 900 },
                keepNext: true,
                children: [],
              }),
              // Garis Solid Tanda Tangan
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "____________________________________",
                    font: FONT,
                    size: FONT_SIZE_BODY,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // ---------- Dokumen ----------
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: FONT, size: FONT_SIZE_BODY },
          paragraph: { spacing: { line: 240 } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.LANDSCAPE,
              width: A4_PORTRAIT_W,  // 11906 twips
              height: A4_PORTRAIT_H, // 16838 twips
            },
            margin: {
              top: MARGIN,
              bottom: MARGIN,
              left: MARGIN,
              right: MARGIN,
            },
          },
          titlePage: true,
        },
        headers: {
          first: new Header({ children: headerFirstPage }),
          default: new Header({ children: headerPage2Plus }),
        },
        footers: {
          default: new Footer({ children: footerParagraphs }),
        },
        children: [
          // 1. HEADER 3 BAGIAN
          header3SectionTable,

          // Spacer
          new Paragraph({ spacing: { after: 240 }, children: [] }),

          // 2. JUDUL UTAMA
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            children: [
              new TextRun({
                text: "TABULASI TEMUAN HASIL PELAKSANAAN AUDIT",
                font: FONT,
                size: FONT_SIZE_TITLE,
                bold: true,
                underline: {},
              }),
            ],
          }),

          // 3. TABEL TEMUAN UTAMA
          mainTable,

          // 4. SPACER DENGAN ENTER JEDA DARI TABEL
          new Paragraph({
            spacing: { before: 360, after: 240 },
            keepNext: true, // Mencegah spasi ini menjadi baris tunggal di dasar halaman
            children: [],
          }),

          // 5. FOOTER TANDA TANGAN (UTUH & PINDAH KE HALAMAN BERIKUTNYA JIKA TIDAK MUAT)
          signatureTable,
        ],
      },
    ],
  });

  // ---------- Download Blob ----------
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".docx") ? filename : `${filename}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}