import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const rule = await prisma.rule.update({
      where: { id: Number(id) },
      data: {
        parameter: body.parameter,
        operator: body.operator,
        numericValue: body.numericValue,
        textThreshold: body.textThreshold,
        minimumValue: body.minimumValue,
        maximumValue: body.maximumValue,
        unit: body.unit,
        condition: body.condition,
        inspectionIndicator: body.inspectionIndicator,
        ruleType: body.ruleType,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "EDIT",
        targetType: "RULE",
        targetId: id,
        description: `Edit aturan ${rule.ruleCode}`,
      },
    });

    return NextResponse.json({ rule });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.rule.delete({ where: { id: Number(id) } });

    await prisma.auditLog.create({
      data: {
        action: "DELETE",
        targetType: "RULE",
        targetId: id,
        description: `Hapus aturan`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}