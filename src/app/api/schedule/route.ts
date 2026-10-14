import { NextResponse } from "next/server";
import db, { DEFAULT_USER_ID } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || DEFAULT_USER_ID;

    // Return schedules for active personal user
    const schedules = db.prepare("SELECT * FROM schedule WHERE user_id = ? OR user_id = 'user-me' ORDER BY start_hour ASC").all(userId);
    const formatted = schedules.map((s: any) => {
      let parsedExcluded: string[] = [];
      try {
        if (s.excluded_dates) parsedExcluded = JSON.parse(s.excluded_dates);
      } catch {}

      return {
        id: s.id,
        userId: s.user_id,
        course: s.course,
        code: s.code || "",
        room: s.room || "",
        startHour: s.start_hour,
        durationHours: s.duration_hours,
        startTime: s.start_time,
        endTime: s.end_time,
        lecturer: s.lecturer || "",
        day: s.day,
        status: s.status || "upcoming",
        attendanceStatus: s.attendance_status || "pending",
        classType: s.class_type || "reguler",
        specificDate: s.specific_date || undefined,
        excludedDates: parsedExcluded,
      };
    });
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
      userId = DEFAULT_USER_ID,
      courseId,
      course,
      code = "",
      room = "",
      startHour = 9,
      durationHours = 2,
      startTime = "09.00",
      endTime = "11.00",
      lecturer = "",
      day = "senin",
      status = "upcoming",
      attendanceStatus = "pending",
      classType = "reguler",
      specificDate = null,
      excludedDates = [],
    } = body;

    // Auto-upsert into courses table so it synchronizes with course listings
    const courseSlug = course.toLowerCase().replace(/[^a-z0-9]/g, "-") || `c-${Date.now()}`;
    const existingCourse = db.prepare("SELECT id FROM courses WHERE name = ?").get(course);
    if (!existingCourse) {
      db.prepare(`
        INSERT OR IGNORE INTO courses (id, code, name, sks, primary_lecturer_id, room_default)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(courseSlug, code, course, 3, null, room);
    }

    const excludedJson = Array.isArray(excludedDates) ? JSON.stringify(excludedDates) : "[]";

    db.prepare(`
      INSERT OR REPLACE INTO schedule (id, user_id, course_id, course, code, room, start_hour, duration_hours, start_time, end_time, lecturer, day, status, attendance_status, class_type, specific_date, excluded_dates)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      userId,
      courseId || courseSlug,
      course,
      code,
      room,
      startHour,
      durationHours,
      startTime,
      endTime,
      lecturer,
      day,
      status,
      attendanceStatus,
      classType,
      specificDate,
      excludedJson
    );

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
