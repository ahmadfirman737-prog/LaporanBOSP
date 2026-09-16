import React, { useState } from "react";
import { Plus, Trash2, GraduationCap, CreditCard, Award } from "lucide-react";
import { Guru } from "../types";
import { formatRupiah } from "../data/initialData";
import { saveGuruToDb, deleteGuruFromDb } from "../lib/firebase";

interface GuruViewProps {
  guruList: Guru[];
  setGuruList: React.Dispatch<React.SetStateAction<Guru[]>>;
  showToast: (message: string, type?: "success" | "info" | "warning" | "error") => void;
}

export const GuruView: React.FC<GuruViewProps> = ({ guruList, setGuruList, showToast }) => {
  const [nama, setNama] = useState("");
  const [jabatan, setJabatan] = useState("");
  const [status, setStatus] = useState("GTT / Honorer");
  const [gajiDefault, setGajiDefault] = useState<string>("");
  const [norek, setNorek] = useState("");

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

  const handleDeleteGuru = (id: number) => {
    if (guruList.length <= 1) {
      showToast("Minimal harus ada satu data guru!", "error");
      return;
    }
    setGuruList((prev) => prev.filter((g) => g.id !== id));
    deleteGuruFromDb(id);
    showToast("Data Guru/Tendik berhasil dihapus", "info");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900">Master Data Guru & Tendik</h2>
        <p className="text-xs text-slate-500 font-medium">
          Daftar penerima honor BOSP beserta standar hak gaji bulanan dan nomor rekening pencairan
        </p>
      </div>

      {/* Form Tambah Guru */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80">
        <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-indigo-600" />
          <span>Tambah Data Guru / Tenaga Kependidikan</span>
        </h3>

        <form
          onSubmit={handleAddGuru}
          className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs font-medium"
        >
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">Nama Lengkap & Gelar</label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Siti Aisyah, S.Pd."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-semibold"
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
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500"
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
            <label className="block text-slate-700 font-bold mb-1.5">Standar Gaji Bulanan (Hak)</label>
            <input
              type="number"
              value={gajiDefault}
              onChange={(e) => setGajiDefault(e.target.value)}
              placeholder="Contoh: 2500000"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-extrabold text-slate-900"
              required
            />
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
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>

          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs shadow-md shadow-indigo-600/20 transition flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Simpan Guru / Tendik</span>
            </button>
          </div>
        </form>
      </div>

      {/* List Guru */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Daftar Guru & Tenaga Kependidikan</h3>
          <span className="text-xs font-semibold text-slate-400">{guruList.length} Orang</span>
        </div>

        <div className="divide-y divide-slate-100">
          {guruList.map((g) => (
            <div
              key={g.id}
              className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm shrink-0">
                  {g.nama.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm">{g.nama}</h4>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                      {g.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-3">
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

              <div className="flex items-center justify-between md:justify-end gap-4">
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Hak Gaji Bulanan
                  </span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {formatRupiah(g.gajiDefault)}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteGuru(g.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                  title="Hapus Data Guru"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
