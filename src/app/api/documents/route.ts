import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const docs = db
      .prepare("SELECT * FROM uploaded_documents ORDER BY created_at DESC")
      .all();

    const formatted = docs.map((d: any) => ({
      id: d.id,
      course: d.course_name,
      fileName: d.file_name,
      filePath: d.file_path,
      fileType: d.file_type,
      docType: d.doc_type || "Dokumen Perkuliahan",
      sessionNo: d.session_no ?? undefined,
      topic: d.topic || undefined,
      previewPath: d.preview_path || (d.file_type === "pdf" ? d.file_path : undefined),
      originalPath: d.original_path || d.file_path,
      createdAt: d.created_at,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      id = `doc-${Date.now()}`,
      course = "Umum / Lainnya",
      fileName,
      filePath,
      fileType = "pdf",
      docType = "Dokumen Perkuliahan",
      sessionNo = null,
      topic = "",
      previewPath = null,
      originalPath = null,
    } = body;

    if (!fileName || !filePath) {
      return NextResponse.json(
        { error: "fileName dan filePath wajib diisi" },
        { status: 400 }
      );
    }

    const finalPreviewPath = previewPath || (fileType === "pdf" ? filePath : null);
    const finalOriginalPath = originalPath || filePath;

    db.prepare(`
      INSERT INTO uploaded_documents (
        id, course_name, file_name, file_path, file_type, doc_type, session_no, topic, preview_path, original_path
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, course, fileName, filePath, fileType, docType, sessionNo, topic, finalPreviewPath, finalOriginalPath);

    return NextResponse.json({
      success: true,
      document: {
        id,
        course,
        fileName,
        filePath,
        previewPath: finalPreviewPath,
        originalPath: finalOriginalPath,
        fileType,
        docType,
        sessionNo,
        topic,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id wajib disertakan" }, { status: 400 });
    }

    db.prepare("DELETE FROM uploaded_documents WHERE id = ?").run(id);
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
