"use client";

import React, { useState } from "react";
import { Layers, GraduationCap, ArrowRight, ShieldCheck, UserCheck, KeyRound, School } from "lucide-react";

interface LoginPageProps {
  onLogin: (userId: string) => void;
  onClose?: () => void;
}

export default function LoginPage({ onLogin, onClose }: LoginPageProps) {
  const [selectedPersona, setSelectedPersona] = useState<string>("student-1");
  const [nimInput, setNimInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");

  const personas = [
    {
      id: "student-1",
      name: "Faras Pratama",
      nim: "23/512948/TK/54321",
      major: "Teknik Informatika",
      semester: 5,
      avatar: "FR",
      accent: "bg-blue-600 text-white",
    },
    {
      id: "student-2",
      name: "Arya Wicaksono",
      nim: "23/514210/TK/55123",
      major: "Teknik Komputer",
      semester: 5,
      avatar: "AW",
      accent: "bg-emerald-600 text-white",
    },
    {
      id: "student-3",
      name: "Nabila Putri",
      nim: "23/516789/TK/56234",
      major: "Teknik Informatika",
      semester: 3,
      avatar: "NP",
      accent: "bg-purple-600 text-white",
    },
  ];

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(selectedPersona);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-[32px] border border-m3-outline-variant shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Branding */}
        <div className="p-6 sm:p-8 bg-m3-surface-container-low border-b border-m3-outline-variant/60 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-m3-primary flex items-center justify-center text-m3-on-primary shadow-xs">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-m3-on-surface">AkademikOS</h2>
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
              className="text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-m3-surface-container text-m3-secondary hover:text-m3-on-surface transition-colors"
            >
              Tutup
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          {/* Quick SSO Persona Picker */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-m3-on-surface flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-m3-primary" />
                <span>Pilih Akun Mahasiswa (Multi-tenant SQLite)</span>
              </label>
              <span className="text-[10px] font-semibold text-m3-secondary">3 Profil Tersedia</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {personas.map((p) => {
                const isSelected = selectedPersona === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPersona(p.id)}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? "border-m3-primary bg-m3-primary-container/20 ring-2 ring-m3-primary/30"
                        : "border-m3-outline-variant hover:border-m3-outline bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${p.accent}`}>
                        {p.avatar}
                      </div>
                      <span className="text-xs font-bold text-m3-on-surface truncate">{p.name.split(" ")[0]}</span>
                    </div>
                    <div className="text-[10px] text-m3-secondary space-y-0.5">
                      <p className="truncate">{p.major}</p>
                      <p className="font-semibold text-m3-on-surface">Sem. {p.semester}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200" />
            <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              atau masuk via sso
            </span>
            <div className="flex-grow border-t border-slate-200" />
          </div>

          {/* Single Sign-On Button */}
          <button
            type="button"
            onClick={() => onLogin(selectedPersona)}
            className="w-full py-3 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 font-bold text-xs text-slate-800 flex items-center justify-center gap-2.5 transition-all shadow-xs"
          >
            <School className="w-4 h-4 text-m3-primary" />
            <span>Masuk dengan SSO Simaster UGM</span>
          </button>

          {/* Form Login Alternatif */}
          <form onSubmit={handleManualLogin} className="space-y-3 pt-2">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-m3-secondary">NIM atau Email Kampus</label>
              <input
                type="text"
                value={nimInput}
                onChange={(e) => setNimInput(e.target.value)}
                placeholder="23/512948/TK/54321"
                className="w-full px-3.5 py-2.5 rounded-xl border border-m3-outline bg-m3-surface-container/20 text-xs text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-m3-secondary">Kata Sandi</label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-m3-outline bg-m3-surface-container/20 text-xs text-m3-on-surface focus:outline-none focus:ring-2 focus:ring-m3-primary"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-m3-primary text-m3-on-primary font-bold text-xs hover:brightness-95 transition-all shadow-xs flex items-center justify-center gap-2 mt-4"
            >
              <span>Masuk ke AkademikOS</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-m3-secondary flex items-center justify-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>JOINTS UGM 2026 Hackathon • Mode Prototipe Offline-first SQLite</span>
        </div>
      </div>
    </div>
  );
}
