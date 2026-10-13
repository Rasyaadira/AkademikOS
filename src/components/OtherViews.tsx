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

const initialCourseLecturers: CourseLecturerItem[] = [
  {
    id: "cl-1",
    courseName: "Kecerdasan Buatan & Sistem Pakar",
    lecturerName: "Dr. Ir. Budi Santoso, M.Kom.",
    lecturerPhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    dayTime: "Kamis, 09.00 - 11.30 WIB",
    room: "Lab AI - Gd. C 302",
    sks: 3,
    whatsapp: "6281234567890",
    lmsUrl: "https://elok.ugm.ac.id/course/ai-2026",
    attendanceStatus: "aman",
  },
  {
    id: "cl-2",
    courseName: "Sistem Operasi",
    lecturerName: "Dr. Ahmad Fauzi, M.T.",
    lecturerPhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    dayTime: "Senin, 07.30 - 10.00 WIB",
    room: "Lab Komputasi Dasar 2",
    sks: 3,
    whatsapp: "6281298765432",
    lmsUrl: "https://elok.ugm.ac.id/course/os-2026",
    attendanceStatus: "aman",
  },
  {
    id: "cl-3",
    courseName: "Rekayasa Perangkat Lunak",
    lecturerName: "Siti Rahmawati, S.Kom., M.Cs.",
    lecturerPhoto: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
    dayTime: "Selasa, 13.00 - 15.30 WIB",
    room: "Ruang Teori 401",
    sks: 3,
    whatsapp: "6285712345678",
    lmsUrl: "https://elok.ugm.ac.id/course/rpl-2026",
    attendanceStatus: "aman",
  },
  {
    id: "cl-4",
    courseName: "Basis Data Lanjut",
    lecturerName: "Prof. Hendra Kusuma",
    lecturerPhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    dayTime: "Rabu, 10.15 - 12.45 WIB",
    room: "Lab Basis Data 1",
    sks: 3,
    whatsapp: "6281345678901",
    lmsUrl: "https://elok.ugm.ac.id/course/db-2026",
    attendanceStatus: "hmm",
  },
  {
    id: "cl-5",
    courseName: "Jaringan Komputer",
    lecturerName: "Ir. Dian Pratama, M.Eng.",
    lecturerPhoto: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80",
    dayTime: "Jumat, 08.00 - 10.30 WIB",
    room: "Lab Jaringan Gd. D",
    sks: 3,
    whatsapp: "6282134567890",
    lmsUrl: "https://elok.ugm.ac.id/course/net-2026",
    attendanceStatus: "gawat",
  },
  {
    id: "cl-6",
    courseName: "Etika Profesi & Komunikasi",
    lecturerName: "Dra. Ratna Dewi, M.Si.",
    lecturerPhoto: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    dayTime: "Rabu, 13.30 - 15.10 WIB",
    room: "Auditorium Lt. 2",
    sks: 2,
    attendanceStatus: "bahaya",
  },
];

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
  newUploadedDoc?: { fileName: string; course: string; docType: string } | null;
}

// Data structures for RPS Folder Tree & Document Preview (40/60)
interface FileItem {
  id: string;
  name: string;
  type: "pdf" | "pptx" | "docx";
  updated: string;
  description: string;
  sessions: {
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

const initialFolders: CourseFolder[] = [
  {
    id: "f-ai",
    courseName: "Kecerdasan Buatan & Sistem Pakar",
    lecturer: "Dr. Ir. Budi Santoso, M.Kom.",
    files: [
      {
        id: "doc-ai-1",
        name: "RPS_KecerdasanBuatan_2026.pdf",
        type: "pdf",
        updated: "12 Sep 2026",
        description: "Rencana Pembelajaran Semester resmi dengan matriks 14 sesi pertemuan, rubrik penilaian praktikum, dan bobot UTS/UAS.",
        sessions: [
          { no: 1, topic: "Pengantar Kecerdasan Buatan & Agen Cerdas", subtopics: "Definisi AI, PEAS framework, lingkungan agen statis vs dinamis" },
          { no: 2, topic: "Uninformed Search (BFS, DFS, UCS)", subtopics: "Kompleksitas waktu, ruang memori, completeness, optimality", weight: "Tugas 1 (5%)" },
          { no: 3, topic: "Informed Search & Heuristic Evaluation", subtopics: "Fungsi heuristik manhattan, greedy best-first search" },
          { no: 4, topic: "Algoritma A* & Optimasi Jalur", subtopics: "Admissibility, consistency/monotonicity, implementasi Python", weight: "Praktikum 1 (15%)" },
          { no: 5, topic: "Adversarial Search & Game Playing", subtopics: "Minimax algorithm, alpha-beta pruning evaluation" },
          { no: 6, topic: "Constraint Satisfaction Problems (CSP)", subtopics: "Forward checking, arc consistency (AC-3), backtracking" },
          { no: 7, topic: "Review Tengah Semester & Studi Kasus", subtopics: "Penyelesaian puzzle 8-tile dan map coloring" },
          { no: 8, topic: "Ujian Tengah Semester (UTS)", subtopics: "Evaluasi teori materi sesi 1 s.d. 7", weight: "UTS (30%)" },
          { no: 9, topic: "Logika Proposisional & First-Order Logic", subtopics: "Inference rules, resolution refutation, knowledge engineering" },
          { no: 10, topic: "Sistem Berbasis Pengetahuan & Forward/Backward Chaining", subtopics: "Rule-based expert system, conflict resolution" },
          { no: 11, topic: "Penalaran Tidak Pasti & Teorema Bayes", subtopics: "Probabilistic reasoning, bayesian networks conditional probability" },
          { no: 12, topic: "Pengantar Machine Learning: Klasifikasi Supervised", subtopics: "Decision trees, ID3/C4.5, information gain, entropy" },
          { no: 13, topic: "Presentasi Tugas Besar Proyek Agen Mandiri", subtopics: "Demo sistem agen pada arena gridworld", weight: "Tugas Besar (20%)" },
          { no: 14, topic: "Ujian Akhir Semester (UAS)", subtopics: "Komprehensif materi semester gasal", weight: "UAS (30%)" },
        ],
      },
      {
        id: "doc-ai-2",
        name: "Slide-Pertemuan-04_AStar_Search.pptx",
        type: "pptx",
        updated: "18 Sep 2026",
        description: "Bahan presentasi kuliah sesi 4: Perumusan heuristik, grafik search vs tree search, dan latihan soal jalur terpendek.",
        sessions: [
          { no: 4, topic: "Sesi 4: Detail Implementasi A*", subtopics: "Priority queue, open set, closed set, rekonstruksi jalur rute" },
        ],
      },
    ],
  },
  {
    id: "f-os",
    courseName: "Sistem Operasi",
    lecturer: "Dr. Ahmad Fauzi, M.T.",
    files: [
      {
        id: "doc-os-1",
        name: "Silabus_SistemOperasi_Rev3.pdf",
        type: "pdf",
        updated: "10 Sep 2026",
        description: "Silabus lengkap konsep arsitektur OS modern, manajemen proses, memory paging, concurrency, dan file system.",
        sessions: [
          { no: 1, topic: "Arsitektur Sistem Operasi & System Calls", subtopics: "Dual-mode operation, kernel space vs user space" },
          { no: 2, topic: "Manajemen Proses & Penjadwalan CPU", subtopics: "PCB, context switching, Round Robin, Multilevel Feedback Queue" },
          { no: 3, topic: "Sinkronisasi Proses & Race Conditions", subtopics: "Critical section problem, Peterson's algorithm, Semaphores" },
          { no: 4, topic: "Deadlock: Pencegahan, Penghindaran, & Deteksi", subtopics: "Kondisi Coffman, Banker's Algorithm, Resource Allocation Graph", weight: "Tugas 2 (10%)" },
          { no: 5, topic: "Manajemen Memori: Swapping & Paging", subtopics: "Page table, TLB, frame allocation, internal vs external fragmentation" },
          { no: 6, topic: "Virtual Memory & Page Replacement", subtopics: "Demand paging, FIFO, LRU, Optimal page replacement, Belady anomaly" },
          { no: 7, topic: "Ujian Tengah Semester (UTS)", subtopics: "Materi proses, CPU scheduling, dan deadlock", weight: "UTS (35%)" },
        ],
      },
    ],
  },
  {
    id: "f-rpl",
    courseName: "Rekayasa Perangkat Lunak",
    lecturer: "Siti Rahmawati, S.Kom., M.Cs.",
    files: [
      {
        id: "doc-rpl-1",
        name: "RPS_RPL_Agile_Scrum_2026.pdf",
        type: "pdf",
        updated: "15 Sep 2026",
        description: "Silabus rekayasa perangkat lunak berbasis Agile/Scrum dengan proyek kolaboratif semester penuh.",
        sessions: [
          { no: 1, topic: "Software Engineering Principles & Lifecycle", subtopics: "Waterfall vs Agile, manifesto agile, extreme programming" },
          { no: 2, topic: "Requirements Engineering & SRS IEEE 830", subtopics: "Functional & non-functional requirements, use case specifications", weight: "Milestone 1 (10%)" },
          { no: 3, topic: "User Stories & Backlog Refinement", subtopics: "INVEST criteria, acceptance criteria, story point estimation" },
        ],
      },
    ],
  },
  {
    id: "f-db",
    courseName: "Basis Data Lanjut",
    lecturer: "Prof. Hendra Kusuma",
    files: [
      {
        id: "doc-db-1",
        name: "RPS_BasisDataLanjut_2026.pdf",
        type: "pdf",
        updated: "08 Sep 2026",
        description: "Silabus optimasi query, query execution plan, B-Tree indexing, dan transaksi ACID.",
        sessions: [
          { no: 1, topic: "Review Relational Model & SQL Advanced", subtopics: "Window functions, CTE, complex joins, subquery optimization" },
          { no: 2, topic: "Storage Architecture & Indexing Data Structures", subtopics: "B-Tree, B+Tree, Hash indexing, clustered vs secondary index" },
          { no: 3, topic: "Query Processing & Execution Plan", subtopics: "EXPLAIN ANALYZE, cost estimation, sequential vs index scan" },
        ],
      },
    ],
  },
];

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

const initialNoteFolders: NoteFolder[] = [
  {
    id: "nf-ai",
    name: "Kecerdasan Buatan",
    notes: [
      {
        id: "note-ai-1",
        filename: "Catatan-04_AStar_Heuristik.md",
        title: "Algoritma A* & Fungsi Heuristik Admissible",
        format: "md",
        updated: "Hari Ini, 10.15",
        content: `# Algoritma A* & Fungsi Heuristik Admissible

Fungsi evaluasi inti pada algoritma pencarian A*:
f(n) = g(n) + h(n)

- **g(n)**: Biaya aktual yang telah ditempuh dari simpul awal ke simpul n.
- **h(n)**: Estimasi biaya heuristik dari simpul n ke simpul tujuan (goal).

## Syarat Keabsahan Heuristik
1. **Admissible (Layak)**: h(n) <= h*(n). Heuristik tidak boleh pernah melebih-lebihkan (overestimate) biaya riil sebenarnya ke tujuan.
2. **Consistent / Monotonic**: h(n) <= c(n, a, n') + h(n').

## Struktur Data Implementasi
- Priority Queue (Min-Heap) untuk **OpenSet**.
- Hash Map atau Set untuk **ClosedSet** (simpul yang telah dievaluasi).
- Map parent pointers untuk merekonstruksi rute jalur terpendek.`,
      },
      {
        id: "note-ai-2",
        filename: "Catatan-02_Uninformed_BFS.md",
        title: "Pencarian Blind Search: BFS vs DFS",
        format: "md",
        updated: "24 Sep 2026",
        content: `# Perbandingan Algoritma Blind Search

1. **Breadth-First Search (BFS)**
   - Struktur: Queue (FIFO)
   - Karakteristik: Complete & Optimal jika cost tiap step seragam.
   - Kelemahan: Konsumsi memori eksponensial O(b^d).

2. **Depth-First Search (DFS)**
   - Struktur: Stack (LIFO)
   - Karakteristik: Hemat memori O(bm), namun tidak menjamin rute optimal.`,
      },
    ],
  },
  {
    id: "nf-os",
    name: "Sistem Operasi",
    notes: [
      {
        id: "note-os-1",
        filename: "Catatan-03_Sinkronisasi_Semaphores.md",
        title: "Sinkronisasi Proses & Mutex vs Semaphores",
        format: "md",
        updated: "Kemarin, 08.45",
        content: `# Sinkronisasi Proses & Semaphores

Critical section problem menuntut tiga syarat fundamental:
1. **Mutual Exclusion**: Hanya satu proses dalam critical section pada satu waktu.
2. **Progress**: Pemilihan proses berikutnya tidak boleh tertunda tanpa batas.
3. **Bounded Waiting**: Terdapat batas waktu tunggu agar tidak terjadi starvation.

## Mutex vs Counting Semaphore
- **Mutex**: Memiliki konsep ownership (hanya thread yang mengunci yang boleh melepas kunci). Bernilai biner (0/1).
- **Counting Semaphore**: Mengelola akses ke kumpulan sumber daya berkapasitas N. Tidak memiliki konsep kepemilikan.`,
      },
    ],
  },
  {
    id: "nf-rpl",
    name: "Rekayasa Perangkat Lunak",
    notes: [
      {
        id: "note-rpl-1",
        filename: "Milestone-01_Checklist_SRS.txt",
        title: "Checklist Spesifikasi Kebutuhan SRS IEEE 830",
        format: "txt",
        updated: "30 Sep 2026",
        content: `CHECKLIST MILESTONE 1 - SPESIFIKASI KEBUTUHAN PERANGKAT LUNAK

[x] Bab 1: Pendahuluan, Lingkup Proyek, Definisi Singkatan
[x] Bab 2: Deskripsi Umum Produk, Karakteristik Pengguna
[ ] Bab 3: Kebutuhan Fungsional (Use Case Spec 1 s.d. 8)
[ ] Bab 4: Kebutuhan Non-Fungsional (Kinerja, Keamanan, Portabilitas)
[ ] Lampiran: Diagram Alur Aktivitas & Wireframe Prototipe`,
      },
    ],
  },
  {
    id: "nf-free",
    name: "Catatan Bebas",
    notes: [
      {
        id: "note-free-1",
        filename: "Todo_Pekan_Ini.txt",
        title: "Rencana Belajar & Target Mandiri",
        format: "txt",
        updated: "28 Sep 2026",
        content: `Target Belajar Mandiri:
1. Selesaikan modul implementasi Python pencarian rute
2. Diskusi bab 3 kebutuhan fungsional bersama kelompok
3. Persiapkan kuis mandiri sesi 4`,
      },
    ],
  },
];

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
  // Akun Step state
  const [akunStep, setAkunStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState<StudentProfile>(profile);
  const [isSaved, setIsSaved] = useState(false);

  // Dynamic RPS Folder & Document Preview state (40/60 Split)
  const [rpsFolders, setRpsFolders] = useState<CourseFolder[]>(initialFolders);
  const [openRpsFolderId, setOpenRpsFolderId] = useState<string>("f-ai");
  const [selectedFileId, setSelectedFileId] = useState<string>("doc-ai-1");
  const [rpsSearchQuery, setRpsSearchQuery] = useState("");

  // Sync newly uploaded document directly into matching course folder in RPS
  React.useEffect(() => {
    if (newUploadedDoc) {
      const courseNorm = (newUploadedDoc.course || "").trim().toLowerCase();
      const newFileId = `doc-up-${Date.now()}`;
      const ext = newUploadedDoc.fileName.endsWith(".pptx")
        ? "pptx"
        : newUploadedDoc.fileName.endsWith(".docx")
        ? "docx"
        : "pdf";

      const newFile: FileItem = {
        id: newFileId,
        name: newUploadedDoc.fileName,
        type: ext,
        updated: "Hari ini",
        description: `Dokumen baru diunggah untuk ${newUploadedDoc.course}. Telah otomatis tersambung ke RPS & materi perkuliahan.`,
        sessions: [
          {
            no: 1,
            topic: `Berkas Masuk: ${newUploadedDoc.fileName}`,
            subtopics: `Dokumen ${newUploadedDoc.docType.toUpperCase()} berhasil diklasifikasikan ke ${newUploadedDoc.course}. Siap dipelajari dan dianalisis.`,
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
  const [openNoteFolderIds, setOpenNoteFolderIds] = useState<string[]>(["nf-ai", "nf-os"]);
  const [activeNoteId, setActiveNoteId] = useState<string>("note-ai-1");
  const [noteEditMode, setNoteEditMode] = useState<"edit" | "preview">("edit");
  const [isEditorFullscreen, setIsEditorFullscreen] = useState(false);
  const [noteSearchQuery, setNoteSearchQuery] = useState("");

  // Course & Lecturer state for Matkul tab (matching user sketch)
  const [courseLecturers, setCourseLecturers] = useState<CourseLecturerItem[]>(initialCourseLecturers);
  const [editingLecturer, setEditingLecturer] = useState<CourseLecturerItem | null>(null);
  const [isAddLecturerOpen, setIsAddLecturerOpen] = useState(false);
  const [newLecturerForm, setNewLecturerForm] = useState<Partial<CourseLecturerItem>>({
    courseName: "",
    lecturerName: "",
    dayTime: "Kamis, 09.00 - 11.30 WIB",
    room: "Ruang Teori 301",
    sks: 3,
    whatsapp: "",
    lmsUrl: "",
    attendanceStatus: "aman",
  });

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
    const targetFolderId = folderId || noteFolders[0].id;
    const newId = `note-${Date.now()}`;
    const nextNum = allNotes.length + 1;
    const newDoc: NoteItem = {
      id: newId,
      filename: `Catatan_Kuliah_Sesi_${nextNum}.md`,
      title: `Catatan Kuliah Pertemuan ${nextNum}`,
      format: "md",
      updated: "Baru saja",
      content: `# Catatan Kuliah Pertemuan ${nextNum}\n\n## Pokok Bahasan\n- \n\n## Rangkuman Konsep\n`,
    };

    setNoteFolders((prev) =>
      prev.map((f) => (f.id === targetFolderId ? { ...f, notes: [newDoc, ...f.notes] } : f))
    );
    if (!openNoteFolderIds.includes(targetFolderId)) {
      setOpenNoteFolderIds((prev) => [...prev, targetFolderId]);
    }
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
  const currentFolder = rpsFolders.find((f) => f.files.some((fl) => fl.id === currentDoc?.id)) || rpsFolders[0];

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
            {activeTab === "akun" && "Akun & Profil Mahasiswa"}
            {activeTab === "setting" && "Pengaturan & Integrasi"}
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
              {noteFolders.map((folder) => {
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
                            const isActive = note.id === activeNote.id;

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
              })}
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
          </div>
        </div>
      )}

      {/* TAB RPS & MATERI: 40/60 FOLDER TREE + REALISTIC ACADEMIC DOCUMENT PREVIEW */}
      {activeTab === "rps" && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-140px)] min-h-[580px] max-h-[820px] items-stretch overflow-hidden">
          {/* KOLOM KIRI (35%): FOLDER TREE DENGAN STYLE SAMA SEPERTI CATATAN KULIAH */}
          <div className="lg:col-span-4 bg-white border border-m3-outline-variant rounded-3xl p-4 sm:p-5 flex flex-col space-y-3.5 shadow-xs h-full overflow-hidden">
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
              {rpsFolders.map((folder) => {
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
              })}
            </div>
          </div>

          {/* KOLOM KANAN (65%): PREVIEW DOKUMEN AKADEMIK SEBENARNYA */}
          <div className="lg:col-span-8 bg-white border border-m3-outline-variant rounded-3xl p-5 sm:p-6 flex flex-col space-y-4 shadow-xs h-full overflow-hidden">
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
                      onClick={() => alert(`Mengunduh berkas ${currentDoc.name}`)}
                      className="min-h-[44px] px-3.5 py-1.5 rounded-full bg-m3-surface-container hover:bg-m3-surface-container-high text-xs font-semibold text-m3-on-surface border border-m3-outline-variant flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh</span>
                    </button>
                  </div>
                </div>

            {/* LEMBAR PREVIEW DOKUMEN ASLI (SEPERTI PDF VIEWER KERTAS RESMI) */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-7 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-5 text-m3-on-surface shadow-inner font-sans">
              {/* Kop Dokumen Akademik Resmi */}
              <div className="text-center pb-4 border-b-2 border-slate-300 space-y-1">
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-800">
                  UNIVERSITAS GADJAH MADA • FAKULTAS TEKNIK
                </h4>
                <p className="text-[11px] font-semibold text-slate-600">
                  DEPARTEMEN TEKNIK ELEKTRO DAN TEKNOLOGI INFORMASI
                </p>
                <div className="pt-2">
                  <span className="px-3 py-1 bg-white border border-slate-300 rounded-full text-xs font-bold uppercase tracking-wider text-slate-900 inline-block shadow-xs">
                    {currentDoc.type === "pdf" ? "RENCANA PEMBELAJARAN SEMESTER (RPS)" : "SLIDE BAHAN AJAR"}
                  </span>
                </div>
              </div>

              {/* Detail Dokumen Resmi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                <div>
                  <span className="text-[10px] text-m3-secondary block">Mata Kuliah</span>
                  <span className="font-bold text-slate-900">{currentFolder.courseName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-m3-secondary block">Program Studi</span>
                  <span className="font-bold text-slate-900">Teknik Informatika UGM</span>
                </div>
                <div>
                  <span className="text-[10px] text-m3-secondary block">Semester / Beban</span>
                  <span className="font-semibold text-slate-800">Semester Gasal • 3 SKS</span>
                </div>
                <div>
                  <span className="text-[10px] text-m3-secondary block">Status Dokumen</span>
                  <span className="font-semibold text-emerald-700">Terverifikasi Akademik</span>
                </div>
              </div>

              {/* Matriks 14 Pertemuan Lengkap */}
              <div className="space-y-2.5">
                <h5 className="text-xs font-bold text-slate-900 flex items-center justify-between border-b pb-1">
                  <span>Matriks Perkuliahan (14 Sesi)</span>
                  <span className="text-[10px] text-m3-secondary font-normal">Semester Gasal 2026</span>
                </h5>

                <div className="space-y-2">
                  {currentDoc.sessions.map((ses) => (
                    <div
                      key={ses.no}
                      className="p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors flex items-start gap-3 shadow-xs"
                    >
                      <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {ses.no}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h6 className="text-xs font-bold text-slate-900">{ses.topic}</h6>
                          {ses.weight && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 flex-shrink-0">
                              {ses.weight}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{ses.subtopics}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Komponen Evaluasi */}
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2 shadow-xs text-xs">
                <h6 className="font-bold text-slate-900">Komposisi Evaluasi & Penilaian</h6>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px]">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-m3-secondary block">UTS</span>
                    <span className="font-bold text-slate-900">30%</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-m3-secondary block">UAS</span>
                    <span className="font-bold text-slate-900">30%</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-m3-secondary block">Praktikum</span>
                    <span className="font-bold text-slate-900">20%</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-m3-secondary block">Tugas</span>
                    <span className="font-bold text-slate-900">20%</span>
                  </div>
                </div>
              </div>
            </div>
            </>
            )}
          </div>
        </div>
      )}

      {/* TAB AKUN */}
      {activeTab === "akun" && (
        <div className="max-w-2xl mx-auto space-y-5">
          {isSaved && (
            <div className="p-3.5 rounded-2xl bg-m3-tertiary text-m3-on-tertiary text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Profil mahasiswa berhasil disimpan dan diperbarui!</span>
            </div>
          )}

          <div className="flex items-center gap-2 p-1.5 bg-m3-surface-container rounded-2xl border border-m3-outline-variant">
            {[
              { step: 1, label: "1. Identitas Diri" },
              { step: 2, label: "2. Akademik" },
              { step: 3, label: "3. Beban & Target" },
            ].map((s) => (
              <button
                key={s.step}
                type="button"
                onClick={() => setAkunStep(s.step as any)}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                  akunStep === s.step
                    ? "bg-m3-surface-container-low text-m3-on-surface shadow-xs font-bold"
                    : "text-m3-secondary hover:text-m3-on-surface"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            {akunStep === 1 && (
              <div className="p-5 rounded-2xl bg-m3-surface-container border border-m3-outline-variant space-y-4 animate-in fade-in">
                <div className="flex items-center gap-4 pb-3 border-b border-m3-outline-variant">
                  <div className="w-16 h-16 rounded-full bg-m3-primary text-m3-on-primary font-bold text-lg flex items-center justify-center flex-shrink-0">
                    {formData.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-m3-on-surface">{formData.name}</h4>
                    <p className="text-xs text-m3-secondary">{formData.nim}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-m3-on-surface">Nama Lengkap</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-2xl bg-m3-surface-container-low border border-m3-outline text-xs text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-m3-on-surface">Nomor Induk Mahasiswa (NIM)</label>
                  <input
                    type="text"
                    value={formData.nim}
                    onChange={(e) => handleInputChange("nim", e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-2xl bg-m3-surface-container-low border border-m3-outline text-xs text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-m3-on-surface">Email Kampus / Akun Resmi</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-2xl bg-m3-surface-container-low border border-m3-outline text-xs text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary"
                  />
                </div>
              </div>
            )}

            {akunStep === 2 && (
              <div className="p-5 rounded-2xl bg-m3-surface-container border border-m3-outline-variant space-y-4 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-m3-on-surface">Program Studi</label>
                    <input
                      type="text"
                      value={formData.major}
                      onChange={(e) => handleInputChange("major", e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl bg-m3-surface-container-low border border-m3-outline text-xs text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-m3-on-surface">Fakultas</label>
                    <input
                      type="text"
                      value={formData.faculty}
                      onChange={(e) => handleInputChange("faculty", e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl bg-m3-surface-container-low border border-m3-outline text-xs text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-m3-on-surface">Universitas / Institusi</label>
                  <input
                    type="text"
                    value={formData.university}
                    onChange={(e) => handleInputChange("university", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-m3-surface-container-low border border-m3-outline text-xs text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-m3-on-surface">Semester Berjalan</label>
                    <select
                      value={formData.semester}
                      onChange={(e) => handleInputChange("semester", Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-2xl bg-m3-surface-container-low border border-m3-outline text-xs text-m3-on-surface focus:outline-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                        <option key={sem} value={sem}>
                          Semester {sem}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-m3-on-surface">Dosen Pembimbing Akademik</label>
                    <input
                      type="text"
                      value={formData.academicAdvisor}
                      onChange={(e) => handleInputChange("academicAdvisor", e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl bg-m3-surface-container-low border border-m3-outline text-xs text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary"
                    />
                  </div>
                </div>
              </div>
            )}

            {akunStep === 3 && (
              <div className="p-5 rounded-2xl bg-m3-surface-container border border-m3-outline-variant space-y-4 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-m3-on-surface">Target Indeks Prestasi (IP)</label>
                    <input
                      type="text"
                      value={formData.targetGPA}
                      onChange={(e) => handleInputChange("targetGPA", e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl bg-m3-surface-container-low border border-m3-outline text-xs text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-m3-on-surface">Batas SKS Maksimal</label>
                    <input
                      type="number"
                      value={formData.maxSKS}
                      onChange={(e) => handleInputChange("maxSKS", Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-2xl bg-m3-surface-container-low border border-m3-outline text-xs text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              {akunStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setAkunStep((prev) => (prev - 1) as any)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-m3-secondary hover:bg-m3-surface-container transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Sebelumnya</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                {akunStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => setAkunStep((prev) => (prev + 1) as any)}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold bg-m3-secondary text-white hover:brightness-110 transition-all shadow-xs"
                  >
                    <span>Lanjut ke Step {akunStep + 1}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold bg-m3-primary text-m3-on-primary hover:brightness-95 transition-all shadow-xs"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Perubahan Akun</span>
                  </button>
                )}
              </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {courseLecturers.map((c) => (
              <div
                key={c.id}
                onClick={() => setEditingLecturer(c)}
                className="p-3.5 sm:p-4 rounded-3xl bg-white border border-m3-outline-variant hover:border-m3-primary/50 shadow-xs hover:shadow-sm transition-all flex gap-3.5 cursor-pointer group relative overflow-hidden"
              >
                {/* KIRI: FOTO DOSEN PERSEGI PANJANG / POTRET SESUAI SKETSA */}
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
                      <div className="flex items-center gap-1 bg-m3-surface-container px-2 py-0.5 rounded-full font-medium">
                        <Clock className="w-3 h-3 text-m3-primary flex-shrink-0" />
                        <span>{c.dayTime.split(" ")[0]} {c.dayTime.split(" ")[1] || ""}</span>
                      </div>
                      <span className="text-slate-300">•</span>
                      <span className="truncate max-w-[110px]">{c.room}</span>
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
                      <label className="font-semibold text-m3-on-surface">Hari & Jam Kelas</label>
                      <input
                        type="text"
                        value={editingLecturer.dayTime}
                        onChange={(e) =>
                          setEditingLecturer({ ...editingLecturer, dayTime: e.target.value })
                        }
                        className="w-full p-2.5 rounded-xl border border-m3-outline bg-m3-surface-container/30 focus:outline-none focus:ring-2 focus:ring-m3-primary"
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

      {/* TAB SETTING */}
      {activeTab === "setting" && (
        <div className="space-y-4 max-w-2xl mx-auto">
          <div className="p-4 rounded-2xl bg-m3-surface-container border border-m3-outline-variant space-y-3">
            <h4 className="text-xs font-bold text-m3-on-surface">Arsitektur & Mesin Data</h4>
            <div className="p-3 rounded-xl bg-white border border-m3-outline-variant flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-m3-on-surface">Siklus Local Engine (Offline-First)</p>
                <p className="text-[11px] text-m3-secondary">Penyimpanan SQLite lokal tanpa dependensi API luar berbayar</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Aktif
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-m3-surface-container border border-m3-outline-variant space-y-3">
            <h4 className="text-xs font-bold text-m3-on-surface">Preferensi Notifikasi</h4>
            <div className="space-y-2 text-xs">
              <label className="flex items-center justify-between">
                <span className="text-m3-secondary">Pengingat kelas 15 menit sebelum mulai</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded-md accent-m3-primary" />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-m3-secondary">Peringatan tenggat tugas (H-1)</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded-md accent-m3-primary" />
              </label>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
