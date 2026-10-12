"use client";

import React, { useState } from "react";
import { Clock, MapPin, BookOpen, ChevronDown, User } from "lucide-react";

interface CourseCardProps {
  onOpenRPS: () => void;
}

export default function CourseCard({ onOpenRPS }: CourseCardProps) {
  const [attendance, setAttendance] = useState<"hadir" | "izin" | "sakit" | "alpa">("hadir");

  return (
    <div className="w-full bg-m3-surface-container-low border border-m3-outline-variant rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-xs">
      {/* Top Section: Course Info & Lecturer Profile */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        {/* Left Course Details */}
        <div className="space-y-2">
          <h3 className="text-lg sm:text-xl font-bold text-m3-on-surface">
            Kecerdasan Buatan & Sistem Pakar
          </h3>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-m3-secondary">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-m3-secondary" />
              <span>09.00 - 11.30 WIB</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-m3-secondary" />
              <span>Lab AI - Gedung C 302</span>
            </div>
          </div>
        </div>

        {/* Right Lecturer Profile Picture / Avatar */}
        <div className="flex items-center gap-3 bg-m3-surface-container px-3.5 py-2 rounded-2xl border border-m3-outline-variant self-start">
          <div className="w-10 h-10 rounded-full bg-m3-secondary text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-xs">
            BS
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-m3-on-surface leading-tight">
              Dr. Ir. Budi Santoso, M.Kom.
            </p>
            <p className="text-[11px] text-m3-secondary leading-tight">Dosen Pengampu</p>
          </div>
        </div>
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
