// analyze/regulations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// GET — list regulations
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const divisionId = searchParams.get("divisionId");
    const status = searchParams.get("status");
    const db = prisma as any;

    const regulations = await db.regulation.findMany({
      where: {
        ...(divisionId ? { divisionId: Number(divisionId) } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        division: true,
        _count: {
          select: { norms: true, documents: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ regulations });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}