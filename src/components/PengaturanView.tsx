import React, { useState } from "react";
import { School, Save, Upload, RotateCcw } from "lucide-react";
import { SchoolData } from "../types";
import { initialSchoolData } from "../data/initialData";

interface PengaturanViewProps {
  school: SchoolData;
  setSchool: React.Dispatch<React.SetStateAction<SchoolData>>;
  showToast: (message: string, type?: "success" | "info" | "warning" | "error") => void;
}

export const PengaturanView: React.FC<PengaturanViewProps> = ({
  school,
  setSchool,
  showToast,
}) => {
  const [formData, setFormData] = useState<SchoolData>({ ...school });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setFormData((prev) => ({ ...prev, logoUrl: reader.result as string }));
          showToast("Logo sekolah berhasil diunggah!");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSchool(formData);
    showToast("Profil & Identitas Sekolah berhasil diperbarui!");
  };

  const handleReset = () => {
    if (confirm("Kembalikan profil sekolah ke data awal contoh?")) {
      setFormData(initialSchoolData);
      setSchool(initialSchoolData);
      showToast("Data sekolah direset ke default.", "info");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900">Identitas & Profil Sekolah</h2>
        <p className="text-xs text-slate-500 font-medium">
          Konfigurasi nama sekolah, alamat, pejabat berwenang, dan logo resmi untuk kop surat laporan BOSP
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/80">
        <form onSubmit={handleSubmit} className="space-y-6 text-xs font-medium">
          {/* Logo Section */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-5 bg-slate-50/80 rounded-2xl border border-slate-200/60">
            <div className="relative group shrink-0">
              <img
                src={formData.logoUrl || "/logo.svg"}
                alt="Logo Sekolah"
                className="w-24 h-24 rounded-2xl object-contain bg-white p-2 border border-slate-200 shadow-sm"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/logo.svg";
                }}
              />
            </div>
            <div className="space-y-2 text-center sm:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h4 className="font-bold text-slate-900 text-sm">Logo Resmi Aplikasi & Sekolah</h4>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                  Kusuma Bangsa
                </span>
              </div>
              <p className="text-xs text-slate-500 max-w-lg leading-relaxed">
                Logo ini tampil pada sidebar navigasi utama dan kop surat resmi cetak laporan pertanggungjawaban BOSP.
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, logoUrl: "/logo.svg?v=kusuma2" }));
                    showToast("Logo diatur ke Lambang Vektor Kusuma Bangsa!", "success");
                  }}
                  className="px-3 py-1.5 bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-700 font-bold rounded-xl text-xs shadow-xs transition"
                >
                  Logo Vektor Resmi
                </button>
                <label className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs cursor-pointer shadow-xs transition">
                  <Upload className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Unggah Logo Lain</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Nama Satuan Pendidikan / Sekolah</label>
              <input
                type="text"
                name="namaSekolah"
                value={formData.namaSekolah}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Nomor Pokok Sekolah Nasional (NPSN)</label>
              <input
                type="text"
                name="npsn"
                value={formData.npsn}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-mono"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-700 font-bold mb-1.5">Alamat Lengkap Sekolah</label>
              <textarea
                name="alamatSekolah"
                rows={2}
                value={formData.alamatSekolah}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-medium leading-relaxed"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Tahun Anggaran BOSP</label>
              <input
                type="text"
                name="tahunAnggaran"
                value={formData.tahunAnggaran}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold"
                required
              />
            </div>

            <div className="hidden md:block"></div>

            {/* Pejabat Penandatangan */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Nama Kepala Sekolah & Gelar</label>
              <input
                type="text"
                name="kepalaSekolah"
                value={formData.kepalaSekolah}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">NIP Kepala Sekolah</label>
              <input
                type="text"
                name="nipKepalaSekolah"
                value={formData.nipKepalaSekolah}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Nama Bendahara BOSP & Gelar</label>
              <input
                type="text"
                name="bendahara"
                value={formData.bendahara}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5">NIP Bendahara BOSP</label>
              <input
                type="text"
                name="nipBendahara"
                value={formData.nipBendahara}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-mono"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2.5 text-slate-500 hover:text-slate-800 font-bold rounded-2xl text-xs transition flex items-center gap-1.5 hover:bg-slate-100"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset ke Contoh</span>
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs shadow-md shadow-indigo-600/20 transition flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
