// app/api/norms/[id]/approve/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const normId = Number(id);

    // Update status norma jadi APPROVED
    const norm = await prisma.norm.update({
      where: { id: normId },
      data: { status: "APPROVED" },
    });

    // Update semua rules di bawah norma ini jadi APPROVED juga
    await prisma.rule.updateMany({
      where: { normId },
      data: { status: "APPROVED" },
    });

    // Cek apakah semua norma di regulation ini sudah approved
    const regulation = await prisma.regulation.findUnique({
      where: { id: norm.regulationId },
      include: { norms: true },
    });

    if (regulation) {
      const allApproved = regulation.norms.every(
        (n) => n.id === norm.id || n.status === "APPROVED"
      );
      if (allApproved) {
        await prisma.regulation.update({
          where: { id: regulation.id },
          data: { status: "APPROVED" },
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        action: "APPROVE",
        targetType: "NORM",
        targetId: id,
        description: `Menyetujui norma ${norm.normCode} ke Master Data`,
      },
    });

    return NextResponse.json({ success: true, norm });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}