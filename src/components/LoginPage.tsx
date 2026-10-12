"use client";

import React, { useState } from "react";
import {
  Layers,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  School,
  Trash2,
  RotateCcw,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

interface LoginPageProps {
  onLogin: (userId: string) => void;
  onClose?: () => void;
  currentUserId?: string;
  onResetData?: (userId: string) => void;
  onRestoreDemo?: () => void;
}

export default function LoginPage({
  onLogin,
  onClose,
  currentUserId = "student-clean",
  onResetData,
  onRestoreDemo,
}: LoginPageProps) {
  const [selectedPersona, setSelectedPersona] = useState<string>(currentUserId);
  const [nimInput, setNimInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const personas = [
    {
      id: "student-clean",
      name: "Akun Bersih (Kosongan)",
      nim: "Uji Mandiri",
      major: "Tanpa Tugas & Jadwal",
      semester: 5,
      avatar: "0",
      accent: "bg-amber-600 text-white",
      tag: "Rekomendasi Uji",
    },
    {
      id: "student-1",
      name: "Faras Pratama",
      nim: "23/512948/TK/54321",
      major: "Teknik Informatika",
      semester: 5,
      avatar: "FR",
      accent: "bg-blue-600 text-white",
      tag: "Data Demo",
    },
    {
      id: "student-2",
      name: "Arya Wicaksono",
      nim: "23/514210/TK/55123",
      major: "Teknik Komputer",
      semester: 5,
      avatar: "AW",
      accent: "bg-emerald-600 text-white",
      tag: "Data Demo",
    },
    {
      id: "student-3",
      name: "Nabila Putri",
      nim: "23/516789/TK/56234",
      major: "Teknik Informatika",
      semester: 3,
      avatar: "NP",
      accent: "bg-purple-600 text-white",
      tag: "Data Demo",
    },
  ];

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(selectedPersona);
  };

  const handleTriggerReset = async () => {
    if (onResetData) {
      onResetData(selectedPersona);
      setActionNotice("Semua tugas & jadwal untuk akun ini berhasil dikosongkan!");
      setTimeout(() => setActionNotice(null), 3500);
    }
  };

  const handleTriggerRestore = async () => {
    if (onRestoreDemo) {
      onRestoreDemo();
      setActionNotice("Data contoh (dummy) berhasil dipulihkan!");
      setTimeout(() => setActionNotice(null), 3500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-[32px] border border-m3-outline-variant shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Branding */}
        <div className="p-5 sm:p-7 bg-m3-surface-container-low border-b border-m3-outline-variant/60 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-m3-primary flex items-center justify-center text-m3-on-primary shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-m3-on-surface">AkademikOS</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-m3-primary-container text-m3-on-primary-container">
                  Siklus.ai
                </span>
              </div>
              <p className="text-xs text-m3-secondary">Portal Ritme Akademik Mahasiswa • UGM</p>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-m3-surface-container text-m3-secondary hover:text-m3-on-surface transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              Tutup
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-5">
          {actionNotice && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{actionNotice}</span>
            </div>
          )}

          {/* Quick SSO Persona Picker */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold text-m3-on-surface flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-m3-primary" />
                <span>Pilih Akun Mahasiswa</span>
              </label>
              <span className="text-[10px] font-semibold text-m3-secondary">Pilih akun pengujian</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {personas.map((p) => {
                const isSelected = selectedPersona === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPersona(p.id)}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between min-h-[70px] ${
                      isSelected
                        ? "border-m3-primary bg-m3-primary-container/20 ring-2 ring-m3-primary/30"
                        : "border-m3-outline-variant hover:border-m3-outline bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${p.accent}`}>
                          {p.avatar}
                        </div>
                        <span className="text-xs font-bold text-m3-on-surface truncate">{p.name}</span>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        p.id === "student-clean" ? "bg-amber-100 text-amber-900 border border-amber-300" : "bg-slate-100 text-slate-700"
                      }`}>
                        {p.tag}
                      </span>
                    </div>
                    <div className="text-[10px] text-m3-secondary flex items-center justify-between mt-1">
                      <span className="truncate">{p.major}</span>
                      <span className="font-semibold text-m3-on-surface">Sem. {p.semester}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons: Masuk & Kontrol Data */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={() => onLogin(selectedPersona)}
              className="w-full py-3 px-4 rounded-2xl bg-m3-primary text-m3-on-primary font-bold text-xs hover:brightness-95 transition-all shadow-xs flex items-center justify-center gap-2 min-h-[44px]"
            >
              <span>Gunakan Akun Terpilih</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick Data Management Buttons for Testing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleTriggerReset}
                className="py-2.5 px-3 rounded-xl border border-red-200 bg-red-50/60 hover:bg-red-100 text-red-700 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors min-h-[44px]"
                title="Hapus semua tugas dan jadwal akun ini agar bersih untuk pengujian data asli"
              >
                <Trash2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Kosongkan Data Akun Ini</span>
              </button>

              <button
                type="button"
                onClick={handleTriggerRestore}
                className="py-2.5 px-3 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-blue-700 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors min-h-[44px]"
                title="Isi kembali dengan data contoh (dummy) perkuliahan"
              >
                <RotateCcw className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Pulihkan Data Contoh</span>
              </button>
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200" />
            <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              atau masuk via sso simaster
            </span>
            <div className="flex-grow border-t border-slate-200" />
          </div>

          {/* Single Sign-On Button */}
          <button
            type="button"
            onClick={() => onLogin(selectedPersona)}
            className="w-full py-2.5 px-4 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 font-bold text-xs text-slate-800 flex items-center justify-center gap-2.5 transition-all shadow-xs min-h-[44px]"
          >
            <School className="w-4 h-4 text-m3-primary flex-shrink-0" />
            <span>Masuk Otomatis via SSO UGM</span>
          </button>
        </div>

        {/* Footer info */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-m3-secondary flex items-center justify-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          <span>Offline-first SQLite • Bebas ganti akun atau kosongkan data untuk pengujian</span>
        </div>
      </div>
    </div>
  );
}
