// app/api/norms/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const regulationId = searchParams.get("regulationId");
    const divisionId = searchParams.get("divisionId");

    const norms = await prisma.norm.findMany({
      where: {
        ...(status && status !== "all" ? { status } : {}),
        ...(regulationId ? { regulationId: Number(regulationId) } : {}),
        ...(divisionId
          ? { regulation: { divisionId: Number(divisionId) } }
          : {}),
      },
      include: {
        rules: true,
        regulation: {
          include: { division: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ norms });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}