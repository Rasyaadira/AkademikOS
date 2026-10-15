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

    const ext = path.extname(file.name).toLowerCase();
    let previewPath = `/api/storage/${safeName}`;
    let convertedToPdf = false;

    // Otomatis convert Office documents (PPTX, PPT, DOCX, XLSX) ke PDF via LibreOffice headless
    if ([".pptx", ".ppt", ".docx", ".doc", ".xlsx", ".xls"].includes(ext)) {
      try {
        const baseNameWithoutExt = path.basename(safeName, ext);
        const expectedPdfName = `${baseNameWithoutExt}.pdf`;
        const expectedPdfPath = path.join(storageDir, expectedPdfName);

        const { spawnSync } = await import("child_process");
        spawnSync("soffice", [
          "--headless",
          "--convert-to",
          "pdf",
          filePath,
          "--outdir",
          storageDir,
        ], { timeout: 30000 });

        if (fs.existsSync(expectedPdfPath)) {
          previewPath = `/api/storage/${expectedPdfName}`;
          convertedToPdf = true;
        }
      } catch (convErr) {
        console.warn("Auto-convert to PDF gagal:", convErr);
      }
    }

    return NextResponse.json({
      success: true,
      originalName: file.name,
      filePath: `/api/storage/${safeName}`,
      previewPath: previewPath,
      originalPath: `/api/storage/${safeName}`,
      url: previewPath,
      size: file.size,
      mimeType: file.type,
      convertedToPdf,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan berkas ke server" },
      { status: 500 }
    );
  }
}
