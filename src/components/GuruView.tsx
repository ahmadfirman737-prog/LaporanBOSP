import React, { useState, useMemo } from "react";
import {
  Plus,
  Trash2,
  GraduationCap,
  CreditCard,
  Award,
  Pencil,
  X,
  Check,
  Search,
  Wallet,
  Building2,
  Users,
  Coins,
} from "lucide-react";
import { Guru } from "../types";
import { formatRupiah } from "../data/initialData";
import { saveGuruToDb, deleteGuruFromDb } from "../lib/firebase";

interface GuruViewProps {
  guruList: Guru[];
  setGuruList: React.Dispatch<React.SetStateAction<Guru[]>>;
  showToast: (message: string, type?: "success" | "info" | "warning" | "error") => void;
  searchQuery?: string;
}

export const GuruView: React.FC<GuruViewProps> = ({
  guruList,
  setGuruList,
  showToast,
  searchQuery = "",
}) => {
  // State for Add Form
  const [nama, setNama] = useState("");
  const [jabatan, setJabatan] = useState("");
  const [status, setStatus] = useState("GTT / Honorer");
  const [gajiDefault, setGajiDefault] = useState<string>("");
  const [norek, setNorek] = useState("");

  // State for Edit Modal
  const [editingGuru, setEditingGuru] = useState<Guru | null>(null);
  const [editNama, setEditNama] = useState("");
  const [editJabatan, setEditJabatan] = useState("");
  const [editStatus, setEditStatus] = useState("GTT / Honorer");
  const [editGaji, setEditGaji] = useState<string>("");
  const [editNorek, setEditNorek] = useState("");

  // Local filter & search
  const [localSearch, setLocalSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Summary statistics
  const stats = useMemo(() => {
    const totalGuru = guruList.length;
    const totalHakGaji = guruList.reduce((sum, g) => sum + (Number(g.gajiDefault) || 0), 0);
    const avgGaji = totalGuru > 0 ? Math.round(totalHakGaji / totalGuru) : 0;
    return { totalGuru, totalHakGaji, avgGaji };
  }, [guruList]);

  // Combined search and filtering
  const filteredGuruList = useMemo(() => {
    const q = (searchQuery || localSearch).trim().toLowerCase();
    return guruList.filter((g) => {
      const matchSearch =
        !q ||
        g.nama.toLowerCase().includes(q) ||
        g.jabatan.toLowerCase().includes(q) ||
        g.status.toLowerCase().includes(q) ||
        g.norek.toLowerCase().includes(q);

      const matchStatus =
        filterStatus === "all" ||
        (filterStatus === "GTT" && g.status.toLowerCase().includes("gtt")) ||
        (filterStatus === "Tendik" && g.status.toLowerCase().includes("tendik")) ||
        (filterStatus === "P3K" && g.status.toLowerCase().includes("p3k")) ||
        (filterStatus === "PNS" && (g.status.toLowerCase().includes("pns") || g.status.toLowerCase().includes("asn")));

      return matchSearch && matchStatus;
    });
  }, [guruList, searchQuery, localSearch, filterStatus]);

  // Handle Add New Guru
  const handleAddGuru = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim() || !jabatan.trim() || !gajiDefault) {
      showToast("Lengkapi nama, jabatan, dan gaji default!", "warning");
      return;
    }

    const newGuru: Guru = {
      id: Date.now(),
      nama: nama.trim(),
      jabatan: jabatan.trim(),
      status,
      gajiDefault: Number(gajiDefault),
      norek: norek.trim() || "Bank BJB - Belum Diisi",
    };

    setGuruList((prev) => [...prev, newGuru]);
    saveGuruToDb(newGuru);
    showToast(`Data Guru/Tendik "${newGuru.nama}" berhasil ditambahkan!`);

    setNama("");
    setJabatan("");
    setGajiDefault("");
    setNorek("");
  };

  // Open Edit Modal
  const handleOpenEdit = (guru: Guru) => {
    setEditingGuru(guru);
    setEditNama(guru.nama);
    setEditJabatan(guru.jabatan);
    setEditStatus(guru.status);
    setEditGaji(String(guru.gajiDefault || 0));
    setEditNorek(guru.norek || "");
  };

  // Quick adjust salary helper inside edit modal
  const handleAdjustEditGaji = (delta: number) => {
    const current = Number(editGaji) || 0;
    const nextVal = Math.max(0, current + delta);
    setEditGaji(String(nextVal));
  };

  // Handle Save Edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGuru) return;

    if (!editNama.trim() || !editJabatan.trim()) {
      showToast("Nama dan jabatan tidak boleh kosong!", "warning");
      return;
    }

    const numGaji = Number(editGaji);
    if (isNaN(numGaji) || numGaji < 0) {
      showToast("Masukkan nominal gaji yang valid!", "warning");
      return;
    }

    const updatedGuru: Guru = {
      ...editingGuru,
      nama: editNama.trim(),
      jabatan: editJabatan.trim(),
      status: editStatus,
      gajiDefault: numGaji,
      norek: editNorek.trim() || "Bank BJB - Belum Diisi",
    };

    setGuruList((prev) => prev.map((g) => (g.id === updatedGuru.id ? updatedGuru : g)));
    saveGuruToDb(updatedGuru);
    showToast(`Data "${updatedGuru.nama}" dan gaji (${formatRupiah(numGaji)}) berhasil diperbarui!`, "success");
    setEditingGuru(null);
  };

  // Handle Delete Guru
  const handleDeleteGuru = (id: number) => {
    if (guruList.length <= 1) {
      showToast("Minimal harus ada satu data guru!", "error");
      return;
    }
    const target = guruList.find((g) => g.id === id);
    if (confirm(`Yakin ingin menghapus data ${target ? `"${target.nama}"` : "Guru/Tendik ini"}?`)) {
      setGuruList((prev) => prev.filter((g) => g.id !== id));
      deleteGuruFromDb(id);
      showToast("Data Guru/Tendik berhasil dihapus", "info");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Master Data Guru & Tendik</h2>
          <p className="text-xs text-slate-500 font-medium">
            Kelola daftar penerima honor BOSP, perbarui besaran hak gaji bulanan, serta nomor rekening pencairan
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Personel
            </span>
            <p className="text-xl font-black text-slate-900">{stats.totalGuru} Orang</p>
            <p className="text-[11px] text-slate-500 font-medium">Guru & Tenaga Kependidikan</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Hak Gaji / Bulan
            </span>
            <p className="text-xl font-black text-emerald-700">{formatRupiah(stats.totalHakGaji)}</p>
            <p className="text-[11px] text-slate-500 font-medium">Standar alokasi honor bulanan</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Rata-Rata Gaji
            </span>
            <p className="text-xl font-black text-slate-900">{formatRupiah(stats.avgGaji)}</p>
            <p className="text-[11px] text-slate-500 font-medium">Per personel per bulan</p>
          </div>
        </div>
      </div>

      {/* Form Tambah Guru */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80">
        <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-indigo-600" />
          <span>Tambah Data Guru / Tenaga Kependidikan Baru</span>
        </h3>

        <form onSubmit={handleAddGuru} className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs font-medium">
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">Nama Lengkap & Gelar</label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Siti Aisyah, S.Pd."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-900"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1.5">Jabatan / Tugas Mengajar</label>
            <input
              type="text"
              value={jabatan}
              onChange={(e) => setJabatan(e.target.value)}
              placeholder="Contoh: Guru PJOK / Penjaskes"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 text-slate-900"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1.5">Status Kepegawaian</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
            >
              <option value="GTT / Honorer">GTT / Guru Honorer</option>
              <option value="Tenaga Kependidikan">Tenaga Kependidikan (Tendik)</option>
              <option value="Guru P3K">Guru Pegawai P3K</option>
              <option value="PNS / ASN">Guru PNS / ASN</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1.5">
              Standar Gaji Bulanan (Hak Gaji)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                Rp
              </span>
              <input
                type="number"
                value={gajiDefault}
                onChange={(e) => setGajiDefault(e.target.value)}
                placeholder="2500000"
                className="w-full pl-11 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-extrabold text-slate-900"
                required
              />
            </div>
            {gajiDefault && !isNaN(Number(gajiDefault)) && Number(gajiDefault) > 0 && (
              <span className="text-[11px] text-emerald-700 font-bold mt-1 block">
                {formatRupiah(Number(gajiDefault))}
              </span>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-slate-700 font-bold mb-1.5">
              Nomor Rekening & Nama Bank
            </label>
            <input
              type="text"
              value={norek}
              onChange={(e) => setNorek(e.target.value)}
              placeholder="Contoh: Bank BJB - 0012345678901"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900"
            />
          </div>

          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs shadow-md shadow-indigo-600/20 transition flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Simpan Guru / Tendik Baru</span>
            </button>
          </div>
        </form>
      </div>

      {/* List Guru & Tendik */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200/80 overflow-hidden">
        {/* Header List & Filters */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Daftar Guru & Tenaga Kependidikan</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Klik tombol <span className="font-bold text-indigo-600">Edit</span> atau klik nominal gaji untuk mengubah besaran gaji
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Cari guru / tendik..."
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 w-48 sm:w-56"
              />
              {localSearch && (
                <button
                  onClick={() => setLocalSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setFilterStatus("all")}
                className={`px-2.5 py-1 rounded-lg font-bold transition text-[11px] ${
                  filterStatus === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Semua ({guruList.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus("GTT")}
                className={`px-2.5 py-1 rounded-lg font-bold transition text-[11px] ${
                  filterStatus === "GTT" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Honorer
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus("Tendik")}
                className={`px-2.5 py-1 rounded-lg font-bold transition text-[11px] ${
                  filterStatus === "Tendik" ? "bg-white text-emerald-700 shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Tendik
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus("PNS")}
                className={`px-2.5 py-1 rounded-lg font-bold transition text-[11px] ${
                  filterStatus === "PNS" ? "bg-white text-amber-700 shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                PNS/P3K
              </button>
            </div>
          </div>
        </div>

        {/* List Items */}
        <div className="divide-y divide-slate-100">
          {filteredGuruList.length === 0 ? (
            <div className="p-10 text-center text-slate-400">
              <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-semibold">Tidak ada data guru/tendik yang sesuai dengan pencarian atau filter.</p>
            </div>
          ) : (
            filteredGuruList.map((g) => (
              <div
                key={g.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition"
              >
                {/* Profile info */}
                <div className="flex items-center space-x-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm shrink-0">
                    {g.nama.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{g.nama}</h4>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        {g.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5 flex flex-wrap items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-indigo-500" />
                        {g.jabatan}
                      </span>
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                        {g.norek}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Salary & Action Buttons */}
                <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {/* Clickable Salary Card */}
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(g)}
                    title="Klik untuk mengubah jumlah gaji"
                    className="text-right p-2 rounded-2xl hover:bg-indigo-50/60 border border-transparent hover:border-indigo-200 transition group cursor-pointer"
                  >
                    <span className="text-[10px] font-bold uppercase text-slate-400 group-hover:text-indigo-600 transition block flex items-center justify-end gap-1">
                      <span>Hak Gaji Bulanan</span>
                      <Pencil className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition" />
                    </span>
                    <span className="font-extrabold text-slate-900 group-hover:text-indigo-700 transition text-sm">
                      {formatRupiah(g.gajiDefault)}
                    </span>
                  </button>

                  {/* Actions: Edit and Delete */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(g)}
                      className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold text-xs transition flex items-center gap-1.5 border border-indigo-200/70 shadow-2xs"
                      title="Edit Data & Gaji Guru"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteGuru(g.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition border border-transparent hover:border-rose-200"
                      title="Hapus Data Guru"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Dialog: Edit Data & Gaji Guru / Tendik */}
      {editingGuru && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Edit Data & Jumlah Gaji Guru/Tendik
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Perbarui profil dan standar hak gaji bulanan untuk {editingGuru.nama}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingGuru(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  Nama Lengkap & Gelar
                </label>
                <input
                  type="text"
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                  placeholder="Contoh: Siti Aisyah, S.Pd."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-900 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    Jabatan / Tugas Mengajar
                  </label>
                  <input
                    type="text"
                    value={editJabatan}
                    onChange={(e) => setEditJabatan(e.target.value)}
                    placeholder="Contoh: Guru PJOK"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 text-slate-900 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    Status Kepegawaian
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 focus:outline-none"
                  >
                    <option value="GTT / Honorer">GTT / Guru Honorer</option>
                    <option value="Tenaga Kependidikan">Tenaga Kependidikan (Tendik)</option>
                    <option value="Guru P3K">Guru Pegawai P3K</option>
                    <option value="PNS / ASN">Guru PNS / ASN</option>
                  </select>
                </div>
              </div>

              {/* HIGHLIGHTED: Input Jumlah Gaji */}
              <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-indigo-950 font-extrabold text-xs">
                    Standar Hak Gaji Bulanan (Rp)
                  </label>
                  <span className="text-[11px] font-black text-indigo-700 bg-white px-2.5 py-0.5 rounded-lg border border-indigo-100 shadow-2xs">
                    {formatRupiah(Number(editGaji) || 0)}
                  </span>
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={editGaji}
                    onChange={(e) => setEditGaji(e.target.value)}
                    placeholder="2500000"
                    step="50000"
                    min="0"
                    className="w-full pl-11 pr-3.5 py-2.5 bg-white border border-indigo-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-black text-slate-900 text-base focus:outline-none"
                    required
                  />
                </div>

                {/* Quick adjustments */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 font-bold mr-1">Sesuaikan Cepat:</span>
                  <button
                    type="button"
                    onClick={() => handleAdjustEditGaji(-100000)}
                    className="px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition"
                  >
                    -100rb
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustEditGaji(100000)}
                    className="px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-indigo-700 transition"
                  >
                    +100rb
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustEditGaji(250000)}
                    className="px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-indigo-700 transition"
                  >
                    +250rb
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustEditGaji(500000)}
                    className="px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-indigo-700 transition"
                  >
                    +500rb
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditGaji("2500000")}
                    className="px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-emerald-700 transition ml-auto"
                  >
                    Standar 2,5 Jt
                  </button>
                </div>

                <p className="text-[10px] text-slate-500 leading-relaxed">
                  💡 Nominal ini menjadi hak gaji standar bulanan yang otomatis ditarik saat membuat transaksi honor baru di menu Honor Guru.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  Nomor Rekening & Nama Bank
                </label>
                <input
                  type="text"
                  value={editNorek}
                  onChange={(e) => setEditNorek(e.target.value)}
                  placeholder="Contoh: Bank BJB - 0012345678901"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900 focus:outline-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingGuru(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Perubahan Gaji</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
