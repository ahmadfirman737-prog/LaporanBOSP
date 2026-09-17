import React, { useState, useMemo } from "react";
import {
  Plus,
  Lock,
  Unlock,
  Trash2,
  ArrowDownLeft,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Check,
  Calendar,
  Edit3,
  X,
} from "lucide-react";
import { HonorEntry, Guru } from "../types";
import { formatRupiah } from "../data/initialData";
import { saveHonorToDb, deleteHonorFromDb } from "../lib/firebase";

interface HonorViewProps {
  honorList: HonorEntry[];
  setHonorList: React.Dispatch<React.SetStateAction<HonorEntry[]>>;
  guruList: Guru[];
  showToast: (message: string, type?: "success" | "info" | "warning" | "error") => void;
  searchQuery: string;
}

export const HonorView: React.FC<HonorViewProps> = ({
  honorList,
  setHonorList,
  guruList,
  showToast,
  searchQuery,
}) => {
  const [selectedGuru, setSelectedGuru] = useState<number | string>(guruList[0]?.id || "");
  const [bulan, setBulan] = useState("Januari 2026");
  const [gaji, setGaji] = useState<number>(guruList[0]?.gajiDefault || 2500000);
  const [isLocked, setIsLocked] = useState(true);
  const [jumlahSI, setJumlahSI] = useState<number>(2500000);
  const [keterangan, setKeterangan] = useState("Pencairan Honor");
  const [statusPengembalian, setStatusPengembalian] = useState<"belum" | "sudah">("belum");
  const [jumlahDikembalikanInput, setJumlahDikembalikanInput] = useState<number>(0);
  const [tanggalPengembalian, setTanggalPengembalian] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<"all" | "belum" | "sudah" | "nihil">("all");

  // Modal for editing jumlah yang dikembalikan
  const [editingEntry, setEditingEntry] = useState<HonorEntry | null>(null);
  const [editJumlah, setEditJumlah] = useState<number>(0);
  const [editTanggal, setEditTanggal] = useState<string>("");

  // Sync Gaji default when teacher is changed
  const handleGuruSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const gId = Number(e.target.value);
    setSelectedGuru(gId);
    const g = guruList.find((x) => x.id === gId);
    if (g) {
      setGaji(g.gajiDefault);
      setJumlahSI(g.gajiDefault);
      setJumlahDikembalikanInput(0);
      setStatusPengembalian("belum");
    }
  };

  const calculatedKembali = useMemo(() => {
    const val = Number(jumlahSI) - Number(gaji);
    return val > 0 ? val : 0;
  }, [jumlahSI, gaji]);

  const handleAddHonor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuru) {
      showToast("Pilih guru/tendik terlebih dahulu", "warning");
      return;
    }

    const valDikembalikan =
      calculatedKembali > 0
        ? Math.max(0, Number(jumlahDikembalikanInput))
        : 0;

    const finalStatus =
      calculatedKembali > 0
        ? valDikembalikan >= calculatedKembali
          ? "sudah"
          : "belum"
        : "sudah";

    const newEntry: HonorEntry = {
      id: Date.now(),
      idGuru: Number(selectedGuru),
      bulan,
      gaji: Number(gaji),
      isGajiLocked: isLocked,
      jumlahSI: Number(jumlahSI),
      keterangan,
      statusPengembalian: finalStatus,
      tanggalPengembalian:
        valDikembalikan > 0
          ? tanggalPengembalian || new Date().toISOString().split("T")[0]
          : undefined,
      jumlahDikembalikan: valDikembalikan,
    };

    setHonorList((prev) => [newEntry, ...prev]);
    saveHonorToDb(newEntry);
    showToast("Data Honor Guru berhasil disimpan!");

    // Reset status fields
    setStatusPengembalian("belum");
    setJumlahDikembalikanInput(0);
    setTanggalPengembalian("");
  };

  const toggleLockInList = (id: number) => {
    setHonorList((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newLock = !item.isGajiLocked;
          const updated = { ...item, isGajiLocked: newLock };
          saveHonorToDb(updated);
          showToast(`Status gaji ${newLock ? "dikunci 🔒" : "dibuka 🔓"}`, "info");
          return updated;
        }
        return item;
      })
    );
  };

  // Quick action: Setor Penuh / Setor Lunas
  const handleSetorPenuh = (item: HonorEntry) => {
    const kembali = Math.max(0, Number(item.jumlahSI) - Number(item.gaji));
    const guru = guruList.find((g) => g.id === Number(item.idGuru));
    const today = new Date().toISOString().split("T")[0];

    const updated: HonorEntry = {
      ...item,
      statusPengembalian: "sudah",
      jumlahDikembalikan: kembali,
      tanggalPengembalian: item.tanggalPengembalian || today,
    };

    setHonorList((prev) => prev.map((h) => (h.id === item.id ? updated : h)));
    saveHonorToDb(updated);
    showToast(
      `Pengembalian honor ${guru ? guru.nama : ""} ditandai LUNAS (${formatRupiah(kembali)})`,
      "success"
    );
  };

  // Open Edit Modal for a specific row
  const openEditModal = (item: HonorEntry) => {
    const kembali = Math.max(0, Number(item.jumlahSI) - Number(item.gaji));
    const existingDikembalikan =
      item.jumlahDikembalikan !== undefined
        ? Number(item.jumlahDikembalikan)
        : item.statusPengembalian === "sudah"
        ? kembali
        : 0;

    setEditingEntry(item);
    setEditJumlah(existingDikembalikan);
    setEditTanggal(
      item.tanggalPengembalian || new Date().toISOString().split("T")[0]
    );
  };

  // Save changes from Edit Modal
  const handleSaveEditModal = () => {
    if (!editingEntry) return;
    const kembali = Math.max(0, Number(editingEntry.jumlahSI) - Number(editingEntry.gaji));
    const safeJumlah = Math.max(0, Number(editJumlah));
    const guru = guruList.find((g) => g.id === Number(editingEntry.idGuru));

    const updated: HonorEntry = {
      ...editingEntry,
      jumlahDikembalikan: safeJumlah,
      statusPengembalian: safeJumlah >= kembali && kembali > 0 ? "sudah" : safeJumlah === 0 ? "belum" : "belum",
      tanggalPengembalian: safeJumlah > 0 ? editTanggal : undefined,
    };

    setHonorList((prev) => prev.map((h) => (h.id === editingEntry.id ? updated : h)));
    saveHonorToDb(updated);
    showToast(
      `Jumlah yang dikembalikan untuk ${guru ? guru.nama : ""} diperbarui: ${formatRupiah(safeJumlah)}`,
      "success"
    );
    setEditingEntry(null);
  };

  const handleDelete = (id: number) => {
    setHonorList((prev) => prev.filter((item) => item.id !== id));
    deleteHonorFromDb(id);
    showToast("Data honor berhasil dihapus", "info");
  };

  // KPI Calculations
  const stats = useMemo(() => {
    let totalSI = 0;
    let totalGaji = 0;
    let totalHarusKembali = 0;
    let totalSudahDikembalikan = 0;
    let totalSisaBelumKembali = 0;
    let countLunas = 0;
    let countBelum = 0;
    let countNihil = 0;

    honorList.forEach((h) => {
      const kembali = Math.max(0, Number(h.jumlahSI) - Number(h.gaji));
      totalSI += Number(h.jumlahSI) || 0;
      totalGaji += Number(h.gaji) || 0;
      totalHarusKembali += kembali;

      const dikembalikan =
        h.jumlahDikembalikan !== undefined
          ? Number(h.jumlahDikembalikan)
          : h.statusPengembalian === "sudah"
          ? kembali
          : 0;

      totalSudahDikembalikan += dikembalikan;
      const sisa = Math.max(0, kembali - dikembalikan);
      totalSisaBelumKembali += sisa;

      if (kembali === 0) {
        countNihil++;
      } else if (sisa === 0 && dikembalikan > 0) {
        countLunas++;
      } else {
        countBelum++;
      }
    });

    return {
      totalSI,
      totalGaji,
      totalHarusKembali,
      totalSudahDikembalikan,
      totalSisaBelumKembali,
      countLunas,
      countBelum,
      countNihil,
    };
  }, [honorList]);

  // Search & Tab Filter
  const filteredList = useMemo(() => {
    return honorList.filter((item) => {
      const g = guruList.find((x) => x.id === Number(item.idGuru));
      const q = searchQuery.toLowerCase().trim();
      const searchMatch =
        !q ||
        (g?.nama.toLowerCase().includes(q) ?? false) ||
        item.bulan.toLowerCase().includes(q) ||
        (item.keterangan && item.keterangan.toLowerCase().includes(q));

      if (!searchMatch) return false;

      const kembali = Math.max(0, Number(item.jumlahSI) - Number(item.gaji));
      const dikembalikan =
        item.jumlahDikembalikan !== undefined
          ? Number(item.jumlahDikembalikan)
          : item.statusPengembalian === "sudah"
          ? kembali
          : 0;
      const sisa = Math.max(0, kembali - dikembalikan);

      if (filterStatus === "belum") {
        return kembali > 0 && sisa > 0;
      }
      if (filterStatus === "sudah") {
        return kembali > 0 && sisa === 0 && dikembalikan > 0;
      }
      if (filterStatus === "nihil") {
        return kembali === 0;
      }
      return true;
    });
  }, [honorList, guruList, searchQuery, filterStatus]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Menu Transaksi Honor Guru & Tendik</h2>
          <p className="text-xs text-slate-500 font-medium">
            Kelola pencairan SI bank, hak riil gaji, jumlah dana yang dikembalikan, dan sisa yang belum disetor ke kas sekolah
          </p>
        </div>
      </div>

      {/* KPI Cards: Tracking Jumlah Yang Dikembalikan vs Sisa Belum Dikembalikan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
            <span>Total Pencairan SI Bank</span>
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-black text-indigo-600">{formatRupiah(stats.totalSI)}</div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">
            Hak Gaji Riil: <span className="font-semibold text-slate-700">{formatRupiah(stats.totalGaji)}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
            <span>Total Harus Dikembalikan</span>
            <span className="p-1.5 bg-slate-100 text-slate-600 rounded-xl">
              <ArrowDownLeft className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-black text-slate-800">{formatRupiah(stats.totalHarusKembali)}</div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">
            Total selisih SI di atas hak gaji
          </div>
        </div>

        <div className="bg-emerald-50/70 p-5 rounded-3xl border border-emerald-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-emerald-900 font-bold mb-1">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Jumlah Yang Dikembalikan</span>
            </span>
            <span className="px-2 py-0.5 bg-emerald-200/70 text-emerald-900 text-[10px] font-black rounded-full">
              {stats.countLunas} Lunas
            </span>
          </div>
          <div className="text-xl font-black text-emerald-700">
            {formatRupiah(stats.totalSudahDikembalikan)}
          </div>
          <div className="text-[11px] text-emerald-800/80 mt-1 font-medium">
            Telah nyata disetor kembali ke kas sekolah
          </div>
        </div>

        <div className="bg-amber-50/70 p-5 rounded-3xl border border-amber-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-amber-900 font-bold mb-1">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Sisa Belum Dikembalikan</span>
            </span>
            <span className="px-2 py-0.5 bg-amber-200/70 text-amber-900 text-[10px] font-black rounded-full">
              {stats.countBelum} Belum Lunas
            </span>
          </div>
          <div className="text-xl font-black text-amber-700">
            {formatRupiah(stats.totalSisaBelumKembali)}
          </div>
          <div className="text-[11px] text-amber-800/80 mt-1 font-medium">
            Wajib segera disetor ke rekening kas sekolah
          </div>
        </div>
      </div>

      {/* Form Input */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80">
        <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-indigo-600" />
          <span>Tambah Transaksi Honor</span>
        </h3>

        <form
          onSubmit={handleAddHonor}
          className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs font-medium"
        >
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">Nama Guru / Tendik</label>
            <select
              value={selectedGuru}
              onChange={handleGuruSelect}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800"
            >
              {guruList.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nama} — ({g.jabatan})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1.5">
              Bulan / Periode Pencairan
            </label>
            <input
              type="text"
              value={bulan}
              onChange={(e) => setBulan(e.target.value)}
              placeholder="Contoh: Januari 2026"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-medium"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-700 font-bold">Jumlah Gaji (Hak)</label>
              <button
                type="button"
                onClick={() => setIsLocked(!isLocked)}
                className={`px-2.5 py-0.5 rounded-lg font-bold text-[10px] transition flex items-center gap-1 ${
                  isLocked
                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {isLocked ? (
                  <>
                    <Lock className="w-3 h-3" /> Dikunci
                  </>
                ) : (
                  <>
                    <Unlock className="w-3 h-3" /> Terbuka
                  </>
                )}
              </button>
            </div>
            <input
              type="number"
              value={gaji}
              disabled={isLocked}
              onChange={(e) => setGaji(Number(e.target.value))}
              className={`w-full px-3.5 py-2.5 rounded-2xl font-bold ${
                isLocked
                  ? "bg-slate-100 border border-slate-200 text-slate-500 cursor-not-allowed"
                  : "bg-slate-50 border border-slate-300 text-slate-900 focus:ring-2 focus:ring-indigo-500"
              }`}
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1.5">
              Jumlah Yang di-SI-kan (Bank)
            </label>
            <input
              type="number"
              value={jumlahSI}
              onChange={(e) => setJumlahSI(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-extrabold text-indigo-600"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1.5">Jumlah Harus Dikembalikan</label>
            <div className="w-full px-3.5 py-2.5 bg-amber-50 border border-amber-200 rounded-2xl font-extrabold text-amber-800 flex items-center justify-between">
              <span>{formatRupiah(calculatedKembali)}</span>
              <ArrowDownLeft className="w-4 h-4 text-amber-600" />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1.5">Keterangan / Catatan</label>
            <input
              type="text"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Contoh: Transfer Bank BJB"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          {/* Bagian Jumlah Yang Dikembalikan (Shown if calculatedKembali > 0) */}
          {calculatedKembali > 0 && (
            <div className="md:col-span-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                <div>
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Rincian Pengembalian Dana Selisih SI</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Total selisih wajib dikembalikan: <strong className="text-amber-800">{formatRupiah(calculatedKembali)}</strong>
                  </p>
                </div>

                {/* Quick Fill Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setJumlahDikembalikanInput(calculatedKembali);
                      setStatusPengembalian("sudah");
                      if (!tanggalPengembalian) {
                        setTanggalPengembalian(new Date().toISOString().split("T")[0]);
                      }
                    }}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold shadow-sm transition"
                  >
                    Setor Penuh ({formatRupiah(calculatedKembali)})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setJumlahDikembalikanInput(0);
                      setStatusPengembalian("belum");
                    }}
                    className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-[11px] font-bold transition"
                  >
                    Belum Setor (Rp 0)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Jumlah Yang Dikembalikan (Rp)
                  </label>
                  <input
                    type="number"
                    value={jumlahDikembalikanInput}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setJumlahDikembalikanInput(val);
                      if (val >= calculatedKembali && calculatedKembali > 0) {
                        setStatusPengembalian("sudah");
                      } else {
                        setStatusPengembalian("belum");
                      }
                    }}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-black text-emerald-700 text-xs focus:ring-2 focus:ring-emerald-500"
                    placeholder="0"
                  />
                  <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
                    {formatRupiah(jumlahDikembalikanInput || 0)}
                  </span>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Tanggal Pengembalian / Setor
                  </label>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <input
                      type="date"
                      value={tanggalPengembalian}
                      onChange={(e) => setTanggalPengembalian(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Sisa Yang Belum Dikembalikan
                  </label>
                  <div className={`px-3.5 py-2 rounded-xl font-black text-xs flex items-center justify-between border ${
                    Math.max(0, calculatedKembali - jumlahDikembalikanInput) > 0
                      ? "bg-amber-50 border-amber-200 text-amber-800"
                      : "bg-emerald-50 border-emerald-200 text-emerald-800"
                  }`}>
                    <span>{formatRupiah(Math.max(0, calculatedKembali - jumlahDikembalikanInput))}</span>
                    {Math.max(0, calculatedKembali - jumlahDikembalikanInput) === 0 ? (
                      <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded-md">Lunas</span>
                    ) : (
                      <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded-md">Kurang</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs shadow-md shadow-indigo-600/20 transition flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Simpan Transaksi Honor</span>
            </button>
          </div>
        </form>
      </div>

      {/* Table View with Filter Tabs */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Daftar Transaksi Honor Guru & Tendik</h3>
            <span className="text-xs font-semibold text-slate-400">
              Menampilkan {filteredList.length} dari {honorList.length} entri
            </span>
          </div>

          {/* Quick Filter Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                filterStatus === "all"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Semua ({honorList.length})
            </button>
            <button
              onClick={() => setFilterStatus("belum")}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 ${
                filterStatus === "belum"
                  ? "bg-amber-500 text-white shadow-sm"
                  : "text-amber-700 hover:bg-amber-50"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Belum Lunas ({stats.countBelum})</span>
            </button>
            <button
              onClick={() => setFilterStatus("sudah")}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 ${
                filterStatus === "sudah"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Sudah Lunas ({stats.countLunas})</span>
            </button>
            <button
              onClick={() => setFilterStatus("nihil")}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                filterStatus === "nihil"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Sesuai / Nihil ({stats.countNihil})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="p-4">Nama Guru / Tendik</th>
                <th className="p-4">Bulan</th>
                <th className="p-4 text-right">Hak Gaji</th>
                <th className="p-4 text-right">Jumlah SI</th>
                <th className="p-4 text-right">Harus Kembali</th>
                <th className="p-4 text-right">Jumlah Yang Dikembalikan</th>
                <th className="p-4 text-right">Sisa Belum Setor</th>
                <th className="p-4 text-center">Status & Aksi Setor</th>
                <th className="p-4 text-center">Status Gaji</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    Tidak ada transaksi honor yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  const guru = guruList.find((g) => g.id === Number(item.idGuru));
                  const kembali = Math.max(0, Number(item.jumlahSI) - Number(item.gaji));
                  const dikembalikan =
                    item.jumlahDikembalikan !== undefined
                      ? Number(item.jumlahDikembalikan)
                      : item.statusPengembalian === "sudah"
                      ? kembali
                      : 0;
                  const sisa = Math.max(0, kembali - dikembalikan);
                  const isLunas = kembali > 0 && sisa === 0 && dikembalikan > 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">
                          {guru ? guru.nama : "Guru Terhapus"}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          {guru ? guru.jabatan : "-"}
                        </div>
                      </td>
                      <td className="p-4 text-slate-600 font-semibold">{item.bulan}</td>
                      <td className="p-4 text-right font-bold text-slate-900">{formatRupiah(item.gaji)}</td>
                      <td className="p-4 text-right font-extrabold text-indigo-600">
                        {formatRupiah(item.jumlahSI)}
                      </td>
                      <td className="p-4 text-right">
                        <span
                          className={`px-2.5 py-1 rounded-xl font-bold text-xs ${
                            kembali > 0
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {formatRupiah(kembali)}
                        </span>
                      </td>

                      {/* Jumlah Yang Dikembalikan (Rp) */}
                      <td className="p-4 text-right">
                        {kembali === 0 ? (
                          <span className="text-slate-400 font-mono text-[11px]">-</span>
                        ) : (
                          <div>
                            <span className="font-black text-emerald-700 text-xs">
                              {formatRupiah(dikembalikan)}
                            </span>
                            {item.tanggalPengembalian && dikembalikan > 0 && (
                              <div className="text-[10px] text-slate-400 font-mono">
                                Setor: {item.tanggalPengembalian}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Sisa Belum Setor (Rp) */}
                      <td className="p-4 text-right">
                        {kembali === 0 ? (
                          <span className="text-slate-400 font-mono text-[11px]">-</span>
                        ) : sisa === 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            ✓ Lunas
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-200">
                            {formatRupiah(sisa)}
                          </span>
                        )}
                      </td>

                      {/* Status & Aksi Setor */}
                      <td className="p-4 text-center">
                        {kembali === 0 ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-xl font-semibold text-[10px] bg-slate-100 text-slate-500 border border-slate-200">
                            Sesuai (Rp 0)
                          </span>
                        ) : (
                          <div className="inline-flex items-center gap-1.5">
                            {!isLunas && (
                              <button
                                type="button"
                                onClick={() => handleSetorPenuh(item)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[10px] transition inline-flex items-center gap-1 shadow-sm"
                                title="Klik untuk langsung tandai lunas setor penuh"
                              >
                                <Check className="w-3 h-3" />
                                <span>Setor Penuh</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl font-bold text-[10px] transition inline-flex items-center gap-1"
                              title="Ubah nominal jumlah yang dikembalikan"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>{isLunas ? "Ubah Setoran" : "Input Cicil"}</span>
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="p-4 text-center">
                        <button
                          onClick={() => toggleLockInList(item.id)}
                          className={`px-3 py-1 rounded-xl font-bold text-[11px] transition inline-flex items-center gap-1 ${
                            item.isGajiLocked
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {item.isGajiLocked ? (
                            <>
                              <Lock className="w-3 h-3" /> Dikunci
                            </>
                          ) : (
                            <>
                              <Unlock className="w-3 h-3" /> Terbuka
                            </>
                          )}
                        </button>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                          title="Hapus Data"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dialog: Edit / Update Jumlah Yang Dikembalikan */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Update Jumlah Yang Dikembalikan
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  {guruList.find((g) => g.id === Number(editingEntry.idGuru))?.nama} • {editingEntry.bulan}
                </p>
              </div>
              <button
                onClick={() => setEditingEntry(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Financial comparison */}
            {(() => {
              const kembali = Math.max(0, Number(editingEntry.jumlahSI) - Number(editingEntry.gaji));
              const safeEdit = Math.max(0, Number(editJumlah));
              const sisa = Math.max(0, kembali - safeEdit);
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/70 text-xs">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">Pencairan SI</span>
                      <p className="font-bold text-indigo-700">{formatRupiah(editingEntry.jumlahSI)}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">Hak Gaji Riil</span>
                      <p className="font-bold text-slate-800">{formatRupiah(editingEntry.gaji)}</p>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                      <span className="font-bold text-slate-700 text-xs">Total Wajib Dikembalikan:</span>
                      <span className="font-black text-amber-800 text-xs">{formatRupiah(kembali)}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold text-xs mb-1.5">
                      Jumlah Uang Yang Nyata Dikembalikan (Rp)
                    </label>
                    <input
                      type="number"
                      value={editJumlah}
                      onChange={(e) => setEditJumlah(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-2xl font-black text-emerald-700 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      placeholder="0"
                    />
                    <div className="flex items-center justify-between mt-1 text-[11px]">
                      <span className="text-slate-400">{formatRupiah(editJumlah || 0)}</span>
                      <button
                        type="button"
                        onClick={() => setEditJumlah(kembali)}
                        className="text-emerald-700 hover:text-emerald-900 font-bold underline"
                      >
                        Setor Penuh ({formatRupiah(kembali)})
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold text-xs mb-1.5">
                      Tanggal Setor / Pengembalian
                    </label>
                    <input
                      type="date"
                      value={editTanggal}
                      onChange={(e) => setEditTanggal(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-2xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
                    sisa > 0
                      ? "bg-amber-50 border-amber-200 text-amber-900"
                      : "bg-emerald-50 border-emerald-200 text-emerald-900"
                  }`}>
                    <div>
                      <span className="font-bold block">Sisa Belum Dikembalikan</span>
                      <span className="text-[10px] text-slate-500">
                        {sisa > 0 ? "Harus tetap disetorkan ke kas sekolah" : "Sudah lunas tanpa selisih"}
                      </span>
                    </div>
                    <span className="font-black text-sm">{formatRupiah(sisa)}</span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingEntry(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs transition"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEditModal}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs shadow-md transition flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Simpan Perubahan</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
