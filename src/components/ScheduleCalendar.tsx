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
  BookOpen,
  Sparkles,
  Camera,
  Loader2,
  ZoomOut,
  AlertCircle,
} from "lucide-react";
import { TaskItem } from "./ActionDeck";
import ImportScheduleModal from "./ImportScheduleModal";

export type CalendarViewMode = "1hari" | "7hari" | "1bulan";

export interface ScheduleItem {
  id: string;
  userId?: string;
  course: string;
  code?: string;
  room?: string;
  startHour: number;
  durationHours: number;
  startTime: string;
  endTime: string;
  lecturer?: string;
  day: string;
  status: "completed" | "active" | "upcoming";
  attendanceStatus?: string;
  classType?: "reguler" | "pindahan";
  specificDate?: string;
  excludedDates?: string[];
  color?: string;
  time?: string;
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
  noAiMode?: boolean;
  semesterStartDate?: string;
  isHomeWidget?: boolean;
}

// Color palettes for distinct courses in calendar views
const getCourseBadgeColor = (courseName: string) => {
  const name = courseName.toLowerCase();
  if (name.includes("buatan") || name.includes("ai")) {
    return "bg-[#9DACFF]/30 text-[#1E293B] border-[#9DACFF] hover:bg-[#9DACFF]/40 dark:bg-indigo-950/70 dark:text-indigo-200 dark:border-indigo-600/60 dark:hover:bg-indigo-950/90";
  }
  if (name.includes("operasi") || name.includes("os")) {
    return "bg-[#5B616A]/20 text-[#1E293B] border-[#5B616A]/40 hover:bg-[#5B616A]/30 dark:bg-slate-800/80 dark:text-slate-200 dark:border-slate-600/60 dark:hover:bg-slate-800";
  }
  if (name.includes("rekayasa") || name.includes("rpl") || name.includes("software")) {
    return "bg-[#CBF7ED] text-[#0F766E] border-[#6EE7B7] hover:bg-[#A7F3D0] dark:bg-emerald-950/70 dark:text-emerald-200 dark:border-emerald-600/60 dark:hover:bg-emerald-950/90";
  }
  if (name.includes("basis data") || name.includes("database")) {
    return "bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-600/60 dark:hover:bg-amber-950/90";
  }
  if (name.includes("jaringan") || name.includes("network")) {
    return "bg-indigo-100 text-indigo-900 border-indigo-200 hover:bg-indigo-200 dark:bg-blue-950/70 dark:text-blue-200 dark:border-blue-600/60 dark:hover:bg-blue-950/90";
  }
  if (name.includes("etika") || name.includes("komunikasi")) {
    return "bg-rose-100 text-rose-900 border-rose-200 hover:bg-rose-200 dark:bg-rose-950/70 dark:text-rose-200 dark:border-rose-600/60 dark:hover:bg-rose-950/90";
  }
  if (name.includes("objek") || name.includes("pbo")) {
    return "bg-purple-100 text-purple-900 border-purple-200 hover:bg-purple-200 dark:bg-purple-950/70 dark:text-purple-200 dark:border-purple-600/60 dark:hover:bg-purple-950/90";
  }
  return "bg-slate-100 text-slate-900 border-slate-300 hover:bg-slate-200 dark:bg-slate-800/90 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-700/80";
};

export const QUICK_COURSE_SUGGESTIONS = [
  "Basis Data",
  "Kecerdasan Buatan",
  "Sistem Operasi",
  "Jaringan Komputer",
  "Rekayasa Perangkat Lunak",
  "Algoritma & Pemrograman",
  "Matematika Diskrit",
  "Metode Numerik",
  "Desain UI/UX",
  "Struktur Data",
];

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
  noAiMode = false,
  semesterStartDate,
  isHomeWidget = false,
}: ScheduleCalendarProps) {
  const [viewMode, setViewMode] = useState<CalendarViewMode>("1hari");

  // Sysdate initialization (mengikuti hari dan tanggal sistem saat ini)
  const weekdayToKey = ["minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"];
  const currentSysDay = weekdayToKey[new Date().getDay()] || "senin";

  const [internalDay, setInternalDay] = useState(currentSysDay);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{ day: string; hour: number } | null>(null);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);

  // Checkbox filters for calendar items
  const [filterCourses, setFilterCourses] = useState(true);
  const [filterTasks, setFilterTasks] = useState(true);
  const [filterAgendas, setFilterAgendas] = useState(true);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [customDragCourse, setCustomDragCourse] = useState("");

  // Add & Import Schedule state
  const [isAddScheduleOpen, setIsAddScheduleOpen] = useState(false);
  const [isImportScheduleOpen, setIsImportScheduleOpen] = useState(false);
  const [newCourse, setNewCourse] = useState("");
  const [newRoom, setNewRoom] = useState("");
  const [newDay, setNewDay] = useState(currentSysDay);
  const [newLecturer, setNewLecturer] = useState("");
  const [newStartTime, setNewStartTime] = useState("08.00");
  const [newEndTime, setNewEndTime] = useState("10.00");
  const [newClassType, setNewClassType] = useState<"reguler" | "pindahan">("reguler");
  const [showAdvancedAdd, setShowAdvancedAdd] = useState(false);

  const [isExtractingPhoto, setIsExtractingPhoto] = useState(false);
  const [extractedCandidates, setExtractedCandidates] = useState<any[]>([]);
  const [photoError, setPhotoError] = useState("");

  const handlePhotoUploadForAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtractingPhoto(true);
    setPhotoError("");
    setExtractedCandidates([]);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("autoSave", "false");

      const res = await fetch("/api/ai/parse-schedule", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal mengekstrak jadwal dari foto.");
      }

      if (data.courses && data.courses.length > 0) {
        setExtractedCandidates(data.courses);
        const first = data.courses[0];
        setNewCourse(first.course || "");
        if (first.day) setNewDay(first.day.toLowerCase());
        if (first.startTime) setNewStartTime(first.startTime);
        if (first.endTime) setNewEndTime(first.endTime);
        if (first.room) setNewRoom(first.room);
        if (first.lecturer) setNewLecturer(first.lecturer);
      } else {
        setPhotoError("Tidak ada mata kuliah yang terdeteksi dalam gambar.");
      }
    } catch (err: any) {
      setPhotoError(err.message || "Gagal memproses gambar jadwal.");
    } finally {
      setIsExtractingPhoto(false);
      e.target.value = "";
    }
  };

  // Base anchor today: Tanggal sistem saat ini (sysdate)
  const BASE_TODAY = new Date();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const monthShort = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Ags", "Sep", "Okt", "Nov", "Des"
  ];
  const dayKeys = ["senin", "selasa", "rabu", "kamis", "jumat", "sabtu", "minggu"];
  const dayLabels = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

  // Monday of the active week
  const getMondayOfWeek = (d: Date) => {
    const copy = new Date(d);
    const day = copy.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    copy.setDate(copy.getDate() + diff);
    return copy;
  };

  const mondayDate = getMondayOfWeek(currentDate);
  const sundayDate = new Date(mondayDate);
  sundayDate.setDate(mondayDate.getDate() + 6);

  // Dynamic 7 days of the active week
  const daysList = dayKeys.map((key, idx) => {
    const d = new Date(mondayDate);
    d.setDate(mondayDate.getDate() + idx);
    const isToday =
      d.getFullYear() === BASE_TODAY.getFullYear() &&
      d.getMonth() === BASE_TODAY.getMonth() &&
      d.getDate() === BASE_TODAY.getDate();

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const yy = String(yyyy).slice(-2);
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const dateFormatted = `${dd}/${mm}/${yy}`;

    return {
      key,
      label: dayLabels[idx],
      date: dateFormatted,
      dayNum: d.getDate(),
      fullDate: d,
      dateStr,
      isToday,
    };
  });

  const dayKeyToDateStr: Record<string, string> = Object.fromEntries(
    daysList.map((d) => [d.key, d.dateStr])
  );

  const activeDayKey = weekdayToKey[currentDate.getDay()] || "kamis";
  const selectedDay = propSelectedDay !== undefined ? propSelectedDay : activeDayKey;
  const setSelectedDay = propOnSelectDay || setInternalDay;

  const currentDayIndex = dayKeys.indexOf(selectedDay);
  const activeDayObj = daysList[currentDayIndex >= 0 ? currentDayIndex : 3];

  const getTaskHour = (t: TaskItem): number => {
    const match = (t.deadlineLabel || "").match(/(\d{1,2})[:.](\d{2})/);
    if (match) {
      const h = parseInt(match[1], 10);
      if (h === 24) return 0;
      return Math.min(Math.max(h, 0), 23);
    }
    return 0;
  };

  // Navigation handlers (tombol kanan kiri):
  // 1 hari lompat 1 hari, 7 hari lompat 7 hari, 1 bulan lompat 1 bulan
  const handlePrevDay = () => {
    const nextDate = new Date(currentDate);
    if (viewMode === "1hari") {
      nextDate.setDate(currentDate.getDate() - 1);
    } else if (viewMode === "7hari") {
      nextDate.setDate(currentDate.getDate() - 7);
    } else {
      nextDate.setMonth(currentDate.getMonth() - 1);
    }
    setCurrentDate(nextDate);
    const dayKey = weekdayToKey[nextDate.getDay()];
    if (propOnSelectDay) {
      propOnSelectDay(dayKey);
    } else {
      setInternalDay(dayKey);
    }
  };

  const handleNextDay = () => {
    const nextDate = new Date(currentDate);
    if (viewMode === "1hari") {
      nextDate.setDate(currentDate.getDate() + 1);
    } else if (viewMode === "7hari") {
      nextDate.setDate(currentDate.getDate() + 7);
    } else {
      nextDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(nextDate);
    const dayKey = weekdayToKey[nextDate.getDay()];
    if (propOnSelectDay) {
      propOnSelectDay(dayKey);
    } else {
      setInternalDay(dayKey);
    }
  };

  const handleJumpToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    const dayKey = weekdayToKey[today.getDay()] || "senin";
    if (propOnSelectDay) {
      propOnSelectDay(dayKey);
    } else {
      setInternalDay(dayKey);
    }
  };

  // State for date-context when editing / deleting a single occurrence
  const [editingDateContext, setEditingDateContext] = useState<string>("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isZoomFit, setIsZoomFit] = useState(true);
  const [quickAddCourse, setQuickAddCourse] = useState("");

  // Dynamic filter for schedules on a specific date (handling recurring vs single instance vs exclusions)
  const getSchedulesForDate = (dateStr: string, dayKey: string): ScheduleItem[] => {
    if (!filterCourses) return [];
    return schedules.filter((s) => {
      // 1. Single-instance schedule with specific date
      if (s.specificDate) {
        return s.specificDate === dateStr;
      }
      // 2. Regular recurring weekly schedule
      if (s.day.toLowerCase() === dayKey.toLowerCase()) {
        if (s.excludedDates && s.excludedDates.includes(dateStr)) {
          return false;
        }
        return true;
      }
      return false;
    });
  };

  // Check if current view is looking at today
  const isViewingToday = (() => {
    if (viewMode === "1hari") {
      return (
        currentDate.getFullYear() === BASE_TODAY.getFullYear() &&
        currentDate.getMonth() === BASE_TODAY.getMonth() &&
        currentDate.getDate() === BASE_TODAY.getDate()
      );
    }
    if (viewMode === "7hari") {
      return BASE_TODAY >= mondayDate && BASE_TODAY <= sundayDate;
    }
    return (
      currentDate.getFullYear() === BASE_TODAY.getFullYear() &&
      currentDate.getMonth() === BASE_TODAY.getMonth()
    );
  })();

  const isSelectedDateToday =
    currentDate.getFullYear() === BASE_TODAY.getFullYear() &&
    currentDate.getMonth() === BASE_TODAY.getMonth() &&
    currentDate.getDate() === BASE_TODAY.getDate();

  // Academic week estimation
  const semesterStart = semesterStartDate
    ? new Date(semesterStartDate)
    : new Date(2026, 8, 7);
  const diffWeeks = Math.floor((mondayDate.getTime() - semesterStart.getTime()) / (7 * 86400000)) + 1;

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
    const rawData = e.dataTransfer.getData("text/plain") || draggedItemId || "";
    if (rawData.startsWith("new-course:")) {
      const courseName = rawData.replace("new-course:", "").trim();
      if (courseName && onAddSchedule) {
        const startFormatted = `${String(hour).padStart(2, "0")}.00`;
        const endHour = Math.min(23, hour + 2);
        const endFormatted = `${String(endHour).padStart(2, "0")}.40`;
        const newSched: ScheduleItem = {
          id: `sch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          course: courseName,
          code: "",
          room: "R. Kuliah",
          day: day,
          lecturer: "Dosen Pengampu",
          startTime: startFormatted,
          endTime: endFormatted,
          startHour: hour,
          durationHours: 2,
          status: "upcoming",
          attendanceStatus: "pending",
          classType: "reguler",
        };
        onAddSchedule(newSched);
      }
    } else if (rawData) {
      onReschedule(rawData, hour, day);
    }
    setDraggedItemId(null);
  };

  // Click to open edit popover/modal with date context
  const handleCardClick = (e: React.MouseEvent, item: ScheduleItem, targetDateStr?: string) => {
    if (draggedItemId) return;
    setEditingItem({ ...item });
    setEditingDateContext(targetDateStr || "");
    setShowDeleteConfirm(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    // Jika pengguna mengubah jadwal rutin menjadi pindahan dosen pada tanggal spesifik
    if (editingDateContext && !editingItem.specificDate && editingItem.classType === "pindahan") {
      // 1. Kecualikan tanggal ini dari jadwal rutin mingguan
      const nextExcluded = Array.from(new Set([...(editingItem.excludedDates || []), editingDateContext]));
      if (onUpdateSchedule) {
        onUpdateSchedule(editingItem.id, { excludedDates: nextExcluded });
      }

      // 2. Buat jadwal baru berstatus 'pindahan' khusus untuk tanggal ini
      const newPindahan: ScheduleItem = {
        ...editingItem,
        id: `sch-pindahan-${Date.now()}`,
        specificDate: editingDateContext,
        classType: "pindahan",
      };
      if (onAddSchedule) {
        onAddSchedule(newPindahan);
      }
    } else {
      if (onUpdateSchedule) {
        onUpdateSchedule(editingItem.id, editingItem);
      }
    }

    setEditingItem(null);
    setShowDeleteConfirm(false);
  };

  const handleDeleteSchedule = (id: string) => {
    if (onDeleteSchedule) {
      onDeleteSchedule(id);
    }
    setEditingItem(null);
    setShowDeleteConfirm(false);
  };

  const handleDeleteOnlyThisDate = (id: string, dateStr: string) => {
    if (!editingItem) return;
    const nextExcluded = Array.from(new Set([...(editingItem.excludedDates || []), dateStr]));
    if (onUpdateSchedule) {
      onUpdateSchedule(id, { excludedDates: nextExcluded });
    }
    setEditingItem(null);
    setShowDeleteConfirm(false);
  };

  const handleSaveNewSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.trim()) return;
    const parsedHour = parseInt(newStartTime.split(".")[0], 10) || 9;
    const newSched: ScheduleItem = {
      id: `sch-${Date.now()}`,
      course: newCourse.trim(),
      code: "",
      room: newRoom.trim() || "-",
      day: newDay,
      lecturer: newLecturer.trim() || "-",
      startTime: newStartTime.trim() || "09.00",
      endTime: newEndTime.trim() || "11.30",
      startHour: parsedHour,
      durationHours: 2,
      status: "upcoming",
      attendanceStatus: "pending",
      classType: newClassType,
    };
    if (onAddSchedule) {
      onAddSchedule(newSched);
    }
    setIsAddScheduleOpen(false);
    setNewCourse("");
    setNewRoom("");
    setNewLecturer("");
  };

  const handleQuickAdd = () => {
    if (!quickAddCourse.trim()) return;
    const newSched: ScheduleItem = {
      id: `sch-${Date.now()}`,
      course: quickAddCourse.trim(),
      code: "",
      room: "-",
      day: selectedDay,
      lecturer: "-",
      startTime: "09.00",
      endTime: "11.30",
      startHour: 9,
      durationHours: 2,
      status: "upcoming",
      attendanceStatus: "pending",
      classType: "reguler",
    };
    if (onAddSchedule) {
      onAddSchedule(newSched);
    }
    setQuickAddCourse("");
  };

  // Base active hours range: 05:00 s.d. 20:00 (jam 5 pagi sampai jam 8 malam)
  const baseStartHour = 5;
  const baseEndHour = 20;

  // Active date string for 1-day view
  const current1DayDateStr = activeDayObj?.dateStr || dayKeyToDateStr[selectedDay] || "";
  const daySchedules = getSchedulesForDate(current1DayDateStr, selectedDay);

  // 1-Day View: Dynamic hours (05:00 - 20:00, ditambah jam luar jika ada jadwal atau tenggat seperti jam 23:00 / 11 malam)
  const dayTasksList = tasks.filter((t) => {
    const isDay =
      t.deadlineDate.startsWith(dayKeyToDateStr[selectedDay] || "") ||
      t.deadlineDate.toLowerCase().includes(selectedDay);
    return isDay;
  });
  const dayTaskHours = new Set(dayTasksList.map(getTaskHour));
  const dayScheduleHours = new Set(daySchedules.map((s) => s.startHour));

  const hours1Day = Array.from({ length: 24 }, (_, i) => i).filter((h) => {
    if (!isHomeWidget) return true;
    if (h >= baseStartHour && h <= baseEndHour) return true;
    return dayScheduleHours.has(h) || dayTaskHours.has(h);
  });

  // 7-Day Matrix View: Dynamic hours (05:00 - 20:00 jika di widget Home, penuh 24 jam jika di tab Kalender)
  const weeklyTaskHours = new Set(tasks.map(getTaskHour));
  const weeklyScheduleHours = new Set(schedules.map((s) => s.startHour));

  const matrixHours = Array.from({ length: 24 }, (_, i) => i).filter((h) => {
    if (!isHomeWidget) return true;
    if (h >= baseStartHour && h <= baseEndHour) return true;
    return weeklyScheduleHours.has(h) || weeklyTaskHours.has(h);
  });

  return (
    <div
      className="bg-m3-surface-container-low border border-m3-outline-variant rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs flex flex-col relative flex-1 h-full min-h-[620px]"
    >
      {/* Top Header: Controls with Prev/Next Navigation (Tombol Kanan Kiri) + View Mode */}
      <div className="flex flex-col gap-3 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-m3-on-surface">Jadwal Perkuliahan</h3>
          </div>

          {/* View Mode Pills (1 Hari, 7 Hari, 1 Bulan) + Zoom Fit */}
          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            <div className="flex items-center gap-1 bg-m3-surface-container p-1 rounded-full border border-m3-outline-variant">
              <button
                onClick={() => setViewMode("1hari")}
                className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === "1hari"
                    ? "bg-m3-primary text-m3-on-primary shadow-xs"
                    : "text-m3-secondary hover:text-m3-on-surface"
                }`}
              >
                1 Hari
              </button>
              <button
                onClick={() => setViewMode("7hari")}
                className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === "7hari"
                    ? "bg-m3-primary text-m3-on-primary shadow-xs"
                    : "text-m3-secondary hover:text-m3-on-surface"
                }`}
              >
                7 Hari
              </button>
              <button
                onClick={() => setViewMode("1bulan")}
                className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === "1bulan"
                    ? "bg-m3-primary text-m3-on-primary shadow-xs"
                    : "text-m3-secondary hover:text-m3-on-surface"
                }`}
              >
                1 Bulan
              </button>
            </div>

            {(viewMode === "1hari" || viewMode === "7hari") && (
              <button
                type="button"
                onClick={() => setIsZoomFit(!isZoomFit)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                  isZoomFit
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                    : "bg-m3-surface-container text-m3-secondary hover:text-m3-on-surface border-m3-outline-variant"
                }`}
                title={isZoomFit ? "Kembali ke tampilan standar" : "Muat 24 jam tanpa scroll (Zoom Fit)"}
              >
                <ZoomOut className="w-3.5 h-3.5" />
                <span>{isZoomFit ? "Normal" : "Zoom Fit"}</span>
              </button>
            )}
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
                  {activeDayObj.label}, {activeDayObj.date} {currentDate.getFullYear()}
                </span>
                {isSelectedDateToday && (
                  <span className="text-xs font-normal text-m3-secondary">
                    (Hari ini)
                  </span>
                )}
              </div>
            )}

            {viewMode === "7hari" && (
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-m3-on-surface">
                  Pekan: {String(mondayDate.getDate()).padStart(2, "0")}/{String(mondayDate.getMonth() + 1).padStart(2, "0")}/{String(mondayDate.getFullYear()).slice(-2)} – {String(sundayDate.getDate()).padStart(2, "0")}/{String(sundayDate.getMonth() + 1).padStart(2, "0")}/{String(sundayDate.getFullYear()).slice(-2)}
                </span>
                {diffWeeks >= 1 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-m3-secondary-container text-m3-on-secondary-container">
                    Minggu {diffWeeks}
                  </span>
                )}
              </div>
            )}

            {viewMode === "1bulan" && (
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-m3-on-surface">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
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

          {/* Right Action Bar: Hari Ini (di samping KIRI filter) + Filter Dropdown + Tambah Jadwal */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Jump: Di samping kiri Filter (tanpa emoji) */}
            {!isViewingToday && (
              <button
                type="button"
                onClick={handleJumpToToday}
                className="text-[11px] font-bold px-3 py-1 rounded-full bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-700 transition-all shadow-xs active:scale-95"
                title={`Lompat kembali ke ${viewMode === "1hari" ? "Hari Ini" : viewMode === "7hari" ? "Minggu Ini" : "Bulan Ini"}`}
              >
                <span>{viewMode === "1hari" ? "Hari Ini" : viewMode === "7hari" ? "Minggu Ini" : "Bulan Ini"}</span>
              </button>
            )}

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


            {/* Tombol Impor Jadwal AI (Hanya jika jadwal masih kosong dan AI mode aktif) */}
            {!noAiMode && schedules.length === 0 && (
              <button
                type="button"
                onClick={() => setIsImportScheduleOpen(true)}
                className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-all shadow-2xs"
                title="Unggah berkas PDF atau foto jadwal kuliah untuk diekstrak otomatis"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Impor AI</span>
              </button>
            )}

            {/* Tombol + Tambah Jadwal */}
            <button
              type="button"
              onClick={() => {
                setExtractedCandidates([]);
                setPhotoError("");
                setIsAddScheduleOpen(true);
              }}
              className="flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-m3-primary text-m3-on-primary hover:brightness-95 transition-all shadow-xs cursor-pointer"
              title="Tambah Jadwal Perkuliahan Baru"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Jadwal</span>
            </button>
          </div>
        </div>
      </div>

      {/* BANNER JIKA JADWAL KOSONG */}
      {schedules.length === 0 && (
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-dashed border-m3-outline-variant text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h4 className="text-sm font-bold text-m3-on-surface">Jadwal Perkuliahan Masih Kosong</h4>
            <p className="text-xs text-m3-secondary leading-relaxed">
              Mulai isi jadwal Anda dengan menambahkan manual satu per satu, atau gunakan fitur Impor AI untuk mengekstrak langsung dari berkas PDF atau foto jadwal kuliah Anda.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => setIsImportScheduleOpen(true)}
              className="px-4 py-2 rounded-full text-xs font-bold bg-m3-primary text-m3-on-primary hover:brightness-95 transition-all shadow-xs flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>✨ Impor Jadwal AI (PDF / Gambar)</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAddScheduleOpen(true)}
              className="px-4 py-2 rounded-full text-xs font-semibold bg-m3-surface-container hover:bg-m3-surface-container-high text-m3-on-surface border border-m3-outline-variant transition-colors"
            >
              + Tambah Manual
            </button>
          </div>
        </div>
      )}

      {/* VIEW 1: 1 HARI (24 JAM 00.00 - 23.00 WIB) */}
      {viewMode === "1hari" && (
        <div className="flex-1 flex flex-col min-h-0 space-y-2">
          {/* 24 Jam Drag & Drop Container */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-1 border border-m3-outline-variant/60 rounded-2xl p-2 bg-m3-surface-container/20">
            {hours1Day.map((hour) => {
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
                      ? "border-2 border-dashed border-m3-primary bg-m3-primary-container/30 min-h-[36px] py-1 rounded-xl"
                      : hasItems
                      ? `border-m3-outline-variant/60 bg-white shadow-xs rounded-xl ${isZoomFit ? "min-h-[26px] py-0.5" : "min-h-[44px] py-1.5"}`
                      : `hover:bg-white/60 ${isZoomFit ? "min-h-[19px] py-0" : "min-h-[26px] py-0.5"}`
                  }`}
                >
                  <div
                    className={`w-10 text-[10px] font-bold text-m3-secondary flex-shrink-0 text-right ${
                      hasItems ? (isZoomFit ? "pt-0.5" : "pt-1") : "pt-0.5"
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
                        onClick={(e) => handleCardClick(e, item, current1DayDateStr)}
                        className={`rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer active:cursor-grabbing transition-all hover:shadow-xs group ${
                          isZoomFit ? "p-1 px-2 text-[10px]" : "p-2 text-xs"
                        } ${
                          item.status === "active"
                            ? "bg-m3-primary-container border-m3-primary"
                            : "bg-m3-surface-container border-m3-outline-variant hover:border-m3-secondary"
                        }`}
                        title="Klik untuk mengedit detail kelas"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {!isZoomFit && (
                            <GripVertical className="w-3.5 h-3.5 text-m3-secondary flex-shrink-0 opacity-60 group-hover:opacity-100" />
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-m3-on-surface truncate">
                                {item.course}
                              </span>
                              {item.classType === "pindahan" && (
                                <span className="text-[8px] font-bold px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-900 border border-amber-300 flex-shrink-0">
                                  Pindahan Dosen
                                </span>
                              )}
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-m3-surface-container-low text-m3-secondary">
                                {item.startTime} - {item.endTime} WIB
                              </span>
                            </div>
                            {!isZoomFit && (
                              <p className="text-[10px] text-m3-secondary truncate">
                                {item.room || "-"} • {item.lecturer || "-"}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[9px] font-semibold text-m3-secondary bg-m3-surface-container-low px-2 py-0.5 rounded-md flex items-center gap-1 group-hover:text-m3-primary transition-colors">
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </span>
                        </div>
                      </div>
                    ))}

                    {matchedTasks.map((t) => {
                      const isUlangan = t.taskType === "ulangan";
                      const isKuis = t.taskType === "kuis";
                      const tagLabel = isUlangan ? "Ulangan" : isKuis ? "Kuis" : "Tugas";
                      const tagClass = isUlangan
                        ? "border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-700/60 dark:bg-rose-950/60 dark:text-rose-200"
                        : isKuis
                        ? "border-purple-300 bg-purple-50 text-purple-900 dark:border-purple-700/60 dark:bg-purple-950/60 dark:text-purple-200"
                        : "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/60 dark:text-amber-200";
                      const badgeBg = isUlangan
                        ? "bg-rose-200 text-rose-900 dark:bg-rose-900/80 dark:text-rose-100"
                        : isKuis
                        ? "bg-purple-200 text-purple-900 dark:bg-purple-900/80 dark:text-purple-100"
                        : "bg-amber-200 text-amber-900 dark:bg-amber-900/80 dark:text-amber-100";

                      return (
                        <div
                          key={t.id}
                          className={`rounded-xl border flex items-center justify-between gap-2 ${tagClass} ${
                            isZoomFit ? "p-1 px-2 text-[10px]" : "p-1.5 px-2.5 text-xs"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded flex-shrink-0 ${badgeBg}`}>
                              {tagLabel}
                            </span>
                            <span className="font-bold truncate">{t.title}</span>
                            <span className="text-[10px] opacity-75 truncate">({t.course})</span>
                          </div>
                          <span className="text-[9px] font-semibold px-2 py-0.2 rounded-full bg-white/80 dark:bg-slate-900/80 text-m3-on-surface border border-black/10 dark:border-white/10 flex-shrink-0">
                            {t.deadlineLabel || "23:59"}
                          </span>
                        </div>
                      );
                    })}

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
          <div className="flex-1 overflow-x-auto overflow-y-auto touch-pan-x touch-pan-y">
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

              {/* TUGAS, ULANGAN & KUIS ROW DALAM MATRIKS 7 HARI (JIKA FILTER TUGAS AKTIF) */}
              {filterTasks && (
                <div className="flex border-b-2 border-amber-200/90 bg-amber-50/50 min-h-[34px]">
                  <div className="w-16 p-1 border-r border-m3-outline-variant flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-amber-800 bg-amber-100/70">
                    Agenda
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
                          dayTasks.map((t) => {
                            const isUlangan = t.taskType === "ulangan";
                            const isKuis = t.taskType === "kuis";
                            const typeLabel = isUlangan ? "Ulangan" : isKuis ? "Kuis" : "Tugas";
                            const tagStyle = isUlangan
                              ? "bg-rose-100 text-rose-900 border-rose-300"
                              : isKuis
                              ? "bg-purple-100 text-purple-900 border-purple-300"
                              : "bg-amber-100 text-amber-900 border-amber-300";

                            return (
                              <div
                                key={t.id}
                                className={`w-full p-0.5 px-1.5 rounded text-[8px] font-bold truncate flex items-center justify-between gap-1 shadow-2xs ${
                                  t.completed
                                    ? "bg-slate-100 text-slate-400 line-through border border-slate-200"
                                    : tagStyle
                                }`}
                                title={`${typeLabel}: ${t.title} (${t.course}) - ${t.deadlineLabel}`}
                              >
                                <span className="truncate">[{typeLabel}] {t.title}</span>
                                <span className="text-[7px] opacity-75 flex-shrink-0">
                                  {t.deadlineLabel || "23:59"}
                                </span>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center text-[9px] text-slate-300 select-none">—</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ROWS: JAM DI SAMPING KIRI (00.00 s.d. 23.00 - DENSITY ADJUSTABLE VIA ZOOM FIT) */}
              {matrixHours.map((hour) => {
                const hourLabel = `${String(hour).padStart(2, "0")}.00`;

                return (
                  <div
                    key={hour}
                    className={`flex border-b border-black/[0.03] hover:bg-slate-50/40 transition-colors ${
                      isZoomFit ? "min-h-[20px]" : "min-h-[38px]"
                    }`}
                  >
                    {/* Sticky Jam di Samping */}
                    <div
                      className={`w-14 sm:w-16 p-0.5 border-r border-black/[0.03] flex-shrink-0 flex items-center justify-center font-bold text-m3-secondary bg-m3-surface-container/20 ${
                        isZoomFit ? "text-[8px]" : "text-[10px]"
                      }`}
                    >
                      {hourLabel}
                    </div>

                    {/* 7 Sel Hari untuk Jam Ini */}
                    {daysList.map((d) => {
                      const classesForDay = getSchedulesForDate(d.dateStr, d.key);
                      const classInCell = filterCourses
                        ? classesForDay.find((s) => s.startHour === hour)
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
                              onClick={(e) => handleCardClick(e, classInCell, d.dateStr)}
                              className={`w-full rounded text-[8px] font-bold shadow-2xs cursor-pointer active:cursor-grabbing hover:brightness-95 flex border transition-all ${
                                isZoomFit
                                  ? "p-0.5 px-1 items-center justify-between leading-none"
                                  : "p-1 text-[9px] flex-col justify-between"
                              } ${badgeColor}`}
                              title={`${classInCell.course} (${classInCell.startTime}-${classInCell.endTime}) - Klik untuk edit`}
                            >
                              <div className="flex items-center justify-between gap-0.5 w-full">
                                <span className="truncate leading-tight font-extrabold">{classInCell.course}</span>
                                {classInCell.classType === "pindahan" && (
                                  <span className="text-[7px] px-1 py-0.2 rounded bg-amber-600 text-white font-bold flex-shrink-0">
                                    {isZoomFit ? "P" : "Pindahan"}
                                  </span>
                                )}
                              </div>
                              {!isZoomFit && (
                                <div className="flex items-center justify-between text-[8px] opacity-80 pt-0.5">
                                  <span>{classInCell.room ? classInCell.room.split("-")[0] : "-"}</span>
                                  <span>{classInCell.startTime}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {tasksInCell.map((t) => {
                            const isUlangan = t.taskType === "ulangan";
                            const isKuis = t.taskType === "kuis";
                            const tagLabel = isUlangan ? "[Ulangan]" : isKuis ? "[Kuis]" : "[Tugas]";
                            const tagStyle = isUlangan
                              ? "bg-rose-100 text-rose-800 border-rose-300"
                              : isKuis
                              ? "bg-purple-100 text-purple-800 border-purple-300"
                              : "bg-amber-100 text-amber-900 border-amber-300";

                            return (
                              <div
                                key={t.id}
                                className={`w-full p-0.5 px-1 rounded text-[8px] font-bold border truncate ${tagStyle}`}
                                title={`${tagLabel} ${t.title}`}
                              >
                                {tagLabel} {t.title}
                              </div>
                            );
                          })}

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

            {/* Calendar Cells for currentDate's month */}
            {(() => {
              const calYear = currentDate.getFullYear();
              const calMonth = currentDate.getMonth();
              const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay(); // 0 is Min, 1 is Sen...
              const totalDaysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
              const prevMonthTotalDays = new Date(calYear, calMonth, 0).getDate();

              const prevMonthDays = Array.from({ length: firstDayOfWeek }, (_, i) => ({
                d: prevMonthTotalDays - firstDayOfWeek + 1 + i,
                isCurr: false,
              }));

              const nextMonthDaysCount = (7 - ((firstDayOfWeek + totalDaysInMonth) % 7)) % 7;
              const nextMonthDays = Array.from({ length: nextMonthDaysCount }, (_, i) => ({
                d: i + 1,
                isCurr: false,
              }));

              return (
                <div className="grid grid-cols-7 flex-1 min-h-[360px]">
                  {/* Previous month trailing days */}
                  {prevMonthDays.map((item, i) => (
                    <div
                      key={`prev-${i}`}
                      className="border-b border-r border-m3-outline-variant/60 p-1.5 min-h-[72px] bg-slate-50/50"
                    >
                      <span className="text-[11px] text-m3-secondary/40 font-medium">{item.d}</span>
                    </div>
                  ))}

                  {/* Current month days */}
                  {Array.from({ length: totalDaysInMonth }, (_, i) => i + 1).map((date) => {
                    const isToday =
                      calYear === BASE_TODAY.getFullYear() &&
                      calMonth === BASE_TODAY.getMonth() &&
                      date === BASE_TODAY.getDate();

                    const jsDate = new Date(calYear, calMonth, date);
                    const dayIndex = jsDate.getDay();
                    const dayKey = weekdayToKey[dayIndex];

                    const datePadded = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
                    const dayClasses = filterCourses ? getSchedulesForDate(datePadded, dayKey) : [];
                    const dayTasks = filterTasks
                      ? tasks.filter((t) => t.deadlineDate.startsWith(datePadded) || t.deadlineDate.toLowerCase().includes(datePadded))
                      : [];

                    return (
                      <div
                        key={`curr-${date}`}
                        onClick={() => {
                          const clickedDate = new Date(calYear, calMonth, date);
                          setCurrentDate(clickedDate);
                          if (propOnSelectDay) {
                            propOnSelectDay(dayKey);
                          }
                        }}
                        className="border-b border-r border-m3-outline-variant/60 p-1.5 min-h-[72px] flex flex-col justify-between hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center justify-between">
                          {isToday ? (
                            <span className="w-5 h-5 rounded-full bg-m3-primary text-m3-on-primary text-[11px] font-bold flex items-center justify-center">
                              {date}
                            </span>
                          ) : (
                            <span className="text-[11px] text-m3-on-surface font-medium group-hover:font-bold">
                              {date === 1 ? `${date} ${monthShort[calMonth]}` : date}
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
                                  handleCardClick(e, cl, datePadded);
                                }}
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold truncate border transition-colors flex items-center justify-between gap-1 ${
                                  cl.classType === "pindahan"
                                    ? "bg-amber-100 text-amber-900 border-amber-300"
                                    : badgeColor
                                }`}
                                title={`${cl.course} (${cl.startTime} - ${cl.endTime} WIB) - Klik untuk edit`}
                              >
                                <span className="truncate">{cl.course}</span>
                                {cl.classType === "pindahan" && (
                                  <span className="text-[7px] px-1 rounded bg-amber-600 text-white font-semibold flex-shrink-0">
                                    Pindahan
                                  </span>
                                )}
                              </div>
                            );
                          })}

                          {dayTasks.map((tk) => {
                            const isUlangan = tk.taskType === "ulangan";
                            const isKuis = tk.taskType === "kuis";
                            const tagLabel = isUlangan ? "Ulangan" : isKuis ? "Kuis" : "Tugas";
                            const tagStyle = isUlangan
                              ? "bg-rose-100 text-rose-800 border-rose-200"
                              : isKuis
                              ? "bg-purple-100 text-purple-800 border-purple-200"
                              : "bg-amber-100 text-amber-900 border-amber-200";

                            return (
                              <div
                                key={tk.id}
                                className={`px-1.5 py-0.5 rounded text-[8px] font-bold truncate border ${tagStyle}`}
                                title={`${tagLabel}: ${tk.title}`}
                              >
                                {tagLabel}: {tk.title}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* Next month leading days */}
                  {nextMonthDays.map((item, i) => (
                    <div
                      key={`next-${i}`}
                      className="border-b border-r border-m3-outline-variant/60 p-1.5 min-h-[72px] bg-slate-50/50"
                    >
                      <span className="text-[11px] text-m3-secondary/40 font-medium">{item.d}</span>
                    </div>
                  ))}
                </div>
              );
            })()}
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
                <h3 className="text-base font-bold text-m3-on-surface">Detail & Edit Jadwal</h3>
                <p className="text-xs text-indigo-700 font-bold mt-0.5">
                  {diffWeeks >= 1 ? `Minggu ke-${diffWeeks} Perkuliahan` : "Periode Pra-Semester"}
                </p>
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
              {/* Tipe Jadwal */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-m3-on-surface">Tipe Jadwal</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingItem({ ...editingItem, classType: "reguler" })}
                    className={`py-1.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                      editingItem.classType !== "pindahan"
                        ? "bg-m3-primary text-m3-on-primary border-m3-primary"
                        : "bg-m3-surface-container text-m3-secondary border-m3-outline-variant hover:bg-m3-surface-container-high"
                    }`}
                  >
                    Jadwal Reguler
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingItem({ ...editingItem, classType: "pindahan" })}
                    className={`py-1.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                      editingItem.classType === "pindahan"
                        ? "bg-amber-600 text-white border-amber-600"
                        : "bg-m3-surface-container text-m3-secondary border-m3-outline-variant hover:bg-m3-surface-container-high"
                    }`}
                  >
                    Pindahan Dosen
                  </button>
                </div>
              </div>

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
                    value={editingItem.room || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, room: e.target.value })}
                    placeholder="Contoh: Lab Komputer 1 (opsional)"
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
                  <span>Dosen Pengampu (Opsional)</span>
                </label>
                <input
                  type="text"
                  value={editingItem.lecturer || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, lecturer: e.target.value })}
                  placeholder="Nama Dosen (opsional)"
                  className="w-full px-3 py-2 rounded-xl bg-m3-surface-container border border-m3-outline text-xs text-m3-on-surface focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-m3-secondary">Jam Mulai</label>
                  <input
                    type="time"
                    value={editingItem.startTime ? editingItem.startTime.replace(".", ":") : "09:00"}
                    onChange={(e) => {
                      const val = e.target.value;
                      const parsedHour = parseInt(val.split(":")[0], 10) || editingItem.startHour;
                      setEditingItem({
                        ...editingItem,
                        startTime: val.replace(":", "."),
                        startHour: parsedHour,
                      });
                    }}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-m3-surface-container border border-m3-outline text-xs text-m3-on-surface focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-m3-secondary">Jam Selesai</label>
                  <input
                    type="time"
                    value={editingItem.endTime ? editingItem.endTime.replace(".", ":") : "11:30"}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingItem({
                        ...editingItem,
                        endTime: val.replace(":", "."),
                      });
                    }}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-m3-surface-container border border-m3-outline text-xs text-m3-on-surface focus:outline-none"
                  />
                </div>
              </div>

              {showDeleteConfirm ? (
                <div className="pt-3 border-t border-rose-200 bg-rose-50/80 p-3.5 rounded-2xl space-y-2.5 animate-in fade-in">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>Konfirmasi Penghapusan Jadwal</span>
                  </div>
                  <p className="text-[11px] text-rose-700 leading-relaxed">
                    Pilih cakupan jadwal yang ingin Anda hapus:
                  </p>
                  <div className="flex flex-col gap-2 pt-1">
                    {editingDateContext && !editingItem.specificDate && (
                      <button
                        type="button"
                        onClick={() => handleDeleteOnlyThisDate(editingItem.id, editingDateContext)}
                        className="w-full py-2 px-3 rounded-xl bg-white hover:bg-rose-100/80 text-rose-700 border border-rose-300 text-xs font-bold text-left transition-colors flex items-center justify-between"
                      >
                        <span>🗑️ Hapus Hanya Pertemuan Ini</span>
                        <span className="text-[10px] font-semibold text-rose-500">{editingDateContext}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteSchedule(editingItem.id)}
                      className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold text-left transition-colors flex items-center justify-between"
                    >
                      <span>
                        {editingItem.specificDate
                          ? "Hapus Jadwal Ini"
                          : "Hapus Seluruh Jadwal Rutin (Semua Pekan)"}
                      </span>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="w-full py-1.5 px-3 text-center text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-3 border-t border-m3-outline-variant/60 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-3.5 py-1.5 rounded-full text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Jadwal</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingItem(null)}
                      className="px-4 py-2 rounded-full text-xs font-semibold text-m3-secondary hover:bg-m3-surface-container transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-full text-xs font-bold bg-m3-primary text-m3-on-primary hover:brightness-95 transition-all shadow-xs cursor-pointer"
                    >
                      Simpan Perubahan
                    </button>
                  </div>
                </div>
              )}
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
            {/* Quick Autofill from Photo / Image (Hanya jika mode AI aktif) */}
            {!noAiMode && (
              <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-900 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Isi dari Foto / Gambar Jadwal</span>
                  </span>
                  <label className="cursor-pointer px-3 py-1 rounded-full bg-white hover:bg-indigo-100 border border-indigo-300 text-indigo-700 text-[10px] font-bold shadow-2xs transition-all flex items-center gap-1">
                    {isExtractingPhoto ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                        <span>Menganalisis...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 text-indigo-600" />
                        <span>Pilih Foto</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      disabled={isExtractingPhoto}
                      onChange={handlePhotoUploadForAdd}
                      className="hidden"
                    />
                  </label>
                </div>

                {photoError && (
                  <p className="text-[10px] text-rose-600 font-medium">{photoError}</p>
                )}

                {extractedCandidates.length > 1 && (
                  <div className="pt-1.5 border-t border-indigo-200/60 space-y-1">
                    <p className="text-[10px] font-medium text-indigo-800">
                      Ditemukan {extractedCandidates.length} mata kuliah dari gambar. Klik untuk memilih:
                    </p>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                      {extractedCandidates.map((c, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setNewCourse(c.course || "");
                            if (c.day) setNewDay(c.day.toLowerCase());
                            if (c.startTime) setNewStartTime(c.startTime);
                            if (c.endTime) setNewEndTime(c.endTime);
                            if (c.room) setNewRoom(c.room);
                            if (c.lecturer) setNewLecturer(c.lecturer);
                          }}
                          className={`text-[9px] font-semibold px-2 py-0.5 rounded-md border transition-all ${
                            newCourse === c.course
                              ? "bg-indigo-600 text-white border-indigo-600"
                              : "bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                          }`}
                        >
                          {c.course} ({c.day} {c.startTime})
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSaveNewSchedule} className="space-y-3.5 text-xs">
              {/* 1. Nama Mata Kuliah (Utama & Cepat) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-m3-on-surface flex items-center gap-1">
                  <CalendarIcon className="w-3.5 h-3.5 text-m3-primary" />
                  <span>Nama Mata Kuliah</span>
                </label>
                <input
                  type="text"
                  value={newCourse}
                  onChange={(e) => setNewCourse(e.target.value)}
                  placeholder="Ketik nama mata kuliah (Contoh: Basis Data)..."
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl bg-m3-surface-container/40 border border-m3-outline text-xs text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary font-medium"
                />
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                  <span className="text-[10px] text-m3-secondary flex-shrink-0">Saran:</span>
                  {QUICK_COURSE_SUGGESTIONS.slice(0, 5).map((sugg) => (
                    <button
                      key={sugg}
                      type="button"
                      onClick={() => setNewCourse(sugg)}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border transition-colors flex-shrink-0 cursor-pointer ${
                        newCourse === sugg
                          ? "bg-m3-primary text-m3-on-primary border-m3-primary"
                          : "bg-m3-surface-container hover:bg-m3-surface-container-high text-m3-on-surface-variant border-m3-outline-variant/60"
                      }`}
                    >
                      {sugg}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Tipe Jadwal */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-m3-on-surface">Tipe Jadwal</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewClassType("reguler")}
                    className={`py-1.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      newClassType === "reguler"
                        ? "bg-m3-primary text-m3-on-primary border-m3-primary"
                        : "bg-m3-surface-container text-m3-secondary border-m3-outline-variant hover:bg-m3-surface-container-high"
                    }`}
                  >
                    Jadwal Reguler
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewClassType("pindahan")}
                    className={`py-1.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      newClassType === "pindahan"
                        ? "bg-amber-600 text-white border-amber-600"
                        : "bg-m3-surface-container text-m3-secondary border-m3-outline-variant hover:bg-m3-surface-container-high"
                    }`}
                  >
                    Pindahan Dosen
                  </button>
                </div>
              </div>

              {/* 3. Hari & Jam */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-m3-secondary">Hari</label>
                  <select
                    value={newDay}
                    onChange={(e) => setNewDay(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-m3-surface-container/30 border border-m3-outline text-xs text-m3-on-surface focus:outline-none capitalize"
                  >
                    {["senin", "selasa", "rabu", "kamis", "jumat", "sabtu"].map((d) => (
                      <option key={d} value={d}>
                        {d.charAt(0).toUpperCase() + d.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-m3-secondary">Jam Mulai</label>
                  <input
                    type="time"
                    value={newStartTime ? newStartTime.replace(".", ":") : "08:00"}
                    onChange={(e) => setNewStartTime(e.target.value.replace(":", "."))}
                    required
                    className="w-full px-2.5 py-2 rounded-xl bg-m3-surface-container/30 border border-m3-outline text-xs text-m3-on-surface focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-m3-secondary">Jam Selesai</label>
                  <input
                    type="time"
                    value={newEndTime ? newEndTime.replace(".", ":") : "10:00"}
                    onChange={(e) => setNewEndTime(e.target.value.replace(":", "."))}
                    required
                    className="w-full px-2.5 py-2 rounded-xl bg-m3-surface-container/30 border border-m3-outline text-xs text-m3-on-surface focus:outline-none"
                  />
                </div>
              </div>

              {/* 4. Opsi Lanjutan (Ruang & Dosen) - Collapsible */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowAdvancedAdd(!showAdvancedAdd)}
                  className="text-[11px] font-semibold text-m3-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>{showAdvancedAdd ? "− Sembunyikan Detail Opsional" : "+ Tambah Ruang & Nama Dosen"}</span>
                </button>

                {showAdvancedAdd && (
                  <div className="grid grid-cols-2 gap-3 pt-2 animate-in fade-in">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-m3-secondary flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-m3-secondary" />
                        <span>Ruang</span>
                      </label>
                      <input
                        type="text"
                        value={newRoom}
                        onChange={(e) => setNewRoom(e.target.value)}
                        placeholder="Contoh: Gd. B 201"
                        className="w-full px-3 py-2 rounded-xl bg-m3-surface-container/20 border border-m3-outline text-xs text-m3-on-surface focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-m3-secondary flex items-center gap-1">
                        <User className="w-3 h-3 text-m3-secondary" />
                        <span>Dosen Pengampu</span>
                      </label>
                      <input
                        type="text"
                        value={newLecturer}
                        onChange={(e) => setNewLecturer(e.target.value)}
                        placeholder="Nama dosen"
                        className="w-full px-3 py-2 rounded-xl bg-m3-surface-container/20 border border-m3-outline text-xs text-m3-on-surface focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-m3-outline-variant/60 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddScheduleOpen(false)}
                  className="min-h-[44px] px-4 py-2 rounded-full text-xs font-semibold text-m3-secondary hover:bg-m3-surface-container transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 rounded-full text-xs font-bold bg-m3-primary text-m3-on-primary hover:brightness-95 transition-all shadow-xs cursor-pointer"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL IMPOR JADWAL DENGAN GEMINI AI */}
      <ImportScheduleModal
        isOpen={isImportScheduleOpen}
        onClose={() => setIsImportScheduleOpen(false)}
        onScheduleImported={(newItems) => {
          newItems.forEach((item) => onAddSchedule?.(item));
        }}
      />
    </div>
  );
}
