import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const norm = await prisma.norm.findUnique({
      where: { id: Number(id) },
      include: {
        rules: true,
        regulation: { include: { division: true, documents: true } },
      },
    });
    if (!norm) {
      return NextResponse.json(
        { error: "Norma tidak ditemukan" },
        { status: 404 }
      );
    }
    return NextResponse.json({ norm });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const norm = await prisma.norm.update({
      where: { id: Number(id) },
      data: {
        criteria: body.criteria,
        article: body.article,
        paragraph: body.paragraph,
        originalText: body.originalText,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "EDIT",
        targetType: "NORM",
        targetId: id,
        description: `Edit norma ${norm.normCode}`,
      },
    });

    return NextResponse.json({ norm });
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
    await prisma.norm.delete({ where: { id: Number(id) } });

    await prisma.auditLog.create({
      data: {
        action: "DELETE",
        targetType: "NORM",
        targetId: id,
        description: `Hapus norma`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}