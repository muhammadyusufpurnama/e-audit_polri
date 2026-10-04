// analyze/audit-logs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit") ?? 100);

    const logs = await (prisma as any).auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ logs });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}