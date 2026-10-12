import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "student-1";

    let profile: any = db.prepare("SELECT * FROM profile WHERE user_id = ? LIMIT 1").get(userId);
    if (!profile) {
      // Fallback to first profile
      profile = db.prepare("SELECT * FROM profile LIMIT 1").get();
    }
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    return NextResponse.json({
      userId: profile.user_id,
      name: profile.name,
      nim: profile.nim,
      email: profile.email,
      major: profile.major,
      faculty: profile.faculty,
      university: profile.university,
      semester: profile.semester,
      academicAdvisor: profile.academic_advisor,
      targetGPA: profile.target_gpa,
      maxSKS: profile.max_sks,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const {
      userId = "student-1",
      name,
      nim,
      email,
      major,
      faculty,
      university,
      semester,
      academicAdvisor,
      targetGPA,
      maxSKS,
    } = body;

    db.prepare(`
      INSERT OR REPLACE INTO profile (user_id, name, nim, email, major, faculty, university, semester, academic_advisor, target_gpa, max_sks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      name,
      nim,
      email,
      major,
      faculty,
      university,
      semester,
      academicAdvisor,
      targetGPA,
      maxSKS
    );

    // Also update users table name
    db.prepare("UPDATE users SET name = ?, nim = ?, email = ? WHERE id = ?").run(name, nim, email, userId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
