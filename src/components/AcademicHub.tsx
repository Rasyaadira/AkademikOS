"use client";

import React, { useState } from "react";
import {
  Clock,
  MapPin,
  User,
  ShieldCheck,
  CheckCircle2,
  CalendarDays,
  ArrowRight,
  ChevronRight,
  BookOpen,
} from "lucide-react";

interface ScheduleItem {
  id: string;
  course: string;
  code: string;
  lecturer: string;
  room: string;
  time: string;
  status: "completed" | "active" | "upcoming";
  attendanceStatus?: "hadir" | "izin" | "sakit" | "pending";
}

const mockSchedules: Record<string, ScheduleItem[]> = {
  kamis: [
    {
      id: "sch-1",
      course: "Sistem Operasi",
      code: "IF-3101",
      lecturer: "Dr. Ahmad Fauzi, M.T.",
      room: "Lab Komputasi Dasar 2",
      time: "07.00 - 08.40 WIB",
      status: "completed",
      attendanceStatus: "hadir",
    },
    {
      id: "sch-2",
      course: "Kecerdasan Buatan & Sistem Pakar",
      code: "IF-3104",
      lecturer: "Dr. Ir. Budi Santoso, M.Kom.",
      room: "Lab AI - Gedung C 302",
      time: "09.00 - 11.30 WIB",
      status: "active",
      attendanceStatus: "hadir",
    },
    {
      id: "sch-3",
      course: "Rekayasa Perangkat Lunak",
      code: "IF-3108",
      lecturer: "Siti Rahmawati, S.Kom., M.Cs.",
      room: "Ruang Teori 401",
      time: "13.00 - 15.30 WIB",
      status: "upcoming",
      attendanceStatus: "pending",
    },
  ],
  senin: [
    {
      id: "sch-4",
      course: "Basis Data Lanjut",
      code: "IF-3102",
      lecturer: "Prof. Hendra Kusuma",
      room: "Lab Basis Data 1",
      time: "08.00 - 10.30 WIB",
      status: "upcoming",
      attendanceStatus: "pending",
    },
  ],
  selasa: [
    {
      id: "sch-5",
      course: "Jaringan Komputer",
      code: "IF-3103",
      lecturer: "Ir. Dian Pratama, M.Eng.",
      room: "Lab Jaringan Gd. D",
      time: "10.00 - 12.30 WIB",
      status: "upcoming",
      attendanceStatus: "pending",
    },
  ],
  rabu: [
    {
      id: "sch-6",
      course: "Pemrograman Berorientasi Objek",
      code: "IF-3105",
      lecturer: "Eko Prasetyo, M.Kom.",
      room: "Lab Software 3",
      time: "13.00 - 15.30 WIB",
      status: "upcoming",
      attendanceStatus: "pending",
    },
  ],
  jumat: [
    {
      id: "sch-7",
      course: "Etika Profesi & Komunikasi",
      code: "KU-3101",
      lecturer: "Dra. Ratna Dewi, M.Si.",
      room: "Auditorium Lantai 2",
      time: "08.00 - 09.40 WIB",
      status: "upcoming",
      attendanceStatus: "pending",
    },
  ],
};

const days = [
  { key: "senin", label: "Senin" },
  { key: "selasa", label: "Selasa" },
  { key: "rabu", label: "Rabu" },
  { key: "kamis", label: "Kamis" },
  { key: "jumat", label: "Jumat" },
];

export default function AcademicHub() {
  const [selectedDay, setSelectedDay] = useState("kamis");
  const [activeCourseStatus, setActiveCourseStatus] = useState<"hadir" | "izin" | "sakit">("hadir");

  const todayClasses = mockSchedules[selectedDay] || [];

  return (
    <section className="flex-1 space-y-6">
      {/* Header Hub */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-0.5 rounded-full text-xs font-medium bg-m3-secondary-container text-m3-on-secondary-container">
              Minggu ke-4 Semester Ganjil
            </span>
            <span className="text-xs text-m3-secondary">•</span>
            <span className="text-xs text-m3-secondary font-medium">Semester 5</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-m3-on-surface">
            Halo, Faras
          </h2>
          <p className="text-sm text-m3-secondary">
            Hari ini kamu memiliki 3 sesi perkuliahan. Sesi aktif saat ini di Gedung C 302.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-m3-surface-container-low border border-m3-outline-variant px-3 py-1.5 rounded-full self-start md:self-auto">
          <CalendarDays className="w-3.5 h-3.5 text-m3-secondary" />
          <span className="text-m3-on-surface font-medium">1 Oktober 2026</span>
        </div>
      </div>

      {/* Active Course Card (Sesuai Sketsa: Nama matkul, Ruangan, Jam, Dosen, Avatar, Presensi Pasif) */}
      <div className="bg-m3-surface-container-low border border-m3-outline-variant rounded-3xl p-6 relative overflow-hidden transition-all">
        {/* Top Active Badge & Topic */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-m3-secondary">
              Sedang Berlangsung (Sisa 35 Menit)
            </span>
          </div>

          {/* Passive Attendance Pill (M3 Tertiary Safe Zone) */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-m3-tertiary text-m3-on-tertiary text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Presensi Pasif: 11/14 Sesi (Kuota Aman)</span>
          </div>
        </div>

        {/* Main Course Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-8 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-m3-surface-container text-m3-secondary">
                IF-3104 • 3 SKS
              </span>
            </div>

            <h3 className="text-xl font-bold text-m3-on-surface">
              Kecerdasan Buatan & Sistem Pakar
            </h3>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-m3-secondary">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-m3-secondary" />
                <span>09.00 - 11.30 WIB</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-m3-secondary" />
                <span>Lab AI - Gedung C 302</span>
              </div>
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-m3-secondary" />
                <span>Dr. Ir. Budi Santoso, M.Kom.</span>
              </div>
            </div>
          </div>

          {/* Quick Attendance Selector (Split state) */}
          <div className="md:col-span-4 bg-m3-surface-container rounded-2xl p-4 border border-m3-outline-variant space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-m3-secondary font-medium">Status Kehadiran</span>
              <span className="font-semibold text-m3-on-surface capitalize">
                {activeCourseStatus}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {(["hadir", "izin", "sakit"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setActiveCourseStatus(mode)}
                  className={`py-1.5 rounded-full text-xs font-medium capitalize transition-colors text-center ${
                    activeCourseStatus === mode
                      ? "bg-m3-primary text-m3-on-primary font-semibold"
                      : "bg-m3-surface-container-low text-m3-secondary hover:bg-m3-surface-container-high"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <p className="text-[11px] text-m3-secondary leading-tight">
              Tercatat otomatis saat jam perkuliahan dimulai. Ubah status jika berhalangan.
            </p>
          </div>
        </div>

        {/* Course RPS Topic Footer */}
        <div className="mt-5 pt-4 border-t border-m3-outline-variant flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-m3-secondary">
            <BookOpen className="w-4 h-4 text-m3-secondary" />
            <span>Materi Pertemuan 4: Algoritma Pencarian Heuristik & A* Search</span>
          </div>

          <button className="flex items-center gap-1 text-xs font-medium text-m3-on-surface hover:text-m3-secondary transition-colors">
            <span>Buka Ringkasan RPS</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Dynamic Schedule Deck (Timeline Jadwal Sesuai Sketsa) */}
      <div className="bg-m3-surface-container-low border border-m3-outline-variant rounded-3xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-m3-on-surface">Jadwal Perkuliahan</h3>
            <p className="text-xs text-m3-secondary">Alur sesi perkuliahan mingguan dan waktu jeda antar kelas</p>
          </div>

          {/* Day Selector Pills */}
          <div className="flex items-center gap-1 bg-m3-surface-container p-1 rounded-full overflow-x-auto">
            {days.map((d) => (
              <button
                key={d.key}
                onClick={() => setSelectedDay(d.key)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedDay === d.key
                    ? "bg-m3-primary text-m3-on-primary font-semibold"
                    : "text-m3-secondary hover:text-m3-on-surface"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Schedule Timeline List */}
        <div className="space-y-3">
          {todayClasses.length === 0 ? (
            <div className="py-8 text-center text-sm text-m3-secondary">
              Tidak ada agenda perkuliahan untuk hari ini.
            </div>
          ) : (
            todayClasses.map((item, index) => {
              const isFirst = index === 0;
              const hasGapAfter = selectedDay === "kamis" && index === 0;
              const hasRestGapAfter = selectedDay === "kamis" && index === 1;

              return (
                <React.Fragment key={item.id}>
                  <div
                    className={`p-4 rounded-2xl border transition-all ${
                      item.status === "active"
                        ? "bg-m3-primary-container border-m3-primary"
                        : "bg-m3-surface-container border-m3-outline-variant"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-m3-surface-container-low text-m3-secondary">
                            {item.code}
                          </span>
                          <span className="text-xs text-m3-secondary">•</span>
                          <span className="text-xs font-medium text-m3-secondary">
                            {item.time}
                          </span>
                          {item.status === "active" && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-m3-primary text-m3-on-primary">
                              Berlangsung
                            </span>
                          )}
                          {item.status === "completed" && (
                            <span className="text-xs font-medium text-emerald-700 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Hadir
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-bold text-m3-on-surface">
                          {item.course}
                        </h4>

                        <div className="flex flex-wrap items-center gap-x-4 text-xs text-m3-secondary">
                          <span>{item.room}</span>
                          <span>•</span>
                          <span>{item.lecturer}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center">
                        <button className="text-xs text-m3-secondary hover:text-m3-on-surface flex items-center gap-1">
                          <span>Detail</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Inter-class Gap Helper (Pilar Ritme Akademik) */}
                  {hasGapAfter && (
                    <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-m3-surface-container-low border border-dashed border-m3-outline text-xs text-m3-secondary">
                      <Clock className="w-3.5 h-3.5 text-m3-secondary" />
                      <span>Jeda 20 menit — Waktu transisi menuju Gedung C 302</span>
                    </div>
                  )}

                  {hasRestGapAfter && (
                    <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-m3-surface-container-low border border-dashed border-m3-outline text-xs text-m3-secondary">
                      <Clock className="w-3.5 h-3.5 text-m3-secondary" />
                      <span>Jeda 1 jam 30 menit — Istirahat siang & Ishoma</span>
                    </div>
                  )}
                </React.Fragment>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
