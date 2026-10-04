import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const norm = await prisma.norm.update({
      where: { id: Number(id) },
      data: { status: "APPROVED" },
    });

    await prisma.rule.updateMany({
      where: { normId: Number(id) },
      data: { status: "APPROVED" },
    });

    const regulation = await prisma.regulation.findUnique({
      where: { id: norm.regulationId },
      include: { norms: true },
    });

    if (regulation) {
      const allApproved = regulation.norms.every(
        (n: (typeof regulation.norms)[number]) =>
          n.id === norm.id || n.status === "APPROVED"
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
        description: `Approve norma ${norm.normCode}`,
      },
    });

    return NextResponse.json({ success: true, norm });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}