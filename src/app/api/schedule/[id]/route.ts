import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      course,
      room,
      lecturer,
      startHour,
      durationHours,
      startTime,
      endTime,
      day,
      attendanceStatus,
    } = body;

    const current = db.prepare("SELECT * FROM schedule WHERE id = ?").get(id) as any;
    if (!current) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    const nextCourse = course !== undefined ? course : current.course;
    const nextRoom = room !== undefined ? room : current.room;
    const nextLecturer = lecturer !== undefined ? lecturer : current.lecturer;
    const nextStartHour = startHour !== undefined ? startHour : current.start_hour;
    const nextDuration = durationHours !== undefined ? durationHours : current.duration_hours;
    const nextStartTime = startTime !== undefined ? startTime : current.start_time;
    const nextEndTime = endTime !== undefined ? endTime : current.end_time;
    const nextDay = day !== undefined ? day : current.day;
    const nextAttendance = attendanceStatus !== undefined ? attendanceStatus : current.attendance_status;

    db.prepare(`
      UPDATE schedule
      SET course = ?, room = ?, lecturer = ?, start_hour = ?, duration_hours = ?, start_time = ?, end_time = ?, day = ?, attendance_status = ?
      WHERE id = ?
    `).run(
      nextCourse,
      nextRoom,
      nextLecturer,
      nextStartHour,
      nextDuration,
      nextStartTime,
      nextEndTime,
      nextDay,
      nextAttendance,
      id
    );

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    db.prepare("DELETE FROM schedule WHERE id = ?").run(id);
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
