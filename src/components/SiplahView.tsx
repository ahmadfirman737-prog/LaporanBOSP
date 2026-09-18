import React, { useState, useMemo } from "react";
import {
  Plus,
  Trash2,
  ArrowRightLeft,
  ShoppingBag,
  Wallet,
  ArrowDownLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Check,
  Calendar,
  Edit3,
  X,
} from "lucide-react";
import { SiplahEntry } from "../types";
import { formatRupiah } from "../data/initialData";
import { saveSiplahToDb, deleteSiplahFromDb } from "../lib/firebase";

interface SiplahViewProps {
  siplahList: SiplahEntry[];
  setSiplahList: React.Dispatch<React.SetStateAction<SiplahEntry[]>>;
  showToast: (message: string, type?: "success" | "info" | "warning" | "error") => void;
  searchQuery: string;
}

export const SiplahView: React.FC<SiplahViewProps> = ({
  siplahList,
  setSiplahList,
  showToast,
  searchQuery,
}) => {
  const [toko, setToko] = useState("");
  const [keperluan, setKeperluan] = useState("");
  const [tanggal, setTanggal] = useState("2026-02-15");
  const [jumlahSIPLah, setJumlahSIPLah] = useState<string>("");
  const [jumlahSI, setJumlahSI] = useState<string>("");
  const [noSpk, setNoSpk] = useState("");

  // Return tracking states in form
  const [statusPengembalian, setStatusPengembalian] = useState<"belum" | "sudah">("belum");
  const [jumlahDikembalikanInput, setJumlahDikembalikanInput] = useState<number>(0);
  const [tanggalPengembalian, setTanggalPengembalian] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<"all" | "belum" | "sudah" | "nihil">("all");

  // Modal for editing return details of a row
  const [editingEntry, setEditingEntry] = useState<SiplahEntry | null>(null);
  const [editJumlah, setEditJumlah] = useState<number>(0);
  const [editTanggal, setEditTanggal] = useState<string>("");

  const calculatedKembali = useMemo(() => {
    const val = Number(jumlahSI) - Number(jumlahSIPLah);
    return val > 0 ? val : 0;
  }, [jumlahSI, jumlahSIPLah]);

  const handleAddSiplah = (e: React.FormEvent) => {
    e.preventDefault();
    if (!toko.trim() || !jumlahSIPLah || !jumlahSI) {
      showToast("Isi semua field belanja SIPLah!", "warning");
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

    const newEntry: SiplahEntry = {
      id: Date.now(),
      tanggal,
      toko: toko.trim(),
      keperluan: keperluan.trim() || "Belanja Kebutuhan Operasional Sekolah",
      jumlahSIPLah: Number(jumlahSIPLah),
      jumlahSI: Number(jumlahSI),
      noSpk: noSpk.trim() || "SPK/BOSP/2026",
      statusPengembalian: finalStatus,
      tanggalPengembalian:
        valDikembalikan > 0
          ? tanggalPengembalian || new Date().toISOString().split("T")[0]
          : undefined,
      jumlahDikembalikan: valDikembalikan,
    };

    setSiplahList((prev) => [newEntry, ...prev]);
    saveSiplahToDb(newEntry);
    showToast("Transaksi Belanja SIPLah berhasil disimpan!");

    // Reset fields
    setToko("");
    setKeperluan("");
    setJumlahSIPLah("");
    setJumlahSI("");
    setNoSpk("");
    setStatusPengembalian("belum");
    setJumlahDikembalikanInput(0);
    setTanggalPengembalian("");
  };

  // Quick action: Setor Penuh / Lunas Masuk Kas
  const handleSetorPenuh = (item: SiplahEntry) => {
    const kembali = Math.max(0, Number(item.jumlahSI) - Number(item.jumlahSIPLah));
    const today = new Date().toISOString().split("T")[0];

    const updated: SiplahEntry = {
      ...item,
      statusPengembalian: "sudah",
      jumlahDikembalikan: kembali,
      tanggalPengembalian: item.tanggalPengembalian || today,
    };

    setSiplahList((prev) => prev.map((s) => (s.id === item.id ? updated : s)));
    saveSiplahToDb(updated);
    showToast(
      `Pengembalian belanja ${item.toko} ditandai LUNAS (${formatRupiah(kembali)})`,
      "success"
    );
  };

  // Open Edit Modal for a specific row
  const openEditModal = (item: SiplahEntry) => {
    const kembali = Math.max(0, Number(item.jumlahSI) - Number(item.jumlahSIPLah));
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
    const kembali = Math.max(0, Number(editingEntry.jumlahSI) - Number(editingEntry.jumlahSIPLah));
    const safeJumlah = Math.max(0, Number(editJumlah));

    const updated: SiplahEntry = {
      ...editingEntry,
      jumlahDikembalikan: safeJumlah,
      statusPengembalian: safeJumlah >= kembali && kembali > 0 ? "sudah" : "belum",
      tanggalPengembalian: safeJumlah > 0 ? editTanggal : undefined,
    };

    setSiplahList((prev) => prev.map((s) => (s.id === editingEntry.id ? updated : s)));
    saveSiplahToDb(updated);
    showToast(
      `Jumlah & tanggal pengembalian untuk ${editingEntry.toko} diperbarui: ${formatRupiah(safeJumlah)}`,
      "success"
    );
    setEditingEntry(null);
  };

  const handleDelete = (id: number) => {
    setSiplahList((prev) => prev.filter((item) => item.id !== id));
    deleteSiplahFromDb(id);
    showToast("Transaksi SIPLah berhasil dihapus", "info");
  };

  // KPI Calculations
  const stats = useMemo(() => {
    let totalSIPLah = 0;
    let totalSI = 0;
    let totalHarusKembali = 0;
    let totalSudahDikembalikan = 0;
    let totalSisaBelumKembali = 0;
    let countLunas = 0;
    let countBelum = 0;
    let countNihil = 0;

    siplahList.forEach((s) => {
      const kembali = Math.max(0, Number(s.jumlahSI) - Number(s.jumlahSIPLah));
      totalSIPLah += Number(s.jumlahSIPLah) || 0;
      totalSI += Number(s.jumlahSI) || 0;
      totalHarusKembali += kembali;

      const dikembalikan =
        s.jumlahDikembalikan !== undefined
          ? Number(s.jumlahDikembalikan)
          : s.statusPengembalian === "sudah"
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
      totalSIPLah,
      totalSI,
      totalHarusKembali,
      totalSudahDikembalikan,
      totalSisaBelumKembali,
      countLunas,
      countBelum,
      countNihil,
    };
  }, [siplahList]);

  // Search & Filter
  const filteredList = useMemo(() => {
    return siplahList.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const searchMatch =
        !q ||
        item.toko.toLowerCase().includes(q) ||
        item.keperluan.toLowerCase().includes(q) ||
        (item.noSpk && item.noSpk.toLowerCase().includes(q));

      if (!searchMatch) return false;

      const kembali = Math.max(0, Number(item.jumlahSI) - Number(item.jumlahSIPLah));
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
  }, [siplahList, searchQuery, filterStatus]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Menu Belanja SIPLah</h2>
          <p className="text-xs text-slate-500 font-medium">
            Input faktur penyedia SIPLah, pencairan SI bank, jumlah dana yang dikembalikan ke kas sekolah, beserta tanggal pengembaliannya
          </p>
        </div>
      </div>

      {/* KPI Cards: Tracking Pengembalian Dana SIPLah */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
            <span>Total Pencairan SI Bank</span>
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-black text-indigo-600">{formatRupiah(stats.totalSI)}</div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">
            Faktur SIPLah: <span className="font-semibold text-slate-700">{formatRupiah(stats.totalSIPLah)}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
            <span>Total Harus Dikembalikan</span>
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded-xl">
              <ArrowDownLeft className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-black text-slate-800">{formatRupiah(stats.totalHarusKembali)}</div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">
            Akumulasi kelebihan SI di atas invoice
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-emerald-200/80 bg-emerald-50/20 shadow-xs">
          <div className="flex items-center justify-between text-xs text-emerald-700 font-bold mb-1">
            <span>Sudah Dikembalikan (Kas)</span>
            <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-black text-emerald-700">
            {formatRupiah(stats.totalSudahDikembalikan)}
          </div>
          <div className="text-[11px] text-emerald-600 mt-1 font-semibold flex items-center gap-1">
            <span>{stats.countLunas} transaksi lunas disetor</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-rose-200/80 bg-rose-50/20 shadow-xs">
          <div className="flex items-center justify-between text-xs text-rose-700 font-bold mb-1">
            <span>Sisa Belum Dikembalikan</span>
            <span className="p-1.5 bg-rose-100 text-rose-700 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-black text-rose-600">
            {formatRupiah(stats.totalSisaBelumKembali)}
          </div>
          <div className="text-[11px] text-rose-500 mt-1 font-semibold">
            {stats.countBelum} transaksi belum lunas disetor
          </div>
        </div>
      </div>

      {/* Form SIPLah */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80">
        <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-emerald-600" />
          <span>Tambah Transaksi Belanja SIPLah</span>
        </h3>

        <form
          onSubmit={handleAddSiplah}
          className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs font-medium"
        >
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">
              Nama Toko / Penyedia SIPLah
            </label>
            <input
              type="text"
              value={toko}
              onChange={(e) => setToko(e.target.value)}
              placeholder="Contoh: CV. Edutech Pratama"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-900"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1.5">Nomor SPK / Order SIPLah</label>
            <input
              type="text"
              value={noSpk}
              onChange={(e) => setNoSpk(e.target.value)}
              placeholder="Contoh: 055/SPK/BOSP/2026"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1.5">Tanggal Transaksi Belanja</label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-semibold"
              required
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-slate-700 font-bold mb-1.5">
              Uraian / Keperluan Belanja
            </label>
            <input
              type="text"
              value={keperluan}
              onChange={(e) => setKeperluan(e.target.value)}
              placeholder="Contoh: Pengadaan Proyektor Pembelajaran & Kertas Ulangan"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1.5">
              Jumlah Yang di-SIPLah-kan (Invoice)
            </label>
            <input
              type="number"
              value={jumlahSIPLah}
              onChange={(e) => {
                const val = e.target.value;
                setJumlahSIPLah(val);
                const diff = Math.max(0, Number(jumlahSI) - Number(val));
                if (statusPengembalian === "sudah") {
                  setJumlahDikembalikanInput(diff);
                }
              }}
              placeholder="Rp 0"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-extrabold text-slate-900"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1.5">
              Jumlah Yang di-SI-kan (Pencairan Bank)
            </label>
            <input
              type="number"
              value={jumlahSI}
              onChange={(e) => {
                const val = e.target.value;
                setJumlahSI(val);
                const diff = Math.max(0, Number(val) - Number(jumlahSIPLah));
                if (statusPengembalian === "sudah") {
                  setJumlahDikembalikanInput(diff);
                }
              }}
              placeholder="Rp 0"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-extrabold text-indigo-600"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1.5">Kelebihan SI (Wajib Dikembalikan)</label>
            <div className="w-full px-3.5 py-2.5 bg-amber-50 border border-amber-200 rounded-2xl font-extrabold text-amber-800 flex items-center justify-between">
              <span>{formatRupiah(calculatedKembali)}</span>
              <ArrowRightLeft className="w-4 h-4 text-amber-600" />
            </div>
          </div>

          {/* Section Pengembalian Dana (Jumlah & Tanggal Dikembalikan) */}
          {calculatedKembali > 0 && (
            <div className="md:col-span-3 p-4 bg-amber-50/50 border border-amber-200/90 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowDownLeft className="w-4 h-4 text-amber-700" />
                  <span className="font-bold text-slate-800 text-xs">
                    Pengembalian Dana ke Kas Sekolah (Kelebihan SI SIPLah)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-medium">Status Setor:</span>
                  <div className="flex bg-white p-0.5 rounded-xl border border-slate-200 text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        setStatusPengembalian("sudah");
                        setJumlahDikembalikanInput(calculatedKembali);
                        if (!tanggalPengembalian) {
                          setTanggalPengembalian(new Date().toISOString().split("T")[0]);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg font-bold transition ${
                        statusPengembalian === "sudah"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "text-slate-600 hover:text-emerald-700"
                      }`}
                    >
                      Sudah Disetor
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStatusPengembalian("belum");
                        setJumlahDikembalikanInput(0);
                      }}
                      className={`px-2.5 py-1 rounded-lg font-bold transition ${
                        statusPengembalian === "belum"
                          ? "bg-rose-600 text-white shadow-xs"
                          : "text-slate-600 hover:text-rose-700"
                      }`}
                    >
                      Belum Disetor
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 font-bold text-[11px]">
                      Jumlah Yang Dikembalikan (Rp)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setJumlahDikembalikanInput(calculatedKembali);
                        setStatusPengembalian("sudah");
                        if (!tanggalPengembalian) {
                          setTanggalPengembalian(new Date().toISOString().split("T")[0]);
                        }
                      }}
                      className="text-[10px] text-indigo-600 hover:underline font-bold"
                    >
                      Setor Penuh
                    </button>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max={calculatedKembali * 2}
                    value={jumlahDikembalikanInput}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setJumlahDikembalikanInput(val);
                      if (val >= calculatedKembali && calculatedKembali > 0) {
                        setStatusPengembalian("sudah");
                      } else if (val === 0) {
                        setStatusPengembalian("belum");
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-black text-emerald-700 text-xs"
                    placeholder="Rp 0"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold text-[11px] mb-1">
                    Tanggal Pengembalian ke Kas
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={tanggalPengembalian}
                      onChange={(e) => setTanggalPengembalian(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold text-[11px] mb-1">
                    Sisa Belum Disetor ke Kas
                  </label>
                  <div
                    className={`w-full px-3 py-2 rounded-xl font-black text-xs flex items-center justify-between border ${
                      Math.max(0, calculatedKembali - jumlahDikembalikanInput) === 0
                        ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                        : "bg-rose-100 text-rose-800 border-rose-200"
                    }`}
                  >
                    <span>
                      {formatRupiah(Math.max(0, calculatedKembali - jumlahDikembalikanInput))}
                    </span>
                    {Math.max(0, calculatedKembali - jumlahDikembalikanInput) === 0 ? (
                      <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded">
                        LUNAS
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold bg-rose-200 text-rose-900 px-1.5 py-0.5 rounded">
                        SISA
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs shadow-md shadow-emerald-600/20 transition flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Simpan Transaksi SIPLah</span>
            </button>
          </div>
        </form>
      </div>

      {/* Table Section with Filter Tabs */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Daftar Realisasi Transaksi SIPLah</h3>
            <p className="text-[11px] text-slate-400 font-medium">
              Pantau status, nominal dan tanggal pengembalian dana belanja SIPLah ke kas sekolah
            </p>
          </div>

          {/* Filter Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl text-xs font-bold self-start sm:self-auto overflow-x-auto max-w-full">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-3 py-1.5 rounded-xl transition ${
                filterStatus === "all"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Semua ({siplahList.length})
            </button>
            <button
              onClick={() => setFilterStatus("belum")}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                filterStatus === "belum"
                  ? "bg-rose-500 text-white shadow-xs"
                  : "text-rose-700 hover:bg-rose-50"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Belum Lunas ({stats.countBelum})</span>
            </button>
            <button
              onClick={() => setFilterStatus("sudah")}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                filterStatus === "sudah"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Lunas Disetor ({stats.countLunas})</span>
            </button>
            <button
              onClick={() => setFilterStatus("nihil")}
              className={`px-3 py-1.5 rounded-xl transition ${
                filterStatus === "nihil"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Nihil ({stats.countNihil})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="p-4">Toko / Penyedia</th>
                <th className="p-4">Keperluan Belanja</th>
                <th className="p-4 text-right">Invoice SIPLah</th>
                <th className="p-4 text-right">Pencairan SI</th>
                <th className="p-4 text-right">Wajib Kembali</th>
                <th className="p-4">Pengembalian ke Kas (Jumlah & Tgl)</th>
                <th className="p-4 text-right">Sisa Belum Setor</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Tidak ada data belanja SIPLah yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  const kembali = Math.max(0, Number(item.jumlahSI) - Number(item.jumlahSIPLah));
                  const dikembalikan =
                    item.jumlahDikembalikan !== undefined
                      ? Number(item.jumlahDikembalikan)
                      : item.statusPengembalian === "sudah"
                      ? kembali
                      : 0;
                  const sisa = Math.max(0, kembali - dikembalikan);
                  const isLunas = kembali > 0 && sisa === 0 && dikembalikan > 0;
                  const isCicil = kembali > 0 && dikembalikan > 0 && sisa > 0;
                  const isBelum = kembali > 0 && dikembalikan === 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{item.toko}</div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          {item.tanggal} &bull; {item.noSpk}
                        </div>
                      </td>
                      <td className="p-4 text-slate-600 font-medium max-w-[200px] truncate">
                        {item.keperluan}
                      </td>
                      <td className="p-4 text-right font-bold text-slate-900">
                        {formatRupiah(item.jumlahSIPLah)}
                      </td>
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
                      <td className="p-4">
                        {kembali === 0 ? (
                          <span className="text-[11px] text-slate-400 italic">Sesuai Faktur / Nihil</span>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  isLunas
                                    ? "bg-emerald-100 text-emerald-800"
                                    : isCicil
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-rose-100 text-rose-800"
                                }`}
                              >
                                {isLunas ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Lunas Masuk Kas</span>
                                  </>
                                ) : isCicil ? (
                                  <>
                                    <Clock className="w-3 h-3" />
                                    <span>Dicicil Sebagian</span>
                                  </>
                                ) : (
                                  <>
                                    <AlertTriangle className="w-3 h-3" />
                                    <span>Belum Disetor</span>
                                  </>
                                )}
                              </span>
                              <span className="font-extrabold text-xs text-slate-900">
                                {formatRupiah(dikembalikan)}
                              </span>
                            </div>
                            {item.tanggalPengembalian && dikembalikan > 0 ? (
                              <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                <span>Tgl Setor: <strong>{item.tanggalPengembalian}</strong></span>
                              </div>
                            ) : kembali > 0 && dikembalikan === 0 ? (
                              <div className="text-[10px] text-rose-500 font-medium">
                                Belum ada bukti setoran
                              </div>
                            ) : null}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {kembali === 0 ? (
                          <span className="text-slate-400 font-bold">-</span>
                        ) : (
                          <span
                            className={`font-black text-xs ${
                              sisa > 0 ? "text-rose-600" : "text-emerald-700"
                            }`}
                          >
                            {sisa > 0 ? formatRupiah(sisa) : "Rp 0"}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {kembali > 0 && (
                            <>
                              {sisa > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleSetorPenuh(item)}
                                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition"
                                  title="Tandai Setor Lunas Penuh"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => openEditModal(item)}
                                className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                                title="Edit Jumlah & Tanggal Pengembalian"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                            title="Hapus Data Belanja"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* MODAL EDIT PENGEMBALIAN DANA BELANJA SIPLAH */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <ArrowDownLeft className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Edit Pengembalian Belanja SIPLah
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {editingEntry.toko} &bull; SPK: {editingEntry.noSpk || "-"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingEntry(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Info */}
            <div className="bg-slate-50 p-3.5 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Uraian Belanja:</span>
                <span className="font-bold text-slate-800 text-right max-w-[200px] truncate">
                  {editingEntry.keperluan}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Faktur SIPLah:</span>
                <span className="font-semibold text-slate-800">
                  {formatRupiah(editingEntry.jumlahSIPLah)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Pencairan Bank (SI):</span>
                <span className="font-bold text-indigo-600">
                  {formatRupiah(editingEntry.jumlahSI)}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 font-bold">
                <span className="text-amber-800">Kelebihan SI Wajib Kembali:</span>
                <span className="text-amber-800 font-black">
                  {formatRupiah(
                    Math.max(0, Number(editingEntry.jumlahSI) - Number(editingEntry.jumlahSIPLah))
                  )}
                </span>
              </div>
            </div>

            {/* Form Edit */}
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-bold text-xs">
                    Jumlah Dana Yang Dikembalikan (Rp)
                  </label>
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const target = Math.max(
                          0,
                          Number(editingEntry.jumlahSI) - Number(editingEntry.jumlahSIPLah)
                        );
                        setEditJumlah(target);
                        if (!editTanggal) {
                          setEditTanggal(new Date().toISOString().split("T")[0]);
                        }
                      }}
                      className="text-[10px] text-indigo-600 hover:underline font-bold"
                    >
                      Setor Penuh (100%)
                    </button>
                    <span className="text-slate-300">&bull;</span>
                    <button
                      type="button"
                      onClick={() => setEditJumlah(0)}
                      className="text-[10px] text-slate-400 hover:underline font-semibold"
                    >
                      Reset (0)
                    </button>
                  </div>
                </div>
                <input
                  type="number"
                  min="0"
                  value={editJumlah}
                  onChange={(e) => setEditJumlah(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-black text-slate-900 text-sm"
                />
                <p className="text-[11px] text-emerald-700 font-bold mt-1">
                  Terbilang: {formatRupiah(editJumlah)}
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1">
                  Tanggal Pengembalian ke Kas Sekolah
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={editTanggal}
                    onChange={(e) => setEditTanggal(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800 text-xs"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Tanggal saat dana kelebihan SI disetorkan kembali ke Rekening Kas Sekolah
                </p>
              </div>

              {/* Status & Sisa Preview */}
              <div className="p-3 bg-slate-100 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 font-medium block">Sisa Belum Dikembalikan:</span>
                  <span
                    className={`font-black text-sm ${
                      Math.max(
                        0,
                        Number(editingEntry.jumlahSI) -
                          Number(editingEntry.jumlahSIPLah) -
                          Number(editJumlah)
                      ) === 0
                        ? "text-emerald-700"
                        : "text-rose-600"
                    }`}
                  >
                    {formatRupiah(
                      Math.max(
                        0,
                        Number(editingEntry.jumlahSI) -
                          Number(editingEntry.jumlahSIPLah) -
                          Number(editJumlah)
                      )
                    )}
                  </span>
                </div>
                <div>
                  {Math.max(
                    0,
                    Number(editingEntry.jumlahSI) -
                      Number(editingEntry.jumlahSIPLah) -
                      Number(editJumlah)
                  ) === 0 ? (
                    <span className="px-2.5 py-1 bg-emerald-200 text-emerald-800 rounded-xl text-[11px] font-black">
                      LUNAS
                    </span>
                  ) : Number(editJumlah) > 0 ? (
                    <span className="px-2.5 py-1 bg-amber-200 text-amber-800 rounded-xl text-[11px] font-bold">
                      DICICIL
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-rose-200 text-rose-800 rounded-xl text-[11px] font-bold">
                      BELUM
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingEntry(null)}
                className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 font-bold rounded-2xl text-xs transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveEditModal}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs shadow-md transition flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Simpan Pengembalian</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
