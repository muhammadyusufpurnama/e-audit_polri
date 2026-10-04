// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

const DIVISIONS = [
  {
    key: "operasional",
    name: "Operasional",
    icon: "Settings",
    description: "Pengawasan kegiatan operasional harian",
  },
  {
    key: "sdm",
    name: "SDM",
    icon: "Users",
    description: "Sumber Daya Manusia & Kepegawaian",
  },
  {
    key: "logistik",
    name: "Logistik",
    icon: "Truck",
    description: "Pengelolaan logistik & inventaris",
  },
  {
    key: "keuangan",
    name: "Keuangan",
    icon: "Wallet",
    description: "Pengelolaan keuangan & anggaran",
  },
];

async function main() {
  console.log("🌱 Seeding divisions...");

  for (const div of DIVISIONS) {
    await prisma.division.upsert({
      where: { key: div.key },
      update: div,
      create: div,
    });
    console.log(`  ✓ ${div.name}`);
  }

  console.log("✅ Seeding selesai!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });