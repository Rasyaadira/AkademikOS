"use client";

import React, { useState } from "react";
import { X, Calendar, Clock, BarChart } from "lucide-react";
import { TaskItem } from "./ActionDeck";

interface QuickTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: TaskItem) => void;
}

const courseOptions = [
  "Kecerdasan Buatan & Sistem Pakar",
  "Sistem Operasi",
  "Rekayasa Perangkat Lunak",
  "Basis Data Lanjut",
  "Jaringan Komputer",
  "Pemrograman Berorientasi Objek",
  "Etika Profesi & Komunikasi",
];

export default function QuickTaskModal({
  isOpen,
  onClose,
  onAddTask,
}: QuickTaskModalProps) {
  const [title, setTitle] = useState("");
  const [course, setCourse] = useState(courseOptions[0]);
  const [difficulty, setDifficulty] = useState<"mudah" | "sedang" | "sulit">("sedang");

  // Default to tomorrow 23:59
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split("T")[0];

  const [dueDate, setDueDate] = useState(defaultDateStr);
  const [dueTime, setDueTime] = useState("23:59");

  if (!isOpen) return null;

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

    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      title: title.trim(),
      course,
      difficulty,
      deadlineLabel: label.split(" ")[0],
      deadlineDate: formattedDate,
      weight: "Tugas Kuliah",
      completed: false,
      priority: difficulty === "sulit" ? "high" : difficulty === "sedang" ? "medium" : "low",
    };

    onAddTask(newTask);
    setTitle("");
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

          {/* Mata Kuliah & Tingkat Kesulitan (Mudah, Sedang, Sulit) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-m3-on-surface">
                Mata Kuliah
              </label>
              <select
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full px-3 py-2.5 rounded-2xl bg-m3-surface-container border border-m3-outline text-xs text-m3-on-surface focus:outline-none"
              >
                {courseOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
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
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-m3-primary-container text-m3-on-primary-container">
                {calculateDeadlineLabel(dueDate)}
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
