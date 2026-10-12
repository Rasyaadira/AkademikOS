"use client";

import React, { useState } from "react";
import {
  Home,
  BookOpen,
  FileText,
  Calendar,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  User,
  Settings,
  Layers,
  Users,
  LogIn,
} from "lucide-react";
import { StudentProfile } from "./OtherViews";

export type NavTab =
  | "home"
  | "rps"
  | "catatan"
  | "kalender"
  | "matkul"
  | "quiz"
  | "akun"
  | "setting";

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  profile?: StudentProfile;
  currentUserId?: string;
  onSwitchAccount?: (userId: string) => void;
  onOpenLogin?: () => void;
}

interface NavItem {
  id: NavTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const mainNavItems: NavItem[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "rps", label: "RPS & Materi", icon: BookOpen },
  { id: "catatan", label: "Catatan Kuliah", icon: FileText },
  { id: "kalender", label: "Kalender & Agenda", icon: Calendar },
  { id: "matkul", label: "Matkul dan Dosen", icon: GraduationCap },
  { id: "quiz", label: "AI Quiz", icon: Sparkles },
];

const bottomNavItems: NavItem[] = [
  { id: "akun", label: "Akun", icon: User },
  { id: "setting", label: "Setting", icon: Settings },
];

export default function Sidebar({
  activeTab,
  onSelectTab,
  profile,
  currentUserId = "student-1",
  onSwitchAccount,
  onOpenLogin,
}: SidebarProps) {
  const [showAccountSwitch, setShowAccountSwitch] = useState(false);

  const studentName = profile?.name || "Faras Pratama";
  const studentMajor = profile?.major || "Informatika";
  const studentSemester = profile?.semester || 5;
  const initials = studentName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="w-64 h-full bg-white rounded-[28px] sm:rounded-[32px] border border-slate-200/80 shadow-[0_2px_16px_rgba(0,0,0,0.03)] flex flex-col justify-between p-4 overflow-y-auto">
      {/* Brand Header */}
      <div>
        <div className="flex items-center gap-3 px-3 py-2 mb-6">
          <div className="w-9 h-9 rounded-2xl bg-m3-primary flex items-center justify-center text-m3-on-primary shadow-xs">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-semibold text-base tracking-tight text-m3-on-surface">
              AkademikOS
            </h1>
            <p className="text-xs text-m3-secondary">Siklus Ritme Akademik</p>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="space-y-1" aria-label="Menu Utama">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-full text-sm transition-colors text-left ${
                  isActive
                    ? "bg-m3-primary text-m3-on-primary font-medium shadow-xs"
                    : "text-m3-on-surface hover:bg-m3-surface-container-high"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-m3-on-primary" : "text-m3-secondary"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Navigation & Profile */}
      <div className="pt-4 border-t border-m3-outline-variant space-y-1">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-full text-sm transition-colors text-left ${
                isActive
                  ? "bg-m3-primary text-m3-on-primary font-medium shadow-xs"
                  : "text-m3-on-surface hover:bg-m3-surface-container-high"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-m3-on-primary" : "text-m3-secondary"}`} />
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* Student Mini Profile with Account Switcher */}
        <div className="mt-3 p-3 bg-m3-surface-container-low rounded-2xl border border-m3-outline-variant space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-m3-primary text-m3-on-primary flex items-center justify-center font-bold text-xs flex-shrink-0">
                {initials}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-m3-on-surface truncate">{studentName}</p>
                <p className="text-[11px] text-m3-secondary truncate">
                  {studentMajor} • Sem. {studentSemester}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {onOpenLogin && (
                <button
                  onClick={onOpenLogin}
                  className="p-1 text-m3-secondary hover:text-m3-on-surface rounded-lg transition-colors hover:bg-slate-200/60"
                  title="Halaman Login / SSO Simaster"
                >
                  <LogIn className="w-4 h-4" />
                </button>
              )}
              {onSwitchAccount && (
                <button
                  onClick={() => setShowAccountSwitch(!showAccountSwitch)}
                  className="p-1 text-m3-secondary hover:text-m3-on-surface rounded-lg transition-colors hover:bg-slate-200/60"
                  title="Ganti Akun Cepat"
                >
                  <Users className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Account Switcher Popup */}
          {showAccountSwitch && onSwitchAccount && (
            <div className="pt-2 border-t border-m3-outline-variant/60 space-y-1 text-xs">
              <p className="text-[10px] text-m3-secondary font-semibold uppercase">Pilih Akun SQLite:</p>
              <button
                onClick={() => {
                  onSwitchAccount("student-1");
                  setShowAccountSwitch(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-xl transition-colors ${
                  currentUserId === "student-1"
                    ? "bg-m3-primary-container text-m3-on-primary-container font-bold"
                    : "hover:bg-slate-100 text-m3-secondary"
                }`}
              >
                Faras Pratama (student-1)
              </button>
              <button
                onClick={() => {
                  onSwitchAccount("student-2");
                  setShowAccountSwitch(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-xl transition-colors ${
                  currentUserId === "student-2"
                    ? "bg-m3-primary-container text-m3-on-primary-container font-bold"
                    : "hover:bg-slate-100 text-m3-secondary"
                }`}
              >
                Arya Wicaksono (student-2)
              </button>
              <button
                onClick={() => {
                  onSwitchAccount("student-3");
                  setShowAccountSwitch(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-xl transition-colors ${
                  currentUserId === "student-3"
                    ? "bg-m3-primary-container text-m3-on-primary-container font-bold"
                    : "hover:bg-slate-100 text-m3-secondary"
                }`}
              >
                Nabila Putri (student-3)
              </button>
              {onOpenLogin && (
                <button
                  onClick={() => {
                    setShowAccountSwitch(false);
                    onOpenLogin();
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-xl text-m3-primary font-semibold hover:bg-m3-primary-container/40 flex items-center gap-1.5 pt-1.5 border-t border-slate-100"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Buka Halaman Login / SSO</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
