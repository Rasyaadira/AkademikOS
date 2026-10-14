"use client";

import React, { useState } from "react";
import { NavTab } from "./Sidebar";
import ScheduleCalendar, { ScheduleItem } from "./ScheduleCalendar";
import TaskList from "./TaskList";
import { TaskItem } from "./ActionDeck";
import {
  Download,
  User,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Save,
  Folder,
  FolderOpen,
  FileText,
  Presentation,
  FileCode,
  ExternalLink,
  BookOpen,
  Search,
  Maximize2,
  Minimize2,
  Plus,
  Bold,
  Italic,
  List,
  ListTodo,
  Code,
  Eye,
  Edit2,
  Edit3,
  Trash2,
  FolderPlus,
  Clock,
  MapPin,
  MessageCircle,
  Globe,
  X,
  Sparkles,
} from "lucide-react";

export interface StudentProfile {
  name: string;
  nim: string;
  email: string;
  major: string;
  faculty: string;
  university: string;
  semester: number;
  academicAdvisor: string;
  targetGPA: string;
  maxSKS: number;
  photoUrl?: string;
  noAiMode?: boolean;
}

export interface CourseLecturerItem {
  id: string;
  courseName: string;
  lecturerName: string;
  lecturerPhoto?: string;
  dayTime: string;
  room: string;
  sks: number;
  whatsapp?: string;
  lmsUrl?: string;
  attendanceStatus: "aman" | "hmm" | "gawat" | "bahaya" | "waspada";
}

const initialCourseLecturers: CourseLecturerItem[] = [];

interface OtherViewsProps {
  activeTab: NavTab;
  onBackToHome: () => void;
  profile: StudentProfile;
  onUpdateProfile: (updated: StudentProfile) => void;
  schedules?: ScheduleItem[];
  tasks?: TaskItem[];
  onReschedule?: (id: string, newStartHour: number, day?: string) => void;
  onUpdateSchedule?: (id: string, updated: Partial<ScheduleItem>) => void;
  onDeleteSchedule?: (id: string) => void;
  onAddSchedule?: (newSched: ScheduleItem) => void;
  onToggleTask?: (id: string) => void;
  onDeleteTask?: (id: string) => void;
  onOpenQuickTask?: () => void;
  onUpdateTask?: (id: string, updated: Partial<TaskItem>) => void;
  newUploadedDoc?: {
    fileName: string;
    course: string;
    docType: string;
    filePath?: string;
    sessionNo?: number;
    topic?: string;
  } | null;
}

// Data structures for RPS Folder Tree & Document Preview (40/60)
interface FileItem {
  id: string;
  name: string;
  type: "pdf" | "pptx" | "docx" | "jpg" | "png";
  updated: string;
  description: string;
  filePath?: string;
  sessionNo?: number;
  topic?: string;
  sessions?: {
    no: number;
    topic: string;
    subtopics: string;
    weight?: string;
  }[];
}

interface CourseFolder {
  id: string;
  courseName: string;
  lecturer: string;
  files: FileItem[];
}

const initialFolders: CourseFolder[] = [];

// Obsidian-like Note Item
interface NoteItem {
  id: string;
  filename: string;
  title: string;
  format: "md" | "txt";
  updated: string;
  content: string;
}

// Obsidian-like Collapsible Folder
interface NoteFolder {
  id: string;
  name: string;
  notes: NoteItem[];
}

const initialNoteFolders: NoteFolder[] = [];

export default function OtherViews({
  activeTab,
  onBackToHome,
  profile,
  onUpdateProfile,
  schedules = [],
  tasks = [],
  onReschedule,
  onUpdateSchedule,
  onDeleteSchedule,
  onAddSchedule,
  onToggleTask,
  onDeleteTask,
  onOpenQuickTask,
  onUpdateTask,
  newUploadedDoc,
}: OtherViewsProps) {
  const [formData, setFormData] = useState<StudentProfile>(profile);
  const [isSaved, setIsSaved] = useState(false);

  // Sync external profile changes into local formData (including photoUrl)
  React.useEffect(() => {
    setFormData(profile);
  }, [profile]);

  // Dynamic RPS Folder & Document Preview state (40/60 Split)
  const [rpsFolders, setRpsFolders] = useState<CourseFolder[]>(initialFolders);
  const [openRpsFolderId, setOpenRpsFolderId] = useState<string>("");
  const [selectedFileId, setSelectedFileId] = useState<string>("");
  const [rpsSearchQuery, setRpsSearchQuery] = useState("");

  // Sync newly uploaded document directly into matching course folder in RPS
  React.useEffect(() => {
    if (newUploadedDoc) {
      const courseNorm = (newUploadedDoc.course || "").trim().toLowerCase();
      const newFileId = `doc-up-${Date.now()}`;
      const lower = newUploadedDoc.fileName.toLowerCase();
      const ext = lower.endsWith(".pptx")
        ? "pptx"
        : lower.endsWith(".docx")
        ? "docx"
        : lower.endsWith(".jpg") || lower.endsWith(".jpeg")
        ? "jpg"
        : lower.endsWith(".png")
        ? "png"
        : "pdf";

      const filePath = newUploadedDoc.filePath || `/storage/${newUploadedDoc.fileName}`;

      const newFile: FileItem = {
        id: newFileId,
        name: newUploadedDoc.fileName,
        type: ext,
        updated: "Hari ini",
        filePath: filePath,
        sessionNo: newUploadedDoc.sessionNo,
        topic: newUploadedDoc.topic,
        description: `Dokumen ${newUploadedDoc.docType} untuk ${newUploadedDoc.course}.`,
        sessions: [
          {
            no: newUploadedDoc.sessionNo || 1,
            topic: newUploadedDoc.topic || newUploadedDoc.fileName,
            subtopics: `Kategori: ${newUploadedDoc.docType}. Tersimpan di server lokal.`,
          },
        ],
      };

      setRpsFolders((prev) => {
        const foundIdx = prev.findIndex(
          (f) =>
            f.courseName.toLowerCase().includes(courseNorm) ||
            (courseNorm.length > 2 && courseNorm.includes(f.courseName.toLowerCase()))
        );
        if (foundIdx >= 0) {
          const updated = [...prev];
          updated[foundIdx] = {
            ...updated[foundIdx],
            files: [newFile, ...updated[foundIdx].files],
          };
          setOpenRpsFolderId(updated[foundIdx].id);
          setSelectedFileId(newFileId);
          return updated;
        } else {
          const newFolder: CourseFolder = {
            id: `f-${Date.now()}`,
            courseName: newUploadedDoc.course || "Mata Kuliah Umum",
            lecturer: "Dosen Pengampu",
            files: [newFile],
          };
          setOpenRpsFolderId(newFolder.id);
          setSelectedFileId(newFileId);
          return [newFolder, ...prev];
        }
      });
    }
  }, [newUploadedDoc]);

  // Obsidian-like Catatan Kuliah state with COLLAPSIBLE FOLDERS
  const [noteFolders, setNoteFolders] = useState<NoteFolder[]>(initialNoteFolders);
  const [openNoteFolderIds, setOpenNoteFolderIds] = useState<string[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string>("");
  const [noteEditMode, setNoteEditMode] = useState<"edit" | "preview">("edit");
  const [isEditorFullscreen, setIsEditorFullscreen] = useState(false);
  const [noteSearchQuery, setNoteSearchQuery] = useState("");

  // Hide lecturer photos preference state
  const [hideLecturerPhotos, setHideLecturerPhotos] = useState(false);
  const [isRpsMaximized, setIsRpsMaximized] = useState(false);

  // Helper to reliably construct non-404 file URLs
  const getDocFileUrl = (doc: { filePath?: string; name: string }) => {
    const raw = doc.filePath || `/storage/${doc.name}`;
    if (raw.startsWith("/storage/")) {
      return `/api/storage/${raw.replace("/storage/", "")}`;
    }
    return raw;
  };

  // Course & Lecturer state for Matkul tab (synchronizes from schedules)
  const [courseLecturers, setCourseLecturers] = useState<CourseLecturerItem[]>(initialCourseLecturers);
  const [editingLecturer, setEditingLecturer] = useState<CourseLecturerItem | null>(null);
  const [isAddLecturerOpen, setIsAddLecturerOpen] = useState(false);
  const [newLecturerForm, setNewLecturerForm] = useState<Partial<CourseLecturerItem>>({
    courseName: "",
    lecturerName: "",
    dayTime: "Senin, 09.00 - 11.30 WIB",
    room: "-",
    sks: 3,
    whatsapp: "",
    lmsUrl: "",
    attendanceStatus: "aman",
  });

  // Synchronize schedules from Calendar into Matkul & Dosen tab dynamically
  React.useEffect(() => {
    if (schedules && schedules.length > 0) {
      setCourseLecturers((prev) => {
        const customMap = new Map(prev.map((c) => [c.courseName.toLowerCase(), c]));
        const merged: CourseLecturerItem[] = [];
        const seenCourses = new Set<string>();

        schedules.forEach((s) => {
          const key = s.course.toLowerCase();
          if (!seenCourses.has(key)) {
            seenCourses.add(key);
            const existing = customMap.get(key);
            const dayStr = s.day ? s.day.charAt(0).toUpperCase() + s.day.slice(1) : "Senin";
            const timeStr = `${dayStr}, ${s.startTime || "08.00"} - ${s.endTime || "10.00"} WIB`;
            if (existing) {
              merged.push({
                ...existing,
                dayTime: timeStr,
                room: s.room && s.room !== "-" ? s.room : existing.room || "-",
                lecturerName: existing.lecturerName && existing.lecturerName !== "-" ? existing.lecturerName : (s.lecturer || "-"),
              });
            } else {
              merged.push({
                id: s.id || `cl-${Date.now()}-${Math.random()}`,
                courseName: s.course,
                lecturerName: s.lecturer || "-",
                dayTime: timeStr,
                room: s.room || "-",
                sks: 3,
                attendanceStatus: "aman",
              });
            }
          }
        });

        // Keep any manually added lecturers not in schedules
        prev.forEach((p) => {
          if (!seenCourses.has(p.courseName.toLowerCase())) {
            merged.push(p);
          }
        });

        return merged;
      });
    }
  }, [schedules]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, isNew: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const uploadData = new FormData();
    uploadData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: uploadData });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          if (isNew) {
            setNewLecturerForm((prev) => ({ ...prev, lecturerPhoto: data.url }));
          } else if (editingLecturer) {
            setEditingLecturer((prev) => prev ? { ...prev, lecturerPhoto: data.url } : null);
          }
          return;
        }
      }
    } catch (err) {
      console.error("Upload error:", err);
    }
    // Fallback to local data URL if server upload fails
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (isNew) {
        setNewLecturerForm((prev) => ({ ...prev, lecturerPhoto: result }));
      } else if (editingLecturer) {
        setEditingLecturer((prev) => prev ? { ...prev, lecturerPhoto: result } : null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveLecturerEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLecturer) return;
    setCourseLecturers((prev) =>
      prev.map((c) => (c.id === editingLecturer.id ? editingLecturer : c))
    );
    setEditingLecturer(null);
  };

  const handleDeleteLecturer = (id: string) => {
    setCourseLecturers((prev) => prev.filter((c) => c.id !== id));
    setEditingLecturer(null);
  };

  const handleAddLecturer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLecturerForm.courseName || !newLecturerForm.lecturerName) return;

    const newItem: CourseLecturerItem = {
      id: `cl-${Date.now()}`,
      courseName: newLecturerForm.courseName,
      lecturerName: newLecturerForm.lecturerName,
      dayTime: newLecturerForm.dayTime || "Senin, 09.00 - 11.30 WIB",
      room: newLecturerForm.room || "Ruang Kuliah",
      sks: newLecturerForm.sks || 3,
      whatsapp: newLecturerForm.whatsapp || "",
      lmsUrl: newLecturerForm.lmsUrl || "",
      attendanceStatus: "aman",
    };

    setCourseLecturers((prev) => [newItem, ...prev]);
    setIsAddLecturerOpen(false);
    setNewLecturerForm({
      courseName: "",
      lecturerName: "",
      dayTime: "Kamis, 09.00 - 11.30 WIB",
      room: "Ruang Teori 301",
      sks: 3,
      whatsapp: "",
      lmsUrl: "",
      attendanceStatus: "aman",
    });
  };

  // Quiz state
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  if (activeTab === "home") return null;

  const handleInputChange = (field: keyof StudentProfile, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  // Toggle note folder open/close
  const toggleNoteFolder = (folderId: string) => {
    setOpenNoteFolderIds((prev) =>
      prev.includes(folderId) ? prev.filter((id) => id !== folderId) : [...prev, folderId]
    );
  };

  // Find active note across all folders
  const allNotes = noteFolders.flatMap((f) => f.notes);
  const activeNote = allNotes.find((n) => n.id === activeNoteId) || allNotes[0];

  const handleUpdateActiveNote = (field: "title" | "content", val: string) => {
    setNoteFolders((prev) =>
      prev.map((folder) => ({
        ...folder,
        notes: folder.notes.map((note) =>
          note.id === activeNote.id ? { ...note, [field]: val, updated: "Baru saja" } : note
        ),
      }))
    );
  };

  const handleCreateNewNote = (folderId?: string) => {
    const newId = `note-${Date.now()}`;
    const nextNum = allNotes.length + 1;
    const newDoc: NoteItem = {
      id: newId,
      filename: `Catatan_Kuliah_${nextNum}.md`,
      title: `Catatan Kuliah Pertemuan ${nextNum}`,
      format: "md",
      updated: "Baru saja",
      content: `# Catatan Kuliah Pertemuan ${nextNum}\n\n## Pokok Bahasan\n- \n\n## Rangkuman Konsep\n`,
    };

    setNoteFolders((prev) => {
      if (prev.length === 0) {
        const defaultFolderId = `nf-${Date.now()}`;
        setOpenNoteFolderIds([defaultFolderId]);
        return [{ id: defaultFolderId, name: "Catatan Kuliah", notes: [newDoc] }];
      }
      const targetFolderId = folderId || prev[0].id;
      if (!openNoteFolderIds.includes(targetFolderId)) {
        setOpenNoteFolderIds((ids) => [...ids, targetFolderId]);
      }
      return prev.map((f) => (f.id === targetFolderId ? { ...f, notes: [newDoc, ...f.notes] } : f));
    });
    setActiveNoteId(newId);
    setNoteEditMode("edit");
  };

  const handleCreateNewFolder = () => {
    const name = prompt("Nama folder baru:", "Folder Catatan");
    if (!name || !name.trim()) return;
    const newFolderId = `nf-${Date.now()}`;
    const newFolder: NoteFolder = {
      id: newFolderId,
      name: name.trim(),
      notes: [],
    };
    setNoteFolders([...noteFolders, newFolder]);
    setOpenNoteFolderIds([...openNoteFolderIds, newFolderId]);
  };

  const handleDeleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (allNotes.length <= 1) return;
    setNoteFolders((prev) =>
      prev.map((folder) => ({
        ...folder,
        notes: folder.notes.filter((n) => n.id !== id),
      }))
    );
    if (activeNoteId === id) {
      const remaining = allNotes.filter((n) => n.id !== id);
      if (remaining.length > 0) setActiveNoteId(remaining[0].id);
    }
  };

  // Find currently active file in RPS
  const allRpsFiles = rpsFolders.flatMap((f) => f.files);
  const currentDoc = allRpsFiles.find((f) => f.id === selectedFileId) || (rpsFolders[0]?.files[0] ?? null);
  const currentFolder = rpsFolders.find((f) => f.files.some((fl) => fl.id === currentDoc?.id)) || rpsFolders[0] || null;

  return (
    <section className="flex-1 bg-m3-surface-container-low border border-m3-outline-variant rounded-3xl p-5 sm:p-7 space-y-5 shadow-xs flex flex-col">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-m3-outline-variant pb-3 gap-2 flex-shrink-0">
        <div>
          <button
            onClick={onBackToHome}
            className="min-h-[44px] text-xs font-semibold text-m3-secondary hover:text-m3-on-surface mb-1 flex items-center gap-1 transition-colors"
          >
            ← Kembali ke Dashboard Home
          </button>
          <h2 className="text-xl sm:text-2xl font-bold text-m3-on-surface">
            {activeTab === "rps" && "RPS & Materi Perkuliahan"}
            {activeTab === "catatan" && "Catatan Kuliah"}
            {activeTab === "kalender" && "Kalender & Agenda"}
            {activeTab === "matkul" && "Mata Kuliah & Dosen Pengampu"}
            {activeTab === "quiz" && "AI Quiz & Review Mandiri"}
            {(activeTab === "akun" || activeTab === "setting") && "Akun & Pengaturan Mahasiswa"}
          </h2>
        </div>
      </div>

      {/* TAB KALENDER & AGENDA: SPLIT VIEW WITH SCHEDULE & TASK LIST */}
      {activeTab === "kalender" && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch min-h-[720px]">
          <div className="lg:col-span-8 flex flex-col h-[720px]">
            <ScheduleCalendar
              schedules={schedules}
              tasks={tasks}
              onReschedule={onReschedule || (() => {})}
              onUpdateSchedule={onUpdateSchedule}
              onDeleteSchedule={onDeleteSchedule}
              onAddSchedule={onAddSchedule}
              isExpanded={true}
              noAiMode={!!profile.noAiMode}
            />
          </div>

          <div className="lg:col-span-4 flex flex-col h-[720px]">
            <TaskList
              tasks={tasks}
              onToggleTask={onToggleTask || (() => {})}
              onDeleteTask={onDeleteTask || (() => {})}
              onOpenQuickTask={onOpenQuickTask}
              onUpdateTask={onUpdateTask}
            />
          </div>
        </div>
      )}

      {/* TAB CATATAN KULIAH: OBSIDIAN FOLDER TREE & TEXT EDITOR WITH FULLSCREEN */}
      {activeTab === "catatan" && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[580px] items-stretch relative">
          {/* KOLOM KIRI (30%): COLLAPSIBLE FOLDER TREE */}
          <div className="lg:col-span-4 bg-white border border-m3-outline-variant rounded-3xl p-4 sm:p-5 flex flex-col space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-m3-on-surface">Folder Catatan</h3>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCreateNewFolder}
                  className="p-1.5 rounded-lg text-m3-secondary hover:bg-m3-surface-container hover:text-m3-on-surface transition-colors"
                  title="Buat folder baru"
                >
                  <FolderPlus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleCreateNewNote(noteFolders[0]?.id)}
                  className="px-2.5 py-1 rounded-full bg-m3-primary text-m3-on-primary text-xs font-bold flex items-center gap-1 hover:brightness-95 transition-all shadow-xs"
                  title="Buat catatan baru"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Catatan</span>
                </button>
              </div>
            </div>

            {/* Pencarian Catatan */}
            <div className="relative">
              <Search className="w-4 h-4 text-m3-secondary absolute left-3 top-2.5" />
              <input
                type="text"
                value={noteSearchQuery}
                onChange={(e) => setNoteSearchQuery(e.target.value)}
                placeholder="Cari berkas catatan..."
                className="w-full pl-9 pr-3 py-2 rounded-2xl bg-m3-surface-container border border-m3-outline text-xs text-m3-on-surface placeholder:text-m3-secondary focus:outline-none focus:ring-2 focus:ring-m3-primary"
              />
            </div>

            {/* Folder Tree Collapsible List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {noteFolders.length === 0 ? (
                <div className="p-6 text-center text-xs text-m3-secondary border border-dashed border-m3-outline-variant rounded-2xl space-y-3">
                  <p>Belum ada catatan kuliah.</p>
                  <button
                    type="button"
                    onClick={() => handleCreateNewNote()}
                    className="px-3.5 py-1.5 rounded-full bg-m3-primary text-m3-on-primary text-xs font-semibold shadow-xs hover:brightness-95 transition-all inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Catatan Baru</span>
                  </button>
                </div>
              ) : (
                noteFolders.map((folder) => {
                  const isOpen = openNoteFolderIds.includes(folder.id);
                  const folderNotes = folder.notes.filter((n) =>
                    noteSearchQuery
                      ? n.title.toLowerCase().includes(noteSearchQuery.toLowerCase()) ||
                        n.filename.toLowerCase().includes(noteSearchQuery.toLowerCase())
                      : true
                  );

                  return (
                    <div
                      key={folder.id}
                      className="border border-m3-outline-variant rounded-2xl overflow-hidden bg-m3-surface-container/20"
                    >
                      {/* Folder Header Button */}
                      <div
                        onClick={() => toggleNoteFolder(folder.id)}
                        className="w-full p-2.5 flex items-center justify-between text-left cursor-pointer hover:bg-m3-surface-container/60 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {isOpen ? (
                            <FolderOpen className="w-4 h-4 text-m3-primary flex-shrink-0" />
                          ) : (
                            <Folder className="w-4 h-4 text-m3-secondary flex-shrink-0" />
                          )}
                          <span className="text-xs font-bold text-m3-on-surface truncate">
                            {folder.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-[10px] text-m3-secondary font-medium">
                            {folder.notes.length}
                          </span>
                          <ChevronRight
                            className={`w-3.5 h-3.5 text-m3-secondary transition-transform ${
                              isOpen ? "rotate-90" : ""
                            }`}
                          />
                        </div>
                      </div>

                      {/* Collapsible File List inside Folder */}
                      {isOpen && (
                        <div className="p-1.5 pt-0 space-y-1 bg-white">
                          {folderNotes.length === 0 ? (
                            <div className="py-2 text-center text-[10px] text-m3-secondary">
                              Folder kosong
                            </div>
                          ) : (
                            folderNotes.map((note) => {
                              const isActive = activeNote && note.id === activeNote.id;

                              return (
                                <div
                                  key={note.id}
                                  onClick={() => setActiveNoteId(note.id)}
                                  className={`w-full p-2 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer group ${
                                    isActive
                                      ? "bg-m3-primary-container border border-m3-primary shadow-xs"
                                      : "hover:bg-slate-50 border border-transparent"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <FileText
                                      className={`w-3.5 h-3.5 flex-shrink-0 ${
                                        isActive ? "text-m3-primary" : "text-m3-secondary"
                                      }`}
                                    />
                                    <div className="min-w-0">
                                      <p
                                        className={`text-xs truncate ${
                                          isActive
                                            ? "text-m3-on-primary-container font-bold"
                                            : "text-m3-on-surface font-medium"
                                        }`}
                                      >
                                        {note.title}
                                      </p>
                                      <p className="text-[10px] text-m3-secondary font-mono truncate">
                                        {note.filename}
                                      </p>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={(e) => handleDeleteNote(note.id, e)}
                                    className="p-1 text-m3-secondary hover:text-red-500 opacity-40 group-hover:opacity-100 transition-opacity"
                                    title="Hapus berkas"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* KOLOM KANAN (70%): INTERACTIVE OBSIDIAN TEXT EDITOR WITH FULLSCREEN */}
          <div
            className={`bg-white border border-m3-outline-variant rounded-3xl p-5 sm:p-6 flex flex-col space-y-3.5 shadow-xs ${
              isEditorFullscreen
                ? "fixed inset-0 z-50 rounded-none p-6 sm:p-10 bg-white"
                : "lg:col-span-8"
            }`}
          >
            {!activeNote ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-m3-secondary">
                <FileText className="w-12 h-12 stroke-[1.5] mb-2 opacity-40 text-m3-primary" />
                <p className="text-sm font-semibold text-m3-on-surface">Belum ada catatan perkuliahan</p>
                <p className="text-xs text-m3-secondary/80 mt-1 max-w-sm">
                  Mulai buat ringkasan materi, catatan kelas, atau daftar target belajar mandiri Anda.
                </p>
                <button
                  type="button"
                  onClick={() => handleCreateNewNote()}
                  className="mt-4 px-4 py-2 rounded-full bg-m3-primary text-m3-on-primary text-xs font-bold flex items-center gap-1.5 shadow-xs hover:brightness-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Buat Catatan Pertama</span>
                </button>
              </div>
            ) : (
              <>
                {/* Editor Top Bar: Title & Fullscreen Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-m3-outline-variant">
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={activeNote.title}
                      onChange={(e) => handleUpdateActiveNote("title", e.target.value)}
                      className="w-full text-base sm:text-lg font-bold text-m3-on-surface bg-transparent focus:outline-none focus:ring-0 placeholder:text-m3-secondary"
                      placeholder="Judul Catatan..."
                    />
                    <p className="text-[11px] text-m3-secondary font-mono">{activeNote.filename}</p>
                  </div>

              {/* Mode Toggle & Fullscreen Button */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="flex items-center gap-1 bg-m3-surface-container p-1 rounded-full border border-m3-outline-variant">
                  <button
                    type="button"
                    onClick={() => setNoteEditMode("edit")}
                    className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      noteEditMode === "edit"
                        ? "bg-white text-m3-on-surface shadow-xs font-bold"
                        : "text-m3-secondary hover:text-m3-on-surface"
                    }`}
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Tulis</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNoteEditMode("preview")}
                    className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      noteEditMode === "preview"
                        ? "bg-white text-m3-on-surface shadow-xs font-bold"
                        : "text-m3-secondary hover:text-m3-on-surface"
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    <span>Pratinjau</span>
                  </button>
                </div>

                {/* FULLSCREEN BUTTON */}
                <button
                  type="button"
                  onClick={() => setIsEditorFullscreen(!isEditorFullscreen)}
                  className="p-2 rounded-full bg-m3-surface-container hover:bg-m3-surface-container-high border border-m3-outline-variant text-m3-secondary hover:text-m3-on-surface transition-colors"
                  aria-label={isEditorFullscreen ? "Keluar layar penuh" : "Buka layar penuh"}
                  title={isEditorFullscreen ? "Keluar layar penuh" : "Layar penuh (Distraction Free)"}
                >
                  {isEditorFullscreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Markdown Toolbar */}
            {noteEditMode === "edit" && (
              <div className="flex items-center gap-1 p-1 bg-m3-surface-container/50 rounded-2xl border border-m3-outline-variant flex-wrap">
                <button
                  type="button"
                  onClick={() => handleUpdateActiveNote("content", activeNote.content + "\n# ")}
                  className="px-2.5 py-1 text-xs font-bold text-m3-secondary hover:bg-white rounded-lg transition-colors"
                  title="Heading 1"
                >
                  H1
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateActiveNote("content", activeNote.content + "\n## ")}
                  className="px-2.5 py-1 text-xs font-bold text-m3-secondary hover:bg-white rounded-lg transition-colors"
                  title="Heading 2"
                >
                  H2
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateActiveNote("content", activeNote.content + " **teks tebal** ")}
                  className="p-1.5 text-m3-secondary hover:bg-white rounded-lg transition-colors"
                  title="Tebal"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateActiveNote("content", activeNote.content + " *teks miring* ")}
                  className="p-1.5 text-m3-secondary hover:bg-white rounded-lg transition-colors"
                  title="Miring"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateActiveNote("content", activeNote.content + "\n- Poin daftar\n")}
                  className="p-1.5 text-m3-secondary hover:bg-white rounded-lg transition-colors"
                  title="Daftar Bullet"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateActiveNote("content", activeNote.content + "\n- [ ] Checklist tugas\n")}
                  className="p-1.5 text-m3-secondary hover:bg-white rounded-lg transition-colors"
                  title="Checklist"
                >
                  <ListTodo className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateActiveNote("content", activeNote.content + "\n```\n// kode\n```\n")}
                  className="p-1.5 text-m3-secondary hover:bg-white rounded-lg transition-colors"
                  title="Blok Kode"
                >
                  <Code className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Editor Area */}
            <div className="flex-1 flex flex-col min-h-0">
              {noteEditMode === "edit" ? (
                <textarea
                  value={activeNote.content}
                  onChange={(e) => handleUpdateActiveNote("content", e.target.value)}
                  placeholder="Tulis catatan kuliah di sini... Mendukung format Markdown (# Heading, - List, **Tebal**, dll.)"
                  className="w-full flex-1 p-4 rounded-2xl bg-m3-surface-container/20 border border-m3-outline-variant font-mono text-xs sm:text-sm text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary resize-none leading-relaxed"
                />
              ) : (
                <div className="w-full flex-1 p-5 rounded-2xl bg-m3-surface-container/20 border border-m3-outline-variant overflow-y-auto space-y-3 text-xs sm:text-sm text-m3-on-surface leading-relaxed whitespace-pre-wrap">
                  {activeNote.content}
                </div>
              )}
            </div>

            {/* Footer Status Bar */}
            <div className="flex items-center justify-between text-[11px] text-m3-secondary pt-2 border-t border-m3-outline-variant">
              <span>
                {activeNote.content.split(/\s+/).filter(Boolean).length} kata • {activeNote.content.length} karakter
              </span>
              <span className="flex items-center gap-1.5 text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Tersimpan di memori</span>
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )}

      {/* TAB RPS & MATERI: 40/60 FOLDER TREE + REALISTIC ACADEMIC DOCUMENT PREVIEW */}
      {activeTab === "rps" && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-140px)] min-h-[580px] max-h-[820px] items-stretch overflow-hidden relative">
          {/* KOLOM KIRI (35%): FOLDER TREE (SEMBUNYI JIKA DIMAKSIMALKAN) */}
          <div className={`${isRpsMaximized ? "hidden" : "lg:col-span-4"} bg-white border border-m3-outline-variant rounded-3xl p-4 sm:p-5 flex flex-col space-y-3.5 shadow-xs h-full overflow-hidden transition-all`}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-m3-on-surface">Folder Materi & RPS</h3>
              <span className="text-[11px] text-m3-secondary font-medium">{rpsFolders.length} Mata Kuliah</span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-m3-secondary absolute left-3 top-2.5" />
              <input
                type="text"
                value={rpsSearchQuery}
                onChange={(e) => setRpsSearchQuery(e.target.value)}
                placeholder="Cari berkas silabus atau matkul..."
                className="w-full pl-9 pr-3 py-2 rounded-2xl bg-m3-surface-container border border-m3-outline text-xs text-m3-on-surface placeholder:text-m3-secondary focus:outline-none focus:ring-2 focus:ring-m3-primary"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {rpsFolders.length === 0 ? (
                <div className="p-6 text-center text-xs text-m3-secondary border border-dashed border-m3-outline-variant rounded-2xl space-y-2">
                  <p>Belum ada berkas materi atau RPS.</p>
                  <p className="text-[11px] text-m3-secondary/70">
                    Berkas yang Anda upload dari dashboard akan otomatis terorganisir ke dalam folder matkul di sini.
                  </p>
                </div>
              ) : (
                rpsFolders.map((folder) => {
                  const isOpen = openRpsFolderId === folder.id;
                  const folderFiles = folder.files.filter((f) =>
                    rpsSearchQuery
                      ? f.name.toLowerCase().includes(rpsSearchQuery.toLowerCase()) ||
                        folder.courseName.toLowerCase().includes(rpsSearchQuery.toLowerCase())
                      : true
                  );

                  return (
                    <div
                      key={folder.id}
                      className="border border-m3-outline-variant rounded-2xl overflow-hidden bg-m3-surface-container/20"
                    >
                      {/* Folder Header Button - Sama persis seperti di Catatan Kuliah (Tanpa Dosen) */}
                      <div
                        onClick={() => setOpenRpsFolderId(isOpen ? "" : folder.id)}
                        className="w-full p-2.5 flex items-center justify-between text-left cursor-pointer hover:bg-m3-surface-container/60 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {isOpen ? (
                            <FolderOpen className="w-4 h-4 text-m3-primary flex-shrink-0" />
                          ) : (
                            <Folder className="w-4 h-4 text-m3-secondary flex-shrink-0" />
                          )}
                          <span className="text-xs font-bold text-m3-on-surface truncate">
                            {folder.courseName}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-[10px] text-m3-secondary font-medium">
                            {folderFiles.length}
                          </span>
                          <ChevronRight
                            className={`w-3.5 h-3.5 text-m3-secondary transition-transform ${
                              isOpen ? "rotate-90" : ""
                            }`}
                          />
                        </div>
                      </div>

                      {/* Berkas dalam folder (Sama seperti catatan) */}
                      {isOpen && (
                        <div className="p-1 space-y-0.5 border-t border-m3-outline-variant/60 bg-white">
                          {folderFiles.map((file) => {
                            const isSelected = file.id === selectedFileId;

                            return (
                              <button
                                key={file.id}
                                type="button"
                                onClick={() => setSelectedFileId(file.id)}
                                className={`w-full p-2 rounded-xl flex items-center justify-between text-left transition-all ${
                                  isSelected
                                    ? "bg-m3-primary-container border border-m3-primary text-m3-on-primary-container font-medium shadow-xs"
                                    : "hover:bg-m3-surface-container-high text-m3-on-surface border border-transparent"
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  {file.type === "pdf" && (
                                    <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? "text-m3-primary" : "text-rose-600"}`} />
                                  )}
                                  {file.type === "pptx" && (
                                    <Presentation className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? "text-m3-primary" : "text-amber-600"}`} />
                                  )}
                                  {file.type === "docx" && (
                                    <FileCode className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? "text-m3-primary" : "text-blue-600"}`} />
                                  )}
                                  <span className="text-xs truncate">
                                    {file.name}
                                  </span>
                                </div>

                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase flex-shrink-0 ${
                                    isSelected
                                      ? "bg-white text-m3-primary"
                                      : "bg-m3-surface-container text-m3-secondary"
                                  }`}
                                >
                                  {file.type}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* KOLOM KANAN: PREVIEW DOKUMEN AKADEMIK SEBENARNYA */}
          <div className={`${isRpsMaximized ? "lg:col-span-12" : "lg:col-span-8"} bg-white border border-m3-outline-variant rounded-3xl p-5 sm:p-6 flex flex-col space-y-4 shadow-xs h-full overflow-hidden transition-all`}>
            {!currentDoc ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-m3-secondary">
                <FileText className="w-12 h-12 stroke-[1.5] mb-2 opacity-50" />
                <p className="text-sm font-semibold text-m3-on-surface">Belum ada dokumen yang dipilih</p>
                <p className="text-xs text-m3-secondary/80 mt-1">Pilih salah satu berkas di sebelah kiri atau unggah dokumen materi baru.</p>
              </div>
            ) : (
              <>
                {/* Header Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-m3-outline-variant">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-m3-surface-container flex items-center justify-center flex-shrink-0 text-m3-primary border border-m3-outline-variant">
                      {currentDoc.type === "pdf" ? (
                        <FileText className="w-5 h-5 text-rose-600" />
                      ) : (
                        <Presentation className="w-5 h-5 text-amber-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-bold text-m3-on-surface truncate">
                        {currentDoc.name}
                      </h3>
                      <p className="text-xs text-m3-secondary truncate">
                        {currentFolder?.courseName || "Materi Kuliah"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsRpsMaximized(!isRpsMaximized)}
                      className="min-h-[44px] px-3.5 py-1.5 rounded-full bg-m3-surface-container hover:bg-m3-surface-container-high text-xs font-semibold text-m3-on-surface border border-m3-outline-variant flex items-center gap-1.5 transition-colors"
                      title={isRpsMaximized ? "Kecilkan pratinjau dokumen" : "Perbesar pratinjau dokumen dalam aplikasi"}
                    >
                      {isRpsMaximized ? (
                        <>
                          <Minimize2 className="w-3.5 h-3.5 text-m3-secondary" />
                          <span>Kecilkan</span>
                        </>
                      ) : (
                        <>
                          <Maximize2 className="w-3.5 h-3.5 text-m3-secondary" />
                          <span>Perbesar</span>
                        </>
                      )}
                    </button>
                    <a
                      href={getDocFileUrl(currentDoc)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[44px] px-3.5 py-1.5 rounded-full bg-m3-surface-container hover:bg-m3-surface-container-high text-xs font-semibold text-m3-on-surface border border-m3-outline-variant flex items-center gap-1.5 transition-colors"
                      title="Buka dokumen di tab baru"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-m3-secondary" />
                      <span>Buka di Tab Baru</span>
                    </a>
                    <a
                      href={getDocFileUrl(currentDoc)}
                      download={currentDoc.name}
                      className="min-h-[44px] px-4 py-1.5 rounded-full bg-m3-primary hover:brightness-95 text-xs font-semibold text-m3-on-primary flex items-center gap-1.5 transition-all shadow-xs"
                      title="Unduh berkas asli"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh</span>
                    </a>
                  </div>
                </div>

                {/* AS-IS VIEWER: FISIK BERKAS ASLI (PDF, GAMBAR, ATAU OFFICE) */}
                <div className="flex-1 w-full h-full min-h-[480px] rounded-2xl border border-m3-outline-variant bg-slate-100 flex flex-col overflow-hidden relative shadow-inner">
                  {currentDoc.type === "pdf" || currentDoc.name.toLowerCase().endsWith(".pdf") ? (
                    <iframe
                      src={getDocFileUrl(currentDoc)}
                      className="w-full h-full min-h-[480px] border-0 bg-white"
                      title={currentDoc.name}
                    />
                  ) : currentDoc.type === "jpg" || currentDoc.type === "png" || currentDoc.name.toLowerCase().match(/\.(jpe?g|png|webp)$/i) ? (
                    <div className="w-full h-full min-h-[480px] flex items-center justify-center p-4 bg-slate-900/5 overflow-auto">
                      <img
                        src={getDocFileUrl(currentDoc)}
                        alt={currentDoc.name}
                        className="max-h-[580px] max-w-full object-contain rounded-xl shadow-md border border-slate-200"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full min-h-[480px] flex flex-col items-center justify-center p-8 bg-white text-center space-y-4">
                      <div className="w-16 h-16 rounded-3xl bg-m3-primary-container text-m3-on-primary-container flex items-center justify-center shadow-xs">
                        {currentDoc.type === "pptx" || currentDoc.name.toLowerCase().endsWith(".pptx") ? (
                          <Presentation className="w-8 h-8 text-amber-600" />
                        ) : (
                          <FileText className="w-8 h-8 text-blue-600" />
                        )}
                      </div>
                      <div className="max-w-md space-y-1.5">
                        <h4 className="text-base font-bold text-m3-on-surface">{currentDoc.name}</h4>
                        <p className="text-xs text-m3-secondary leading-relaxed">
                          Dokumen perkuliahan berformat {currentDoc.name.split(".").pop()?.toUpperCase() || "Office"}. Berkas ini tersimpan aman di server lokal dan siap dibuka di aplikasi dokumen komputer Anda.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <a
                          href={getDocFileUrl(currentDoc)}
                          download={currentDoc.name}
                          className="min-h-[44px] px-6 py-2.5 rounded-full text-xs font-bold bg-m3-primary text-m3-on-primary hover:brightness-95 transition-all shadow-xs flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          <span>Unduh Berkas</span>
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* METADATA DOKUMEN ASLI (TANPA KOP SURAT TIRUAN) */}
                <div className="p-3 bg-m3-surface-container-low border border-m3-outline-variant rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-m3-on-surface">{currentDoc.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-m3-primary border border-m3-outline-variant uppercase">
                      {currentDoc.name.split(".").pop() || currentDoc.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-m3-secondary text-[11px]">
                    <span>Lokasi: {getDocFileUrl(currentDoc)}</span>
                    <span>•</span>
                    <span>Diperbarui: {currentDoc.updated}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB AKUN & SETTING (HALAMAN TUNGGAL PANJANG DIPISAH GARIS) */}
      {(activeTab === "akun" || activeTab === "setting") && (
        <div className="max-w-3xl mx-auto w-full space-y-6">
          {isSaved && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>Profil mahasiswa dan preferensi sistem berhasil disimpan!</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-6 bg-white p-6 sm:p-8 rounded-3xl border border-m3-outline-variant shadow-xs">
            {/* BAGIAN 1: FOTO PROFIL & IDENTITAS DIRI */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1">
                <User className="w-4 h-4 text-m3-primary" />
                <h3 className="text-sm font-bold text-m3-on-surface">Foto Profil & Identitas Diri</h3>
              </div>

              {/* Foto Profil with Live Preview and Change Button */}
              <div className="flex items-center gap-5 p-4 rounded-2xl bg-m3-surface-container/30 border border-m3-outline-variant/60">
                <div className="relative group w-20 h-20 rounded-full overflow-hidden border-2 border-m3-outline-variant shadow-xs flex-shrink-0 bg-m3-surface-container flex items-center justify-center">
                  {formData.photoUrl ? (
                    <img
                      src={formData.photoUrl}
                      alt={formData.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-m3-primary text-m3-on-primary font-bold text-xl flex items-center justify-center">
                      {formData.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "MA"}
                    </div>
                  )}
                  <label
                    htmlFor="profile-photo-upload"
                    className="absolute inset-0 bg-black/40 text-white text-[10px] font-semibold flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-center px-1"
                  >
                    <span>Ganti Foto</span>
                  </label>
                </div>

                <div className="space-y-2 flex-1">
                  <div>
                    <h4 className="text-sm font-bold text-m3-on-surface">{formData.name || "Nama Mahasiswa"}</h4>
                    <p className="text-xs text-m3-secondary font-mono">{formData.nim || "-"}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <label
                      htmlFor="profile-photo-upload"
                      className="min-h-[36px] px-3.5 py-1.5 rounded-full bg-m3-primary text-m3-on-primary text-xs font-semibold cursor-pointer hover:brightness-95 transition-all inline-flex items-center gap-1.5 shadow-xs"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Unggah Foto Profil</span>
                    </label>
                    <input
                      id="profile-photo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const uploadData = new FormData();
                        uploadData.append("file", file);
                        try {
                          const res = await fetch("/api/upload", { method: "POST", body: uploadData });
                          if (res.ok) {
                            const data = await res.json();
                            const url = data.url || data.filePath;
                            if (url) {
                              setFormData((prev) => ({ ...prev, photoUrl: url }));
                              return;
                            }
                          }
                        } catch (err) {
                          console.error("Upload error:", err);
                        }
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const result = ev.target?.result as string;
                          if (result) setFormData((prev) => ({ ...prev, photoUrl: result }));
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                    {formData.photoUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, photoUrl: undefined }))}
                        className="min-h-[36px] px-3 py-1.5 rounded-full text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        Hapus Foto
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Input Identitas Diri */}
              <div className="space-y-3 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-m3-on-surface">Nama Lengkap</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                    placeholder="Contoh: Muhammad Raihan"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-m3-surface-container/30 border border-m3-outline text-xs text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-m3-on-surface">Nomor Induk Mahasiswa (NIM)</label>
                    <input
                      type="text"
                      value={formData.nim}
                      onChange={(e) => handleInputChange("nim", e.target.value)}
                      required
                      placeholder="Contoh: 22/498231/TK/54120"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-m3-surface-container/30 border border-m3-outline text-xs text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-m3-on-surface">Email Kampus / Akun Resmi</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      required
                      placeholder="Contoh: mahasiswa@mail.ugm.ac.id"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-m3-surface-container/30 border border-m3-outline text-xs text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary"
                    />
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-m3-outline-variant/60 my-6" />

            {/* BAGIAN 2: INSTITUSI & AKADEMIK */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1">
                <BookOpen className="w-4 h-4 text-m3-primary" />
                <h3 className="text-sm font-bold text-m3-on-surface">Institusi & Akademik</h3>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-m3-on-surface">
                    Universitas / Institut / Politeknik
                  </label>
                  <input
                    type="text"
                    value={formData.university}
                    onChange={(e) => handleInputChange("university", e.target.value)}
                    placeholder="Contoh: Universitas Gadjah Mada"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-m3-surface-container/30 border border-m3-outline text-xs text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-m3-on-surface">
                    Fakultas / Program Studi
                  </label>
                  <input
                    type="text"
                    value={formData.faculty}
                    onChange={(e) => handleInputChange("faculty", e.target.value)}
                    placeholder="Contoh: Fakultas Teknik / Teknik Informatika"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-m3-surface-container/30 border border-m3-outline text-xs text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-m3-on-surface">Semester Berjalan</label>
                    <select
                      value={formData.semester}
                      onChange={(e) => handleInputChange("semester", Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl bg-m3-surface-container/30 border border-m3-outline text-xs text-m3-on-surface focus:outline-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((sem) => (
                        <option key={sem} value={sem}>
                          Semester {sem}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-m3-on-surface">
                      Dosen Pembimbing Akademik (Opsional)
                    </label>
                    <input
                      type="text"
                      value={formData.academicAdvisor}
                      onChange={(e) => handleInputChange("academicAdvisor", e.target.value)}
                      placeholder="Nama Dosen PA"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-m3-surface-container/30 border border-m3-outline text-xs text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary"
                    />
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-m3-outline-variant/60 my-6" />

            {/* BAGIAN 3: PENGATURAN DATA & SISTEM */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1">
                <Globe className="w-4 h-4 text-m3-primary" />
                <h3 className="text-sm font-bold text-m3-on-surface">Pengaturan Data & Preferensi Sistem</h3>
              </div>

              <div className="p-4 rounded-2xl bg-m3-surface-container/40 border border-m3-outline-variant/60 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-m3-on-surface">Penyimpanan Lokal (Offline-First SQLite)</p>
                  <p className="text-[11px] text-m3-secondary">Seluruh data jadwal, tugas, dan materi tersimpan aman di perangkat lokal.</p>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                  Aktif
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-m3-surface-container/30 border border-m3-outline-variant/60 space-y-2 text-xs">
                <h4 className="font-bold text-m3-on-surface">Preferensi Pengingat</h4>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-m3-secondary">Pengingat kelas 15 menit sebelum kuliah dimulai</span>
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded-md accent-m3-primary" />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-m3-secondary">Peringatan tenggat tugas kuliah (H-1)</span>
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded-md accent-m3-primary" />
                </label>
                <label className="flex items-center justify-between cursor-pointer pt-1.5 border-t border-slate-100">
                  <div>
                    <span className="text-xs font-semibold text-m3-on-surface block">Sembunyikan Foto Dosen</span>
                    <span className="text-[11px] text-m3-secondary">Tampilkan kartu mata kuliah ringkas tanpa foto wajah dosen</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={hideLecturerPhotos}
                    onChange={(e) => setHideLecturerPhotos(e.target.checked)}
                    className="w-4 h-4 rounded-md accent-m3-primary cursor-pointer"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-xs font-semibold text-m3-on-surface block">Mode Bebas AI (Non-AI Mode)</span>
                    <span className="text-[11px] text-m3-secondary">Matikan seluruh fitur AI, impor jadwal AI, dan rekomendasi otomatis di aplikasi</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!formData.noAiMode}
                    onChange={(e) => {
                      handleInputChange("noAiMode", e.target.checked);
                      onUpdateProfile({ ...formData, noAiMode: e.target.checked });
                    }}
                    className="w-4 h-4 rounded-md accent-m3-primary cursor-pointer"
                  />
                </label>
              </div>

              {/* Zona Bahaya: Reset Bersih */}
              <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200/80 space-y-2">
                <h4 className="text-xs font-bold text-rose-900">Manajemen Database & Reset Bersih</h4>
                <p className="text-[11px] text-rose-700 leading-relaxed">
                  Kosongkan seluruh data tugas, jadwal kalender, dan materi untuk memulai kembali dengan catatan bersih tanpa data dummy.
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm("Apakah Anda yakin ingin mengosongkan seluruh data tugas, jadwal, dan riwayat? Tindakan ini tidak dapat dibatalkan.")) {
                      try {
                        const res = await fetch("/api/reset", { method: "POST" });
                        if (res.ok) {
                          alert("Database berhasil dikosongkan. Halaman akan dimuat ulang.");
                          window.location.reload();
                        } else {
                          alert("Gagal mengosongkan database.");
                        }
                      } catch (err) {
                        alert("Terjadi kesalahan saat mereset data.");
                      }
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-white border border-rose-300 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-colors shadow-xs"
                >
                  Kosongkan Seluruh Data / Reset Bersih
                </button>
              </div>
            </div>

            {/* TOMBOL SIMPAN */}
            <div className="pt-4 border-t border-m3-outline-variant/60 flex items-center justify-end">
              <button
                type="submit"
                className="min-h-[44px] px-6 py-2.5 rounded-full bg-m3-primary text-m3-on-primary text-xs font-bold hover:brightness-95 transition-all shadow-xs flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan Akun & Pengaturan</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB MATKUL DAN DOSEN: GRID 3 KOLOM SESUAI SKETSA PENGGUNA */}
      {activeTab === "matkul" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3 pb-1 border-b border-m3-outline-variant/60">
            <div>
              <p className="text-xs text-m3-secondary">
                Daftar mata kuliah semester ini dan profil dosen pengampu
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddLecturerOpen(true)}
              className="px-4 py-2 rounded-full bg-m3-primary text-m3-on-primary text-xs font-bold flex items-center gap-1.5 hover:brightness-95 transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Mata Kuliah & Dosen</span>
            </button>
          </div>

          {/* Grid 3 Kolom Kartu Sesuai Sketsa */}
          {courseLecturers.length === 0 ? (
            <div className="p-12 text-center text-xs text-m3-secondary border border-dashed border-m3-outline-variant rounded-3xl bg-white space-y-3">
              <BookOpen className="w-10 h-10 mx-auto opacity-40 text-m3-primary" />
              <p className="font-semibold text-sm text-m3-on-surface">Belum ada mata kuliah atau profil dosen</p>
              <p className="text-xs text-m3-secondary max-w-sm mx-auto">
                Tambahkan jadwal perkuliahan di Kalender atau klik tombol &quot;Tambah Mata Kuliah & Dosen&quot; di atas untuk mendaftarkan dosen pengampu.
              </p>
              <button
                type="button"
                onClick={() => setIsAddLecturerOpen(true)}
                className="mt-2 px-4 py-2 rounded-full bg-m3-primary text-m3-on-primary text-xs font-bold inline-flex items-center gap-1.5 shadow-xs hover:brightness-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Mata Kuliah</span>
              </button>
            </div>
          ) : (
            <div className={`grid gap-4 ${
              hideLecturerPhotos
                ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
            }`}>
              {courseLecturers.map((c) => (
              <div
                key={c.id}
                onClick={() => setEditingLecturer(c)}
                className="p-3.5 sm:p-4 rounded-3xl bg-white border border-m3-outline-variant hover:border-m3-primary/50 shadow-xs hover:shadow-sm transition-all flex gap-3.5 cursor-pointer group relative overflow-hidden"
              >
                {/* KIRI: FOTO DOSEN PERSEGI PANJANG / POTRET (BISA DISEMBUNYIKAN VIA SETTING) */}
                {!hideLecturerPhotos && (
                  <div className="w-20 sm:w-24 h-28 sm:h-32 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 flex-shrink-0 relative">
                    {c.lecturerPhoto ? (
                      <img
                        src={c.lecturerPhoto}
                        alt={c.lecturerName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-m3-secondary bg-m3-surface-container">
                        <User className="w-8 h-8 opacity-50" />
                        <span className="text-[10px] font-bold mt-1">Dosen</span>
                      </div>
                    )}
                  </div>
                )}

                {/* KANAN: HIERARKI NAMA MATKUL DULU -> DOSEN KECIL -> WAKTU & LOKASI -> LINK WA & LMS */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div>
                    {/* Nama Matkul (Atas, Bold) */}
                    <h4 className="text-xs sm:text-sm font-bold text-m3-on-surface line-clamp-2 leading-snug group-hover:text-m3-primary transition-colors">
                      {c.courseName}
                    </h4>

                    {/* Nama Dosen (Kecil) */}
                    <p className="text-[11px] text-m3-secondary font-medium mt-1 truncate">
                      {c.lecturerName}
                    </p>

                    {/* Jam Kelas & Lokasi Berdampingan Sesuai Permintaan */}
                    <div className="flex items-center gap-1.5 text-[10px] text-m3-secondary mt-2 flex-wrap">
                      <div className="flex items-center gap-1 bg-m3-surface-container px-2.5 py-0.5 rounded-full font-medium">
                        <Clock className="w-3 h-3 text-m3-primary flex-shrink-0" />
                        <span>{c.dayTime}</span>
                      </div>
                      <span className="text-slate-300">•</span>
                      <span className="truncate max-w-[140px] font-medium text-slate-700">{c.room}</span>
                    </div>
                  </div>

                  {/* Bawah: Status Presensi Tanpa Angka + Ikon Tombol (O O) */}
                  <div className="flex items-center justify-between gap-1.5 mt-3 pt-2 border-t border-slate-100 flex-wrap">
                    {/* Status Presensi: Aman, Hmm..., Gawat, Bahaya */}
                    {c.attendanceStatus === "aman" && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Aman
                      </span>
                    )}
                    {(c.attendanceStatus === "hmm" || c.attendanceStatus === "waspada") && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        Hmm...
                      </span>
                    )}
                    {c.attendanceStatus === "gawat" && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-800 border border-orange-200">
                        Gawat
                      </span>
                    )}
                    {c.attendanceStatus === "bahaya" && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                        Bahaya
                      </span>
                    )}

                    {/* Ikon Aksi: WA & LMS + Edit */}
                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto">
                      {c.whatsapp ? (
                        <a
                          href={`https://wa.me/${c.whatsapp}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors shadow-xs"
                          title={`Hubungi WhatsApp Dosen (${c.whatsapp})`}
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      ) : null}

                      {c.lmsUrl ? (
                        <a
                          href={c.lmsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors shadow-xs"
                          title="Buka LMS / eLOK Mata Kuliah"
                        >
                          <Globe className="w-3.5 h-3.5" />
                        </a>
                      ) : null}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingLecturer(c);
                        }}
                        className="p-1.5 rounded-full bg-m3-surface-container hover:bg-m3-surface-container-high text-m3-secondary hover:text-m3-on-surface border border-m3-outline-variant transition-colors"
                        title="Edit Profil Dosen & Matkul"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

          {/* MODAL EDIT DOSEN & MATKUL */}
          {editingLecturer && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
              <div className="bg-white rounded-3xl border border-m3-outline-variant p-6 w-full max-w-lg shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="text-base font-bold text-m3-on-surface">
                      Edit Profil Dosen & Mata Kuliah
                    </h3>
                    <p className="text-[11px] text-m3-secondary">
                      Perbarui foto pengajar, jadwal kuliah, kontak dosen, dan status presensi.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingLecturer(null)}
                    className="p-1.5 rounded-full text-m3-secondary hover:bg-m3-surface-container"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveLecturerEdit} className="space-y-4 text-xs">
                  {/* Foto Dosen dengan Pratinjau & Upload */}
                  <div className="flex items-center gap-4 p-3.5 bg-m3-surface-container/30 rounded-2xl border border-m3-outline-variant">
                    <div className="w-20 h-28 rounded-xl overflow-hidden bg-slate-100 border border-slate-300 flex-shrink-0 relative">
                      {editingLecturer.lecturerPhoto ? (
                        <img
                          src={editingLecturer.lecturerPhoto}
                          alt={editingLecturer.lecturerName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-m3-secondary">
                          <User className="w-8 h-8 opacity-40" />
                          <span className="text-[9px] font-bold mt-1 text-center px-1">Tanpa Foto</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-xs font-bold text-m3-on-surface">Foto Dosen (Potret)</p>
                      <div className="flex items-center gap-2">
                        <label className="px-3 py-1.5 rounded-xl bg-white border border-m3-outline text-[11px] font-bold text-m3-primary hover:bg-m3-surface-container cursor-pointer transition-colors shadow-xs">
                          <span>Pilih Foto</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handlePhotoUpload(e, false)}
                          />
                        </label>
                        {editingLecturer.lecturerPhoto && (
                          <button
                            type="button"
                            onClick={() => setEditingLecturer({ ...editingLecturer, lecturerPhoto: undefined })}
                            className="px-2.5 py-1.5 rounded-xl text-[11px] text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
                          >
                            Hapus Foto
                          </button>
                        )}
                      </div>
                      <input
                        type="url"
                        value={editingLecturer.lecturerPhoto || ""}
                        onChange={(e) =>
                          setEditingLecturer({ ...editingLecturer, lecturerPhoto: e.target.value })
                        }
                        placeholder="Atau tautkan URL foto..."
                        className="w-full p-2 text-[11px] rounded-xl border border-m3-outline bg-white focus:outline-none focus:ring-1 focus:ring-m3-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-m3-on-surface">Nama Mata Kuliah</label>
                    <input
                      type="text"
                      value={editingLecturer.courseName}
                      onChange={(e) =>
                        setEditingLecturer({ ...editingLecturer, courseName: e.target.value })
                      }
                      className="w-full p-2.5 rounded-xl border border-m3-outline bg-m3-surface-container/30 focus:outline-none focus:ring-2 focus:ring-m3-primary"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-m3-on-surface">Nama Dosen & Gelar Lengkap</label>
                    <input
                      type="text"
                      value={editingLecturer.lecturerName}
                      onChange={(e) =>
                        setEditingLecturer({ ...editingLecturer, lecturerName: e.target.value })
                      }
                      className="w-full p-2.5 rounded-xl border border-m3-outline bg-m3-surface-container/30 focus:outline-none focus:ring-2 focus:ring-m3-primary"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="font-semibold text-m3-on-surface">Hari & Jam Kelas</label>
                        <span className="text-[10px] text-m3-secondary font-medium">(Otomatis dari Kalender)</span>
                      </div>
                      <input
                        type="text"
                        value={editingLecturer.dayTime}
                        readOnly
                        disabled
                        className="w-full p-2.5 rounded-xl border border-m3-outline-variant bg-slate-100 text-slate-600 cursor-not-allowed select-none font-medium text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-m3-on-surface">Ruangan / Lab</label>
                      <input
                        type="text"
                        value={editingLecturer.room}
                        onChange={(e) =>
                          setEditingLecturer({ ...editingLecturer, room: e.target.value })
                        }
                        className="w-full p-2.5 rounded-xl border border-m3-outline bg-m3-surface-container/30 focus:outline-none focus:ring-2 focus:ring-m3-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-m3-on-surface">Nomor WhatsApp Dosen</label>
                      <input
                        type="text"
                        value={editingLecturer.whatsapp || ""}
                        onChange={(e) =>
                          setEditingLecturer({ ...editingLecturer, whatsapp: e.target.value })
                        }
                        placeholder="Contoh: 6281234567890"
                        className="w-full p-2.5 rounded-xl border border-m3-outline bg-m3-surface-container/30 focus:outline-none focus:ring-2 focus:ring-m3-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-m3-on-surface">Tautan LMS Kuliah (eLOK)</label>
                      <input
                        type="url"
                        value={editingLecturer.lmsUrl || ""}
                        onChange={(e) =>
                          setEditingLecturer({ ...editingLecturer, lmsUrl: e.target.value })
                        }
                        placeholder="https://elok.ugm.ac.id/..."
                        className="w-full p-2.5 rounded-xl border border-m3-outline bg-m3-surface-container/30 focus:outline-none focus:ring-2 focus:ring-m3-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-m3-on-surface">Status Presensi Kehadiran</label>
                    <select
                      value={editingLecturer.attendanceStatus || "aman"}
                      onChange={(e) =>
                        setEditingLecturer({
                          ...editingLecturer,
                          attendanceStatus: e.target.value as any,
                        })
                      }
                      className="w-full p-2.5 rounded-xl border border-m3-outline bg-m3-surface-container/30 focus:outline-none focus:ring-2 focus:ring-m3-primary capitalize"
                    >
                      <option value="aman">Aman</option>
                      <option value="hmm">Hmm...</option>
                      <option value="gawat">Gawat</option>
                      <option value="bahaya">Bahaya</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <button
                      type="button"
                      onClick={() => handleDeleteLecturer(editingLecturer.id)}
                      className="px-4 py-2 rounded-full text-red-600 hover:bg-red-50 font-bold transition-colors"
                    >
                      Hapus Mata Kuliah
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingLecturer(null)}
                        className="px-4 py-2 rounded-full text-m3-secondary hover:bg-m3-surface-container transition-colors"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-full bg-m3-primary text-m3-on-primary font-bold shadow-xs hover:brightness-95 transition-all"
                      >
                        Simpan Perubahan
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL TAMBAH DOSEN & MATKUL */}
          {isAddLecturerOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
              <div className="bg-white rounded-3xl border border-m3-outline-variant p-6 w-full max-w-lg shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="text-base font-bold text-m3-on-surface">
                    Tambah Mata Kuliah & Dosen Baru
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAddLecturerOpen(false)}
                    className="p-1.5 rounded-full text-m3-secondary hover:bg-m3-surface-container"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleAddLecturer} className="space-y-4 text-xs">
                  {/* Foto Dosen dengan Pratinjau & Upload */}
                  <div className="flex items-center gap-4 p-3.5 bg-m3-surface-container/30 rounded-2xl border border-m3-outline-variant">
                    <div className="w-20 h-28 rounded-xl overflow-hidden bg-slate-100 border border-slate-300 flex-shrink-0 relative">
                      {newLecturerForm.lecturerPhoto ? (
                        <img
                          src={newLecturerForm.lecturerPhoto}
                          alt="Foto Baru"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-m3-secondary">
                          <User className="w-8 h-8 opacity-40" />
                          <span className="text-[9px] font-bold mt-1 text-center px-1">Tanpa Foto</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-xs font-bold text-m3-on-surface">Foto Dosen (Potret)</p>
                      <div className="flex items-center gap-2">
                        <label className="px-3 py-1.5 rounded-xl bg-white border border-m3-outline text-[11px] font-bold text-m3-primary hover:bg-m3-surface-container cursor-pointer transition-colors shadow-xs">
                          <span>Pilih Foto</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handlePhotoUpload(e, true)}
                          />
                        </label>
                        {newLecturerForm.lecturerPhoto && (
                          <button
                            type="button"
                            onClick={() => setNewLecturerForm({ ...newLecturerForm, lecturerPhoto: undefined })}
                            className="px-2.5 py-1.5 rounded-xl text-[11px] text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
                          >
                            Hapus Foto
                          </button>
                        )}
                      </div>
                      <input
                        type="url"
                        value={newLecturerForm.lecturerPhoto || ""}
                        onChange={(e) =>
                          setNewLecturerForm({ ...newLecturerForm, lecturerPhoto: e.target.value })
                        }
                        placeholder="Atau tautkan URL foto..."
                        className="w-full p-2 text-[11px] rounded-xl border border-m3-outline bg-white focus:outline-none focus:ring-1 focus:ring-m3-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-m3-on-surface">Nama Mata Kuliah</label>
                    <input
                      type="text"
                      value={newLecturerForm.courseName}
                      onChange={(e) =>
                        setNewLecturerForm({ ...newLecturerForm, courseName: e.target.value })
                      }
                      placeholder="Contoh: Pemrograman Web Lanjut"
                      className="w-full p-2.5 rounded-xl border border-m3-outline bg-m3-surface-container/30 focus:outline-none focus:ring-2 focus:ring-m3-primary"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-m3-on-surface">Nama Dosen & Gelar</label>
                    <input
                      type="text"
                      value={newLecturerForm.lecturerName}
                      onChange={(e) =>
                        setNewLecturerForm({ ...newLecturerForm, lecturerName: e.target.value })
                      }
                      placeholder="Contoh: Ir. Muhammad Rizki, M.Eng."
                      className="w-full p-2.5 rounded-xl border border-m3-outline bg-m3-surface-container/30 focus:outline-none focus:ring-2 focus:ring-m3-primary"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-m3-on-surface">Hari & Jam Kelas</label>
                      <input
                        type="text"
                        value={newLecturerForm.dayTime}
                        onChange={(e) =>
                          setNewLecturerForm({ ...newLecturerForm, dayTime: e.target.value })
                        }
                        placeholder="Contoh: Kamis, 09.00 - 11.30 WIB"
                        className="w-full p-2.5 rounded-xl border border-m3-outline bg-m3-surface-container/30 focus:outline-none focus:ring-2 focus:ring-m3-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-m3-on-surface">Ruangan / Lab</label>
                      <input
                        type="text"
                        value={newLecturerForm.room}
                        onChange={(e) =>
                          setNewLecturerForm({ ...newLecturerForm, room: e.target.value })
                        }
                        placeholder="Contoh: Lab Komputer 3"
                        className="w-full p-2.5 rounded-xl border border-m3-outline bg-m3-surface-container/30 focus:outline-none focus:ring-2 focus:ring-m3-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-m3-on-surface">Nomor WhatsApp (Opsional)</label>
                      <input
                        type="text"
                        value={newLecturerForm.whatsapp || ""}
                        onChange={(e) =>
                          setNewLecturerForm({ ...newLecturerForm, whatsapp: e.target.value })
                        }
                        placeholder="6281234567890"
                        className="w-full p-2.5 rounded-xl border border-m3-outline bg-m3-surface-container/30 focus:outline-none focus:ring-2 focus:ring-m3-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-m3-on-surface">Tautan LMS Kuliah (Opsional)</label>
                      <input
                        type="url"
                        value={newLecturerForm.lmsUrl || ""}
                        onChange={(e) =>
                          setNewLecturerForm({ ...newLecturerForm, lmsUrl: e.target.value })
                        }
                        placeholder="https://elok.ugm.ac.id/..."
                        className="w-full p-2.5 rounded-xl border border-m3-outline bg-m3-surface-container/30 focus:outline-none focus:ring-2 focus:ring-m3-primary"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t">
                    <button
                      type="button"
                      onClick={() => setIsAddLecturerOpen(false)}
                      className="px-4 py-2 rounded-full text-m3-secondary hover:bg-m3-surface-container transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-full bg-m3-primary text-m3-on-primary font-bold shadow-xs hover:brightness-95 transition-all"
                    >
                      Tambah Dosen
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB QUIZ: DI-BLANK-IN SESUAI INSTRUKSI PENGGUNA */}
      {activeTab === "quiz" && (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[420px] rounded-3xl border border-dashed border-m3-outline-variant/60 bg-m3-surface-container/20 p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-m3-surface-container flex items-center justify-center text-m3-secondary/60 mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-m3-on-surface">Fitur AI Quiz</h3>
          <p className="text-xs text-m3-secondary max-w-sm mt-1">
            Halaman ini dikosongkan sementara waktu sesuai instruksi pengembangan.
          </p>
        </div>
      )}
    </section>
  );
}
