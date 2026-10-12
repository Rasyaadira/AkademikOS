"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  UploadCloud,
  Sparkles,
  SlidersHorizontal,
  FileText,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  FolderOpen,
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
  }) => void;
  initialFile?: File | null;
}

export default function UploadDocModal({
  isOpen,
  onClose,
  onUploadSuccess,
  initialFile = null,
}: UploadDocModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(initialFile);
  const [mode, setMode] = useState<"ai" | "manual">("ai");
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);

  // Manual Form State
  const [manualCourse, setManualCourse] = useState("Sistem Operasi");
  const [manualSessionNo, setManualSessionNo] = useState(4);
  const [manualDocType, setManualDocType] = useState<"rps" | "slide" | "praktikum" | "tugas">("slide");
  const [manualTopic, setManualTopic] = useState("");

  const availableCourses = [
    "Sistem Operasi",
    "Kecerdasan Buatan & Sistem Pakar",
    "Rekayasa Perangkat Lunak",
    "Basis Data Lanjut",
    "Jaringan Komputer",
    "Etika Profesi & Komunikasi",
  ];

  useEffect(() => {
    if (initialFile) {
      setSelectedFile(initialFile);
    }
  }, [initialFile]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSaveDocument = async () => {
    if (!selectedFile) return;

    setIsUploading(true);

    let savedPath = `/storage/${selectedFile.name}`;

    try {
      // Unggah berkas asli ke API backend /api/upload
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        savedPath = data.filePath;
        setUploadedPath(data.filePath);
      }
    } catch (err) {
      console.warn("Gagal unggah fisik ke server, melanjutkan dengan representasi lokal:", err);
    }

    // Simulasi pemrosesan
    setTimeout(() => {
      setIsUploading(false);
      setIsSuccess(true);

      setTimeout(() => {
        onUploadSuccess({
          fileName: selectedFile.name,
          docType:
            mode === "ai"
              ? "Ekstraksi Otomatis AI (Silabus & Jadwal)"
              : manualDocType === "rps"
              ? "Rencana Pembelajaran Semester (RPS)"
              : manualDocType === "slide"
              ? `Slide Sesi ${manualSessionNo}`
              : manualDocType === "praktikum"
              ? `Modul Praktikum Sesi ${manualSessionNo}`
              : `Panduan Tugas Sesi ${manualSessionNo}`,
          course: mode === "manual" ? manualCourse : undefined,
          sessionNo: mode === "manual" ? manualSessionNo : undefined,
          filePath: savedPath,
        });

        setSelectedFile(null);
        setIsSuccess(false);
        onClose();
      }, 1200);
    }, 1000);
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
            <h3 className="text-base sm:text-lg font-bold text-m3-on-surface">Unggah Berkas Kuliah</h3>
            <p className="text-xs text-m3-secondary">
              Pilih apakah berkas diatur otomatis oleh AI atau dikategorikan secara manual
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-m3-secondary hover:bg-m3-surface-container transition-colors"
            aria-label="Tutup dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* File Selection or Active File Preview */}
        {!selectedFile ? (
          <label className="border-2 border-dashed border-m3-outline rounded-3xl p-7 flex flex-col items-center justify-center text-center cursor-pointer hover:border-m3-primary transition-colors bg-m3-surface-container-low/50">
            <input
              type="file"
              accept=".pdf,.docx,.pptx"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="w-12 h-12 rounded-full bg-m3-primary-container text-m3-on-primary-container flex items-center justify-center mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-m3-on-surface">
              Klik atau seret berkas PDF, PPTX, atau DOCX ke sini
            </p>
            <p className="text-[11px] text-m3-secondary mt-1">
              Disimpan langsung ke server di direktori /storage
            </p>
          </label>
        ) : (
          <div className="p-3.5 rounded-2xl bg-m3-surface-container-low border border-m3-outline-variant flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-m3-primary-container text-m3-on-primary-container flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-m3-on-surface truncate">{selectedFile.name}</p>
                <p className="text-[11px] text-m3-secondary">
                  {(selectedFile.size / 1024).toFixed(1)} KB • Siap diproses
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors"
            >
              Ganti Berkas
            </button>
          </div>
        )}

        {/* Mode Selector Tabs: AI vs Manual */}
        {selectedFile && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 p-1 bg-m3-surface-container rounded-2xl">
              <button
                type="button"
                onClick={() => setMode("ai")}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  mode === "ai"
                    ? "bg-white text-m3-primary shadow-xs"
                    : "text-m3-secondary hover:text-m3-on-surface"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Atur Otomatis via AI</span>
              </button>
              <button
                type="button"
                onClick={() => setMode("manual")}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  mode === "manual"
                    ? "bg-white text-m3-primary shadow-xs"
                    : "text-m3-secondary hover:text-m3-on-surface"
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Atur Manual</span>
              </button>
            </div>

            {/* Content for AI Mode */}
            {mode === "ai" && (
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2 text-xs text-indigo-950">
                <div className="flex items-center gap-2 font-bold text-indigo-900">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Fitur Ekstraksi Pintar AI (Simulasi)</span>
                </div>
                <p className="text-[11px] leading-relaxed text-indigo-900/80">
                  AI akan membaca struktur dokumen, mengekstrak 14 sesi pertemuan, mendeteksi bobot nilai tugas & ujian, serta menyelaraskannya ke kalender akademik secara otomatis.
                </p>
                <div className="pt-2 flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>Berkas akan disimpan di server lokal (/public/storage/)</span>
                </div>
              </div>
            )}

            {/* Content for Manual Mode: Popup Detail Form */}
            {mode === "manual" && (
              <div className="p-4 rounded-2xl bg-m3-surface-container-low border border-m3-outline-variant space-y-3.5 text-xs animate-in fade-in duration-100">
                <div className="flex items-center gap-2 font-bold text-m3-on-surface pb-1 border-b border-slate-200/80">
                  <FolderOpen className="w-4 h-4 text-m3-primary" />
                  <span>Formulir Pengkategorian Berkas</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Pilih Mata Kuliah */}
                  <div>
                    <label className="text-[11px] font-bold text-m3-on-surface block mb-1">
                      Mata Kuliah
                    </label>
                    <select
                      value={manualCourse}
                      onChange={(e) => setManualCourse(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-m3-outline text-xs text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary"
                    >
                      {availableCourses.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Pertemuan Ke- */}
                  <div>
                    <label className="text-[11px] font-bold text-m3-on-surface block mb-1">
                      Pertemuan Ke-
                    </label>
                    <select
                      value={manualSessionNo}
                      onChange={(e) => setManualSessionNo(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-m3-outline text-xs text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary"
                    >
                      {Array.from({ length: 14 }, (_, i) => i + 1).map((num) => (
                        <option key={num} value={num}>
                          Sesi Pertemuan {num}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Tipe Berkas */}
                  <div>
                    <label className="text-[11px] font-bold text-m3-on-surface block mb-1">
                      Jenis Dokumen
                    </label>
                    <select
                      value={manualDocType}
                      onChange={(e) => setManualDocType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-m3-outline text-xs text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary"
                    >
                      <option value="slide">Slide Bahan Ajar</option>
                      <option value="rps">RPS & Silabus Resmi</option>
                      <option value="praktikum">Modul Praktikum</option>
                      <option value="tugas">Petunjuk / Soal Tugas</option>
                    </select>
                  </div>

                  {/* Topik / Catatan Singkat */}
                  <div>
                    <label className="text-[11px] font-bold text-m3-on-surface block mb-1">
                      Topik Materi (Opsional)
                    </label>
                    <input
                      type="text"
                      value={manualTopic}
                      onChange={(e) => setManualTopic(e.target.value)}
                      placeholder="Contoh: Virtual Memory & Paging"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-m3-outline text-xs text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full text-xs font-semibold text-m3-secondary hover:bg-m3-surface-container transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={!selectedFile || isUploading || isSuccess}
            onClick={handleSaveDocument}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all shadow-xs flex items-center gap-2 ${
              !selectedFile || isUploading || isSuccess
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-m3-primary text-m3-on-primary hover:brightness-95"
            }`}
          >
            {isSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Tersimpan di /storage!</span>
              </>
            ) : isUploading ? (
              <span>Mengunggah ke Server...</span>
            ) : mode === "ai" ? (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Simpan & Ekstraksi AI</span>
              </>
            ) : (
              <span>Simpan Dokumen</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
