"use client";

import React, { useState } from "react";
import { X, UploadCloud, FileCheck, CheckCircle2, AlertCircle } from "lucide-react";

interface UploadDocModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (info: { fileName: string; docType: string }) => void;
}

export default function UploadDocModal({
  isOpen,
  onClose,
  onUploadSuccess,
}: UploadDocModalProps) {
  const [docType, setDocType] = useState<"rps" | "slide">("rps");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleProcess = () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        onUploadSuccess({
          fileName: selectedFile.name,
          docType: docType === "rps" ? "RPS & Silabus" : "Slide Materi Pertemuan",
        });
        setSelectedFile(null);
        setIsSuccess(false);
        onClose();
      }, 1200);
    }, 1500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-m3-surface-container-low border border-m3-outline-variant rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-m3-on-surface">Unggah Dokumen Kuliah</h3>
            <p className="text-xs text-m3-secondary">
              Ekstraksi otomatis jadwal, silabus RPS, atau materi slide pertemuan
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-m3-secondary hover:bg-m3-surface-container-high transition-colors"
            aria-label="Tutup dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Document Type Selector */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-m3-surface-container rounded-2xl">
          <button
            type="button"
            onClick={() => setDocType("rps")}
            className={`py-2 px-3 rounded-xl text-xs font-semibold transition-colors ${
              docType === "rps"
                ? "bg-m3-surface-container-low text-m3-on-surface shadow-xs"
                : "text-m3-secondary hover:text-m3-on-surface"
            }`}
          >
            RPS / Silabus Matkul
          </button>
          <button
            type="button"
            onClick={() => setDocType("slide")}
            className={`py-2 px-3 rounded-xl text-xs font-semibold transition-colors ${
              docType === "slide"
                ? "bg-m3-surface-container-low text-m3-on-surface shadow-xs"
                : "text-m3-secondary hover:text-m3-on-surface"
            }`}
          >
            Slide / Catatan Dosen
          </button>
        </div>

        {/* Drag & Drop Zone */}
        <label className="border-2 border-dashed border-m3-outline rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-m3-secondary transition-colors bg-m3-surface-container">
          <input
            type="file"
            accept=".pdf,.docx,.pptx"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="w-12 h-12 rounded-full bg-m3-secondary-container text-m3-secondary flex items-center justify-center mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-m3-on-surface">
            {selectedFile ? selectedFile.name : "Klik atau seret file PDF / DOCX / PPTX ke sini"}
          </p>
          <p className="text-[11px] text-m3-secondary mt-1">
            Maksimal 25MB • Format dokumen resmi dari dosen
          </p>
        </label>

        {/* Parsing preview simulation */}
        {selectedFile && !isSuccess && (
          <div className="p-3.5 rounded-2xl bg-m3-surface-container border border-m3-outline-variant space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-m3-on-surface font-semibold">
              <span>Status Berkas</span>
              <span className="text-emerald-700">Siap diekstraksi</span>
            </div>
            <p className="text-[11px] text-m3-secondary">
              Dokumen akan dipindai untuk memperbarui jadwal 14 pertemuan dan sinkronisasi bobot tugas.
            </p>
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div className="p-4 rounded-2xl bg-m3-primary-container text-m3-on-primary-container text-xs flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-m3-on-primary-container border-t-transparent rounded-full animate-spin" />
            <span className="font-semibold">Mengekstrak struktur topik dan tenggat tugas...</span>
          </div>
        )}

        {/* Success State */}
        {isSuccess && (
          <div className="p-4 rounded-2xl bg-m3-tertiary text-m3-on-tertiary text-xs flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span className="font-semibold">Dokumen berhasil disinkronkan ke siklus akademik!</span>
          </div>
        )}

        {/* Actions */}
        <div className="pt-3 border-t border-m3-outline-variant flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-5 py-2 rounded-full text-xs font-semibold text-m3-secondary hover:bg-m3-surface-container transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleProcess}
            disabled={!selectedFile || isProcessing || isSuccess}
            className="px-6 py-2 rounded-full text-xs font-bold bg-m3-secondary text-m3-on-secondary hover:brightness-110 transition-all disabled:opacity-50 shadow-xs"
          >
            {isProcessing ? "Memproses..." : "Ekstraksi Dokumen"}
          </button>
        </div>
      </div>
    </div>
  );
}
