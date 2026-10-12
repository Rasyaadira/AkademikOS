import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "student-1";

    const tasks = db.prepare("SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC").all(userId);
    const formatted = tasks.map((t: any) => ({
      id: t.id,
      userId: t.user_id,
      title: t.title,
      course: t.course,
      difficulty: t.difficulty || "sedang",
      taskType: t.task_type || "tugas",
      deadlineLabel: t.deadline_label,
      deadlineDate: t.deadline_date,
      weight: t.weight,
      completed: Boolean(t.completed),
      priority: t.priority,
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
      id,
      userId = "student-1",
      title,
      course,
      difficulty = "sedang",
      taskType = "tugas",
      deadlineLabel,
      deadlineDate,
      weight,
      priority,
    } = body;
    
    db.prepare(`
      INSERT INTO tasks (id, user_id, title, course, difficulty, task_type, deadline_label, deadline_date, weight, completed, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `).run(
      id || `task-${Date.now()}`,
      userId,
      title,
      course,
      difficulty,
      taskType,
      deadlineLabel || "H-1",
      deadlineDate || "Besok",
      weight || "Tugas Mandiri (10%)",
      priority || "medium"
    );

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
