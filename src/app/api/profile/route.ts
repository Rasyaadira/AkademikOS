import { NextResponse } from "next/server";
import db, { DEFAULT_USER_ID } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || DEFAULT_USER_ID;

    let profile: any = db.prepare("SELECT * FROM profile WHERE user_id = ? LIMIT 1").get(userId);
    if (!profile) {
      profile = db.prepare("SELECT * FROM profile LIMIT 1").get();
    }
    if (!profile) {
      return NextResponse.json({
        userId: DEFAULT_USER_ID,
        name: "Mahasiswa",
        nim: "",
        email: "",
        major: "",
        faculty: "",
        university: "",
        semester: 1,
        academicAdvisor: "",
        targetGPA: "",
        maxSKS: 24,
        photoUrl: "",
        noAiMode: false,
        semesterStartDate: "2026-09-07",
        aiTokenUsage: 0,
        darkMode: false,
        openCodeApiKey: "",
        openCodeBaseUrl: "https://api.opencode.ai/v1",
        openCodeModel: "opencode/gpt-4o",
      });
    }

    return NextResponse.json({
      userId: profile.user_id,
      name: profile.name,
      nim: profile.nim === "23/------/TK/00000" ? "" : profile.nim,
      email: profile.email,
      major: profile.major,
      faculty: profile.faculty,
      university: profile.university,
      semester: profile.semester,
      academicAdvisor: profile.academic_advisor,
      targetGPA: profile.target_gpa,
      maxSKS: profile.max_sks,
      photoUrl: profile.photo_url || "",
      noAiMode: !!profile.no_ai_mode,
      semesterStartDate: profile.semester_start_date || "2026-09-07",
      aiTokenUsage: profile.ai_token_usage || 0,
      darkMode: !!profile.dark_mode,
      openCodeApiKey: profile.opencode_api_key || "",
      openCodeBaseUrl: profile.opencode_base_url || "https://api.opencode.ai/v1",
      openCodeModel: profile.opencode_model || "opencode/gpt-4o",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const {
      userId = DEFAULT_USER_ID,
      name = "Mahasiswa",
      nim = "",
      email = "",
      major = "",
      faculty = "",
      university = "",
      semester = 1,
      academicAdvisor = "",
      targetGPA = "",
      maxSKS = 24,
      photoUrl = "",
      noAiMode = false,
      semesterStartDate = "2026-09-07",
      aiTokenUsage = 0,
      darkMode = false,
      openCodeApiKey = "",
      openCodeBaseUrl = "https://api.opencode.ai/v1",
      openCodeModel = "opencode/gpt-4o",
    } = body;

    const cleanNim = nim === "23/------/TK/00000" ? "" : nim;

    db.prepare(`
      INSERT OR REPLACE INTO profile (
        user_id, name, nim, email, major, faculty, university, semester, 
        academic_advisor, target_gpa, max_sks, photo_url, no_ai_mode, 
        semester_start_date, ai_token_usage, dark_mode, opencode_api_key, opencode_base_url, opencode_model
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      name,
      cleanNim,
      email,
      major,
      faculty,
      university,
      semester,
      academicAdvisor,
      targetGPA,
      maxSKS,
      photoUrl,
      noAiMode ? 1 : 0,
      semesterStartDate,
      aiTokenUsage,
      darkMode ? 1 : 0,
      openCodeApiKey,
      openCodeBaseUrl,
      openCodeModel
    );

    // Also update users table name and avatar
    db.prepare(`
      INSERT OR REPLACE INTO users (id, name, nim, email, avatar)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, name, cleanNim, email, photoUrl);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
