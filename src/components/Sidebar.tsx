import React from "react";
import {
  LayoutDashboard,
  HandCoins,
  ShoppingBag,
  FileSpreadsheet,
  GraduationCap,
  School,
  X,
  ShieldCheck,
  UserCog,
  Cloud,
} from "lucide-react";
import { SchoolData, TabType } from "../types";

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  school: SchoolData;
  honorCount: number;
  siplahCount: number;
  guruCount: number;
  userCount?: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  school,
  honorCount,
  siplahCount,
  guruCount,
  userCount,
  isOpen,
  setIsOpen,
}) => {
  const navItems: { id: TabType; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "honor", label: "Menu Honor Guru", icon: HandCoins, badge: honorCount },
    { id: "siplah", label: "Menu SIPLah", icon: ShoppingBag, badge: siplahCount },
    { id: "laporan", label: "Menu Laporan", icon: FileSpreadsheet },
    { id: "guru", label: "Guru & Tendik", icon: GraduationCap, badge: guruCount },
    { id: "users", label: "Manajemen User", icon: UserCog, badge: userCount },
    { id: "pengaturan", label: "Identitas Sekolah", icon: School },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200/90 text-slate-700 flex flex-col justify-between transform transition-transform duration-300 ease-in-out shadow-xl md:shadow-none no-print ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-3 overflow-hidden">
              <img
                src={school.logoUrl || "/logo.svg"}
                alt="Logo Sekolah"
                className="w-11 h-11 rounded-2xl object-contain bg-white p-0.5 border border-slate-200 shadow-sm shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/logo.svg";
                }}
              />
              <div className="overflow-hidden">
                <h1 className="font-extrabold text-slate-900 text-sm tracking-tight truncate leading-snug">
                  {school.namaSekolah}
                </h1>
                <p className="text-[11px] text-indigo-600 font-bold tracking-wider uppercase mt-0.5">
                  Keuangan BOSP
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="md:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              title="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav List */}
          <nav className="p-3.5 space-y-1.5">
            <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
              Navigasi Utama
            </p>
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold transition-all duration-200 group ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-600"
                      } transition`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-600 border border-slate-200/60"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom School Status Badge */}
        <div className="p-3 m-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 text-emerald-950 space-y-2">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="font-bold text-xs text-emerald-950 truncate">
                Portal BOSP Terverifikasi
              </p>
              <p className="text-[10px] text-emerald-700 font-medium truncate">
                TA {school.tahunAnggaran} &bull; Terverifikasi
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-white/80 rounded-xl border border-emerald-200/60 text-[10px] font-bold text-emerald-800">
            <Cloud className="w-3 h-3 text-emerald-600 shrink-0" />
            <span className="truncate">Firebase Cloud Realtime</span>
          </div>
        </div>
      </aside>
    </>
  );
};
