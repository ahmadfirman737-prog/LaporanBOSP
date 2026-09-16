import React, { useState } from "react";
import {
  Lock,
  User,
  LogIn,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { AuthUser, SchoolData } from "../types";

interface LoginViewProps {
  school: SchoolData;
  users?: AuthUser[];
  onLogin: (user: AuthUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ school, users = [], onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState("Bendahara BOSP");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!username.trim()) {
      setErrorMsg("Harap masukkan nama pengguna atau NIP.");
      return;
    }

    if (!password.trim()) {
      setErrorMsg("Harap masukkan kata sandi.");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const cleanUser = username.trim().toLowerCase();
      const matched = users.find(
        (u) =>
          u.username.toLowerCase() === cleanUser ||
          (u.nip && u.nip.replace(/\s+/g, "") === username.trim().replace(/\s+/g, ""))
      );

      if (matched) {
        if (matched.status === "Nonaktif") {
          setIsLoading(false);
          setErrorMsg("Akun ini sedang berstatus Nonaktif. Silakan hubungi pengelola sistem.");
          return;
        }

        // Verify password if user has password set
        if (matched.password && matched.password !== password) {
          setIsLoading(false);
          setErrorMsg("Kata sandi yang Anda masukkan tidak sesuai.");
          return;
        }

        setIsLoading(false);
        onLogin(matched);
        return;
      }

      // If custom user not found in preset list
      let displayName = username.trim();
      let nip = "";

      if (selectedRole === "Bendahara BOSP") {
        displayName = school.bendahara || username.trim();
        nip = school.nipBendahara || "";
      } else if (selectedRole === "Kepala Sekolah") {
        displayName = school.kepalaSekolah || username.trim();
        nip = school.nipKepalaSekolah || "";
      } else {
        displayName = username.trim();
      }

      const user: AuthUser = {
        id: `usr-${Date.now()}`,
        username: username.trim(),
        nama: displayName,
        role: selectedRole,
        nip: nip || undefined,
        email: `${username.trim().toLowerCase().replace(/\s+/g, "")}@kusumabangsa.sch.id`,
        password: password,
        status: "Aktif",
      };

      setIsLoading(false);
      onLogin(user);
    }, 350);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden selection:bg-emerald-500 selection:text-white">
      {/* Subtle Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative z-10 transition-all">
        {/* Top Header with Emblem */}
        <div className="bg-gradient-to-b from-emerald-50/70 to-white px-8 pt-8 pb-5 text-center border-b border-slate-100">
          <div className="inline-block relative mb-3">
            <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto p-2 bg-white rounded-3xl shadow-md border border-slate-200/80 flex items-center justify-center transition-transform hover:scale-105 duration-300">
              <img
                src={school.logoUrl || "/logo.svg?v=kusuma2"}
                alt="Logo Kusuma Bangsa"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/logo.svg?v=kusuma2";
                }}
              />
            </div>
            <span className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center text-white" title="Sistem Aktif">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          </div>

          <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight uppercase leading-snug">
            {school.namaSekolah}
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Sistem Informasi Laporan Realisasi BOSP &bull; TA {school.tahunAnggaran}
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Nama Pengguna / NIP
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan nama pengguna atau NIP"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1"
                  title={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Role selection dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Sebagai Peran</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              >
                <option value="Bendahara BOSP">Bendahara BOSP (Pengelola Dana & Belanja)</option>
                <option value="Kepala Sekolah">Kepala Sekolah (Penanggung Jawab)</option>
                <option value="Operator Keuangan">Operator Keuangan / Admin</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-emerald-700/20 hover:shadow-lg hover:shadow-emerald-700/30 transition flex items-center justify-center gap-2 group disabled:opacity-75 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memverifikasi Akun...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Masuk ke Sistem BOSP</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="bg-slate-50/90 px-6 py-3 border-t border-slate-100 text-center flex items-center justify-center gap-2 text-[11px] text-slate-500 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Sesi Terenkripsi &bull; Portal Resmi Sekolah Bogor</span>
        </div>
      </div>

      <p className="mt-6 text-slate-400 text-xs text-center font-medium">
        &copy; {new Date().getFullYear()} {school.namaSekolah}. Hak Cipta Dilindungi.
      </p>
    </div>
  );
};
