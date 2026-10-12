"use client";

import React, { useState } from "react";
import { CheckCircle2, Calendar, Trash2, Plus, Edit3, X, Save } from "lucide-react";
import { TaskItem } from "./ActionDeck";

interface TaskListProps {
  tasks: TaskItem[];
  onToggleTask: (id: string) => void;
  onDeleteTask?: (id: string) => void;
  onUpdateTask?: (id: string, updated: Partial<TaskItem>) => void;
  onOpenQuickTask?: () => void;
}

export default function TaskList({
  tasks,
  onToggleTask,
  onDeleteTask,
  onUpdateTask,
  onOpenQuickTask,
}: TaskListProps) {
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

  // Edit Task Modal State
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCourse, setEditCourse] = useState("");
  const [editDeadlineLabel, setEditDeadlineLabel] = useState("");
  const [editDeadlineDate, setEditDeadlineDate] = useState("");
  const [editDifficulty, setEditDifficulty] = useState<"mudah" | "sedang" | "sulit">("sedang");

  const filteredTasks = tasks.filter((t) => {
    if (filter === "pending") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });

  // Sort tasks: Active tasks first, completed tasks pushed to bottom with smooth animation
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.completed === b.completed) return 0;
    return a.completed ? 1 : -1;
  });

  const pendingCount = tasks.filter((t) => !t.completed).length;

  const handleOpenEdit = (task: TaskItem) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditCourse(task.course);
    setEditDeadlineLabel(task.deadlineLabel || "H-1");
    setEditDeadlineDate(task.deadlineDate || "Besok, 23.59 WIB");
    setEditDifficulty(task.difficulty || "sedang");
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    if (onUpdateTask) {
      onUpdateTask(editingTask.id, {
        title: editTitle,
        course: editCourse,
        deadlineLabel: editDeadlineLabel,
        deadlineDate: editDeadlineDate,
        difficulty: editDifficulty,
      });
    }

    setEditingTask(null);
  };

  const handleDeleteCurrent = () => {
    if (!editingTask) return;
    if (onDeleteTask) {
      onDeleteTask(editingTask.id);
    }
    setEditingTask(null);
  };

  return (
    <div className="bg-m3-surface-container-low border border-m3-outline-variant rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs max-h-[640px] h-full flex flex-col relative">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h3 className="text-base font-bold text-m3-on-surface">Tenggat Tugas</h3>
          <p className="text-xs text-m3-secondary">
            {pendingCount > 0
              ? `${pendingCount} tugas aktif menunggu diselesaikan`
              : "Semua tugas telah diselesaikan"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenQuickTask && (
            <button
              type="button"
              onClick={onOpenQuickTask}
              className="px-2.5 py-1 rounded-full bg-m3-primary text-m3-on-primary text-xs font-bold flex items-center gap-1 hover:brightness-95 transition-all shadow-xs"
              title="Tambah tugas baru"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tugas</span>
            </button>
          )}
          <span className="w-7 h-7 rounded-full bg-m3-primary-container text-m3-on-primary-container text-xs font-bold flex items-center justify-center">
            {pendingCount}
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-m3-surface-container p-1 rounded-full text-xs flex-shrink-0">
        <button
          onClick={() => setFilter("all")}
          className={`flex-1 py-1.5 rounded-full transition-colors font-semibold text-center ${
            filter === "all"
              ? "bg-m3-surface-container-low text-m3-on-surface shadow-xs"
              : "text-m3-secondary hover:text-m3-on-surface"
          }`}
        >
          Semua
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`flex-1 py-1.5 rounded-full transition-colors font-semibold text-center ${
            filter === "pending"
              ? "bg-m3-surface-container-low text-m3-on-surface shadow-xs"
              : "text-m3-secondary hover:text-m3-on-surface"
          }`}
        >
          Belum ({pendingCount})
        </button>
        <button
          onClick={() => setFilter("completed")}
          className={`flex-1 py-1.5 rounded-full transition-colors font-semibold text-center ${
            filter === "completed"
              ? "bg-m3-surface-container-low text-m3-on-surface shadow-xs"
              : "text-m3-secondary hover:text-m3-on-surface"
          }`}
        >
          Selesai ({tasks.length - pendingCount})
        </button>
      </div>

      {/* Spacious Un-cramped Task List dengan Animasi Smooth Pindah ke Bawah & Klik untuk Edit */}
      <div className="space-y-3 pt-1 flex-1 overflow-y-auto pr-1 transition-all duration-300">
        {sortedTasks.length === 0 ? (
          <div className="py-16 text-center text-xs text-m3-secondary">
            Tidak ada tugas dalam kategori ini.
          </div>
        ) : (
          sortedTasks.map((task) => {
            const isH1 = task.deadlineLabel === "H-1" || task.deadlineLabel === "H-0";
            const isH3 = task.deadlineLabel === "H-2" || task.deadlineLabel === "H-3";

            return (
              <div
                key={task.id}
                className={`p-4 rounded-2xl border transition-all duration-300 ease-in-out cursor-pointer group ${
                  task.completed
                    ? "bg-m3-surface-container/60 border-m3-outline-variant/60 opacity-60 translate-y-0.5"
                    : "bg-m3-surface-container-low border-m3-outline-variant hover:border-m3-primary hover:shadow-xs"
                }`}
                onClick={() => handleOpenEdit(task)}
              >
                <div className="flex items-start gap-3.5">
                  {/* Interactive Checkbox */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleTask(task.id);
                    }}
                    className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
                      task.completed
                        ? "bg-emerald-600 border-emerald-600 text-white scale-95"
                        : "border-m3-secondary hover:border-m3-on-surface active:scale-90"
                    }`}
                    aria-label={task.completed ? "Tandai belum selesai" : "Tandai selesai"}
                  >
                    {task.completed && <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />}
                  </button>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-m3-secondary truncate">
                        {task.course}
                      </span>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* Difficulty Badge: Mudah / Sedang / Sulit */}
                        {task.difficulty && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                              task.difficulty === "sulit"
                                ? "bg-amber-100 text-amber-900 border border-amber-300"
                                : task.difficulty === "sedang"
                                ? "bg-blue-100 text-blue-900 border border-blue-200"
                                : "bg-emerald-100 text-emerald-900 border border-emerald-200"
                            }`}
                          >
                            {task.difficulty}
                          </span>
                        )}

                        {/* Deadline Tag */}
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider transition-colors duration-300 ${
                            task.completed
                              ? "bg-m3-surface-container text-m3-secondary"
                              : isH1
                              ? "bg-m3-error-container text-m3-error font-extrabold"
                              : isH3
                              ? "bg-m3-primary-container text-m3-on-primary-container font-extrabold"
                              : "bg-m3-secondary-container text-m3-secondary font-bold"
                          }`}
                        >
                          {task.deadlineLabel}
                        </span>
                      </div>
                    </div>

                    <h4
                      className={`text-xs sm:text-sm font-bold text-m3-on-surface leading-snug transition-all duration-300 group-hover:text-m3-primary ${
                        task.completed ? "line-through text-m3-secondary/70" : ""
                      }`}
                    >
                      {task.title}
                    </h4>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-m3-secondary pt-0.5">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-m3-secondary" />
                        <span>{task.deadlineDate}</span>
                      </span>

                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] text-m3-primary font-medium flex items-center gap-0.5">
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL EDIT TUGAS (MUNCUL SAAT TUGAS DIKLIK) */}
      {editingTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in"
          onClick={() => setEditingTask(null)}
        >
          <div
            className="bg-white rounded-3xl border border-m3-outline-variant p-6 w-full max-w-md shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-m3-primary" />
                <h3 className="text-base font-bold text-m3-on-surface">Edit Rincian Tugas</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="p-1 rounded-full text-m3-secondary hover:bg-m3-surface-container transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-bold text-m3-on-surface block mb-1">
                  Judul Tugas
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-m3-surface-container border border-m3-outline text-xs text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-m3-on-surface block mb-1">
                  Mata Kuliah
                </label>
                <input
                  type="text"
                  required
                  value={editCourse}
                  onChange={(e) => setEditCourse(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-m3-surface-container border border-m3-outline text-xs text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-m3-on-surface block mb-1">
                    Label Tenggat (cth: H-1, H-3)
                  </label>
                  <input
                    type="text"
                    value={editDeadlineLabel}
                    onChange={(e) => setEditDeadlineLabel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-m3-surface-container border border-m3-outline text-xs text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-m3-on-surface block mb-1">
                    Tingkat Kesulitan
                  </label>
                  <select
                    value={editDifficulty}
                    onChange={(e) => setEditDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-m3-surface-container border border-m3-outline text-xs text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary"
                  >
                    <option value="mudah">Mudah</option>
                    <option value="sedang">Sedang</option>
                    <option value="sulit">Sulit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-m3-on-surface block mb-1">
                  Keterangan Tanggal / Jam
                </label>
                <input
                  type="text"
                  value={editDeadlineDate}
                  onChange={(e) => setEditDeadlineDate(e.target.value)}
                  placeholder="Contoh: Besok, 23.59 WIB"
                  className="w-full px-3 py-2 rounded-xl bg-m3-surface-container border border-m3-outline text-xs text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleDeleteCurrent}
                  className="px-3 py-1.5 rounded-full text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Tugas</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTask(null)}
                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-m3-secondary hover:bg-m3-surface-container transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-full bg-m3-primary text-m3-on-primary text-xs font-bold flex items-center gap-1.5 hover:brightness-95 transition-all shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
