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
import FirstTimeOnboardingModal from "@/components/FirstTimeOnboardingModal";
import { TaskItem } from "@/components/ActionDeck";
import { Menu, X, CalendarDays } from "lucide-react";

export default function HomeDashboard() {
  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isQuickTaskOpen, setIsQuickTaskOpen] = useState(false);
  const [isUploadDocOpen, setIsUploadDocOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("student-clean");
  const [droppedFile, setDroppedFile] = useState<File | null>(null);

  const [newUploadedDoc, setNewUploadedDoc] = useState<{
    fileName: string;
    course: string;
    docType: string;
    filePath?: string;
    previewPath?: string;
    originalPath?: string;
    sessionNo?: number;
    topic?: string;
  } | null>(null);

  // Data states connected to SQLite DB
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [profile, setProfile] = useState<StudentProfile>({
    name: "Mahasiswa",
    nim: "",
    email: "",
    major: "",
    faculty: "",
    university: "",
    semester: 1,
    academicAdvisor: "",
    targetGPA: "4.00",
    maxSKS: 24,
  });

  const [bannerNotice, setBannerNotice] = useState<string | null>(null);
  const [selectedCourseForRps, setSelectedCourseForRps] = useState<string>("");

  // Fetch data from SQLite DB for the single user
  const loadUserData = async () => {
    try {
      const [taskRes, schedRes, profRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/schedule"),
        fetch("/api/profile"),
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
        if (profData && profData.name) {
          setProfile(profData);
          if (profData.darkMode !== undefined) {
            document.documentElement.classList.toggle("dark", !!profData.darkMode);
          }
          // Periksa apakah pengguna baru pertama kali masuk
          try {
            const hasCompleted = localStorage.getItem("akademikos_onboarding_completed");
            if (!hasCompleted && (!profData.name || profData.name === "Mahasiswa")) {
              setIsOnboardingOpen(true);
            }
          } catch (e) {
            console.warn("Storage warning:", e);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load DB data:", err);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const handleLoginSuccess = async (userId: string) => {
    setCurrentUserId(userId);
    setIsLoginModalOpen(false);
    localStorage.setItem("akademikos_active_user", userId);
    await loadUserData();
    setBannerNotice(`Berhasil beralih ke akun ${userId === "student-clean" ? "Akun Bersih" : "Mahasiswa"}.`);
    setTimeout(() => setBannerNotice(null), 3500);
  };

  const handleLogout = () => {
    setIsLoginModalOpen(true);
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
    setTasks((prev) => [newTask, ...prev]);
    setBannerNotice(`Tugas baru berhasil disimpan ke database (${newTask.difficulty}): "${newTask.title}"`);
    setTimeout(() => setBannerNotice(null), 4000);

    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
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
    setSchedules((prev) => [...prev, newSched]);
    setBannerNotice(`Jadwal baru "${newSched.course}" berhasil ditambahkan.`);
    setTimeout(() => setBannerNotice(null), 4000);

    try {
      await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSched),
      });
    } catch (err) {
      console.error("Failed to add schedule to DB:", err);
    }
  };

  // Update profile and persist to DB
  const handleUpdateProfile = async (updated: StudentProfile) => {
    setProfile(updated);
    if (updated.darkMode !== undefined) {
      document.documentElement.classList.toggle("dark", !!updated.darkMode);
    }
    setBannerNotice(`Pengaturan & profil "${updated.name || "mahasiswa"}" berhasil disimpan.`);
    setTimeout(() => setBannerNotice(null), 4000);

    try {
      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
    } catch (err) {
      console.error("Failed to update profile in DB:", err);
    }
  };

  // Handle first time onboarding completion
  const handleOnboardingComplete = async (data: Partial<StudentProfile>) => {
    const updated = { ...profile, ...data };
    await handleUpdateProfile(updated);
    setBannerNotice(
      `Selamat datang di AkademikOS, ${data.name}! Semester ${data.semester} berhasil disinkronkan ke Minggu Ke-1.`
    );
    setTimeout(() => setBannerNotice(null), 5000);
  };

  // Direct Drag and Drop file handler
  const handleDirectFileDrop = (file: File) => {
    setDroppedFile(file);
    setIsUploadDocOpen(true);
  };

  const handleUploadSuccess = (info: {
    fileName: string;
    docType: string;
    course?: string;
    sessionNo?: number;
    filePath?: string;
    previewPath?: string;
    originalPath?: string;
    topic?: string;
  }) => {
    const targetCourse = info.course || (schedules[0]?.course || "Mata Kuliah Umum");
    setNewUploadedDoc({
      fileName: info.fileName,
      course: targetCourse,
      docType: info.docType,
      sessionNo: info.sessionNo,
      filePath: info.filePath,
      previewPath: info.previewPath,
      originalPath: info.originalPath,
      topic: info.topic,
    });

    // Persist document metadata into SQLite database
    try {
      fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: `doc-${Date.now()}`,
          course: targetCourse,
          fileName: info.fileName,
          filePath: info.filePath,
          previewPath: info.previewPath,
          originalPath: info.originalPath,
          fileType: info.fileName.toLowerCase().endsWith(".pptx")
            ? "pptx"
            : info.fileName.toLowerCase().endsWith(".docx")
            ? "docx"
            : info.fileName.toLowerCase().match(/\.(jpe?g|png)$/)
            ? "jpg"
            : "pdf",
          docType: info.docType || "Dokumen Perkuliahan",
          sessionNo: info.sessionNo,
          topic: info.topic,
        }),
      }).catch((err) => console.error("Gagal simpan dokumen ke DB:", err));
    } catch (e) {
      console.error(e);
    }

    setActiveTab("rps");
    setBannerNotice(
      `Dokumen "${info.fileName}" berhasil diunggah ke mata kuliah ${targetCourse}.`
    );
    setTimeout(() => setBannerNotice(null), 6000);
  };

  const firstName = profile.name.split(" ")[0] || "Mahasiswa";

  // Academic week based on user configured semester start date and real system date
  const semesterStart = profile.semesterStartDate
    ? new Date(profile.semesterStartDate)
    : new Date("2026-09-07");
  const today = new Date();
  const currentWeek = Math.max(
    1,
    Math.floor((today.getTime() - semesterStart.getTime()) / (7 * 86400000)) + 1
  );

  return (
    <div className="min-h-screen bg-m3-surface text-m3-on-surface flex flex-col md:flex-row antialiased p-2.5 sm:p-3.5 gap-3.5 transition-colors">
      {/* Mobile Top App Bar */}
      <header className="md:hidden flex items-center justify-between p-3.5 bg-white dark:bg-m3-surface-container-low border border-slate-200/80 dark:border-m3-outline-variant rounded-2xl shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-m3-primary flex items-center justify-center text-m3-on-primary font-bold text-xs">
            A
          </div>
          <span className="font-semibold text-sm text-m3-on-surface">AkademikOS</span>
        </div>
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-m3-surface-container transition-colors text-m3-secondary"
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
          onLogout={handleLogout}
        />
      </div>

      {/* Mobile Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative w-64 max-w-xs z-50 bg-white dark:bg-m3-surface-container-low h-full shadow-xl">
            <Sidebar
              activeTab={activeTab}
              onSelectTab={(tab) => {
                setActiveTab(tab);
                setMobileSidebarOpen(false);
              }}
              profile={profile}
              onLogout={handleLogout}
            />
          </div>
        </div>
      )}

      {/* Main Content Area: Large Floating Pill Sheet */}
      <main className="flex-1 bg-white dark:bg-m3-surface-container-low rounded-[32px] sm:rounded-[36px] p-5 sm:p-7 border border-slate-200/80 dark:border-m3-outline-variant shadow-[0_2px_16px_rgba(0,0,0,0.03)] flex flex-col space-y-6 overflow-x-hidden">
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
                  Semester {profile.semester || 1}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-m3-on-surface">
                  Halo, {firstName}
                  {currentWeek >= 1 && (
                    <span className="text-sm sm:text-base font-normal text-m3-secondary ml-2">
                      (Minggu ke-{currentWeek})
                    </span>
                  )}
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs bg-m3-surface-container-low border border-m3-outline-variant px-3 py-1.5 rounded-full">
                  <CalendarDays className="w-3.5 h-3.5 text-m3-secondary" />
                  <span className="text-m3-on-surface font-semibold">
                    {(() => {
                      const now = new Date();
                      const dd = String(now.getDate()).padStart(2, "0");
                      const mm = String(now.getMonth() + 1).padStart(2, "0");
                      const yy = String(now.getFullYear()).slice(-2);
                      return `${dd}/${mm}/${yy}`;
                    })()}
                  </span>
                </div>
              </div>
            </div>

            {/* Row 1: Course Card (Col-8) & Action Quick Cards (Col-4) Sejajar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              <div className="lg:col-span-8 flex">
                <CourseCard
                  onOpenRPS={() => setActiveTab("rps")}
                  schedules={schedules}
                  onOpenCalendar={() => setActiveTab("kalender")}
                  onUpdateAttendance={(id, status) => handleUpdateSchedule(id, { attendanceStatus: status })}
                />
              </div>

              <div className="lg:col-span-4 flex">
                <ActionQuickCards
                  onOpenQuickTask={() => setIsQuickTaskOpen(true)}
                  onFileDrop={handleDirectFileDrop}
                  onOpenUploadDoc={() => setIsUploadDocOpen(true)}
                />
              </div>
            </div>

            {/* Row 2: Schedule Calendar (Col-8) & Task List (Col-4) Sejajar Min Height */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch min-h-[640px]">
              <div className="lg:col-span-8 flex flex-col h-[640px]">
                <ScheduleCalendar
                  schedules={schedules}
                  tasks={tasks}
                  onReschedule={handleReschedule}
                  onUpdateSchedule={handleUpdateSchedule}
                  onDeleteSchedule={handleDeleteSchedule}
                  onAddSchedule={handleAddSchedule}
                  noAiMode={!!profile.noAiMode}
                  semesterStartDate={profile.semesterStartDate}
                  isHomeWidget={true}
                />
              </div>

              <div className="lg:col-span-4 flex flex-col h-[640px]">
                <TaskList
                  tasks={tasks}
                  onToggleTask={handleToggleTask}
                  onDeleteTask={handleDeleteTask}
                  onUpdateTask={handleUpdateTask}
                  onOpenQuickTask={() => setIsQuickTaskOpen(true)}
                  onOpenCourseMaterial={(courseName) => {
                    setSelectedCourseForRps(courseName);
                    setActiveTab("rps");
                  }}
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
            selectedCourseForRps={selectedCourseForRps}
            onLogout={handleLogout}
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
          />
        )}
      </main>

      {/* Modals */}
      <QuickTaskModal
        isOpen={isQuickTaskOpen}
        onClose={() => setIsQuickTaskOpen(false)}
        onAddTask={handleAddTask}
        courses={Array.from(new Set(schedules.map((s) => s.course).filter(Boolean)))}
        semesterStartDate={profile.semesterStartDate}
      />

      <UploadDocModal
        isOpen={isUploadDocOpen}
        onClose={() => {
          setIsUploadDocOpen(false);
          setDroppedFile(null);
        }}
        onUploadSuccess={handleUploadSuccess}
        initialFile={droppedFile}
        courses={Array.from(new Set(schedules.map((s) => s.course).filter(Boolean)))}
        noAiMode={!!profile.noAiMode}
        semesterStartDate={profile.semesterStartDate}
      />

      {/* Login / Switch Account Modal */}
      {isLoginModalOpen && (
        <LoginPage
          onLogin={handleLoginSuccess}
          onClose={() => setIsLoginModalOpen(false)}
          currentUserId={currentUserId}
          onResetData={async (uid) => {
            await fetch(`/api/reset?userId=${uid}`, { method: "POST" });
            await loadUserData();
          }}
          onRestoreDemo={async () => {
            await fetch("/api/seed", { method: "POST" });
            await loadUserData();
          }}
        />
      )}

      {/* First Time Welcome / Onboarding Modal */}
      <FirstTimeOnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onComplete={handleOnboardingComplete}
        currentProfile={profile}
      />
    </div>
  );
}
