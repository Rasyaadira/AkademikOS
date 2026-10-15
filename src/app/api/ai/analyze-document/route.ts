import { NextResponse } from "next/server";
import { analyzeDocumentWithAI } from "@/lib/deepseek";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      fileName,
      fileType = "application/pdf",
      snippetText = "",
      availableCourses = [],
      currentWeek = 1,
    } = body;

    if (!fileName) {
      return NextResponse.json(
        { error: "Nama berkas (fileName) wajib diberikan." },
        { status: 400 }
      );
    }

    const result = await analyzeDocumentWithAI({
      fileName,
      fileType,
      snippetText,
      availableCourses,
      currentWeek,
    });

    return NextResponse.json({
      success: true,
      analysis: result,
    });
  } catch (error: any) {
    console.error("Error in /api/ai/analyze-document:", error);
    return NextResponse.json(
      { error: error.message || "Gagal menganalisis dokumen dengan AI." },
      { status: 500 }
    );
  }
}
