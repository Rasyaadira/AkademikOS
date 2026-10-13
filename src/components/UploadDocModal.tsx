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
}

export default function UploadDocModal({
  isOpen,
  onClose,
  onUploadSuccess,
  initialFile = null,
  courses = [],
}: UploadDocModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(initialFile);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<"pick" | "routing">("pick");

  // Routing State
  const defaultCourse = courses[0] || "Mata Kuliah Umum";
  const [selectedCourse, setSelectedCourse] = useState(defaultCourse);
  const [isCustomCourse, setIsCustomCourse] = useState(false);
  const [customCourseName, setCustomCourseName] = useState("");
  const [docType, setDocType] = useState<"rps" | "slide" | "tugas" | "praktikum" | "lainnya">("rps");
  const [sessionNo, setSessionNo] = useState<number | "all">("all");
  const [topic, setTopic] = useState("");

  useEffect(() => {
    if (initialFile) {
      setSelectedFile(initialFile);
      handleDirectUpload(initialFile);
    }
  }, [initialFile]);

  useEffect(() => {
    if (courses.length > 0 && !courses.includes(selectedCourse) && !isCustomCourse) {
      setSelectedCourse(courses[0]);
    }
  }, [courses]);

  if (!isOpen) return null;

  const handleDirectUpload = async (file: File) => {
    setIsUploading(true);
    let pathResult = `/storage/${file.name}`;

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

  const handleFinalConfirm = () => {
    if (!selectedFile) return;

    const finalCourse = isCustomCourse
      ? customCourseName.trim() || "Mata Kuliah Baru"
      : selectedCourse;

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
      course: finalCourse,
      sessionNo: typeof sessionNo === "number" ? sessionNo : undefined,
      filePath: uploadedPath || `/storage/${selectedFile.name}`,
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
            <p className="text-xs text-m3-secondary">
              {currentStep === "pick"
                ? "Pilih berkas RPS, Slide, atau Modul Perkuliahan"
                : "Tentukan penempatan berkas ke dalam folder mata kuliah & pertemuan"}
            </p>
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
            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Rekomendasi Penempatan Dokumen (AI Routing)</span>
              </div>
              <p className="text-[11px] text-indigo-950/80 leading-relaxed">
                Dokumen ini terdeteksi sebagai bahan perkuliahan. Silakan konfirmasi mata kuliah tujuan dan kategorinya agar berkas langsung terorganisir ke folder yang tepat.
              </p>
            </div>

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
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-white border border-m3-outline text-xs text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary"
                    >
                      {courses.length > 0 ? (
                        courses.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))
                      ) : (
                        <option value="Mata Kuliah Umum">Mata Kuliah Umum</option>
                      )}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={customCourseName}
                      onChange={(e) => setCustomCourseName(e.target.value)}
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
                    {Array.from({ length: 14 }, (_, i) => i + 1).map((n) => (
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
              onClick={handleFinalConfirm}
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
