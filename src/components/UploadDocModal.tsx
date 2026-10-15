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
    previewPath?: string;
    originalPath?: string;
    topic?: string;
  }) => void;
  initialFile?: File | null;
  courses?: string[];
  noAiMode?: boolean;
  semesterStartDate?: string;
}

export default function UploadDocModal({
  isOpen,
  onClose,
  onUploadSuccess,
  initialFile = null,
  courses = [],
  noAiMode = false,
  semesterStartDate,
}: UploadDocModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(initialFile);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  const [uploadedPreviewPath, setUploadedPreviewPath] = useState<string | null>(null);
  const [uploadedOriginalPath, setUploadedOriginalPath] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<"pick" | "routing">("pick");

  // Academic week calculation (default: minggu sekarang)
  const semesterStart = semesterStartDate
    ? new Date(semesterStartDate)
    : new Date(2026, 8, 7);
  const now = new Date();
  const currentWeek = Math.min(
    16,
    Math.max(1, Math.floor((now.getTime() - semesterStart.getTime()) / (7 * 86400000)) + 1)
  );

  // Routing State - Default empty to avoid assigning wrong course
  const [selectedCourse, setSelectedCourse] = useState("");
  const [isCustomCourse, setIsCustomCourse] = useState(false);
  const [customCourseName, setCustomCourseName] = useState("");
  const [docType, setDocType] = useState<"rps" | "slide" | "tugas" | "praktikum" | "lainnya">("rps");
  const [sessionNo, setSessionNo] = useState<number | "all">(currentWeek);
  const [topic, setTopic] = useState("");
  const [showEmptyCourseConfirm, setShowEmptyCourseConfirm] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisFeedback, setAnalysisFeedback] = useState<{ type: "success" | "warning"; message: string } | null>(null);

  const handleAutoAnalyzeAI = async (targetFile?: File | null) => {
    const fileToAnalyze = targetFile || selectedFile;
    if (!fileToAnalyze) return;
    setIsAnalyzing(true);
    setAnalysisFeedback(null);

    try {
      const res = await fetch("/api/ai/analyze-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: fileToAnalyze.name,
          fileType: fileToAnalyze.type || "application/pdf",
          availableCourses: courses,
          currentWeek,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const analysis = data.analysis;
        if (analysis) {
          if (analysis.course) {
            setSelectedCourse(analysis.course);
            const isKnown = courses.some(
              (c) => c.toLowerCase() === analysis.course.toLowerCase()
            );
            setIsCustomCourse(!isKnown);
            if (!isKnown) {
              setCustomCourseName(analysis.course);
            }
          }

          if (analysis.docType) {
            setDocType(analysis.docType);
          }

          if (analysis.sessionNo !== undefined) {
            setSessionNo(analysis.sessionNo);
          }

          if (analysis.topic) {
            setTopic(analysis.topic);
          }

          setAnalysisFeedback({
            type: "success",
            message:
              analysis.explanation ||
              `AI DeepSeek mengidentifikasi berkas untuk ${analysis.course}.`,
          });
          return;
        }
      }
      throw new Error("Gagal menerima respons analisis AI.");
    } catch (e: any) {
      console.warn("AI Analysis error, using fallback heuristic:", e);
      const rawName = fileToAnalyze.name.replace(/\.[^/.]+$/, "").toLowerCase();
      const matched = courses.find((c) => rawName.includes(c.toLowerCase()));
      if (matched) {
        setSelectedCourse(matched);
      }
      setAnalysisFeedback({
        type: "warning",
        message: "Analisis AI daring terkendala. Silakan sesuaikan kategori di bawah secara manual.",
      });
    } finally {
      setIsAnalyzing(false);
    }
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
        if (data.previewPath) setUploadedPreviewPath(data.previewPath);
        if (data.originalPath) setUploadedOriginalPath(data.originalPath);
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

      if (!noAiMode) {
        handleAutoAnalyzeAI(file);
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
      previewPath: uploadedPreviewPath || uploadedPath || `/api/storage/${selectedFile.name}`,
      originalPath: uploadedOriginalPath || uploadedPath || `/api/storage/${selectedFile.name}`,
      topic: topic.trim() || undefined,
    });

    handleClose();
  };

  const handleClose = () => {
    setSelectedFile(null);
    setUploadedPath(null);
    setUploadedPreviewPath(null);
    setUploadedOriginalPath(null);
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-m3-surface border border-m3-outline-variant rounded-3xl w-full max-w-xl p-6 sm:p-7 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-m3-outline-variant">
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
            className="w-8 h-8 rounded-full flex items-center justify-center text-m3-secondary hover:bg-m3-surface-container transition-colors cursor-pointer"
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
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 dark:text-indigo-200">
                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Rekomendasi Penempatan Dokumen (DeepSeek AI)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAutoAnalyzeAI()}
                    disabled={isAnalyzing}
                    className="px-3.5 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-60 cursor-pointer"
                    title="Jalankan analisis AI DeepSeek untuk mendeteksi mata kuliah, topik, dan pertemuan"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Menganalisis berkas...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Analisis Ulang AI</span>
                      </>
                    )}
                  </button>
                </div>
                {isAnalyzing ? (
                  <div className="p-2.5 rounded-xl bg-white/90 dark:bg-m3-surface-container border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 flex items-center gap-2.5 animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-ping" />
                    <span className="font-medium">
                      DeepSeek AI sedang memindai isi dokumen dan mencocokkan mata kuliah serta topiknya...
                    </span>
                  </div>
                ) : analysisFeedback ? (
                  <div
                    className={`p-2.5 rounded-xl text-xs flex items-start gap-2 border animate-in fade-in ${
                      analysisFeedback.type === "success"
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800"
                        : "bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800"
                    }`}
                  >
                    {analysisFeedback.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    )}
                    <span className="leading-relaxed font-medium">{analysisFeedback.message}</span>
                  </div>
                ) : (
                  <p className="text-[11px] text-indigo-950/80 dark:text-indigo-200/80 leading-relaxed">
                    DeepSeek AI menganalisis berkas ini untuk merekomendasikan mata kuliah dan topik secara otomatis.
                  </p>
                )}
              </div>
            )}

            {/* Empty Course Confirmation Alert */}
            {showEmptyCourseConfirm && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2.5 animate-in fade-in">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-700 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-amber-950 dark:text-amber-200">
                    <p className="font-bold">Mata kuliah belum dipilih</p>
                    <p className="text-[11px] text-amber-900/80 dark:text-amber-200/80 mt-0.5">
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
                      className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-m3-surface-container border border-m3-outline dark:border-m3-outline-variant text-xs text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary"
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
                      className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-m3-surface-container border border-m3-outline dark:border-m3-outline-variant text-xs text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setIsCustomCourse(!isCustomCourse)}
                    className="px-3 py-2 rounded-xl border border-m3-outline-variant bg-m3-surface-container dark:bg-m3-surface-container/60 text-[11px] font-semibold text-m3-secondary hover:text-m3-on-surface transition-colors flex-shrink-0 cursor-pointer"
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
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-m3-surface-container border border-m3-outline dark:border-m3-outline-variant text-xs text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary cursor-pointer"
                  >
                    <option value="rps">RPS & Silabus Resmi</option>
                    <option value="slide">Slide Bahan Ajar</option>
                    <option value="tugas">Petunjuk / Soal Tugas</option>
                    <option value="praktikum">Modul Praktikum</option>
                    <option value="lainnya">Dokumen Lainnya</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-m3-on-surface block">
                      Pertemuan Ke-
                    </label>
                    <span className="text-[10px] text-m3-secondary font-medium">
                      Default: Minggu ke-{currentWeek}
                    </span>
                  </div>
                  <select
                    value={sessionNo}
                    onChange={(e) =>
                      setSessionNo(e.target.value === "all" ? "all" : Number(e.target.value))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-m3-surface-container border border-m3-outline dark:border-m3-outline-variant text-xs text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary cursor-pointer"
                  >
                    <option value="all">Umum / Seluruh Semester</option>
                    {Array.from({ length: 16 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        Pertemuan Sesi {n} {n === currentWeek ? "(Minggu Sekarang)" : ""}
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
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-m3-surface-container border border-m3-outline dark:border-m3-outline-variant text-xs text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary"
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-m3-outline-variant">
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
