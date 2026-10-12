import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "student-1";

    const schedules = db.prepare("SELECT * FROM schedule WHERE user_id = ? ORDER BY start_hour ASC").all(userId);
    const formatted = schedules.map((s: any) => ({
      id: s.id,
      userId: s.user_id,
      course: s.course,
      code: s.code,
      room: s.room,
      startHour: s.start_hour,
      durationHours: s.duration_hours,
      startTime: s.start_time,
      endTime: s.end_time,
      lecturer: s.lecturer,
      day: s.day,
      status: s.status,
      attendanceStatus: s.attendance_status,
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
      id = `sch-${Date.now()}`,
      userId = "student-1",
      courseId,
      course,
      code = "MK-2026",
      room = "Ruang Kelas",
      startHour = 9,
      durationHours = 2,
      startTime = "09.00",
      endTime = "11.00",
      lecturer = "Dosen Pengampu",
      day = "senin",
      status = "upcoming",
      attendanceStatus = "pending",
      classType = "reguler",
    } = body;

    db.prepare(`
      INSERT OR REPLACE INTO schedule (id, user_id, course_id, course, code, room, start_hour, duration_hours, start_time, end_time, lecturer, day, status, attendance_status, class_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      userId,
      courseId || null,
      course,
      code,
      room,
      startHour,
      durationHours,
      startTime,
      endTime,
      lecturer,
      day.toLowerCase(),
      status,
      attendanceStatus,
      classType
    );

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
