import React, { useState, useRef, useEffect } from "react";
import {
  Menu,
  Search,
  Sparkles,
  LogOut,
  User,
  ChevronDown,
  ShieldCheck,
  Settings,
  UserCheck,
  UserCog,
  Cloud,
} from "lucide-react";
import { AuthUser, SchoolData, TabType } from "../types";

interface HeaderBarProps {
  school: SchoolData;
  activeTab: TabType;
  onToggleSidebar: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currentUser: AuthUser;
  onLogout: () => void;
  onNavigateTab?: (tab: TabType) => void;
  firebaseConnected?: boolean;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  school,
  activeTab,
  onToggleSidebar,
  searchQuery,
  setSearchQuery,
  currentUser,
  onLogout,
  onNavigateTab,
  firebaseConnected = true,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getTabTitle = () => {
    switch (activeTab) {
      case "dashboard":
        return "Dashboard Ikhtisar";
      case "honor":
        return "Pencairan Honor Guru & Tendik";
      case "siplah":
        return "Realisasi Belanja SIPLah";
      case "laporan":
        return "Laporan & Ekspor Keuangan";
      case "guru":
        return "Master Data Guru & Tendik";
      case "users":
        return "Manajemen Pengguna & Hak Akses";
      case "pengaturan":
        return "Identitas & Profil Sekolah";
      default:
        return "Laporan BOSP";
    }
  };

  // User initials for avatar
  const getInitials = (name: string) => {
    if (!name) return "KB";
    const parts = name.split(" ").filter(Boolean);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  return (
    <header className="bg-white/85 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 px-4 md:px-8 py-3 flex items-center justify-between no-print transition-all">
      {/* Left Area: Hamburger & Title */}
      <div className="flex items-center space-x-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 focus:outline-none shrink-0"
          title="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h2 className="font-bold text-slate-900 text-base md:text-xl tracking-tight truncate">
            {getTabTitle()}
          </h2>
          <p className="text-xs text-slate-500 font-medium hidden sm:block truncate">
            {school.namaSekolah} &bull; TA {school.tahunAnggaran}
          </p>
        </div>
      </div>

      {/* Right Area: Search, Status, User & Logout */}
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        {/* Quick Search */}
        <div className="relative hidden lg:block w-56">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari transaksi / guru..."
            className="w-full pl-9 pr-4 py-2 bg-slate-100/90 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
          />
        </div>

        {/* Firebase Realtime Cloud Indicator */}
        <div
          className={`hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
            firebaseConnected
              ? "bg-emerald-50/90 border-emerald-200/80 text-emerald-800"
              : "bg-amber-50 border-amber-200 text-amber-800"
          }`}
          title="Sinkronisasi Cloud Firestore Real-time"
        >
          <Cloud className={`w-3.5 h-3.5 ${firebaseConnected ? "text-emerald-600 animate-pulse" : "text-amber-600"}`} />
          <span className="hidden lg:inline text-[11px] font-bold">
            {firebaseConnected ? "Firebase Realtime" : "Menghubungkan..."}
          </span>
        </div>

        {/* Status Chip */}
        <div className="hidden xl:flex items-center space-x-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200/60 rounded-xl">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            BOSP Aktif
          </span>
        </div>

        {/* Top Right User Profile & Logout Section */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition focus:outline-none group cursor-pointer"
            title="Menu Akun & Keluar"
          >
            {/* Avatar Initials */}
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
              {getInitials(currentUser.nama)}
            </div>

            {/* User Name & Role in Header */}
            <div className="hidden sm:flex flex-col text-left overflow-hidden max-w-[140px] md:max-w-[180px]">
              <span className="text-xs font-bold text-slate-900 truncate leading-tight group-hover:text-emerald-700 transition">
                {currentUser.nama}
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold truncate leading-tight">
                {currentUser.role}
              </span>
            </div>

            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${
                dropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 sm:w-72 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Account Summary Header */}
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                    {getInitials(currentUser.nama)}
                  </div>
                  <div className="overflow-hidden min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {currentUser.nama}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium truncate">
                      {currentUser.email}
                    </p>
                    <span className="inline-block mt-0.5 px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[9px] rounded-md uppercase tracking-wider">
                      {currentUser.role}
                    </span>
                  </div>
                </div>
                {currentUser.nip && (
                  <p className="mt-2 text-[10px] text-slate-400 font-mono truncate">
                    NIP: {currentUser.nip}
                  </p>
                )}
              </div>

              {/* Menu Items */}
              <div className="p-1.5 space-y-0.5 text-xs font-medium">
                {onNavigateTab && (
                  <>
                    <button
                      onClick={() => {
                        onNavigateTab("users");
                        setDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-xl transition text-left cursor-pointer"
                    >
                      <UserCog className="w-4 h-4 text-emerald-600" />
                      <span>Manajemen User & Kata Sandi</span>
                    </button>
                    <button
                      onClick={() => {
                        onNavigateTab("pengaturan");
                        setDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-xl transition text-left cursor-pointer"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>Profil & Pengaturan Sekolah</span>
                    </button>
                  </>
                )}
              </div>

              {/* Logout Button in Top Right Dropdown */}
              <div className="pt-1 mt-1 border-t border-slate-100 p-1.5">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-rose-50/80 hover:bg-rose-100 text-rose-700 font-bold rounded-xl transition text-xs group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <LogOut className="w-4 h-4 text-rose-600 transition-transform group-hover:-translate-x-0.5" />
                    <span>Keluar dari Sistem</span>
                  </div>
                  <span className="text-[10px] font-semibold text-rose-500 bg-white px-2 py-0.5 rounded-md border border-rose-200/70">
                    Logout
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Dedicated Direct Logout Button next to user profile for quick access */}
        <button
          onClick={onLogout}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 rounded-2xl font-bold text-xs transition shadow-2xs group cursor-pointer"
          title="Keluar dari Sistem"
        >
          <LogOut className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600 transition" />
          <span>Keluar</span>
        </button>
      </div>
    </header>
  );
};

