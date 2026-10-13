"use client";

import React, { useState } from "react";
import { Clock, MapPin, BookOpen, ChevronDown, User, Calendar } from "lucide-react";
import { ScheduleItem } from "./ScheduleCalendar";

interface CourseCardProps {
  onOpenRPS: () => void;
  schedules?: ScheduleItem[];
  onOpenCalendar?: () => void;
}

export default function CourseCard({ onOpenRPS, schedules = [], onOpenCalendar }: CourseCardProps) {
  const [attendance, setAttendance] = useState<"hadir" | "izin" | "sakit" | "alpa">("hadir");

  // Determine today's day name in Indonesian
  const dayNames = ["minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"];
  const todayName = dayNames[new Date().getDay()];

  // Find active course for today or fallback to first available schedule
  const todaySchedules = schedules.filter((s) => s.day.toLowerCase() === todayName);
  const activeCourse = todaySchedules[0] || schedules[0] || null;

  if (!activeCourse) {
    return (
      <div className="w-full bg-m3-surface-container-low border border-m3-outline-variant rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-m3-secondary" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-m3-secondary">
                Perkuliahan Hari Ini
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-m3-on-surface">
              Tidak Ada Kuliah Aktif Saat Ini
            </h3>
            <p className="text-xs text-m3-secondary">
              Belum ada jadwal kuliah yang terdaftar. Tambahkan mata kuliah baru untuk memulai.
            </p>
          </div>
          {onOpenCalendar && (
            <button
              type="button"
              onClick={onOpenCalendar}
              className="px-4 py-2 rounded-full bg-m3-primary text-m3-on-primary text-xs font-bold shadow-xs hover:brightness-95 transition-all self-start sm:self-auto flex items-center gap-1.5"
            >
              <span>Buka Kalender</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const lecturerInitials = (activeCourse.lecturer && activeCourse.lecturer !== "-")
    ? activeCourse.lecturer
        .split(" ")
        .filter((w) => !w.includes(".") && w.length > 1)
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "DS"
    : "DS";

  return (
    <div className="w-full bg-m3-surface-container-low border border-m3-outline-variant rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-xs">
      {/* Top Section: Course Info & Lecturer Profile */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        {/* Left Course Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-m3-primary/10 text-m3-primary">
              {activeCourse.day ? activeCourse.day.charAt(0).toUpperCase() + activeCourse.day.slice(1) : "Hari Ini"}
            </span>
            {activeCourse.code && (
              <span className="text-[10px] font-mono text-m3-secondary">
                {activeCourse.code}
              </span>
            )}
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-m3-on-surface">
            {activeCourse.course}
          </h3>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-m3-secondary">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-m3-secondary" />
              <span>{activeCourse.startTime} - {activeCourse.endTime} WIB</span>
            </div>
            {activeCourse.room && activeCourse.room !== "-" && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-m3-secondary" />
                <span>{activeCourse.room}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Lecturer Profile Picture / Avatar */}
        {activeCourse.lecturer && activeCourse.lecturer !== "-" && (
          <div className="flex items-center gap-3 bg-m3-surface-container px-3.5 py-2 rounded-2xl border border-m3-outline-variant self-start">
            <div className="w-10 h-10 rounded-full bg-m3-secondary text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-xs">
              {lecturerInitials}
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-m3-on-surface leading-tight">
                {activeCourse.lecturer}
              </p>
              <p className="text-[11px] text-m3-secondary leading-tight">Dosen Pengampu</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section: RPS Pill Button & Attendance Dropdown */}
      <div className="mt-5 pt-4 border-t border-m3-outline-variant flex flex-wrap items-center justify-between gap-3">
        {/* Pill Button to RPS */}
        <button
          onClick={onOpenRPS}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-m3-surface-container hover:bg-m3-surface-container-high text-m3-on-surface text-xs font-semibold border border-m3-outline-variant transition-all hover:scale-[1.02]"
        >
          <BookOpen className="w-3.5 h-3.5 text-m3-secondary" />
          <span>Lihat Silabus & RPS</span>
        </button>

        {/* Attendance Dropdown (Hadir, Izin, Sakit, Alpa) */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-m3-secondary font-medium">Presensi:</span>
          <div className="relative">
            <select
              value={attendance}
              onChange={(e) => setAttendance(e.target.value as any)}
              className={`appearance-none pl-3.5 pr-8 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer focus:outline-none ${
                attendance === "hadir"
                  ? "bg-m3-tertiary text-m3-on-tertiary border-emerald-300"
                  : attendance === "izin"
                  ? "bg-m3-primary-container text-m3-on-primary-container border-indigo-200"
                  : attendance === "sakit"
                  ? "bg-amber-100 text-amber-900 border-amber-300"
                  : "bg-m3-error-container text-m3-error border-red-200"
              }`}
            >
              <option value="hadir">Hadir (Default)</option>
              <option value="izin">Izin</option>
              <option value="sakit">Sakit</option>
              <option value="alpa">Alpa</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-current opacity-70" />
          </div>
        </div>
      </div>
    </div>
  );
}
