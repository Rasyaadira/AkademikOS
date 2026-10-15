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
  LogOut,
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
  onLogout?: () => void;
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
  { id: "setting", label: "Pengaturan & Akun", icon: Settings },
];

export default function Sidebar({
  activeTab,
  onSelectTab,
  profile,
  onLogout,
}: SidebarProps) {
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);
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
    <aside className="w-64 h-full bg-white dark:bg-m3-surface-container-low rounded-[28px] sm:rounded-[32px] border border-slate-200/80 dark:border-m3-outline-variant shadow-[0_2px_16px_rgba(0,0,0,0.03)] flex flex-col justify-between p-4 overflow-y-auto relative">
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
      <div className="pt-4 border-t border-m3-outline-variant space-y-1 relative">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id || (item.id === "setting" && activeTab === "akun");
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

        {/* Profile Popover Menu */}
        {showProfileMenu && (
          <div className="absolute bottom-16 left-0 right-0 bg-white dark:bg-m3-surface-container-high border border-m3-outline-variant rounded-2xl shadow-xl p-2 z-50 space-y-1 animate-in fade-in zoom-in-95">
            <div className="px-3 py-2 border-b border-m3-outline-variant/60">
              <p className="text-xs font-bold text-m3-on-surface truncate">{studentName}</p>
              <p className="text-[10px] text-m3-secondary truncate">{profile?.nim || "Mahasiswa Aktif"}</p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowProfileMenu(false);
                onSelectTab("setting");
              }}
              className="w-full px-3 py-2 text-xs font-semibold text-m3-on-surface hover:bg-m3-surface-container rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer text-left"
            >
              <Settings className="w-3.5 h-3.5 text-m3-primary" />
              <span>Buka Pengaturan & Akun</span>
            </button>

            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(false);
                  onLogout();
                }}
                className="w-full px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer text-left"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar / Ganti Akun</span>
              </button>
            )}
          </div>
        )}

        {/* Student Mini Profile Card */}
        <div
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="mt-3 p-3 bg-m3-surface-container-low rounded-2xl border border-m3-outline-variant flex items-center justify-between cursor-pointer hover:bg-m3-surface-container transition-all group min-h-[52px]"
          title="Klik untuk opsi profil & logout"
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

          <ChevronRight className={`w-4 h-4 text-m3-secondary group-hover:text-m3-primary transition-all flex-shrink-0 ${showProfileMenu ? "rotate-90" : "group-hover:translate-x-0.5"}`} />
        </div>
      </div>
    </aside>
  );
}
