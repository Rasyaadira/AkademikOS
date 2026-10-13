"use client";

import React, { useState } from "react";
import {
  X,
  UploadCloud,
  Sparkles,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  User,
  Calendar,
  Layers,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { ScheduleItem } from "./ScheduleCalendar";

interface ImportScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScheduleImported: (schedules: ScheduleItem[]) => void;
}

export default function ImportScheduleModal({
  isOpen,
  onClose,
  onScheduleImported,
}: ImportScheduleModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [step, setStep] = useState<"upload" | "filter" | "review">("upload");

  // Step 2: Filter Questions
  const [detectedClasses, setDetectedClasses] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [customClass, setCustomClass] = useState<string>("");
  const [semesterYear, setSemesterYear] = useState<string>("Semester Ganjil 2026/2027");

  // Step 3: Extracted Courses & Review
  const [extractedCourses, setExtractedCourses] = useState<any[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  // Loading & status
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setErrorMsg(null);
    setIsLoading(true);
    setStatusMessage("Mengunggah dan menginspeksi struktur berkas...");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("detectClassesOnly", "true");

      const res = await fetch("/api/ai/parse-schedule", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menginspeksi berkas");

      const classes = data.detectedClasses || [];
      setDetectedClasses(classes);
      if (classes.length > 0) {
        setSelectedClass(classes[0]);
      }
      if (data.detectedSemester) {
        setSemesterYear(data.detectedSemester);
      }
      setStep("filter");
    } catch (err: any) {
      console.error("Inspect error:", err);
      setErrorMsg(err.message || "Gagal memproses berkas jadwal");
    } finally {
      setIsLoading(false);
      setStatusMessage("");
    }
  };

  const handleExtractWithAi = async () => {
    if (!file) return;

    const finalClass = customClass.trim() || selectedClass || "Kelas Utama";

    setIsLoading(true);
    setErrorMsg(null);
    setStatusMessage(`Gemini AI sedang membaca dan mengekstrak jadwal kelas ${finalClass}...`);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("className", finalClass);
      formData.append("semesterYear", semesterYear);
      formData.append("autoSave", "false");

      const res = await fetch("/api/ai/parse-schedule", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengekstrak jadwal via AI");

      const courses = data.courses || [];
      if (courses.length === 0) {
        throw new Error(`Tidak ditemukan mata kuliah untuk kelas "${finalClass}". Coba pilih nama kelas lain.`);
      }

      setExtractedCourses(courses);
      setSelectedIndices(courses.map((_: any, i: number) => i));
      setStep("review");
    } catch (err: any) {
      console.error("Extract error:", err);
      setErrorMsg(err.message || "Gagal mengekstrak jadwal");
    } finally {
      setIsLoading(false);
      setStatusMessage("");
    }
  };

  const handleToggleCourse = (index: number) => {
    setSelectedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleSaveToCalendar = async () => {
    setIsLoading(true);
    setStatusMessage("Menyimpan jadwal ke basis data...");

    const chosenCourses = extractedCourses.filter((_, i) => selectedIndices.includes(i));
    const savedItems: ScheduleItem[] = [];

    try {
      for (const item of chosenCourses) {
        const startHour = parseInt(item.startTime?.split(".")[0] || "8", 10);
        const endHour = parseInt(item.endTime?.split(".")[0] || "10", 10);
        const duration = Math.max(1, endHour - startHour);

        const newSched: ScheduleItem = {
          id: `sch-ai-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          userId: "user-me",
          course: item.course,
          day: item.day,
          startTime: item.startTime,
          endTime: item.endTime,
          startHour,
          durationHours: duration,
          room: item.room || "Ruang Kuliah",
          lecturer: item.lecturer || "Dosen Pengampu",
          status: "upcoming",
          attendanceStatus: "pending",
        };

        // Persist to API
        await fetch("/api/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newSched),
        });

        savedItems.push(newSched);
      }

      onScheduleImported(savedItems);
      handleClose();
    } catch (err: any) {
      console.error("Save error:", err);
      setErrorMsg("Gagal menyimpan beberapa jadwal ke database.");
    } finally {
      setIsLoading(false);
      setStatusMessage("");
    }
  };

  const handleClose = () => {
    setFile(null);
    setFilePath(null);
    setStep("upload");
    setExtractedCourses([]);
    setSelectedIndices([]);
    setErrorMsg(null);
    setIsLoading(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white border border-m3-outline-variant rounded-3xl w-full max-w-2xl p-6 sm:p-7 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-m3-primary-container text-m3-on-primary-container flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-m3-primary" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-m3-on-surface">
                Impor Jadwal Kuliah Otomatis (Gemini AI)
              </h3>
              <p className="text-xs text-m3-secondary">
                {step === "upload"
                  ? "Unggah berkas PDF atau foto jadwal kuliah Anda"
                  : step === "filter"
                  ? "Tentukan kelas dan tahun akademik yang ingin diimpor"
                  : "Periksa hasil ekstraksi mata kuliah sebelum diterapkan"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-m3-secondary hover:bg-m3-surface-container transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: UPLOAD FILE */}
        {step === "upload" && (
          <div className="space-y-4">
            <label className="border-2 border-dashed border-m3-outline rounded-3xl p-8 sm:p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:border-m3-primary transition-colors bg-m3-surface-container-low/50">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />
              <div className="w-14 h-14 rounded-2xl bg-m3-primary-container text-m3-on-primary-container flex items-center justify-center mb-3">
                <UploadCloud className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-m3-on-surface">
                Pilih atau seret berkas Jadwal Kuliah (PDF / Foto JPG/PNG)
              </p>
              <p className="text-xs text-m3-secondary mt-1">
                Bisa berupa dokumen jadwal resmi kampus satu jurusan (multi-halaman) atau screenshot foto jadwal
              </p>
            </label>

            {isLoading && (
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center gap-3 text-xs text-indigo-900 animate-in fade-in">
                <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                <span>{statusMessage}</span>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: QUESTIONS (KELAS & TAHUN BERAPA) */}
        {step === "filter" && file && (
          <div className="space-y-5 animate-in fade-in">
            {/* File Info */}
            <div className="p-3.5 rounded-2xl bg-m3-surface-container-low border border-m3-outline-variant flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-5 h-5 text-m3-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-m3-on-surface truncate">{file.name}</p>
                  <p className="text-[11px] text-m3-secondary">
                    {(file.size / 1024).toFixed(1)} KB • Siap diekstrak
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep("upload")}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1"
              >
                Ganti Berkas
              </button>
            </div>

            {/* Questions Card */}
            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-950">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Konfirmasi Kelas & Semester Kuliah</span>
              </div>

              {detectedClasses.length > 0 && (
                <div className="space-y-1.5 text-xs">
                  <label className="font-bold text-indigo-950 block">
                    Pilih Kelas (Terdeteksi dalam Dokumen)
                  </label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white border border-indigo-200 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {detectedClasses.map((cls) => (
                      <option key={cls} value={cls}>
                        Kelas: {cls}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Or type custom class */}
              <div className="space-y-1.5 text-xs">
                <label className="font-bold text-indigo-950 block">
                  {detectedClasses.length > 0
                    ? "Atau Ketik Kode / Nama Kelas Khusus:"
                    : "Nama Kelas Anda (Contoh: TI 1A, TI 3A, SI 2B):"}
                </label>
                <input
                  type="text"
                  value={customClass}
                  onChange={(e) => setCustomClass(e.target.value)}
                  placeholder="Contoh: TI 3A"
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-indigo-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Semester & Tahun */}
              <div className="space-y-1.5 text-xs">
                <label className="font-bold text-indigo-950 block">
                  Tahun Akademik & Semester
                </label>
                <input
                  type="text"
                  value={semesterYear}
                  onChange={(e) => setSemesterYear(e.target.value)}
                  placeholder="Contoh: Semester Ganjil 2026/2027"
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-indigo-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {isLoading && (
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center gap-3 text-xs text-indigo-900 animate-in fade-in">
                <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                <span>{statusMessage}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setStep("upload")}
                className="px-4 py-2 rounded-full text-xs font-semibold text-m3-secondary hover:bg-m3-surface-container"
              >
                Kembali
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={handleExtractWithAi}
                className="px-5 py-2.5 rounded-full text-xs font-bold bg-m3-primary text-m3-on-primary hover:brightness-95 transition-all shadow-xs flex items-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>Mulai Ekstraksi dengan Gemini AI</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: REVIEW EXTRACTED COURSES */}
        {step === "review" && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <div className="text-xs">
                <span className="font-bold text-m3-on-surface">
                  {extractedCourses.length} Mata Kuliah Ditemukan
                </span>
                <span className="text-m3-secondary ml-1.5">
                  ({selectedIndices.length} dipilih untuk dimasukkan)
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSelectedIndices(
                    selectedIndices.length === extractedCourses.length
                      ? []
                      : extractedCourses.map((_, i) => i)
                  )
                }
                className="text-xs text-m3-primary font-semibold hover:underline"
              >
                {selectedIndices.length === extractedCourses.length
                  ? "Hapus Semua Pilihan"
                  : "Pilih Semua"}
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {extractedCourses.map((course, idx) => {
                const isSelected = selectedIndices.includes(idx);
                return (
                  <div
                    key={idx}
                    onClick={() => handleToggleCourse(idx)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? "bg-white border-m3-primary shadow-xs"
                        : "bg-slate-50 border-slate-200 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleCourse(idx)}
                      className="w-4 h-4 rounded border-m3-outline text-m3-primary accent-m3-primary mt-0.5 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-m3-on-surface truncate">
                          {course.course}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-m3-secondary-container text-m3-on-secondary-container capitalize flex-shrink-0">
                          {course.day}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-m3-secondary mt-1">
                        <span className="flex items-center gap-1 font-medium text-slate-800">
                          <Clock className="w-3 h-3 text-m3-primary" />
                          <span>{course.startTime} - {course.endTime}</span>
                        </span>
                        {course.room && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{course.room}</span>
                          </span>
                        )}
                        {course.lecturer && (
                          <span className="flex items-center gap-1 truncate">
                            <User className="w-3 h-3" />
                            <span>{course.lecturer}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {isLoading && (
              <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center gap-3 text-xs text-indigo-900 animate-in fade-in">
                <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                <span>{statusMessage}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep("filter")}
                className="px-4 py-2 rounded-full text-xs font-semibold text-m3-secondary hover:bg-m3-surface-container"
              >
                Kembali
              </button>
              <button
                type="button"
                disabled={selectedIndices.length === 0 || isLoading}
                onClick={handleSaveToCalendar}
                className="px-6 py-2.5 rounded-full text-xs font-bold bg-m3-primary text-m3-on-primary hover:brightness-95 transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Terapkan {selectedIndices.length} Jadwal ke Kalender</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
