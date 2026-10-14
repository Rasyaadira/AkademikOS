"use client";

import React from "react";
import {
  Home,
  BookOpen,
  FileText,
  Calendar,
  GraduationCap,
  Sparkles,
  User,
  Settings,
  Layers,
  ChevronRight,
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
  { id: "akun", label: "Akun & Profil", icon: User },
  { id: "setting", label: "Pengaturan", icon: Settings },
];

export default function Sidebar({
  activeTab,
  onSelectTab,
  profile,
}: SidebarProps) {
  const studentName = profile?.name || "Mahasiswa";
  const studentMajor = profile?.faculty || profile?.major || "Program Studi";
  const studentSemester = profile?.semester || 1;
  const initials = studentName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "MA";

  const filteredMainNavItems = profile?.noAiMode
    ? mainNavItems.filter((item) => item.id !== "quiz")
    : mainNavItems;

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
          {filteredMainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-full text-sm transition-colors text-left min-h-[44px] ${
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

      {/* Bottom Navigation & Single Student Profile */}
      <div className="pt-4 border-t border-m3-outline-variant space-y-1">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-full text-sm transition-colors text-left min-h-[44px] ${
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

        {/* Student Mini Profile Card */}
        <div
          onClick={() => onSelectTab("akun")}
          className="mt-3 p-3 bg-m3-surface-container-low rounded-2xl border border-m3-outline-variant flex items-center justify-between cursor-pointer hover:bg-m3-surface-container transition-all group min-h-[52px]"
          title="Buka Pengaturan Akun Mahasiswa"
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            {profile?.photoUrl ? (
              <img
                src={profile.photoUrl}
                alt={studentName}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-m3-outline-variant"
              />
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 bg-m3-primary text-m3-on-primary">
                {initials}
              </div>
            )}
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-m3-on-surface truncate group-hover:text-m3-primary transition-colors">
                  {studentName}
                </p>
              </div>
              <p className="text-[10px] text-m3-secondary truncate">
                {studentMajor} • Sem. {studentSemester}
              </p>
            </div>
          </div>

          <ChevronRight className="w-4 h-4 text-m3-secondary group-hover:text-m3-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </div>
      </div>
    </aside>
  );
}
