"use client";

import React, { useState } from "react";
import {
  Sparkles,
  User,
  GraduationCap,
  Calendar,
  Building,
  CheckCircle2,
  X,
  ArrowRight,
} from "lucide-react";
import { StudentProfile } from "./OtherViews";

interface FirstTimeOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: Partial<StudentProfile>) => void;
  currentProfile?: StudentProfile;
}

export default function FirstTimeOnboardingModal({
  isOpen,
  onClose,
  onComplete,
  currentProfile,
}: FirstTimeOnboardingModalProps) {
  // Hitung tanggal hari Senin di pekan berjalan saat ini
  const getMondayCurrentWeek = () => {
    const now = new Date();
    const day = now.getDay(); // 0: Minggu, 1: Senin, ...
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    const yyyy = monday.getFullYear();
    const mm = String(monday.getMonth() + 1).padStart(2, "0");
    const dd = String(monday.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const [name, setName] = useState(
    currentProfile?.name && currentProfile.name !== "Mahasiswa"
      ? currentProfile.name
      : ""
  );
  const [semester, setSemester] = useState<number>(currentProfile?.semester || 1);
  const [isCurrentWeekWeekOne, setIsCurrentWeekWeekOne] = useState(true);
  const [customStartDate, setCustomStartDate] = useState(
    currentProfile?.semesterStartDate || getMondayCurrentWeek()
  );
  const [major, setMajor] = useState(currentProfile?.major || "");
  const [university, setUniversity] = useState(currentProfile?.university || "");
  const [nim, setNim] = useState(currentProfile?.nim || "");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalStartDate = isCurrentWeekWeekOne
      ? getMondayCurrentWeek()
      : customStartDate || getMondayCurrentWeek();

    onComplete({
      name: name.trim(),
      semester: Number(semester) || 1,
      semesterStartDate: finalStartDate,
      major: major.trim() || "Teknik Informatika",
      university: university.trim() || "Perguruan Tinggi",
      nim: nim.trim(),
    });

    try {
      localStorage.setItem("akademikos_onboarding_completed", "true");
    } catch (err) {
      console.warn("Storage not available:", err);
    }

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-m3-surface-container-low border border-m3-outline-variant rounded-3xl w-full max-w-lg p-6 sm:p-7 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-m3-outline-variant/60 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-m3-primary/10 text-m3-primary text-[11px] font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Inisialisasi Pertama Kali</span>
            </div>
            <h2 className="text-lg font-bold text-m3-on-surface">
              Selamat Datang di AkademikOS
            </h2>
            <p className="text-xs text-m3-secondary leading-relaxed">
              Konfigurasikan profil awal Anda untuk menyelaraskan jadwal, kalender akademik, dan pemantauan tugas perkuliahan.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-m3-secondary hover:bg-m3-surface-container transition-colors cursor-pointer flex-shrink-0"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nama Mahasiswa */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-m3-on-surface flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-m3-primary" />
              <span>Nama Lengkap / Panggilan Mahasiswa *</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Rasyaadira"
              className="w-full px-4 py-2.5 rounded-2xl bg-m3-surface-container border border-m3-outline text-sm text-m3-on-surface placeholder:text-m3-secondary focus:outline-none focus:ring-2 focus:ring-m3-primary"
            />
          </div>

          {/* Semester Saat Ini */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-m3-on-surface flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-m3-primary" />
              <span>Semester Saat Ini *</span>
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSemester(s)}
                  className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    semester === s
                      ? "bg-m3-primary text-m3-on-primary border-m3-primary shadow-xs ring-2 ring-m3-primary/30"
                      : "bg-m3-surface-container border-m3-outline-variant text-m3-secondary hover:bg-m3-surface-container-high"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Pengaturan Kalender Semester (Anggap Pekan Ini Minggu Ke-1) */}
          <div className="p-3.5 rounded-2xl bg-m3-surface-container/60 border border-m3-outline-variant space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-m3-on-surface flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-m3-primary" />
                <span>Sinkronisasi Minggu Perkuliahan</span>
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800">
                Otomatis
              </span>
            </div>

            <label className="flex items-start gap-2.5 p-2 rounded-xl bg-white dark:bg-m3-surface-container border border-m3-outline-variant/60 cursor-pointer">
              <input
                type="checkbox"
                checked={isCurrentWeekWeekOne}
                onChange={(e) => setIsCurrentWeekWeekOne(e.target.checked)}
                className="mt-0.5 accent-m3-primary w-4 h-4 cursor-pointer"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-m3-on-surface block">
                  Jadikan pekan ini sebagai Minggu Ke-1 (Pertemuan 1)
                </span>
                <p className="text-[11px] text-m3-on-surface-variant leading-snug">
                  Sistem akan menyelaraskan tanggal mulai semester ke awal pekan ini ({getMondayCurrentWeek()}), sehingga kalender perkuliahan dan RPS dimulai tepat di Pertemuan 1.
                </p>
              </div>
            </label>

            {!isCurrentWeekWeekOne && (
              <div className="space-y-1 pt-1">
                <label className="text-[11px] font-semibold text-m3-secondary">
                  Pilih Tanggal Mulai Semester Secara Manual:
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-m3-surface-container border border-m3-outline text-xs text-m3-on-surface"
                />
              </div>
            )}
          </div>

          {/* Detail Opsional: Kampus & Jurusan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-m3-secondary flex items-center gap-1">
                <Building className="w-3 h-3 text-m3-secondary" />
                <span>Program Studi (Opsional)</span>
              </label>
              <input
                type="text"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                placeholder="Contoh: Teknik Informatika"
                className="w-full px-3 py-2 rounded-xl bg-m3-surface-container border border-m3-outline text-xs text-m3-on-surface placeholder:text-m3-secondary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-m3-secondary flex items-center gap-1">
                <Building className="w-3 h-3 text-m3-secondary" />
                <span>Perguruan Tinggi (Opsional)</span>
              </label>
              <input
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="Contoh: Universitas Gadjah Mada"
                className="w-full px-3 py-2 rounded-xl bg-m3-surface-container border border-m3-outline text-xs text-m3-on-surface placeholder:text-m3-secondary"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-3 border-t border-m3-outline-variant/60 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-m3-secondary hover:text-m3-on-surface transition-colors cursor-pointer"
            >
              Lewati untuk Sekarang
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-6 py-2.5 rounded-full bg-m3-primary text-m3-on-primary text-xs font-bold hover:brightness-95 transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <span>Mulai Gunakan AkademikOS</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
