import React, { useState, useMemo } from "react";
import {
  Users,
  UserPlus,
  KeyRound,
  Shield,
  ShieldCheck,
  Search,
  Filter,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Lock,
  User,
  Mail,
  FileText,
  AlertTriangle,
  X,
  UserCheck,
} from "lucide-react";
import { AuthUser, SchoolData } from "../types";

interface UserManagementViewProps {
  users: AuthUser[];
  currentUser: AuthUser;
  school: SchoolData;
  onAddUser: (newUser: AuthUser) => void;
  onUpdateUser: (updatedUser: AuthUser) => void;
  onDeleteUser: (userId: string) => void;
  onChangePassword: (userId: string, newPass: string) => void;
  showToast: (msg: string, type?: "success" | "info" | "warning" | "error") => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  users,
  currentUser,
  school,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onChangePassword,
  showToast,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"list" | "my-password">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);
  const [passwordTargetUser, setPasswordTargetUser] = useState<AuthUser | null>(null);

  // Form states for Add User
  const [addForm, setAddForm] = useState({
    username: "",
    nama: "",
    role: "Operator Keuangan",
    nip: "",
    email: "",
    password: "",
    confirmPassword: "",
    status: "Aktif" as "Aktif" | "Nonaktif",
  });
  const [showAddPass, setShowAddPass] = useState(false);

  // Form state for Change Password Modal
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showTargetPass, setShowTargetPass] = useState(false);

  // Form state for "Ganti Password Saya"
  const [selfOldPassword, setSelfOldPassword] = useState("");
  const [selfNewPassword, setSelfNewPassword] = useState("");
  const [selfConfirmPassword, setSelfConfirmPassword] = useState("");
  const [showSelfPass, setShowSelfPass] = useState(false);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchQuery =
        u.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.nip && u.nip.includes(searchQuery)) ||
        u.role.toLowerCase().includes(searchQuery.toLowerCase());

      const matchRole = roleFilter === "all" || u.role === roleFilter;

      return matchQuery && matchRole;
    });
  }, [users, searchQuery, roleFilter]);

  // Available roles
  const roles = [
    "Bendahara BOSP",
    "Kepala Sekolah",
    "Operator Keuangan",
    "Verifikator Laporan",
    "Staff Administrasi",
  ];

  // Handler for Adding New User
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanUsername = addForm.username.trim().toLowerCase();
    if (!cleanUsername) {
      showToast("Nama pengguna (username) wajib diisi!", "error");
      return;
    }

    // Check duplicate username
    if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
      showToast("Username tersebut sudah digunakan oleh akun lain!", "error");
      return;
    }

    if (!addForm.nama.trim()) {
      showToast("Nama lengkap pengguna wajib diisi!", "error");
      return;
    }

    if (!addForm.password) {
      showToast("Kata sandi wajib diisi!", "error");
      return;
    }

    if (addForm.password !== addForm.confirmPassword) {
      showToast("Konfirmasi kata sandi tidak cocok!", "error");
      return;
    }

    const newUser: AuthUser = {
      id: `usr-${Date.now()}`,
      username: cleanUsername,
      nama: addForm.nama.trim(),
      role: addForm.role,
      nip: addForm.nip.trim() || undefined,
      email:
        addForm.email.trim() ||
        `${cleanUsername.replace(/\s+/g, "")}@kusumabangsa.sch.id`,
      password: addForm.password,
      status: addForm.status,
      createdAt: new Date().toISOString().split("T")[0],
    };

    onAddUser(newUser);
    setIsAddModalOpen(false);
    setAddForm({
      username: "",
      nama: "",
      role: "Operator Keuangan",
      nip: "",
      email: "",
      password: "",
      confirmPassword: "",
      status: "Aktif",
    });
    showToast(`Pengguna "${newUser.nama}" berhasil ditambahkan!`, "success");
  };

  // Handler for Updating Existing User Details
  const handleUpdateUserDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!editingUser.nama.trim()) {
      showToast("Nama lengkap pengguna tidak boleh kosong!", "error");
      return;
    }

    onUpdateUser(editingUser);
    setEditingUser(null);
    showToast(`Data pengguna "${editingUser.nama}" berhasil diperbarui!`, "success");
  };

  // Handler for Changing Target User Password
  const handleSubmitChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordTargetUser) return;

    if (!newPassword.trim()) {
      showToast("Kata sandi baru tidak boleh kosong!", "error");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      showToast("Konfirmasi kata sandi baru tidak cocok!", "error");
      return;
    }

    onChangePassword(passwordTargetUser.id, newPassword);
    setPasswordTargetUser(null);
    setNewPassword("");
    setConfirmNewPassword("");
    showToast(
      `Kata sandi untuk pengguna "${passwordTargetUser.nama}" berhasil diubah!`,
      "success"
    );
  };

  // Handler for "Ganti Password Saya"
  const handleSelfPasswordChange = (e: React.FormEvent) => {
    e.preventDefault();

    if (currentUser.password && currentUser.password !== selfOldPassword) {
      showToast("Kata sandi lama yang Anda masukkan salah!", "error");
      return;
    }

    if (!selfNewPassword.trim()) {
      showToast("Kata sandi baru tidak boleh kosong!", "error");
      return;
    }

    if (selfNewPassword !== selfConfirmPassword) {
      showToast("Konfirmasi kata sandi baru tidak cocok!", "error");
      return;
    }

    onChangePassword(currentUser.id, selfNewPassword);
    setSelfOldPassword("");
    setSelfNewPassword("");
    setSelfConfirmPassword("");
    showToast("Kata sandi akun Anda berhasil diperbarui!", "success");
  };

  // User initials
  const getInitials = (name: string) => {
    if (!name) return "US";
    const p = name.split(" ").filter(Boolean);
    if (p.length === 1) return p[0].substring(0, 2).toUpperCase();
    return (p[0][0] + p[1][0]).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-emerald-50/80 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs px-3.5 py-1 rounded-full font-bold uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Otoritas & Akses Pengguna</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              Manajemen Pengguna & Hak Akses
            </h1>
            <p className="text-slate-500 text-xs md:text-sm font-medium">
              Kelola daftar akun pengguna, atur peran hak akses, tambah akun baru, dan perbarui kata sandi sistem BOSP.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah User Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub Tabs: Daftar Pengguna & Ganti Password Saya */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab("list")}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeSubTab === "list"
              ? "border-emerald-600 text-emerald-800 bg-emerald-50/40"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Daftar Pengguna Sistem ({users.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab("my-password")}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeSubTab === "my-password"
              ? "border-emerald-600 text-emerald-800 bg-emerald-50/40"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Ganti Password Akun Saya ({currentUser.nama})</span>
        </button>
      </div>

      {/* VIEW 1: DAFTAR PENGGUNA */}
      {activeSubTab === "list" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama, username, NIP, atau peran..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              >
                <option value="all">Semua Peran ({users.length})</option>
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3.5">Pengguna & Akun</th>
                    <th className="px-6 py-3.5">Peran / Otoritas</th>
                    <th className="px-6 py-3.5">NIP / Identitas</th>
                    <th className="px-6 py-3.5">Status Akun</th>
                    <th className="px-6 py-3.5 text-right">Aksi Manajemen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-slate-400">
                        <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-xs">Tidak ada data pengguna yang sesuai.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isMe = u.id === currentUser.id;
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/60 transition">
                          {/* Nama & Username */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                                {getInitials(u.nama)}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900 text-xs">
                                    {u.nama}
                                  </span>
                                  {isMe && (
                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded-md">
                                      Saya
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 font-mono">
                                  @{u.username} &bull; {u.email}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{u.role}</span>
                            </span>
                          </td>

                          {/* NIP */}
                          <td className="px-6 py-4 font-mono text-[11px] text-slate-600">
                            {u.nip || <span className="text-slate-400 italic">Tidak ada NIP</span>}
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                u.status === "Nonaktif"
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {u.status === "Nonaktif" ? (
                                <>
                                  <XCircle className="w-3 h-3" />
                                  <span>Nonaktif</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Aktif</span>
                                </>
                              )}
                            </span>
                          </td>

                          {/* Action Buttons */}
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Change Password Button */}
                              <button
                                onClick={() => {
                                  setPasswordTargetUser(u);
                                  setNewPassword("");
                                  setConfirmNewPassword("");
                                }}
                                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition"
                                title="Ubah Kata Sandi"
                              >
                                <KeyRound className="w-4 h-4" />
                              </button>

                              {/* Edit Profile Button */}
                              <button
                                onClick={() => setEditingUser(u)}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                                title="Edit Pengguna"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              {/* Delete Button (safeguarded) */}
                              {!isMe && (
                                <button
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        `Apakah Anda yakin ingin menghapus pengguna "${u.nama}" (@${u.username})?`
                                      )
                                    ) {
                                      onDeleteUser(u.id);
                                      showToast(`Pengguna "${u.nama}" berhasil dihapus.`, "info");
                                    }
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                                  title="Hapus Pengguna"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: GANTI PASSWORD SAYA */}
      {activeSubTab === "my-password" && (
        <div className="max-w-xl bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Perbarui Kata Sandi Anda</h3>
            <p className="text-xs text-slate-500 mt-1">
              Gunakan kata sandi yang aman untuk melindungi akun BOSP Anda ({currentUser.nama}).
            </p>
          </div>

          <form onSubmit={handleSelfPasswordChange} className="space-y-4">
            {/* Old Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Kata Sandi Lama
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showSelfPass ? "text" : "password"}
                  value={selfOldPassword}
                  onChange={(e) => setSelfOldPassword(e.target.value)}
                  placeholder="Masukkan kata sandi saat ini"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  required
                />
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Kata Sandi Baru
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showSelfPass ? "text" : "password"}
                  value={selfNewPassword}
                  onChange={(e) => setSelfNewPassword(e.target.value)}
                  placeholder="Masukkan kata sandi baru"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  required
                />
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Konfirmasi Kata Sandi Baru
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showSelfPass ? "text" : "password"}
                  value={selfConfirmPassword}
                  onChange={(e) => setSelfConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi baru"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowSelfPass(!showSelfPass)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
              >
                {showSelfPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showSelfPass ? "Sembunyikan Sandi" : "Tampilkan Sandi"}</span>
              </button>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-2 cursor-pointer mt-4"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan Kata Sandi Baru</span>
            </button>
          </form>
        </div>
      )}

      {/* MODAL 1: TAMBAH USER BARU */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Tambah Pengguna Baru</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4 text-xs font-medium">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Username */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Username *</label>
                  <input
                    type="text"
                    value={addForm.username}
                    onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                    placeholder="misal: ahmad_operator"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                    required
                  />
                </div>

                {/* Peran / Role */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Peran / Otoritas *</label>
                  <select
                    value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  >
                    {roles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Nama Lengkap */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nama Lengkap & Gelar *</label>
                <input
                  type="text"
                  value={addForm.nama}
                  onChange={(e) => setAddForm({ ...addForm, nama: e.target.value })}
                  placeholder="misal: Siti Nurhaliza, S.Pd."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* NIP */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">NIP (Opsional)</label>
                  <input
                    type="text"
                    value={addForm.nip}
                    onChange={(e) => setAddForm({ ...addForm, nip: e.target.value })}
                    placeholder="1980xxxx xxxxx x xxx"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Email</label>
                  <input
                    type="email"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    placeholder="nama@kusumabangsa.sch.id"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Password & Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Kata Sandi *</label>
                  <div className="relative">
                    <input
                      type={showAddPass ? "text" : "password"}
                      value={addForm.password}
                      onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                      placeholder="Minimal 4 karakter"
                      className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowAddPass(!showAddPass)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      {showAddPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Ulangi Kata Sandi *</label>
                  <input
                    type={showAddPass ? "text" : "password"}
                    value={addForm.confirmPassword}
                    onChange={(e) =>
                      setAddForm({ ...addForm, confirmPassword: e.target.value })
                    }
                    placeholder="Ketik ulang sandi"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                    required
                  />
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Status Akun</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={addForm.status === "Aktif"}
                      onChange={() => setAddForm({ ...addForm, status: "Aktif" })}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Aktif</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={addForm.status === "Nonaktif"}
                      onChange={() => setAddForm({ ...addForm, status: "Nonaktif" })}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span>Nonaktif</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Simpan Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT DATA USER */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Edit Pengguna: @{editingUser.username}
                </h3>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateUserDetails} className="p-6 space-y-4 text-xs font-medium">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nama Lengkap & Gelar *</label>
                <input
                  type="text"
                  value={editingUser.nama}
                  onChange={(e) => setEditingUser({ ...editingUser, nama: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Peran / Otoritas *</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                >
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">NIP</label>
                <input
                  type="text"
                  value={editingUser.nip || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, nip: e.target.value })}
                  placeholder="NIP Pengguna"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Email</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Status Akun</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={editingUser.status !== "Nonaktif"}
                      onChange={() => setEditingUser({ ...editingUser, status: "Aktif" })}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Aktif</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={editingUser.status === "Nonaktif"}
                      onChange={() => setEditingUser({ ...editingUser, status: "Nonaktif" })}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span>Nonaktif</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: UBAH KATA SANDI USER TERPILIH */}
      {passwordTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Ubah Kata Sandi: {passwordTargetUser.nama}
                </h3>
              </div>
              <button
                onClick={() => setPasswordTargetUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitChangePassword} className="p-6 space-y-4 text-xs font-medium">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-amber-900 text-xs flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                <div>
                  <p className="font-bold">Reset Kredensial Akun</p>
                  <p className="text-[11px] text-amber-800">
                    Akun: @{passwordTargetUser.username} ({passwordTargetUser.role})
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Kata Sandi Baru *</label>
                <div className="relative">
                  <input
                    type={showTargetPass ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Masukkan kata sandi baru"
                    className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowTargetPass(!showTargetPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showTargetPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Ulangi Kata Sandi Baru *</label>
                <input
                  type={showTargetPass ? "text" : "password"}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Ketik ulang kata sandi baru"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  required
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPasswordTargetUser(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Perbarui Kata Sandi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
