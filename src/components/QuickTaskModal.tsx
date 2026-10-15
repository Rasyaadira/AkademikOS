"use client";

import React, { useState } from "react";
import { X, Calendar, Clock, BarChart, Sparkles } from "lucide-react";
import { TaskItem } from "./ActionDeck";

interface QuickTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: TaskItem) => void;
  courses?: string[];
  semesterStartDate?: string;
}

export default function QuickTaskModal({
  isOpen,
  onClose,
  onAddTask,
  courses = [],
  semesterStartDate,
}: QuickTaskModalProps) {
  const availableCourses = courses && courses.length > 0 ? courses : [
    "Matematika Diskrit",
    "Menggambar",
    "Pengantar Multimedia",
    "Bahasa Inggris untuk TIK",
    "Pengantar Teknologi Informasi dan Komunikasi",
    "Pengantar Desain Komunikasi Visual",
    "Pendidikan Agama",
    "Algoritma dan Pemrograman",
    "Pancasila",
  ];

  const [title, setTitle] = useState("");
  const [course, setCourse] = useState(availableCourses[0] || "Mata Kuliah Umum");
  const [isCustomCourse, setIsCustomCourse] = useState(false);
  const [customCourseName, setCustomCourseName] = useState("");
  const [difficulty, setDifficulty] = useState<"mudah" | "sedang" | "sulit">("sedang");
  const [taskType, setTaskType] = useState<"tugas" | "ulangan" | "kuis">("tugas");
  const [examPrepOption, setExamPrepOption] = useState<"none" | "phased">("none");

  // Academic week calculation
  const semesterStart = semesterStartDate
    ? new Date(semesterStartDate)
    : new Date(2026, 8, 7);
  const now = new Date();
  const currentWeek = Math.max(
    1,
    Math.floor((now.getTime() - semesterStart.getTime()) / (7 * 86400000)) + 1
  );

  // Helper tanggal akhir pekan minggu sekarang (Minggu pekan berjalan)
  const getEndOfWeekDateStr = () => {
    const d = new Date();
    const day = d.getDay();
    const diffToSunday = day === 0 ? 0 : 7 - day;
    const endOfWeek = new Date(d);
    endOfWeek.setDate(d.getDate() + diffToSunday);
    const yyyy = endOfWeek.getFullYear();
    const mm = String(endOfWeek.getMonth() + 1).padStart(2, "0");
    const dd = String(endOfWeek.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const getTodayDateStr = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const getTomorrowDateStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const [dueDate, setDueDate] = useState(getEndOfWeekDateStr());
  const [dueTime, setDueTime] = useState("23:59");

  React.useEffect(() => {
    if (isOpen) {
      setDueDate(getEndOfWeekDateStr());
      setExamPrepOption("none");
      if (availableCourses.length > 0 && !isCustomCourse) {
        if (!course || !availableCourses.includes(course)) {
          setCourse(availableCourses[0]);
        }
      }
    }
  }, [isOpen, courses]);

  if (!isOpen) return null;

  // Format YYYY-MM-DD to DD/MM/YY
  const formatToDDMMYY = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}`;
    }
    return dateStr;
  };

  // Calculate dynamic H-X label based on selected date
  const calculateDeadlineLabel = (dateStr: string) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = new Date(dateStr);
      target.setHours(0, 0, 0, 0);
      const diffTime = target.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) return "H-0 (Hari Ini)";
      if (diffDays === 1) return "H-1 (Besok)";
      return `H-${diffDays}`;
    } catch {
      return "H-1";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const label = calculateDeadlineLabel(dueDate);
    const formattedDate = `${dueDate} ${dueTime} WIB`;

    const finalCourse = isCustomCourse ? (customCourseName.trim() || "Mata Kuliah Umum") : course;

    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      title: title.trim(),
      course: finalCourse,
      difficulty,
      taskType,
      deadlineLabel: label.split(" ")[0],
      deadlineDate: formattedDate,
      weight: taskType === "ulangan" ? "Ujian Semester" : taskType === "kuis" ? "Kuis Mingguan" : "Tugas Kuliah",
      completed: false,
      priority: difficulty === "sulit" ? "high" : difficulty === "sedang" ? "medium" : "low",
    };

    onAddTask(newTask);

    // Jika pengguna memilih opsi persiapan bertahap (Anti-Mendadak)
    if (taskType === "ulangan" && examPrepOption === "phased") {
      try {
        const examDateObj = new Date(dueDate);

        // H-7 Review Materi
        const h7DateObj = new Date(examDateObj);
        h7DateObj.setDate(examDateObj.getDate() - 7);
        const y7 = h7DateObj.getFullYear();
        const m7 = String(h7DateObj.getMonth() + 1).padStart(2, "0");
        const d7 = String(h7DateObj.getDate()).padStart(2, "0");
        const h7DateStr = `${y7}-${m7}-${d7}`;
        const h7Label = calculateDeadlineLabel(h7DateStr);

        const h7Task: TaskItem = {
          id: `task-${Date.now()}-h7`,
          title: `[Review H-7] Pembahasan Materi: ${title.trim()}`,
          course: finalCourse,
          difficulty: "sedang",
          taskType: "tugas",
          deadlineLabel: h7Label.split(" ")[0],
          deadlineDate: `${h7DateStr} 20:00 WIB`,
          weight: "Persiapan Ujian",
          completed: false,
          priority: "medium",
        };
        onAddTask(h7Task);

        // H-3 Simulasi Soal & Ujian Mandiri
        const h3DateObj = new Date(examDateObj);
        h3DateObj.setDate(examDateObj.getDate() - 3);
        const y3 = h3DateObj.getFullYear();
        const m3 = String(h3DateObj.getMonth() + 1).padStart(2, "0");
        const d3 = String(h3DateObj.getDate()).padStart(2, "0");
        const h3DateStr = `${y3}-${m3}-${d3}`;
        const h3Label = calculateDeadlineLabel(h3DateStr);

        const h3Task: TaskItem = {
          id: `task-${Date.now()}-h3`,
          title: `[Simulasi H-3] Latihan Soal & Kuis: ${title.trim()}`,
          course: finalCourse,
          difficulty: "sulit",
          taskType: "kuis",
          deadlineLabel: h3Label.split(" ")[0],
          deadlineDate: `${h3DateStr} 21:00 WIB`,
          weight: "Simulasi Ujian",
          completed: false,
          priority: "high",
        };
        onAddTask(h3Task);
      } catch (err) {
        console.error("Gagal menjadwalkan persiapan bertahap ulangan:", err);
      }
    }

    setTitle("");
    setIsCustomCourse(false);
    setCustomCourseName("");
    setExamPrepOption("none");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-m3-surface-container-low border border-m3-outline-variant rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-m3-on-surface">Tambah Tugas Cepat</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-m3-secondary hover:bg-m3-surface-container-high transition-colors"
            aria-label="Tutup dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Judul Tugas */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-m3-on-surface">
              Deskripsi / Judul Tugas
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Implementasi Algoritma Greedy Bab 3"
              required
              className="w-full px-4 py-2.5 rounded-2xl bg-m3-surface-container border border-m3-outline text-sm text-m3-on-surface placeholder:text-m3-secondary focus:outline-none focus:ring-2 focus:ring-m3-primary"
            />
          </div>

          {/* Tipe Agenda: Tugas, Ulangan, Kuis */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-m3-on-surface">
              Tipe Agenda
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTaskType("tugas")}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  taskType === "tugas"
                    ? "bg-amber-100 text-amber-900 border-amber-400 shadow-2xs"
                    : "bg-m3-surface-container text-m3-secondary border-m3-outline-variant hover:bg-m3-surface-container-high"
                }`}
              >
                <span>Tugas</span>
              </button>
              <button
                type="button"
                onClick={() => setTaskType("ulangan")}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  taskType === "ulangan"
                    ? "bg-rose-100 text-rose-900 border-rose-400 shadow-2xs"
                    : "bg-m3-surface-container text-m3-secondary border-m3-outline-variant hover:bg-m3-surface-container-high"
                }`}
              >
                <span>Ulangan</span>
              </button>
              <button
                type="button"
                onClick={() => setTaskType("kuis")}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  taskType === "kuis"
                    ? "bg-purple-100 text-purple-900 border-purple-400 shadow-2xs"
                    : "bg-m3-surface-container text-m3-secondary border-m3-outline-variant hover:bg-m3-surface-container-high"
                }`}
              >
                <span>Kuis</span>
              </button>
            </div>
          </div>

          {/* Opsi Persiapan Ulangan (Jika tipe Ulangan dipilih) */}
          {taskType === "ulangan" && (
            <div className="p-3.5 rounded-2xl bg-m3-surface-container/60 border border-m3-outline-variant space-y-2.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-m3-on-surface flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-m3-primary" />
                  <span>Rencana Persiapan Ulangan</span>
                </span>
                <span className="text-[10px] text-m3-secondary font-medium">Anti-Mendadak</span>
              </div>
              <p className="text-[11px] text-m3-on-surface-variant leading-relaxed">
                Pilih apakah Anda ingin membuat rangkaian tugas persiapan atau cukup mencatat jadwal ujian saja tanpa tugas mendadak.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setExamPrepOption("none")}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    examPrepOption === "none"
                      ? "bg-m3-surface-container-high border-m3-primary text-m3-on-surface ring-1 ring-m3-primary shadow-2xs"
                      : "bg-m3-surface-container/40 border-m3-outline-variant hover:bg-m3-surface-container text-m3-secondary"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      examPrepOption === "none" ? "border-m3-primary bg-m3-primary" : "border-m3-outline"
                    }`}>
                      {examPrepOption === "none" && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                    <span className="text-xs font-bold text-m3-on-surface">Catat Tanggal Saja</span>
                  </div>
                  <p className="text-[10px] text-m3-on-surface-variant mt-1.5 pl-5.5 leading-snug">
                    Hanya membuat 1 entri ulangan tanpa tugas persiapan tambahan.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setExamPrepOption("phased")}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    examPrepOption === "phased"
                      ? "bg-m3-primary/10 border-m3-primary text-m3-on-surface ring-1 ring-m3-primary shadow-2xs"
                      : "bg-m3-surface-container/40 border-m3-outline-variant hover:bg-m3-surface-container text-m3-secondary"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      examPrepOption === "phased" ? "border-m3-primary bg-m3-primary" : "border-m3-outline"
                    }`}>
                      {examPrepOption === "phased" && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                    <span className="text-xs font-bold text-m3-on-surface">Persiapan Bertahap</span>
                  </div>
                  <p className="text-[10px] text-m3-on-surface-variant mt-1.5 pl-5.5 leading-snug">
                    Jadwalkan otomatis Review Materi (H-7) dan Simulasi Ujian (H-3).
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Mata Kuliah & Tingkat Kesulitan (Mudah, Sedang, Sulit) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-m3-on-surface">
                  Mata Kuliah
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomCourse(!isCustomCourse)}
                  className="text-[10px] text-m3-primary hover:underline font-semibold"
                >
                  {isCustomCourse ? "Pilih dari Daftar" : "+ Ketik Manual"}
                </button>
              </div>

              {isCustomCourse ? (
                <input
                  type="text"
                  value={customCourseName}
                  onChange={(e) => setCustomCourseName(e.target.value)}
                  placeholder="Ketik nama mata kuliah..."
                  required
                  className="w-full px-3 py-2 rounded-xl bg-m3-surface-container border border-m3-outline text-xs text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary"
                />
              ) : (
                <select
                  value={course}
                  onChange={(e) => {
                    if (e.target.value === "__custom__") {
                      setIsCustomCourse(true);
                    } else {
                      setCourse(e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2.5 rounded-2xl bg-m3-surface-container border border-m3-outline text-xs text-m3-on-surface focus:outline-none"
                >
                  {availableCourses.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value="__custom__">+ Ketik Mata Kuliah Lain...</option>
                </select>
              )}
            </div>

            {/* Tingkat Kesulitan: Mudah / Sedang / Sulit */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-m3-on-surface flex items-center gap-1">
                <BarChart className="w-3.5 h-3.5 text-m3-secondary" />
                <span>Tingkat Kesulitan</span>
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-2xl bg-m3-surface-container border border-m3-outline text-xs text-m3-on-surface focus:outline-none font-medium"
              >
                <option value="mudah">Mudah</option>
                <option value="sedang">Sedang</option>
                <option value="sulit">Sulit (Susah)</option>
              </select>
            </div>
          </div>

          {/* Tanggal & Waktu Tenggat (Kapan Deadlinenya) */}
          <div className="p-3.5 rounded-2xl bg-m3-surface-container border border-m3-outline-variant space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-m3-on-surface">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-m3-secondary" />
                <span>Kapan Tenggatnya? (Deadline)</span>
              </span>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-m3-primary-container text-m3-on-primary-container">
                {formatToDDMMYY(dueDate)} • {calculateDeadlineLabel(dueDate)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="text-[11px] text-m3-secondary mb-1 block">Tanggal</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-white border border-m3-outline text-xs text-m3-on-surface focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-m3-secondary mb-1 block">Waktu Jam</label>
                <input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-white border border-m3-outline text-xs text-m3-on-surface focus:outline-none"
                />
              </div>
            </div>

            {/* Quick Date Pills: Default Minggu Sekarang */}
            <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
              <span className="text-[10px] text-m3-secondary font-medium flex-shrink-0">Pilih Cepat:</span>
              <button
                type="button"
                onClick={() => setDueDate(getEndOfWeekDateStr())}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all flex-shrink-0 cursor-pointer ${
                  dueDate === getEndOfWeekDateStr()
                    ? "bg-m3-primary text-m3-on-primary border-m3-primary shadow-2xs"
                    : "bg-white text-m3-on-surface border-m3-outline-variant hover:bg-m3-surface-container"
                }`}
              >
                Minggu Sekarang (Minggu {currentWeek})
              </button>
              <button
                type="button"
                onClick={() => setDueDate(getTodayDateStr())}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all flex-shrink-0 cursor-pointer ${
                  dueDate === getTodayDateStr()
                    ? "bg-m3-primary text-m3-on-primary border-m3-primary shadow-2xs"
                    : "bg-white text-m3-on-surface border-m3-outline-variant hover:bg-m3-surface-container"
                }`}
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => setDueDate(getTomorrowDateStr())}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all flex-shrink-0 cursor-pointer ${
                  dueDate === getTomorrowDateStr()
                    ? "bg-m3-primary text-m3-on-primary border-m3-primary shadow-2xs"
                    : "bg-white text-m3-on-surface border-m3-outline-variant hover:bg-m3-surface-container"
                }`}
              >
                Besok
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-m3-outline-variant flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-full text-xs font-semibold text-m3-secondary hover:bg-m3-surface-container transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-full text-xs font-bold bg-m3-primary text-m3-on-primary hover:brightness-95 transition-all shadow-xs"
            >
              Simpan Tugas
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
