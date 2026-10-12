"use client";

import React, { useState, useRef } from "react";
import { Plus, ArrowUp } from "lucide-react";

interface ActionQuickCardsProps {
  onOpenQuickTask: () => void;
  onFileDrop: (file: File) => void;
  onOpenUploadDoc: () => void;
}

export default function ActionQuickCards({
  onOpenQuickTask,
  onFileDrop,
  onOpenUploadDoc,
}: ActionQuickCardsProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      onFileDrop(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileDrop(e.target.files[0]);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3.5 w-full h-full">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept=".pdf,.docx,.pptx"
        className="hidden"
      />

      {/* Card 1: + Tugas (Clean, Subtitle Removed per User Request) */}
      <button
        type="button"
        onClick={onOpenQuickTask}
        className="h-full min-h-[140px] bg-m3-primary text-m3-on-primary rounded-3xl p-4 flex flex-col items-center justify-center text-center transition-all hover:scale-[1.02] active:scale-95 shadow-xs border border-indigo-200/50 group"
      >
        <div className="w-12 h-12 rounded-full bg-white/40 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
          <Plus className="w-7 h-7 text-m3-on-primary stroke-[2.5]" />
        </div>
        <span className="font-bold text-sm tracking-tight">+ Tugas</span>
      </button>

      {/* Card 2: ^ Dokumen (Clean, Subtitle Removed per User Request, Direct Drag & Drop Retained) */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (fileInputRef.current) {
            fileInputRef.current.click();
          } else {
            onOpenUploadDoc();
          }
        }}
        className={`h-full min-h-[140px] rounded-3xl p-4 flex flex-col items-center justify-center text-center transition-all cursor-pointer shadow-xs border ${
          isDragOver
            ? "bg-slate-700 text-white border-dashed border-2 border-white scale-105"
            : "bg-m3-secondary text-white border-slate-600/50 hover:scale-[1.02] active:scale-95"
        }`}
      >
        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-2">
          <ArrowUp className="w-7 h-7 text-white stroke-[2.5]" />
        </div>
        <span className="font-bold text-sm tracking-tight">↑ Dokumen</span>
      </div>
    </div>
  );
}
