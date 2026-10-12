import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Berkas tidak ditemukan" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Pastikan direktori penyimpanan ada
    const storageDir = path.join(process.cwd(), "public", "storage");
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    // Nama berkas yang aman dengan timestamp
    const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const filePath = path.join(storageDir, safeName);

    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({
      success: true,
      originalName: file.name,
      fileName: safeName,
      filePath: `/storage/${safeName}`,
      size: file.size,
      mimeType: file.type,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan berkas ke server" },
      { status: 500 }
    );
  }
}
