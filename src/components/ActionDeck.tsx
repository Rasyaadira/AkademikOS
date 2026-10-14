"use client";

import React, { useState } from "react";
import {
  Plus,
  Upload,
  CheckCircle2,
  Calendar,
} from "lucide-react";

export interface TaskItem {
  id: string;
  userId?: string;
  title: string;
  course: string;
  difficulty?: "mudah" | "sedang" | "sulit";
  taskType?: "tugas" | "ulangan" | "kuis" | "presentasi" | "dokumen" | "praktik" | "proyek";
  deadlineLabel: string;
  deadlineDate: string;
  weight: string;
  completed: boolean;
  priority: "high" | "medium" | "low";
}

interface ActionDeckProps {
  onOpenQuickTask: () => void;
  onOpenUploadDoc: () => void;
  tasks: TaskItem[];
  onToggleTask: (id: string) => void;
}

export default function ActionDeck({
  onOpenQuickTask,
  onOpenUploadDoc,
  tasks,
  onToggleTask,
}: ActionDeckProps) {
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

  const filteredTasks = tasks.filter((t) => {
    if (filter === "pending") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });

  const pendingCount = tasks.filter((t) => !t.completed).length;

  return (
    <aside className="w-full lg:w-80 flex-shrink-0 space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onOpenQuickTask}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-m3-primary text-m3-on-primary font-semibold text-sm transition-all hover:brightness-95 active:scale-95 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tugas</span>
        </button>

        <button
          onClick={onOpenUploadDoc}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-m3-secondary text-m3-on-secondary font-semibold text-sm transition-all hover:brightness-110 active:scale-95 shadow-sm"
        >
          <Upload className="w-4 h-4" />
          <span>↑ Dokumen</span>
        </button>
      </div>

      <div className="bg-m3-surface-container-low border border-m3-outline-variant rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-m3-on-surface">Tenggat Tugas</h3>
            <p className="text-xs text-m3-secondary">
              {pendingCount > 0
                ? `${pendingCount} tugas menunggu diselesaikan`
                : "Semua tugas selesai"}
            </p>
          </div>

          <span className="w-6 h-6 rounded-full bg-m3-primary-container text-m3-on-primary-container text-xs font-bold flex items-center justify-center">
            {pendingCount}
          </span>
        </div>

        <div className="flex items-center gap-1 bg-m3-surface-container p-1 rounded-full text-xs">
          <button
            onClick={() => setFilter("all")}
            className={`flex-1 py-1 rounded-full transition-colors font-medium text-center ${
              filter === "all"
                ? "bg-m3-surface-container-low text-m3-on-surface shadow-xs font-semibold"
                : "text-m3-secondary hover:text-m3-on-surface"
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`flex-1 py-1 rounded-full transition-colors font-medium text-center ${
              filter === "pending"
                ? "bg-m3-surface-container-low text-m3-on-surface shadow-xs font-semibold"
                : "text-m3-secondary hover:text-m3-on-surface"
            }`}
          >
            Belum
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`flex-1 py-1 rounded-full transition-colors font-medium text-center ${
              filter === "completed"
                ? "bg-m3-surface-container-low text-m3-on-surface shadow-xs font-semibold"
                : "text-m3-secondary hover:text-m3-on-surface"
            }`}
          >
            Selesai
          </button>
        </div>

        <div className="space-y-2.5">
          {filteredTasks.length === 0 ? (
            <div className="py-8 text-center text-xs text-m3-secondary">
              Tidak ada tugas dalam kategori ini.
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  task.completed
                    ? "bg-m3-surface-container border-m3-outline-variant opacity-60"
                    : "bg-m3-surface-container-low border-m3-outline-variant hover:border-m3-secondary"
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => onToggleTask(task.id)}
                    className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors flex-shrink-0 ${
                      task.completed
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : "border-m3-secondary hover:border-m3-on-surface"
                    }`}
                    aria-label={task.completed ? "Tandai belum selesai" : "Tandai selesai"}
                  >
                    {task.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-medium text-m3-secondary truncate">
                        {task.course}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-m3-secondary-container text-m3-secondary">
                        {task.deadlineLabel}
                      </span>
                    </div>

                    <h4
                      className={`text-xs font-semibold text-m3-on-surface leading-tight ${
                        task.completed ? "line-through text-m3-secondary" : ""
                      }`}
                    >
                      {task.title}
                    </h4>

                    <div className="flex items-center justify-between text-[11px] text-m3-secondary pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-m3-secondary" />
                        <span>{task.deadlineDate}</span>
                      </span>
                      <span className="font-medium text-m3-secondary">{task.weight}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
