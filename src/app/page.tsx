"use client";

import React, { useState, useEffect } from "react";
import Sidebar, { NavTab } from "@/components/Sidebar";
import CourseCard from "@/components/CourseCard";
import ActionQuickCards from "@/components/ActionQuickCards";
import ScheduleCalendar, { ScheduleItem } from "@/components/ScheduleCalendar";
import TaskList from "@/components/TaskList";
import QuickTaskModal from "@/components/QuickTaskModal";
import UploadDocModal from "@/components/UploadDocModal";
import OtherViews, { StudentProfile } from "@/components/OtherViews";
import LoginPage from "@/components/LoginPage";
import { TaskItem } from "@/components/ActionDeck";
import { Menu, X, CalendarDays } from "lucide-react";

export default function HomeDashboard() {
  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isQuickTaskOpen, setIsQuickTaskOpen] = useState(false);
  const [isUploadDocOpen, setIsUploadDocOpen] = useState(false);
  const [droppedFile, setDroppedFile] = useState<File | null>(null);
  
  // Current active student account ID in SQLite - default to student-clean for clean testing!
  const [currentUserId, setCurrentUserId] = useState<string>("student-clean");
  const [showLoginPage, setShowLoginPage] = useState<boolean>(false);
  const [newUploadedDoc, setNewUploadedDoc] = useState<{
    fileName: string;
    course: string;
    docType: string;
  } | null>(null);

  // Data states connected to SQLite DB
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [profile, setProfile] = useState<StudentProfile>({
    name: "Mahasiswa Baru (Akun Kosong)",
    nim: "26/512000/TK/00001",
    email: "mahasiswa.baru@mail.ugm.ac.id",
    major: "Teknik Informatika",
    faculty: "Fakultas Teknik",
    university: "Universitas Gadjah Mada",
    semester: 1,
    academicAdvisor: "Dr. Ir. Budi Santoso, M.Kom.",
    targetGPA: "4.00",
    maxSKS: 24,
  });

  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  // Fetch data from SQLite DB for the given user ID
  const loadUserData = async (userId: string) => {
    try {
      const [taskRes, schedRes, profRes] = await Promise.all([
        fetch(`/api/tasks?userId=${userId}`),
        fetch(`/api/schedule?userId=${userId}`),
        fetch(`/api/profile?userId=${userId}`),
      ]);

      if (taskRes.ok) {
        const taskData = await taskRes.json();
        setTasks(taskData);
      } else {
        setTasks([]);
      }

      if (schedRes.ok) {
        const schedData = await schedRes.json();
        setSchedules(schedData);
      } else {
        setSchedules([]);
      }

      if (profRes.ok) {
        const profData = await profRes.json();
        setProfile(profData);
      }
    } catch (err) {
      console.error("Failed to load DB data:", err);
    }
  };

  useEffect(() => {
    loadUserData(currentUserId);
  }, [currentUserId]);

  const handleResetData = async (userId: string) => {
    try {
      const res = await fetch(`/api/reset?userId=${userId}`, { method: "POST" });
      if (res.ok) {
        setTasks([]);
        setSchedules([]);
        setBannerNotice("Data tugas & jadwal akun berhasil dikosongkan.");
        setTimeout(() => setBannerNotice(null), 3500);
      }
    } catch (err) {
      console.error("Failed to reset data:", err);
    }
  };

  const handleRestoreDemo = async () => {
    try {
      const res = await fetch(`/api/seed?userId=${currentUserId}`, { method: "POST" });
      if (res.ok) {
        await loadUserData(currentUserId);
        setBannerNotice("Data contoh tugas & jadwal berhasil dipulihkan.");
        setTimeout(() => setBannerNotice(null), 3500);
      }
    } catch (err) {
      console.error("Failed to restore demo:", err);
    }
  };

  // Update task attributes and persist to DB
  const handleUpdateTask = async (id: string, updated: Partial<TaskItem>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updated } : t))
    );
    setBannerNotice(`Tugas "${updated.title || "tugas"}" berhasil diperbarui.`);
    setTimeout(() => setBannerNotice(null), 3000);

    try {
      await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
    } catch (err) {
      console.error("Failed to update task in DB:", err);
    }
  };

  // Toggle task completion and persist to DB
  const handleToggleTask = async (id: string) => {
    const target = tasks.find((t) => t.id === id);
    if (!target) return;

    const nextCompleted = !target.completed;
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: nextCompleted } : t))
    );

    try {
      await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: nextCompleted }),
      });
    } catch (err) {
      console.error("Failed to update task in DB:", err);
    }
  };

  // Delete task and persist to DB
  const handleDeleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      setBannerNotice("Tugas berhasil dihapus dari database.");
      setTimeout(() => setBannerNotice(null), 3000);
    } catch (err) {
      console.error("Failed to delete task from DB:", err);
    }
  };

  // Add new task and persist to DB
  const handleAddTask = async (newTask: TaskItem) => {
    const taskWithUser = { ...newTask, userId: currentUserId };
    setTasks((prev) => [taskWithUser, ...prev]);
    setBannerNotice(`Tugas baru berhasil disimpan ke database (${newTask.difficulty}): "${newTask.title}"`);
    setTimeout(() => setBannerNotice(null), 4000);

    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskWithUser),
      });
    } catch (err) {
      console.error("Failed to save task to DB:", err);
    }
  };

  // Drag and drop reschedule handler - persists to DB!
  const handleReschedule = async (id: string, newStartHour: number, day?: string) => {
    const target = schedules.find((s) => s.id === id);
    if (!target) return;

    const duration = target.durationHours || 2;
    const endHour = Math.min(newStartHour + duration, 24);
    const newStartTime = `${String(newStartHour).padStart(2, "0")}.00`;
    const newEndTime = `${String(endHour).padStart(2, "0")}.${endHour === newStartHour + duration ? "00" : "30"}`;
    const targetDay = day || target.day;

    setSchedules((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              startHour: newStartHour,
              startTime: newStartTime,
              endTime: newEndTime,
              day: targetDay,
            }
          : s
      )
    );

    setBannerNotice(
      `Jadwal "${target.course}" dipindahkan ke ${targetDay} jam ${newStartTime} WIB (Tersimpan di SQLite).`
    );
    setTimeout(() => setBannerNotice(null), 4000);

    try {
      await fetch(`/api/schedule/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startHour: newStartHour,
          startTime: newStartTime,
          endTime: newEndTime,
          day: targetDay,
        }),
      });
    } catch (err) {
      console.error("Failed to update schedule in DB:", err);
    }
  };

  // Full schedule update handler (from click-to-edit modal)
  const handleUpdateSchedule = async (id: string, updated: Partial<ScheduleItem>) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updated } : s))
    );
    setBannerNotice(`Jadwal "${updated.course || "kelas"}" berhasil diperbarui.`);
    setTimeout(() => setBannerNotice(null), 3000);

    try {
      await fetch(`/api/schedule/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
    } catch (err) {
      console.error("Failed to update schedule in DB:", err);
    }
  };

  // Delete schedule handler - persists to DB!
  const handleDeleteSchedule = async (id: string) => {
    const target = schedules.find((s) => s.id === id);
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    setBannerNotice(`Jadwal "${target?.course || "matkul"}" berhasil dihapus dari jadwal.`);
    setTimeout(() => setBannerNotice(null), 3500);

    try {
      await fetch(`/api/schedule/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete schedule from DB:", err);
    }
  };

  // Add new schedule handler - persists to DB!
  const handleAddSchedule = async (newSched: ScheduleItem) => {
    const schedWithUser = { ...newSched, userId: currentUserId };
    setSchedules((prev) => [...prev, schedWithUser]);
    setBannerNotice(`Jadwal baru "${newSched.course}" berhasil ditambahkan.`);
    setTimeout(() => setBannerNotice(null), 4000);

    try {
      await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schedWithUser),
      });
    } catch (err) {
      console.error("Failed to add schedule to DB:", err);
    }
  };

  // Update profile and persist to DB
  const handleUpdateProfile = async (updated: StudentProfile) => {
    setProfile(updated);
    try {
      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...updated, userId: currentUserId }),
      });
    } catch (err) {
      console.error("Failed to update profile in DB:", err);
    }
  };

  // Direct Drag and Drop file handler
  const handleDirectFileDrop = (file: File) => {
    setDroppedFile(file);
    setIsUploadDocOpen(true);
  };

  const handleUploadSuccess = (info: { fileName: string; docType: string; course?: string }) => {
    const targetCourse = info.course || "Kecerdasan Buatan & Sistem Pakar";
    setNewUploadedDoc({
      fileName: info.fileName,
      course: targetCourse,
      docType: info.docType,
    });
    setActiveTab("rps");
    setBannerNotice(
      `Dokumen "${info.fileName}" (${info.docType}) berhasil diunggah dan otomatis ditempatkan di RPS & Materi perkuliahan ${targetCourse}.`
    );
    setTimeout(() => setBannerNotice(null), 6000);
  };

  const firstName = profile.name.split(" ")[0];

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-m3-on-surface flex flex-col md:flex-row antialiased p-2.5 sm:p-3.5 gap-3.5">
      {/* Mobile Top App Bar */}
      <header className="md:hidden flex items-center justify-between p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-m3-primary flex items-center justify-center text-m3-on-primary font-bold text-xs">
            A
          </div>
          <span className="font-semibold text-sm text-m3-on-surface">AkademikOS</span>
        </div>
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-2 rounded-full hover:bg-slate-100 transition-colors text-m3-secondary"
          aria-label="Buka menu navigasi"
        >
          {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Sidebar for Desktop - Sticky and locked in viewport */}
      <div className="hidden md:block flex-shrink-0 sticky top-2.5 sm:top-3.5 h-[calc(100vh-1.25rem)] sm:h-[calc(100vh-1.75rem)] z-30">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          profile={profile}
          currentUserId={currentUserId}
          onOpenLogin={() => setShowLoginPage(true)}
        />
      </div>

      {/* Mobile Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative w-64 max-w-xs z-50 bg-white h-full shadow-xl">
            <Sidebar
              activeTab={activeTab}
              onSelectTab={(tab) => {
                setActiveTab(tab);
                setMobileSidebarOpen(false);
              }}
              profile={profile}
              currentUserId={currentUserId}
              onOpenLogin={() => {
                setMobileSidebarOpen(false);
                setShowLoginPage(true);
              }}
            />
          </div>
        </div>
      )}

      {/* Main Content Area: Large Floating Pill Sheet */}
      <main className="flex-1 bg-white rounded-[32px] sm:rounded-[36px] p-5 sm:p-7 border border-slate-200/80 shadow-[0_2px_16px_rgba(0,0,0,0.03)] flex flex-col space-y-6 overflow-x-hidden">
        {/* Real-time Notification Banner */}
        {bannerNotice && (
          <div className="p-3.5 rounded-2xl bg-m3-primary-container border border-m3-primary text-xs font-semibold text-m3-on-primary-container flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <span>{bannerNotice}</span>
            <button
              onClick={() => setBannerNotice(null)}
              className="text-xs font-bold text-m3-secondary hover:text-m3-on-surface"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Content Switcher */}
        {activeTab === "home" ? (
          <div className="space-y-6">
            {/* Header: Sederhana & Minimalis */}
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-3">
                <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-m3-secondary-container text-m3-on-secondary-container">
                  Minggu 4
                </span>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-m3-on-surface">
                  Halo, {firstName}
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs bg-m3-surface-container-low border border-m3-outline-variant px-3 py-1.5 rounded-full">
                  <CalendarDays className="w-3.5 h-3.5 text-m3-secondary" />
                  <span className="text-m3-on-surface font-semibold">1 Oktober 2026</span>
                </div>
              </div>
            </div>

            {/* Row 1: Course Card (Col-8) & Action Quick Cards (Col-4) Sejajar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              <div className="lg:col-span-8 flex">
                <CourseCard onOpenRPS={() => setActiveTab("rps")} />
              </div>

              <div className="lg:col-span-4 flex">
                <ActionQuickCards
                  onOpenQuickTask={() => setIsQuickTaskOpen(true)}
                  onFileDrop={handleDirectFileDrop}
                  onOpenUploadDoc={() => setIsUploadDocOpen(true)}
                />
              </div>
            </div>

            {/* Row 2: Schedule Calendar (Col-8) & Task List (Col-4) Sejajar Max Height */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              <div className="lg:col-span-8 h-[640px]">
                <ScheduleCalendar
                  schedules={schedules}
                  tasks={tasks}
                  onReschedule={handleReschedule}
                  onUpdateSchedule={handleUpdateSchedule}
                  onDeleteSchedule={handleDeleteSchedule}
                  onAddSchedule={handleAddSchedule}
                />
              </div>

              <div className="lg:col-span-4 h-[640px]">
                <TaskList
                  tasks={tasks}
                  onToggleTask={handleToggleTask}
                  onDeleteTask={handleDeleteTask}
                  onUpdateTask={handleUpdateTask}
                />
              </div>
            </div>
          </div>
        ) : (
          <OtherViews
            activeTab={activeTab}
            onBackToHome={() => setActiveTab("home")}
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            schedules={schedules}
            tasks={tasks}
            onReschedule={handleReschedule}
            onUpdateSchedule={handleUpdateSchedule}
            onDeleteSchedule={handleDeleteSchedule}
            onAddSchedule={handleAddSchedule}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
            onOpenQuickTask={() => setIsQuickTaskOpen(true)}
            onUpdateTask={handleUpdateTask}
            newUploadedDoc={newUploadedDoc}
          />
        )}
      </main>

      {/* Modals */}
      <QuickTaskModal
        isOpen={isQuickTaskOpen}
        onClose={() => setIsQuickTaskOpen(false)}
        onAddTask={handleAddTask}
      />

      <UploadDocModal
        isOpen={isUploadDocOpen}
        onClose={() => {
          setIsUploadDocOpen(false);
          setDroppedFile(null);
        }}
        onUploadSuccess={handleUploadSuccess}
        initialFile={droppedFile}
      />

      {/* Login / Switch Account Modal */}
      {showLoginPage && (
        <LoginPage
          currentUserId={currentUserId}
          onLogin={(userId) => {
            setCurrentUserId(userId);
            setShowLoginPage(false);
            loadUserData(userId);
            setBannerNotice(
              `Beralih ke akun: ${userId === "student-clean" ? "Akun Bersih (Kosongan)" : userId}`
            );
            setTimeout(() => setBannerNotice(null), 3000);
          }}
          onClose={() => setShowLoginPage(false)}
          onResetData={handleResetData}
          onRestoreDemo={handleRestoreDemo}
        />
      )}
    </div>
  );
}
