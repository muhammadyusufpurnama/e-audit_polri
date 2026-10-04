import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    const divisions = await (prisma as any).division.findMany({
      orderBy: { id: "asc" },
      include: {
        _count: {
          select: { regulations: true },
        },
      },
    });

    return NextResponse.json({ divisions });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}