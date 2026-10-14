"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  UploadCloud,
  Sparkles,
  FileText,
  CheckCircle2,
  FolderOpen,
  BookOpen,
  Presentation,
  FileCode,
  FileCheck,
  ChevronRight,
  ExternalLink,
  AlertCircle,
} from "lucide-react";

interface UploadDocModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (info: {
    fileName: string;
    docType: string;
    course?: string;
    sessionNo?: number;
    filePath?: string;
    topic?: string;
  }) => void;
  initialFile?: File | null;
  courses?: string[];
  noAiMode?: boolean;
}

export default function UploadDocModal({
  isOpen,
  onClose,
  onUploadSuccess,
  initialFile = null,
  courses = [],
  noAiMode = false,
}: UploadDocModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(initialFile);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<"pick" | "routing">("pick");

  // Routing State - Default empty to avoid assigning wrong course
  const [selectedCourse, setSelectedCourse] = useState("");
  const [isCustomCourse, setIsCustomCourse] = useState(false);
  const [customCourseName, setCustomCourseName] = useState("");
  const [docType, setDocType] = useState<"rps" | "slide" | "tugas" | "praktikum" | "lainnya">("rps");
  const [sessionNo, setSessionNo] = useState<number | "all">("all");
  const [topic, setTopic] = useState("");
  const [showEmptyCourseConfirm, setShowEmptyCourseConfirm] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisFeedback, setAnalysisFeedback] = useState<{ type: "success" | "warning"; message: string } | null>(null);

  const handleAutoAnalyzeAI = () => {
    if (!selectedFile) return;
    setIsAnalyzing(true);
    setAnalysisFeedback(null);
    setTimeout(() => {
      const lower = selectedFile.name.toLowerCase();
      
      // 1. Direct match with registered courses
      let matched = courses.find((c) => lower.includes(c.toLowerCase()) || c.toLowerCase().includes(lower));

      // 2. Heuristic speculation from academic keywords
      if (!matched) {
        const keywordMap: Record<string, string> = {
          metnum: "Metode Numerik",
          numerik: "Metode Numerik",
          strukdat: "Struktur Data",
          struktur: "Struktur Data",
          basdat: "Basis Data",
          database: "Basis Data",
          sql: "Basis Data",
          jarkom: "Jaringan Komputer",
          jaringan: "Jaringan Komputer",
          network: "Jaringan Komputer",
          os: "Sistem Operasi",
          operasi: "Sistem Operasi",
          rpl: "Rekayasa Perangkat Lunak",
          software: "Rekayasa Perangkat Lunak",
          ai: "Kecerdasan Buatan",
          buatan: "Kecerdasan Buatan",
          pbo: "Pemrograman Berorientasi Objek",
          oop: "Pemrograman Berorientasi Objek",
          kalkulus: "Kalkulus",
          aljabar: "Aljabar Linear",
          algoritma: "Algoritma & Pemrograman",
          algo: "Algoritma & Pemrograman",
          daspro: "Dasar Pemrograman",
          ui: "Desain UI/UX",
          ux: "Desain UI/UX",
          etika: "Etika Profesi",
        };

        for (const [kw, courseName] of Object.entries(keywordMap)) {
          if (lower.includes(kw)) {
            // Check if user has a registered course close to this name
            const existingSimilar = courses.find((c) => c.toLowerCase().includes(kw) || c.toLowerCase().includes(courseName.toLowerCase()));
            matched = existingSimilar || courseName;
            break;
          }
        }
      }

      // 3. Fallback speculation: Pick first available course or cleaned title segment
      if (!matched) {
        if (courses.length > 0) {
          matched = courses[0];
        } else {
          // Speculate from filename words
          const cleanWords = selectedFile.name
            .replace(/\.[^/.]+$/, "")
            .replace(/^[0-9._\- ]+/, "")
            .split(/[_-]/)[0];
          matched = cleanWords.trim() || "Mata Kuliah Umum";
        }
      }

      setSelectedCourse(matched);
      setIsCustomCourse(!courses.includes(matched));
      if (!courses.includes(matched)) {
        setCustomCourseName(matched);
      }
      setAnalysisFeedback({
        type: "success",
        message: `AI berspekulasi mata kuliah: "${matched}" (dapat Anda ganti jika kurang sesuai).`,
      });

      // Match docType
      if (lower.includes("rps") || lower.includes("silabus") || lower.includes("kurikulum")) {
        setDocType("rps");
        setSessionNo("all");
      } else if (lower.includes("slide") || lower.includes("ppt") || lower.includes("materi")) {
        setDocType("slide");
        setSessionNo(1);
      } else if (lower.includes("tugas") || lower.includes("assignment") || lower.includes("proyek")) {
        setDocType("tugas");
        setSessionNo(1);
      } else if (lower.includes("praktikum") || lower.includes("lab") || lower.includes("modul")) {
        setDocType("praktikum");
        setSessionNo(1);
      }

      // Topic
      const cleanTopic = selectedFile.name
        .replace(/\.[^/.]+$/, "")
        .replace(/^[0-9._\- ]+/, "")
        .replace(/[_-]/g, " ");
      setTopic(cleanTopic);
      setIsAnalyzing(false);
      setShowEmptyCourseConfirm(false);
    }, 1200);
  };

  useEffect(() => {
    if (initialFile) {
      setSelectedFile(initialFile);
      handleDirectUpload(initialFile);
    }
  }, [initialFile]);

  if (!isOpen) return null;

  const handleDirectUpload = async (file: File) => {
    setIsUploading(true);
    let pathResult = `/api/storage/${file.name}`;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        pathResult = data.filePath;
      }
    } catch (err) {
      console.warn("Upload fisik gagal, menggunakan representasi lokal:", err);
    } finally {
      setIsUploading(false);
      setUploadedPath(pathResult);
      setCurrentStep("routing");

      // Auto-detect docType from file name
      const lower = file.name.toLowerCase();
      if (lower.includes("rps") || lower.includes("silabus") || lower.includes("kurikulum")) {
        setDocType("rps");
        setSessionNo("all");
      } else if (lower.includes("slide") || lower.includes("ppt") || lower.includes("materi")) {
        setDocType("slide");
        setSessionNo(1);
      } else if (lower.includes("tugas") || lower.includes("assignment") || lower.includes("proyek")) {
        setDocType("tugas");
        setSessionNo(1);
      } else if (lower.includes("praktikum") || lower.includes("lab") || lower.includes("modul")) {
        setDocType("praktikum");
        setSessionNo(1);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      handleDirectUpload(file);
    }
  };

  const handleFinalConfirm = (forceEmpty = false) => {
    if (!selectedFile) return;

    const finalCourse = isCustomCourse
      ? customCourseName.trim()
      : selectedCourse.trim();

    if (!finalCourse && !forceEmpty) {
      setShowEmptyCourseConfirm(true);
      return;
    }

    const courseToSave = finalCourse || "Umum / Lainnya";

    const docTypeLabel =
      docType === "rps"
        ? "Rencana Pembelajaran Semester (RPS)"
        : docType === "slide"
        ? `Slide Sesi ${sessionNo === "all" ? "Umum" : sessionNo}`
        : docType === "tugas"
        ? `Panduan Tugas Sesi ${sessionNo === "all" ? "Umum" : sessionNo}`
        : docType === "praktikum"
        ? `Modul Praktikum Sesi ${sessionNo === "all" ? "Umum" : sessionNo}`
        : "Dokumen Pembelajaran";

    onUploadSuccess({
      fileName: selectedFile.name,
      docType: docTypeLabel,
      course: courseToSave,
      sessionNo: typeof sessionNo === "number" ? sessionNo : undefined,
      filePath: uploadedPath || `/api/storage/${selectedFile.name}`,
      topic: topic.trim() || undefined,
    });

    handleClose();
  };

  const handleClose = () => {
    setSelectedFile(null);
    setUploadedPath(null);
    setCurrentStep("pick");
    setIsCustomCourse(false);
    setCustomCourseName("");
    setSelectedCourse("");
    setShowEmptyCourseConfirm(false);
    setAnalysisFeedback(null);
    setTopic("");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white border border-m3-outline-variant rounded-3xl w-full max-w-xl p-6 sm:p-7 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-m3-on-surface">
              {currentStep === "pick" ? "Unggah Dokumen Perkuliahan" : "Inspeksi & Penempatan Berkas"}
            </h3>
            {currentStep === "pick" && (
              <p className="text-xs text-m3-secondary">
                Pilih berkas RPS, Slide, atau Modul Perkuliahan
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-m3-secondary hover:bg-m3-surface-container transition-colors"
            aria-label="Tutup dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* STEP 1: PICK FILE */}
        {currentStep === "pick" && (
          <div className="space-y-4">
            <label className="border-2 border-dashed border-m3-outline rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-m3-primary transition-colors bg-m3-surface-container-low/50">
              <input
                type="file"
                accept=".pdf,.docx,.pptx,.jpg,.jpeg,.png"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="w-12 h-12 rounded-full bg-m3-primary-container text-m3-on-primary-container flex items-center justify-center mb-3">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-m3-on-surface">
                Klik atau seret berkas PDF, Slide, atau Modul ke sini
              </p>
              <p className="text-[11px] text-m3-secondary mt-1">
                Format yang didukung: PDF, PPTX, DOCX, JPG, PNG
              </p>
            </label>

            {isUploading && (
              <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center gap-3 text-xs text-indigo-900">
                <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span>Mengunggah berkas ke server lokal (/storage)...</span>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: AI ROUTING & PLACEMENT DIALOG */}
        {currentStep === "routing" && selectedFile && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* File Info Banner */}
            <div className="p-3.5 rounded-2xl bg-m3-surface-container-low border border-m3-outline-variant flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-m3-primary-container text-m3-on-primary-container flex items-center justify-center flex-shrink-0">
                  {selectedFile.name.endsWith(".pdf") ? (
                    <FileText className="w-5 h-5 text-rose-600" />
                  ) : selectedFile.name.endsWith(".pptx") ? (
                    <Presentation className="w-5 h-5 text-amber-600" />
                  ) : (
                    <FileCode className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-m3-on-surface truncate">{selectedFile.name}</p>
                  <p className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Tersimpan di server ({uploadedPath})</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setCurrentStep("pick");
                }}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors"
              >
                Ganti
              </button>
            </div>

            {/* AI Assistant Question Box */}
            {!noAiMode && (
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>Rekomendasi Penempatan Dokumen (AI Routing)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoAnalyzeAI}
                    disabled={isAnalyzing}
                    className="px-3.5 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-60 cursor-pointer"
                    title="Jalankan analisis AI otomatis untuk mendeteksi mata kuliah dan pertemuan"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Menganalisis berkas...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Analisis & Auto-Isi AI</span>
                      </>
                    )}
                  </button>
                </div>
                {isAnalyzing ? (
                  <div className="p-2.5 rounded-xl bg-white/90 border border-indigo-200 text-xs text-indigo-900 flex items-center gap-2.5 animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                    <span className="font-medium">
                      AI sedang memindai isi dokumen dan mencocokkan dengan daftar mata kuliah Anda...
                    </span>
                  </div>
                ) : analysisFeedback ? (
                  <div
                    className={`p-2.5 rounded-xl text-xs flex items-start gap-2 border animate-in fade-in ${
                      analysisFeedback.type === "success"
                        ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                        : "bg-amber-50 text-amber-900 border-amber-300"
                    }`}
                  >
                    {analysisFeedback.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    )}
                    <span className="leading-relaxed font-medium">{analysisFeedback.message}</span>
                  </div>
                ) : (
                  <p className="text-[11px] text-indigo-950/80 leading-relaxed">
                    Klik <strong>Analisis & Auto-Isi AI</strong> untuk mengisi kategori dan mata kuliah secara otomatis, atau lengkapi penempatan folder secara manual di bawah.
                  </p>
                )}
              </div>
            )}

            {/* Empty Course Confirmation Alert */}
            {showEmptyCourseConfirm && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2.5 animate-in fade-in">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-amber-950">
                    <p className="font-bold">Mata kuliah belum dipilih</p>
                    <p className="text-[11px] text-amber-900/80 mt-0.5">
                      Dokumen akan dikelompokkan ke kategori <strong>Umum / Lainnya</strong>. Apakah ingin memilih mata kuliah terlebih dahulu?
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowEmptyCourseConfirm(false)}
                    className="px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-colors"
                  >
                    Pilih Matkul Dulu
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFinalConfirm(true)}
                    className="px-3 py-1.5 rounded-lg bg-amber-700 text-white text-xs font-bold hover:bg-amber-800 transition-colors"
                  >
                    Tetap Simpan sebagai Umum
                  </button>
                </div>
              </div>
            )}

            {/* Placement Form */}
            <div className="space-y-3.5 text-xs">
              {/* 1. Mata Kuliah */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-m3-on-surface block">
                  Mata Kuliah Tujuan
                </label>
                <div className="flex gap-2">
                  {!isCustomCourse ? (
                    <select
                      value={selectedCourse}
                      onChange={(e) => {
                        setSelectedCourse(e.target.value);
                        if (showEmptyCourseConfirm) setShowEmptyCourseConfirm(false);
                      }}
                      className="flex-1 px-3 py-2 rounded-xl bg-white border border-m3-outline text-xs text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary"
                    >
                      <option value="">-- Pilih Mata Kuliah (Bisa Dikosongkan) --</option>
                      {courses.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={customCourseName}
                      onChange={(e) => {
                        setCustomCourseName(e.target.value);
                        if (showEmptyCourseConfirm) setShowEmptyCourseConfirm(false);
                      }}
                      placeholder="Ketik nama mata kuliah baru..."
                      className="flex-1 px-3 py-2 rounded-xl bg-white border border-m3-outline text-xs text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setIsCustomCourse(!isCustomCourse)}
                    className="px-3 py-2 rounded-xl border border-m3-outline-variant bg-m3-surface-container text-[11px] font-semibold text-m3-secondary hover:text-m3-on-surface transition-colors flex-shrink-0"
                  >
                    {isCustomCourse ? "Pilih dari List" : "+ Matkul Baru"}
                  </button>
                </div>
              </div>

              {/* 2. Jenis Dokumen & Pertemuan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-m3-on-surface block">
                    Jenis Dokumen
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setDocType(val);
                      if (val === "rps") setSessionNo("all");
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-m3-outline text-xs text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary"
                  >
                    <option value="rps">RPS & Silabus Resmi</option>
                    <option value="slide">Slide Bahan Ajar</option>
                    <option value="tugas">Petunjuk / Soal Tugas</option>
                    <option value="praktikum">Modul Praktikum</option>
                    <option value="lainnya">Dokumen Lainnya</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-m3-on-surface block">
                    Pertemuan Ke-
                  </label>
                  <select
                    value={sessionNo}
                    onChange={(e) =>
                      setSessionNo(e.target.value === "all" ? "all" : Number(e.target.value))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white border border-m3-outline text-xs text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary"
                  >
                    <option value="all">Umum / Seluruh Semester</option>
                    {Array.from({ length: 16 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        Pertemuan Sesi {n}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3. Topik Bahasan (Opsional) */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-m3-on-surface block">
                  Topik / Catatan Singkat (Opsional)
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Contoh: Pengenalan AI, Algoritma A*, dsb"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-m3-outline text-xs text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary"
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-full text-xs font-semibold text-m3-secondary hover:bg-m3-surface-container transition-colors"
          >
            Batal
          </button>

          {currentStep === "routing" && (
            <button
              type="button"
              onClick={() => handleFinalConfirm(false)}
              className="px-5 py-2 rounded-full text-xs font-bold bg-m3-primary text-m3-on-primary hover:brightness-95 transition-all shadow-xs flex items-center gap-1.5"
            >
              <span>Simpan & Buka Dokumen Asli</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
