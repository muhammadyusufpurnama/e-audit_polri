// app/api/extract-text/route.ts
import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse-new";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "File tidak ditemukan" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let text = "";
    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      const pdfData = await pdfParse(buffer);
      text = pdfData.text;
    } else {
      text = buffer.toString("utf-8");
    }

    return NextResponse.json({ text });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg, text: "" }, { status: 500 });
  }
}