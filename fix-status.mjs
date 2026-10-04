// fix-status.mjs
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import "dotenv/config";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🔍 Cek status yang ada di database...\n");

  // Tampilkan semua status yang ada
  const allNorms = await prisma.norm.findMany({
    select: { id: true, normCode: true, status: true },
  });

  console.log("📋 Status norms saat ini:");
  const statusCount = {};
  allNorms.forEach((n) => {
    statusCount[n.status] = (statusCount[n.status] ?? 0) + 1;
  });
  Object.entries(statusCount).forEach(([status, count]) => {
    console.log(`   ${status}: ${count}`);
  });

  // Fix norms: ACTIVE → APPROVED
  const normsFixed = await prisma.norm.updateMany({
    where: { status: "ACTIVE" },
    data: { status: "APPROVED" },
  });
  console.log(`\n✅ Fixed ${normsFixed.count} norms: ACTIVE → APPROVED`);

  // Fix rules: ACTIVE → APPROVED
  const rulesFixed = await prisma.rule.updateMany({
    where: { status: "ACTIVE" },
    data: { status: "APPROVED" },
  });
  console.log(`✅ Fixed ${rulesFixed.count} rules: ACTIVE → APPROVED`);

  // Ringkasan setelah fix
  console.log("\n📊 Status setelah fix:");
  const after = await prisma.norm.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  after.forEach((s) => {
    console.log(`   ${s.status}: ${s._count._all}`);
  });
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });