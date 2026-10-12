"use client";

import React, { useState } from "react";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  X,
  Edit3,
  MapPin,
  User,
  Calendar as CalendarIcon,
  Filter,
  Plus,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { TaskItem } from "./ActionDeck";

export type CalendarViewMode = "1hari" | "7hari" | "1bulan";

export interface ScheduleItem {
  id: string;
  userId?: string;
  course: string;
  code: string;
  room: string;
  startHour: number;
  durationHours: number;
  startTime: string;
  endTime: string;
  lecturer: string;
  day: string;
  status: "completed" | "active" | "upcoming";
  attendanceStatus?: string;
}

interface ScheduleCalendarProps {
  schedules: ScheduleItem[];
  tasks?: TaskItem[];
  selectedDay?: string;
  onSelectDay?: (day: string) => void;
  onReschedule: (id: string, newStartHour: number, day?: string) => void;
  onUpdateSchedule?: (id: string, updated: Partial<ScheduleItem>) => void;
  onDeleteSchedule?: (id: string) => void;
  onAddSchedule?: (newSched: ScheduleItem) => void;
  isExpanded?: boolean;
}

// Color palettes for distinct courses in calendar views
const getCourseBadgeColor = (courseName: string) => {
  const name = courseName.toLowerCase();
  if (name.includes("buatan") || name.includes("ai")) {
    return "bg-[#9DACFF]/30 text-[#1E293B] border-[#9DACFF] hover:bg-[#9DACFF]/40";
  }
  if (name.includes("operasi") || name.includes("os")) {
    return "bg-[#5B616A]/20 text-[#1E293B] border-[#5B616A]/40 hover:bg-[#5B616A]/30";
  }
  if (name.includes("rekayasa") || name.includes("rpl") || name.includes("software")) {
    return "bg-[#CBF7ED] text-[#0F766E] border-[#6EE7B7] hover:bg-[#A7F3D0]";
  }
  if (name.includes("basis data") || name.includes("database")) {
    return "bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200";
  }
  if (name.includes("jaringan") || name.includes("network")) {
    return "bg-indigo-100 text-indigo-900 border-indigo-200 hover:bg-indigo-200";
  }
  if (name.includes("etika") || name.includes("komunikasi")) {
    return "bg-rose-100 text-rose-900 border-rose-200 hover:bg-rose-200";
  }
  if (name.includes("objek") || name.includes("pbo")) {
    return "bg-purple-100 text-purple-900 border-purple-200 hover:bg-purple-200";
  }
  return "bg-slate-100 text-slate-900 border-slate-300 hover:bg-slate-200";
};

export default function ScheduleCalendar({
  schedules,
  tasks = [],
  selectedDay: propSelectedDay,
  onSelectDay: propOnSelectDay,
  onReschedule,
  onUpdateSchedule,
  onDeleteSchedule,
  onAddSchedule,
  isExpanded = false,
}: ScheduleCalendarProps) {
  const [viewMode, setViewMode] = useState<CalendarViewMode>("1hari");
  const [internalDay, setInternalDay] = useState("kamis");
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{ day: string; hour: number } | null>(null);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);

  // Checkbox filters for calendar items
  const [filterCourses, setFilterCourses] = useState(true);
  const [filterTasks, setFilterTasks] = useState(true);
  const [filterAgendas, setFilterAgendas] = useState(true);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  // Add Schedule Modal state
  const [isAddScheduleOpen, setIsAddScheduleOpen] = useState(false);
  const [newCourse, setNewCourse] = useState("");
  const [newRoom, setNewRoom] = useState("");
  const [newDay, setNewDay] = useState("kamis");
  const [newLecturer, setNewLecturer] = useState("");
  const [newStartTime, setNewStartTime] = useState("09.00");
  const [newEndTime, setNewEndTime] = useState("11.30");

  const selectedDay = propSelectedDay !== undefined ? propSelectedDay : internalDay;
  const setSelectedDay = propOnSelectDay || setInternalDay;

  const dayKeyToDateStr: Record<string, string> = {
    senin: "2026-09-28",
    selasa: "2026-09-29",
    rabu: "2026-09-30",
    kamis: "2026-10-01",
    jumat: "2026-10-02",
    sabtu: "2026-10-03",
    minggu: "2026-10-04",
  };

  const getTaskHour = (t: TaskItem): number => {
    const match = (t.deadlineLabel || "").match(/(\d{1,2})[:.](\d{2})/);
    if (match) return parseInt(match[1], 10);
    return 23;
  };

  const daysList = [
    { key: "senin", label: "Senin", date: "28 Sep", dayNum: 28 },
    { key: "selasa", label: "Selasa", date: "29 Sep", dayNum: 29 },
    { key: "rabu", label: "Rabu", date: "30 Sep", dayNum: 30 },
    { key: "kamis", label: "Kamis", date: "1 Okt", dayNum: 1 },
    { key: "jumat", label: "Jumat", date: "2 Okt", dayNum: 2 },
    { key: "sabtu", label: "Sabtu", date: "3 Okt", dayNum: 3 },
    { key: "minggu", label: "Minggu", date: "4 Okt", dayNum: 4 },
  ];

  const currentDayIndex = daysList.findIndex((d) => d.key === selectedDay);
  const activeDayObj = daysList[currentDayIndex >= 0 ? currentDayIndex : 3];

  // Navigation handlers (tombol kanan kiri)
  const handlePrevDay = () => {
    const nextIdx = (currentDayIndex - 1 + daysList.length) % daysList.length;
    setSelectedDay(daysList[nextIdx].key);
  };

  const handleNextDay = () => {
    const nextIdx = (currentDayIndex + 1) % daysList.length;
    setSelectedDay(daysList[nextIdx].key);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    setDraggedItemId(id);
  };

  const handleCellDragOver = (e: React.DragEvent, day: string, hour: number) => {
    e.preventDefault();
    setDragOverCell({ day, hour });
  };

  const handleCellDragLeave = () => {
    setDragOverCell(null);
  };

  const handleCellDrop = (e: React.DragEvent, day: string, hour: number) => {
    e.preventDefault();
    setDragOverCell(null);
    const itemId = e.dataTransfer.getData("text/plain") || draggedItemId;
    if (itemId) {
      onReschedule(itemId, hour, day);
    }
    setDraggedItemId(null);
  };

  // Click to open edit popover/modal
  const handleCardClick = (e: React.MouseEvent, item: ScheduleItem) => {
    if (draggedItemId) return;
    setEditingItem({ ...item });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (onUpdateSchedule) {
      onUpdateSchedule(editingItem.id, editingItem);
    }
    setEditingItem(null);
  };

  const handleDeleteSchedule = (id: string) => {
    if (onDeleteSchedule) {
      onDeleteSchedule(id);
    }
    setEditingItem(null);
  };

  const handleSaveNewSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.trim()) return;
    const parsedHour = parseInt(newStartTime.split(".")[0], 10) || 9;
    const newSched: ScheduleItem = {
      id: `sch-${Date.now()}`,
      course: newCourse.trim(),
      code: "IF-2026",
      room: newRoom.trim() || "Ruang Kelas",
      day: newDay,
      lecturer: newLecturer.trim() || "Dosen Pengampu",
      startTime: newStartTime.trim() || "09.00",
      endTime: newEndTime.trim() || "11.30",
      startHour: parsedHour,
      durationHours: 2,
      status: "upcoming",
      attendanceStatus: "pending",
    };
    if (onAddSchedule) {
      onAddSchedule(newSched);
    }
    setIsAddScheduleOpen(false);
    setNewCourse("");
    setNewRoom("");
    setNewLecturer("");
  };

  // 1-24 Hours array for Day view
  const hours24 = Array.from({ length: 24 }, (_, i) => i + 1);

  // Standard daytime hours for 7-day matrix (06.00 - 22.00)
  const matrixHours = Array.from({ length: 17 }, (_, i) => i + 6);

  // Filter schedules for the selected day in 1-day view
  const daySchedules = schedules.filter((s) => s.day === selectedDay);

  // Weekday map for Month view
  const weekdayToKey = ["minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"];

  return (
    <div
      className={`bg-m3-surface-container-low border border-m3-outline-variant rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs flex flex-col relative ${
        isExpanded ? "min-h-[720px] flex-1" : "max-h-[640px] h-full"
      }`}
    >
      {/* Top Header: Controls with Prev/Next Navigation (Tombol Kanan Kiri) + View Mode */}
      <div className="flex flex-col gap-3 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-m3-on-surface">Jadwal Perkuliahan</h3>
          </div>

          {/* View Mode Pills (1 Hari, 7 Hari, 1 Bulan) */}
          <div className="flex items-center gap-1 bg-m3-surface-container p-1 rounded-full border border-m3-outline-variant self-start sm:self-auto">
            <button
              onClick={() => setViewMode("1hari")}
              className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all ${
                viewMode === "1hari"
                  ? "bg-m3-primary text-m3-on-primary shadow-xs"
                  : "text-m3-secondary hover:text-m3-on-surface"
              }`}
            >
              1 Hari
            </button>
            <button
              onClick={() => setViewMode("7hari")}
              className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all ${
                viewMode === "7hari"
                  ? "bg-m3-primary text-m3-on-primary shadow-xs"
                  : "text-m3-secondary hover:text-m3-on-surface"
              }`}
            >
              7 Hari
            </button>
            <button
              onClick={() => setViewMode("1bulan")}
              className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all ${
                viewMode === "1bulan"
                  ? "bg-m3-primary text-m3-on-primary shadow-xs"
                  : "text-m3-secondary hover:text-m3-on-surface"
              }`}
            >
              1 Bulan
            </button>
          </div>
        </div>

        {/* Global Navigation Bar: TOMBOL KANAN KIRI & Label Tanggal Aktif */}
        <div className="flex items-center justify-between pt-1 pb-2 border-b border-m3-outline-variant/50">
          <div className="flex items-center gap-2">
            {/* Tombol Kiri */}
            <button
              type="button"
              onClick={handlePrevDay}
              className="p-1.5 rounded-full bg-m3-surface-container hover:bg-m3-surface-container-high border border-m3-outline-variant text-m3-secondary hover:text-m3-on-surface transition-colors"
              aria-label="Sebelumnya"
              title="Hari sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Label Hari/Pekan Terkini */}
            {viewMode === "1hari" && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-bold text-m3-on-surface">
                  {activeDayObj.label}, {activeDayObj.date} 2026
                </span>
                {activeDayObj.key === "kamis" && (
                  <span className="text-xs font-normal text-m3-secondary">
                    (Hari ini)
                  </span>
                )}
              </div>
            )}

            {viewMode === "7hari" && (
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-m3-on-surface">
                  Pekan Kuliah: 28 Sep – 4 Okt 2026
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-m3-secondary-container text-m3-on-secondary-container">
                  Minggu 4
                </span>
              </div>
            )}

            {viewMode === "1bulan" && (
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-m3-on-surface">
                  Oktober 2026
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-m3-primary text-m3-on-primary">
                  Semester Gasal
                </span>
              </div>
            )}

            {/* Tombol Kanan */}
            <button
              type="button"
              onClick={handleNextDay}
              className="p-1.5 rounded-full bg-m3-surface-container hover:bg-m3-surface-container-high border border-m3-outline-variant text-m3-secondary hover:text-m3-on-surface transition-colors"
              aria-label="Berikutnya"
              title="Hari berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Right Action Bar: Filter Dropdown + Tambah Jadwal + Lompat Hari Ini */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Dropdown Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-m3-surface-container hover:bg-m3-surface-container-high border border-m3-outline-variant text-[11px] font-semibold text-m3-on-surface transition-all shadow-xs"
              >
                <Filter className="w-3.5 h-3.5 text-m3-secondary" />
                <span>Filter Tampilan</span>
                <span className="w-4 h-4 rounded-full bg-m3-primary text-m3-on-primary text-[9px] font-bold flex items-center justify-center">
                  {(filterCourses ? 1 : 0) + (filterTasks ? 1 : 0) + (filterAgendas ? 1 : 0)}
                </span>
                <ChevronDown className="w-3 h-3 text-m3-secondary" />
              </button>

              {isFilterDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl border border-m3-outline-variant shadow-lg p-2 z-30 space-y-1 animate-in fade-in zoom-in-95">
                  <label className="flex items-center gap-2 p-2 rounded-xl hover:bg-m3-surface-container-low cursor-pointer transition-colors text-xs font-medium text-m3-on-surface">
                    <input
                      type="checkbox"
                      checked={filterCourses}
                      onChange={(e) => setFilterCourses(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-m3-outline text-m3-primary accent-m3-primary cursor-pointer"
                    />
                    <span>Mata Kuliah</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-xl hover:bg-m3-surface-container-low cursor-pointer transition-colors text-xs font-medium text-m3-on-surface">
                    <input
                      type="checkbox"
                      checked={filterTasks}
                      onChange={(e) => setFilterTasks(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-m3-outline text-m3-primary accent-m3-primary cursor-pointer"
                    />
                    <span>Tenggat Tugas</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-xl hover:bg-m3-surface-container-low cursor-pointer transition-colors text-xs font-medium text-m3-on-surface">
                    <input
                      type="checkbox"
                      checked={filterAgendas}
                      onChange={(e) => setFilterAgendas(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-m3-outline text-m3-primary accent-m3-primary cursor-pointer"
                    />
                    <span>Agenda & Ujian</span>
                  </label>
                </div>
              )}
            </div>

            {/* Tombol + Tambah Jadwal */}
            <button
              type="button"
              onClick={() => setIsAddScheduleOpen(true)}
              className="flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-m3-primary text-m3-on-primary hover:brightness-95 transition-all shadow-xs"
              title="Tambah Jadwal Perkuliahan Baru"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Matkul</span>
            </button>

            {/* Quick Jump to Today button */}
            <button
              type="button"
              onClick={() => setSelectedDay("kamis")}
              className="text-[11px] font-semibold px-3 py-1 rounded-full bg-m3-surface-container hover:bg-m3-surface-container-high border border-m3-outline-variant text-m3-secondary hover:text-m3-on-surface transition-colors"
            >
              Hari Ini
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: 1 HARI (COMPACT 1 - 24 JAM TIMELINE TANPA BANYAK SCROLL) */}
      {viewMode === "1hari" && (
        <div className="flex-1 flex flex-col min-h-0 space-y-2">
          {/* 1 - 24 Hours Drag & Drop Container with Compact Density */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-1 border border-m3-outline-variant/60 rounded-2xl p-2 bg-m3-surface-container/20">
            {hours24.map((hour) => {
              const hourLabel = `${String(hour).padStart(2, "0")}.00`;
              const matchedClasses = filterCourses ? daySchedules.filter((s) => s.startHour === hour) : [];
              const matchedTasks = filterTasks
                ? tasks.filter((t) => {
                    const isDay =
                      t.deadlineDate.startsWith(dayKeyToDateStr[selectedDay] || "") ||
                      t.deadlineDate.toLowerCase().includes(selectedDay);
                    if (!isDay) return false;
                    return getTaskHour(t) === hour;
                  })
                : [];
              const hasItems = matchedClasses.length > 0 || matchedTasks.length > 0;
              const isOver = dragOverCell?.day === selectedDay && dragOverCell?.hour === hour;

              return (
                <div
                  key={hour}
                  onDragOver={(e) => handleCellDragOver(e, selectedDay, hour)}
                  onDragLeave={handleCellDragLeave}
                  onDrop={(e) => handleCellDrop(e, selectedDay, hour)}
                  className={`flex items-start gap-2.5 px-2.5 transition-all border-b border-black/[0.03] ${
                    isOver
                      ? "border-2 border-dashed border-m3-primary bg-m3-primary-container/30 min-h-[44px] py-1.5 rounded-xl"
                      : hasItems
                      ? "border-m3-outline-variant/60 bg-white min-h-[44px] py-1.5 shadow-xs rounded-xl"
                      : "hover:bg-white/60 min-h-[26px] py-0.5"
                  }`}
                >
                  <div
                    className={`w-10 text-[10px] font-bold text-m3-secondary flex-shrink-0 text-right ${
                      hasItems ? "pt-1" : "pt-0.5"
                    }`}
                  >
                    {hourLabel}
                  </div>

                  <div className="flex-1 space-y-1">
                    {matchedClasses.map((item) => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.id)}
                        onClick={(e) => handleCardClick(e, item)}
                        className={`p-2 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer active:cursor-grabbing transition-all hover:shadow-xs group ${
                          item.status === "active"
                            ? "bg-m3-primary-container border-m3-primary"
                            : "bg-m3-surface-container border-m3-outline-variant hover:border-m3-secondary"
                        }`}
                        title="Klik untuk mengedit detail kelas"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <GripVertical className="w-3.5 h-3.5 text-m3-secondary flex-shrink-0 opacity-60 group-hover:opacity-100" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-m3-on-surface truncate">
                                {item.course}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-m3-surface-container-low text-m3-secondary">
                                {item.startTime} - {item.endTime} WIB
                              </span>
                            </div>
                            <p className="text-[10px] text-m3-secondary truncate">
                              {item.room} • {item.lecturer}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[10px] font-semibold text-m3-secondary bg-m3-surface-container-low px-2 py-0.5 rounded-md flex items-center gap-1 group-hover:text-m3-primary transition-colors">
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </span>
                        </div>
                      </div>
                    ))}

                    {matchedTasks.map((t) => (
                      <div
                        key={t.id}
                        className="p-1.5 px-2.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 flex-shrink-0">
                            Tenggat Tugas
                          </span>
                          <span className="font-bold truncate">{t.title}</span>
                          <span className="text-[10px] text-amber-700 truncate">({t.course})</span>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white border border-amber-200 flex-shrink-0">
                          {t.difficulty || "Sedang"} • {t.deadlineLabel || "23:59"}
                        </span>
                      </div>
                    ))}

                    {!hasItems && (
                      <div className="h-full flex items-center text-[10px] text-m3-secondary/30 select-none">
                        {isOver ? "Lepaskan untuk memindahkan ke jam ini" : "—"}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: 7 HARI (HARI DI ATAS / COLUMNS, JAM DI SAMPING / ROWS - COMPACT HEIGHT) */}
      {viewMode === "7hari" && (
        <div className="flex-1 flex flex-col min-h-0 space-y-2 border border-m3-outline-variant rounded-2xl overflow-hidden bg-white">
          <div className="flex-1 overflow-x-auto overflow-y-auto">
            <div className="min-w-[760px] flex flex-col">
              {/* TOP HEADER: HARI-HARI DI ATAS */}
              <div className="flex border-b border-m3-outline-variant bg-m3-surface-container/60 sticky top-0 z-10">
                {/* Kolom Pojok: Label Jam */}
                <div className="w-16 p-2 text-center text-xs font-bold text-m3-secondary border-r border-m3-outline-variant flex-shrink-0 bg-m3-surface-container/80">
                  Jam
                </div>

                {/* 7 Kolom Hari */}
                {daysList.map((d) => {
                  const isToday = d.key === "kamis";
                  const isSelected = d.key === selectedDay;

                  return (
                    <div
                      key={d.key}
                      onClick={() => setSelectedDay(d.key)}
                      className={`flex-1 min-w-[95px] p-1.5 text-center border-r border-m3-outline-variant/60 cursor-pointer transition-colors ${
                        isToday
                          ? "bg-m3-primary-container/30"
                          : isSelected
                          ? "bg-slate-100"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="text-xs font-bold text-m3-on-surface">{d.label}</span>
                        {isToday && (
                          <span className="w-2 h-2 rounded-full bg-m3-primary flex-shrink-0" />
                        )}
                      </div>
                      <span className="text-[10px] text-m3-secondary">{d.date}</span>
                    </div>
                  );
                })}
              </div>

              {/* TENGGAT TUGAS ROW DALAM MATRIKS 7 HARI (JIKA FILTER TUGAS AKTIF) */}
              {filterTasks && (
                <div className="flex border-b-2 border-amber-200/90 bg-amber-50/50 min-h-[34px]">
                  <div className="w-16 p-1 border-r border-m3-outline-variant flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-amber-800 bg-amber-100/70">
                    Tenggat
                  </div>
                  {daysList.map((d) => {
                    const dayTasks = tasks.filter((t) => {
                      const datePrefix = dayKeyToDateStr[d.key] || "";
                      return (
                        t.deadlineDate.startsWith(datePrefix) ||
                        t.deadlineDate.toLowerCase().includes(d.key)
                      );
                    });

                    return (
                      <div
                        key={`task-header-${d.key}`}
                        className="flex-1 min-w-[95px] border-r border-m3-outline-variant/40 p-1 flex flex-col justify-center gap-0.5"
                      >
                        {dayTasks.length > 0 ? (
                          dayTasks.map((t) => (
                            <div
                              key={t.id}
                              className={`w-full p-0.5 px-1.5 rounded text-[8px] font-bold truncate flex items-center justify-between gap-1 shadow-2xs ${
                                t.completed
                                  ? "bg-slate-100 text-slate-400 line-through border border-slate-200"
                                  : "bg-amber-100 text-amber-900 border border-amber-300"
                              }`}
                              title={`${t.title} (${t.course}) - ${t.deadlineLabel}`}
                            >
                              <span className="truncate">{t.title}</span>
                              <span className="text-[7px] opacity-75 flex-shrink-0">
                                {t.deadlineLabel || "23:59"}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-[9px] text-slate-300 select-none">—</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ROWS: JAM DI SAMPING KIRI (06.00 s.d. 22.00 - COMPACT ROW MIN-H-38PX) */}
              {matrixHours.map((hour) => {
                const hourLabel = `${String(hour).padStart(2, "0")}.00`;

                return (
                  <div
                    key={hour}
                    className="flex border-b border-black/[0.03] min-h-[38px] hover:bg-slate-50/40 transition-colors"
                  >
                    {/* Sticky Jam di Samping */}
                    <div className="w-16 p-1 border-r border-black/[0.03] flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-m3-secondary bg-m3-surface-container/20">
                      {hourLabel}
                    </div>

                    {/* 7 Sel Hari untuk Jam Ini */}
                    {daysList.map((d) => {
                      const classInCell = filterCourses
                        ? schedules.find((s) => s.day === d.key && s.startHour === hour)
                        : null;
                      const tasksInCell = filterTasks
                        ? tasks.filter((t) => {
                            const isDay =
                              t.deadlineDate.startsWith(dayKeyToDateStr[d.key] || "") ||
                              t.deadlineDate.toLowerCase().includes(d.key);
                            if (!isDay) return false;
                            return getTaskHour(t) === hour;
                          })
                        : [];
                      const isOver = dragOverCell?.day === d.key && dragOverCell?.hour === hour;
                      const badgeColor = classInCell ? getCourseBadgeColor(classInCell.course) : "";

                      return (
                        <div
                          key={d.key}
                          onDragOver={(e) => handleCellDragOver(e, d.key, hour)}
                          onDragLeave={handleCellDragLeave}
                          onDrop={(e) => handleCellDrop(e, d.key, hour)}
                          className={`flex-1 min-w-[95px] border-r border-black/[0.03] p-0.5 flex flex-col justify-center gap-0.5 transition-all ${
                            isOver ? "bg-m3-primary-container/40 border-2 border-dashed border-m3-primary" : ""
                          }`}
                        >
                          {classInCell && (
                            <div
                              draggable
                              onDragStart={(e) => handleDragStart(e, classInCell.id)}
                              onClick={(e) => handleCardClick(e, classInCell)}
                              className={`w-full p-1 rounded-lg text-[9px] font-bold shadow-xs cursor-pointer active:cursor-grabbing hover:brightness-95 flex flex-col justify-between border transition-all ${badgeColor}`}
                              title={`${classInCell.course} (${classInCell.startTime}-${classInCell.endTime}) - Klik untuk edit`}
                            >
                              <span className="truncate leading-tight font-extrabold">{classInCell.course}</span>
                              <div className="flex items-center justify-between text-[8px] opacity-80 pt-0.5">
                                <span>{classInCell.room.split("-")[0]}</span>
                                <span>{classInCell.startTime}</span>
                              </div>
                            </div>
                          )}

                          {tasksInCell.map((t) => (
                            <div
                              key={t.id}
                              className="w-full p-0.5 px-1 rounded text-[8px] font-bold bg-amber-100 text-amber-900 border border-amber-300 truncate"
                              title={`Tenggat: ${t.title}`}
                            >
                              [Tugas] {t.title}
                            </div>
                          ))}

                          {!classInCell && tasksInCell.length === 0 && (
                            <div className="w-full h-full text-center text-slate-300 text-[10px] flex items-center justify-center select-none">
                              {isOver ? "+" : ""}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: 1 BULAN (NAMA MATKUL & TUGAS DENGAN WARNA-WARNA BERBEDA) */}
      {viewMode === "1bulan" && (
        <div className="flex-1 flex flex-col min-h-0 space-y-3">
          {/* Month Calendar Grid */}
          <div className="flex-1 overflow-y-auto border border-m3-outline-variant rounded-2xl bg-white flex flex-col min-h-0">
            {/* Weekday headers: Sun, Mon, Tue, Wed, Thu, Fri, Sat */}
            <div className="grid grid-cols-7 border-b border-m3-outline-variant bg-m3-surface-container/40 text-center py-2 text-[11px] font-semibold text-m3-secondary flex-shrink-0">
              <div>Min</div>
              <div>Sen</div>
              <div>Sel</div>
              <div>Rab</div>
              <div>Kam</div>
              <div>Jum</div>
              <div>Sab</div>
            </div>

            {/* 35 Calendar Cells (5 rows of 7 days) */}
            <div className="grid grid-cols-7 flex-1 min-h-[360px]">
              {/* Previous month days: Sep 27, 28, 29, 30 */}
              {[
                { d: 27, isCurr: false },
                { d: 28, isCurr: false },
                { d: 29, isCurr: false },
                { d: 30, isCurr: false },
              ].map((item, i) => (
                <div
                  key={`prev-${i}`}
                  className="border-b border-r border-m3-outline-variant/60 p-1.5 min-h-[72px] bg-slate-50/50"
                >
                  <span className="text-[11px] text-m3-secondary/40 font-medium">{item.d}</span>
                </div>
              ))}

              {/* October days: 1 to 31 */}
              {Array.from({ length: 31 }, (_, i) => i + 1).map((date) => {
                const isToday = date === 1;
                const isOct1 = date === 1;

                const jsDate = new Date(2026, 9, date);
                const dayIndex = jsDate.getDay();
                const dayKey = weekdayToKey[dayIndex];

                const dayClasses = filterCourses ? schedules.filter((s) => s.day === dayKey) : [];
                const datePadded = `2026-10-${String(date).padStart(2, "0")}`;
                const dayTasks = filterTasks ? tasks.filter((t) => t.deadlineDate.startsWith(datePadded)) : [];

                return (
                  <div
                    key={`curr-${date}`}
                    onClick={() => setSelectedDay(dayKey)}
                    className="border-b border-r border-m3-outline-variant/60 p-1.5 min-h-[72px] flex flex-col justify-between hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      {isToday ? (
                        <span className="w-5 h-5 rounded-full bg-m3-primary text-m3-on-primary text-[11px] font-bold flex items-center justify-center">
                          {date}
                        </span>
                      ) : (
                        <span className="text-[11px] text-m3-on-surface font-medium group-hover:font-bold">
                          {isOct1 ? `1 Okt` : date}
                        </span>
                      )}
                    </div>

                    {/* Actual Course and Task Items with Specific Colors */}
                    <div className="space-y-1 mt-1 flex-1 overflow-hidden">
                      {dayClasses.map((cl) => {
                        const badgeColor = getCourseBadgeColor(cl.course);
                        return (
                          <div
                            key={cl.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCardClick(e, cl);
                            }}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold truncate border transition-colors ${badgeColor}`}
                            title={`${cl.course} (${cl.startTime} - ${cl.endTime} WIB) - Klik untuk edit`}
                          >
                            {cl.course}
                          </div>
                        );
                      })}

                      {dayTasks.map((tk) => (
                        <div
                          key={tk.id}
                          className="px-1.5 py-0.5 rounded bg-red-100 text-red-800 border border-red-200 text-[9px] font-bold truncate"
                          title={`Tenggat: ${tk.title}`}
                        >
                          Tenggat: {tk.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* POPUP / MODAL EDIT JADWAL (KELAS, RUANGAN, WAKTU, HARI) */}
      {editingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-m3-surface-container-low border border-m3-outline-variant rounded-3xl w-full max-w-md p-6 space-y-4 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-m3-outline-variant">
              <div>
                <h3 className="text-base font-bold text-m3-on-surface">Edit Jadwal Perkuliahan</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-m3-secondary hover:bg-m3-surface-container transition-colors"
                aria-label="Tutup form edit"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-m3-on-surface">Nama Mata Kuliah</label>
                <input
                  type="text"
                  value={editingItem.course}
                  onChange={(e) => setEditingItem({ ...editingItem, course: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-m3-surface-container border border-m3-outline text-xs text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-m3-on-surface flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-m3-secondary" />
                    <span>Ruang Kelas</span>
                  </label>
                  <input
                    type="text"
                    value={editingItem.room}
                    onChange={(e) => setEditingItem({ ...editingItem, room: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-m3-surface-container border border-m3-outline text-xs text-m3-on-surface focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-m3-on-surface flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-m3-secondary" />
                    <span>Hari Perkuliahan</span>
                  </label>
                  <select
                    value={editingItem.day}
                    onChange={(e) => setEditingItem({ ...editingItem, day: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-m3-surface-container border border-m3-outline text-xs text-m3-on-surface focus:outline-none capitalize"
                  >
                    {["senin", "selasa", "rabu", "kamis", "jumat", "sabtu", "minggu"].map((d) => (
                      <option key={d} value={d}>
                        {d.charAt(0).toUpperCase() + d.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-m3-on-surface flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-m3-secondary" />
                  <span>Dosen Pengampu</span>
                </label>
                <input
                  type="text"
                  value={editingItem.lecturer}
                  onChange={(e) => setEditingItem({ ...editingItem, lecturer: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-m3-surface-container border border-m3-outline text-xs text-m3-on-surface focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-m3-secondary">Jam Mulai</label>
                  <input
                    type="text"
                    value={editingItem.startTime}
                    onChange={(e) => {
                      const val = e.target.value;
                      const parsedHour = parseInt(val.split(".")[0]) || editingItem.startHour;
                      setEditingItem({
                        ...editingItem,
                        startTime: val,
                        startHour: parsedHour,
                      });
                    }}
                    placeholder="09.00"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-m3-surface-container border border-m3-outline text-xs text-m3-on-surface focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-m3-secondary">Jam Selesai</label>
                  <input
                    type="text"
                    value={editingItem.endTime}
                    onChange={(e) => setEditingItem({ ...editingItem, endTime: e.target.value })}
                    placeholder="11.30"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-m3-surface-container border border-m3-outline text-xs text-m3-on-surface focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-m3-outline-variant/60 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleDeleteSchedule(editingItem.id)}
                  className="px-3.5 py-1.5 rounded-full text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Jadwal</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-4 py-2 rounded-full text-xs font-semibold text-m3-secondary hover:bg-m3-surface-container transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-full text-xs font-bold bg-m3-primary text-m3-on-primary hover:brightness-95 transition-all shadow-xs"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH JADWAL PERKULIAHAN */}
      {isAddScheduleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-m3-outline-variant p-6 w-full max-w-md shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-m3-on-surface">Tambah Jadwal Perkuliahan</h3>
              <button
                type="button"
                onClick={() => setIsAddScheduleOpen(false)}
                className="p-1 rounded-full text-m3-secondary hover:bg-m3-surface-container"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewSchedule} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-m3-on-surface flex items-center gap-1">
                  <CalendarIcon className="w-3.5 h-3.5 text-m3-secondary" />
                  <span>Mata Kuliah</span>
                </label>
                <input
                  type="text"
                  value={newCourse}
                  onChange={(e) => setNewCourse(e.target.value)}
                  placeholder="Contoh: Sistem Operasi"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-m3-surface-container/30 border border-m3-outline text-xs text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-m3-on-surface flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-m3-secondary" />
                    <span>Ruang Kelas</span>
                  </label>
                  <input
                    type="text"
                    value={newRoom}
                    onChange={(e) => setNewRoom(e.target.value)}
                    placeholder="Lab AI Gd. C 302"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-m3-surface-container/30 border border-m3-outline text-xs text-m3-on-surface focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-m3-on-surface flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-m3-secondary" />
                    <span>Hari Kuliah</span>
                  </label>
                  <select
                    value={newDay}
                    onChange={(e) => setNewDay(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-m3-surface-container/30 border border-m3-outline text-xs text-m3-on-surface focus:outline-none capitalize"
                  >
                    {["senin", "selasa", "rabu", "kamis", "jumat", "sabtu"].map((d) => (
                      <option key={d} value={d}>
                        {d.charAt(0).toUpperCase() + d.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-m3-on-surface flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-m3-secondary" />
                  <span>Dosen Pengampu</span>
                </label>
                <input
                  type="text"
                  value={newLecturer}
                  onChange={(e) => setNewLecturer(e.target.value)}
                  placeholder="Dr. Ahmad Fauzi, M.T."
                  className="w-full px-3 py-2 rounded-xl bg-m3-surface-container/30 border border-m3-outline text-xs text-m3-on-surface focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-m3-secondary">Jam Mulai</label>
                  <input
                    type="text"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    placeholder="09.00"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-m3-surface-container/30 border border-m3-outline text-xs text-m3-on-surface focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-m3-secondary">Jam Selesai</label>
                  <input
                    type="text"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    placeholder="11.30"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-m3-surface-container/30 border border-m3-outline text-xs text-m3-on-surface focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-m3-outline-variant/60 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddScheduleOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-m3-secondary hover:bg-m3-surface-container transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full text-xs font-bold bg-m3-primary text-m3-on-primary hover:brightness-95 transition-all shadow-xs"
                >
                  Tambahkan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
