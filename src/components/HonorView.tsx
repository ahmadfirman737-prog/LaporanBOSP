import React, { useState, useMemo } from "react";
import { Plus, Lock, Unlock, Trash2, ArrowDownLeft, Wallet } from "lucide-react";
import { HonorEntry, Guru } from "../types";
import { formatRupiah } from "../data/initialData";

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

  // Sync Gaji default when teacher is changed
  const handleGuruSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const gId = Number(e.target.value);
    setSelectedGuru(gId);
    const g = guruList.find((x) => x.id === gId);
    if (g) {
      setGaji(g.gajiDefault);
      setJumlahSI(g.gajiDefault);
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

    const newEntry: HonorEntry = {
      id: Date.now(),
      idGuru: Number(selectedGuru),
      bulan,
      gaji: Number(gaji),
      isGajiLocked: isLocked,
      jumlahSI: Number(jumlahSI),
      keterangan,
    };

    setHonorList((prev) => [newEntry, ...prev]);
    showToast("Data Honor Guru berhasil disimpan!");
  };

  const toggleLockInList = (id: number) => {
    setHonorList((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newLock = !item.isGajiLocked;
          showToast(`Status gaji ${newLock ? "dikunci 🔒" : "dibuka 🔓"}`, "info");
          return { ...item, isGajiLocked: newLock };
        }
        return item;
      })
    );
  };

  const handleDelete = (id: number) => {
    setHonorList((prev) => prev.filter((item) => item.id !== id));
    showToast("Data honor berhasil dihapus", "info");
  };

  // Search Filter
  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return honorList;
    const q = searchQuery.toLowerCase();
    return honorList.filter((item) => {
      const g = guruList.find((x) => x.id === Number(item.idGuru));
      return (
        g?.nama.toLowerCase().includes(q) ||
        item.bulan.toLowerCase().includes(q) ||
        (item.keterangan && item.keterangan.toLowerCase().includes(q))
      );
    });
  }, [honorList, guruList, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900">Menu Honor Guru & Tendik</h2>
        <p className="text-xs text-slate-500 font-medium">
          Kelola hak gaji, jumlah pencairan SI bank, dan hitung selisih dana yang harus dikembalikan
        </p>
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

      {/* Table View */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Daftar Realisasi Honor Guru & Tendik</h3>
          <span className="text-xs font-semibold text-slate-400">
            {filteredList.length} Entri Data
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="p-4">Nama Guru / Tendik</th>
                <th className="p-4">Bulan</th>
                <th className="p-4">Jumlah Gaji</th>
                <th className="p-4">Jumlah SI</th>
                <th className="p-4">Harus Dikembalikan</th>
                <th className="p-4 text-center">Status Gaji</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Tidak ada transaksi honor yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  const guru = guruList.find((g) => g.id === Number(item.idGuru));
                  const kembali = Math.max(0, Number(item.jumlahSI) - Number(item.gaji));
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
                      <td className="p-4 font-bold text-slate-900">{formatRupiah(item.gaji)}</td>
                      <td className="p-4 font-extrabold text-indigo-600">
                        {formatRupiah(item.jumlahSI)}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-xl font-bold text-xs ${
                            kembali > 0
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {formatRupiah(kembali)}
                        </span>
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
    </div>
  );
};
