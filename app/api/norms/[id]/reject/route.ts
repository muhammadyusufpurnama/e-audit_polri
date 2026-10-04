// app/api/norms/[id]/reject/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const normId = Number(id);

    // Update status norma jadi REJECTED
    const norm = await prisma.norm.update({
      where: { id: normId },
      data: { status: "REJECTED" },
    });

    // Update semua rules di bawah norma ini jadi REJECTED juga
    await prisma.rule.updateMany({
      where: { normId },
      data: { status: "REJECTED" },
    });

    await prisma.auditLog.create({
      data: {
        action: "REJECT",
        targetType: "NORM",
        targetId: id,
        description: `Reject norma ${norm.normCode}`,
      },
    });

    return NextResponse.json({ success: true, norm });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}