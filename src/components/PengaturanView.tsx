import React, { useState, useEffect, useRef } from "react";
import { School, Save, Upload, RotateCcw, Image as ImageIcon, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { SchoolData } from "../types";
import { initialSchoolData } from "../data/initialData";
import { processAndCompressImage } from "../utils/imageUtils";

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
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadInfo, setUploadInfo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync formData when external/Firestore school updates
  useEffect(() => {
    setFormData((prev) => ({ ...prev, ...school }));
  }, [school]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProcessFile = async (file: File) => {
    if (!file.type.startsWith("image/") && !file.name.toLowerCase().endsWith(".svg")) {
      showToast("Harap pilih file gambar (PNG, JPG, JPEG, WEBP, atau SVG)", "error");
      return;
    }

    try {
      setIsUploading(true);
      setUploadInfo("Mengompres & memproses logo...");
      
      const result = await processAndCompressImage(file, 500, 0.9);
      
      // Update form state and school immediately
      setFormData((prev) => ({ ...prev, logoUrl: result.dataUrl }));
      setSchool((prev) => ({ ...prev, logoUrl: result.dataUrl }));
      
      setUploadInfo(`Ukuran teroptimasi: ${result.sizeKb} KB (${result.width}x${result.height}px)`);
      showToast(`Logo sekolah "${file.name}" berhasil diunggah & disimpan!`, "success");
    } catch (err: any) {
      console.error("Error processing logo image:", err);
      showToast(err?.message || "Gagal mengunggah logo sekolah", "error");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleProcessFile(files[0]);
    }
  };

  const handleSetPresetLogo = (presetUrl: string, label: string) => {
    setFormData((prev) => ({ ...prev, logoUrl: presetUrl }));
    setSchool((prev) => ({ ...prev, logoUrl: presetUrl }));
    setUploadInfo(null);
    showToast(`Logo berhasil diatur ke ${label}!`, "success");
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
      setUploadInfo(null);
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
          {/* Logo Management Section */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`p-5 rounded-2xl border-2 transition-all ${
              isDragging
                ? "border-indigo-500 bg-indigo-50/70 shadow-md"
                : "border-slate-200/80 bg-slate-50/70 hover:border-slate-300"
            }`}
          >
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Logo Preview Container */}
              <div className="relative group shrink-0">
                <div className="w-28 h-28 rounded-2xl bg-white p-2.5 border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden">
                  <img
                    src={formData.logoUrl || "/logo.svg"}
                    alt="Logo Sekolah"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/logo.svg";
                    }}
                  />
                </div>
                {isUploading && (
                  <div className="absolute inset-0 bg-slate-900/40 rounded-2xl flex flex-col items-center justify-center text-white backdrop-blur-xs">
                    <Loader2 className="w-6 h-6 animate-spin text-white mb-1" />
                    <span className="text-[10px] font-bold">Memproses...</span>
                  </div>
                )}
              </div>

              {/* Upload Controls & Presets */}
              <div className="space-y-2.5 text-center sm:text-left flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-indigo-600" />
                    <span>Logo Resmi Sekolah / Yayasan</span>
                  </h4>
                  {uploadInfo ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                      <CheckCircle2 className="w-3 h-3" />
                      {uploadInfo}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded-md">
                      Tampil di Kop Surat & Header
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 max-w-lg leading-relaxed">
                  Tarik dan lepas (*drag & drop*) file gambar logo ke area ini, atau klik tombol unggah.
                  Format yang didukung: <strong>PNG, JPG, WEBP, atau SVG</strong> (otomatis dikompres secara optimal).
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="school-logo-file-input"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm shadow-indigo-600/20 transition disabled:opacity-50"
                  >
                    {isUploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>Pilih File Logo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetPresetLogo("/logo.svg?v=kusuma2", "Logo Vektor Kusuma Bangsa")}
                    className="px-3 py-2 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-xs shadow-xs transition"
                  >
                    Logo Kusuma Bangsa (Vektor)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetPresetLogo("/logo.png", "Logo Resmi Kusuma Bangsa PNG")}
                    className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs shadow-xs transition"
                  >
                    Logo Kusuma Bangsa (PNG)
                  </button>
                </div>
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
