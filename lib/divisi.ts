export type DivisiKey = "operasional" | "sdm" | "logistik" | "keuangan";

export interface DivisiConfig {
  key: DivisiKey;
  nama: string;
  deskripsi: string;
  icon: "Settings" | "Users" | "Truck" | "Wallet";
  warna: {
    bg: string;
    border: string;
    text: string;
    button: string;
    buttonHover: string;
    accent: string;
  };
  contohDokumen: string;
}

export const DIVISI_LIST: readonly DivisiConfig[] = [
  {
    key: "operasional",
    nama: "Divisi Operasional",
    deskripsi:
      "Analisis laporan operasional, SOP, temuan lapangan, dan kepatuhan proses bisnis terhadap regulasi.",
    icon: "Settings",
    warna: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-700",
      button: "bg-blue-600",
      buttonHover: "hover:bg-blue-700",
      accent: "border-blue-500",
    },
    contohDokumen:
      "SOP Operasional, Laporan Audit Internal, Temuan Lapangan, Laporan Kualitas",
  },
  {
    key: "sdm",
    nama: "Divisi SDM",
    deskripsi:
      "Evaluasi kebijakan ketenagakerjaan, kontrak kerja, penggajian, dan kepatuhan terhadap UU Ketenagakerjaan.",
    icon: "Users",
    warna: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-700",
      button: "bg-green-600",
      buttonHover: "hover:bg-green-700",
      accent: "border-green-500",
    },
    contohDokumen:
      "Kontrak Kerja, Perjanjian Kerja Bersama, Laporan Penggajian, Data BPJS",
  },
  {
    key: "logistik",
    nama: "Divisi Logistik",
    deskripsi:
      "Pengujian dokumen pengadaan, inventaris, distribusi barang, dan kepatuhan terhadap regulasi pengadaan.",
    icon: "Truck",
    warna: {
      bg: "bg-orange-50",
      border: "border-orange-200",
      text: "text-orange-700",
      button: "bg-orange-600",
      buttonHover: "hover:bg-orange-700",
      accent: "border-orange-500",
    },
    contohDokumen:
      "Dokumen Pengadaan, PO, Surat Jalan, Laporan Inventaris, Kontrak Vendor",
  },
  {
    key: "keuangan",
    nama: "Divisi Keuangan",
    deskripsi:
      "Analisis laporan keuangan, pajak, anggaran, dan kepatuhan terhadap standar akuntansi & perpajakan.",
    icon: "Wallet",
    warna: {
      bg: "bg-purple-50",
      border: "border-purple-200",
      text: "text-purple-700",
      button: "bg-purple-600",
      buttonHover: "hover:bg-purple-700",
      accent: "border-purple-500",
    },
    contohDokumen:
      "Laporan Keuangan, SPT Pajak, Anggaran, Bukti Transaksi, Neraca",
  },
] as const;