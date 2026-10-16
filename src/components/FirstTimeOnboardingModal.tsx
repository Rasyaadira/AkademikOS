"use client";

import React, { useState } from "react";
import { X, ArrowRight } from "lucide-react";
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

  React.useEffect(() => {
    if (isOpen) {
      setName(currentProfile?.name && currentProfile.name !== "Mahasiswa" ? currentProfile.name : "");
      setSemester(currentProfile?.semester || 1);
      setMajor(currentProfile?.major || "");
      setUniversity(currentProfile?.university || "");
      setNim(currentProfile?.nim || "");
      setIsCurrentWeekWeekOne(true);
      setCustomStartDate(currentProfile?.semesterStartDate || getMondayCurrentWeek());
    }
  }, [isOpen, currentProfile]);

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
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-m3-surface-container-low border border-m3-outline-variant rounded-3xl w-full max-w-lg p-6 sm:p-7 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header Bersih Tanpa Slop */}
        <div className="flex items-center justify-between border-b border-m3-outline-variant/60 pb-3">
          <h2 className="text-base font-bold text-m3-on-surface">
            Selamat Datang di AkademikOS
          </h2>
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
            <label className="text-xs font-semibold text-m3-on-surface">
              Nama Mahasiswa *
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
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-m3-on-surface">
              Semester *
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

          {/* Opsi Jadikan Hari Ini Minggu Pertama */}
          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isCurrentWeekWeekOne}
                onChange={(e) => setIsCurrentWeekWeekOne(e.target.checked)}
                className="accent-m3-primary w-4 h-4 rounded cursor-pointer"
              />
              <span className="text-xs font-semibold text-m3-on-surface">
                Jadikan hari ini minggu pertama
              </span>
            </label>

            {!isCurrentWeekWeekOne && (
              <div className="space-y-1 pl-6 pt-1 animate-in fade-in duration-150">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-m3-surface-container border border-m3-outline text-xs text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary"
                />
              </div>
            )}
          </div>

          {/* Detail Opsional: Kampus & Jurusan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-m3-outline-variant/40">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-m3-secondary">
                Program Studi (Opsional)
              </label>
              <input
                type="text"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                placeholder="Contoh: Teknik Informatika"
                className="w-full px-3 py-2 rounded-xl bg-m3-surface-container border border-m3-outline text-xs text-m3-on-surface placeholder:text-m3-secondary focus:outline-none focus:ring-2 focus:ring-m3-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-m3-secondary">
                Perguruan Tinggi (Opsional)
              </label>
              <input
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="Contoh: Universitas Gadjah Mada"
                className="w-full px-3 py-2 rounded-xl bg-m3-surface-container border border-m3-outline text-xs text-m3-on-surface placeholder:text-m3-secondary focus:outline-none focus:ring-2 focus:ring-m3-primary"
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
