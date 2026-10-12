"use client";

import React, { useState } from "react";
import { CheckCircle2, Calendar, Trash2, Plus } from "lucide-react";
import { TaskItem } from "./ActionDeck";

interface TaskListProps {
  tasks: TaskItem[];
  onToggleTask: (id: string) => void;
  onDeleteTask?: (id: string) => void;
  onOpenQuickTask?: () => void;
}

export default function TaskList({
  tasks,
  onToggleTask,
  onDeleteTask,
  onOpenQuickTask,
}: TaskListProps) {
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

  const filteredTasks = tasks.filter((t) => {
    if (filter === "pending") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });

  // Sort tasks: Active (uncompleted) tasks first, completed tasks pushed to bottom with smooth animation
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.completed === b.completed) return 0;
    return a.completed ? 1 : -1;
  });

  const pendingCount = tasks.filter((t) => !t.completed).length;

  return (
    <div className="bg-m3-surface-container-low border border-m3-outline-variant rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs max-h-[640px] h-full flex flex-col">
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

      {/* Spacious Un-cramped Task List dengan Animasi Smooth Pindah ke Bawah */}
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
                className={`p-4 rounded-2xl border transition-all duration-500 ease-in-out ${
                  task.completed
                    ? "bg-m3-surface-container/60 border-m3-outline-variant/60 opacity-60 translate-y-0.5"
                    : "bg-m3-surface-container-low border-m3-outline-variant hover:border-m3-secondary hover:shadow-xs"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Interactive Checkbox */}
                  <button
                    onClick={() => onToggleTask(task.id)}
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
                      className={`text-xs sm:text-sm font-bold text-m3-on-surface leading-snug transition-all duration-300 ${
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

                      {onDeleteTask && (
                        <button
                          onClick={() => onDeleteTask(task.id)}
                          className="p-1 text-m3-secondary hover:text-red-500 rounded transition-colors"
                          title="Hapus tugas"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
