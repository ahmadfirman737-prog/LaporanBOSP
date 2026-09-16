import React, { useState, useMemo } from "react";
import { Plus, Trash2, ArrowRightLeft, ShoppingBag } from "lucide-react";
import { SiplahEntry } from "../types";
import { formatRupiah } from "../data/initialData";

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

    const newEntry: SiplahEntry = {
      id: Date.now(),
      tanggal,
      toko: toko.trim(),
      keperluan: keperluan.trim() || "Belanja Kebutuhan Operasional Sekolah",
      jumlahSIPLah: Number(jumlahSIPLah),
      jumlahSI: Number(jumlahSI),
      noSpk: noSpk.trim() || "SPK/BOSP/2026",
    };

    setSiplahList((prev) => [newEntry, ...prev]);
    showToast("Transaksi Belanja SIPLah berhasil disimpan!");

    // Reset fields
    setToko("");
    setKeperluan("");
    setJumlahSIPLah("");
    setJumlahSI("");
    setNoSpk("");
  };

  const handleDelete = (id: number) => {
    setSiplahList((prev) => prev.filter((item) => item.id !== id));
    showToast("Transaksi SIPLah berhasil dihapus", "info");
  };

  // Search filter
  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return siplahList;
    const q = searchQuery.toLowerCase();
    return siplahList.filter(
      (item) =>
        item.toko.toLowerCase().includes(q) ||
        item.keperluan.toLowerCase().includes(q) ||
        item.noSpk.toLowerCase().includes(q)
    );
  }, [siplahList, searchQuery]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900">Menu Belanja SIPLah</h2>
        <p className="text-xs text-slate-500 font-medium">
          Input invoice penyedia SIPLah, nominal pencairan SI bank, dan hitung pengembalian selisih dana
        </p>
      </div>

      {/* Form SIPLah */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80">
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
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-semibold"
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
            <label className="block text-slate-700 font-bold mb-1.5">Tanggal Transaksi</label>
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
              onChange={(e) => setJumlahSIPLah(e.target.value)}
              placeholder="Rp 0"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-extrabold text-slate-900"
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
              onChange={(e) => setJumlahSI(e.target.value)}
              placeholder="Rp 0"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-extrabold text-indigo-600"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1.5">Jumlah Harus Dikembalikan</label>
            <div className="w-full px-3.5 py-2.5 bg-amber-50 border border-amber-200 rounded-2xl font-extrabold text-amber-800 flex items-center justify-between">
              <span>{formatRupiah(calculatedKembali)}</span>
              <ArrowRightLeft className="w-4 h-4 text-amber-600" />
            </div>
          </div>

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

      {/* Table View */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Daftar Realisasi Transaksi SIPLah</h3>
          <span className="text-xs font-semibold text-slate-400">
            {filteredList.length} Entri Data
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="p-4">Toko / Penyedia</th>
                <th className="p-4">Keperluan Belanja</th>
                <th className="p-4">Nominal SIPLah</th>
                <th className="p-4">Jumlah SI</th>
                <th className="p-4">Harus Dikembalikan</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Tidak ada data belanja SIPLah yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  const kembali = Math.max(0, Number(item.jumlahSI) - Number(item.jumlahSIPLah));
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{item.toko}</div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          {item.tanggal} &bull; {item.noSpk}
                        </div>
                      </td>
                      <td className="p-4 text-slate-600 font-medium max-w-[220px] truncate">
                        {item.keperluan}
                      </td>
                      <td className="p-4 font-bold text-slate-900">
                        {formatRupiah(item.jumlahSIPLah)}
                      </td>
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
