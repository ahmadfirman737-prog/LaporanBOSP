import React, { useState, useMemo } from "react";
import {
  Printer,
  Download,
  FileCheck,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShoppingBag,
  FileSpreadsheet,
} from "lucide-react";
import * as XLSX from "xlsx";
import { SchoolData, HonorEntry, Guru, TabType } from "../types";
import { formatRupiah } from "../data/initialData";

interface LaporanHonorViewProps {
  school: SchoolData;
  honorList: HonorEntry[];
  guruList: Guru[];
  onNavigateTab: (tab: TabType) => void;
  showToast: (message: string, type?: "success" | "info" | "warning" | "error") => void;
}

export const LaporanHonorView: React.FC<LaporanHonorViewProps> = ({
  school,
  honorList,
  guruList,
  onNavigateTab,
  showToast,
}) => {
  const [selectedBulan, setSelectedBulan] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "kembali" | "nihil">("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const currentDate = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  // Distinct months present in honor list
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    honorList.forEach((h) => {
      if (h.bulan) set.add(h.bulan);
    });
    return Array.from(set);
  }, [honorList]);

  // Filtered Honor list
  const filteredHonor = useMemo(() => {
    return honorList.filter((item) => {
      const guru = guruList.find((g) => g.id === Number(item.idGuru));
      const guruName = guru ? guru.nama.toLowerCase() : "";
      const guruJabatan = guru ? guru.jabatan.toLowerCase() : "";
      const searchMatch =
        searchTerm === "" ||
        guruName.includes(searchTerm.toLowerCase()) ||
        guruJabatan.includes(searchTerm.toLowerCase()) ||
        item.bulan.toLowerCase().includes(searchTerm.toLowerCase());

      const monthMatch = selectedBulan === "all" || item.bulan === selectedBulan;

      const kembali = Math.max(0, Number(item.jumlahSI) - Number(item.gaji));
      const statusMatch =
        statusFilter === "all" ||
        (statusFilter === "kembali" && kembali > 0) ||
        (statusFilter === "nihil" && kembali === 0);

      return searchMatch && monthMatch && statusMatch;
    });
  }, [honorList, guruList, searchTerm, selectedBulan, statusFilter]);

  // Financial calculations
  const totalHakGaji = useMemo(
    () => filteredHonor.reduce((sum, h) => sum + Number(h.gaji || 0), 0),
    [filteredHonor]
  );

  const totalCairSI = useMemo(
    () => filteredHonor.reduce((sum, h) => sum + Number(h.jumlahSI || 0), 0),
    [filteredHonor]
  );

  const totalPengembalian = useMemo(
    () =>
      filteredHonor.reduce(
        (sum, h) => sum + Math.max(0, Number(h.jumlahSI || 0) - Number(h.gaji || 0)),
        0
      ),
    [filteredHonor]
  );

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    try {
      const rows = filteredHonor.map((item, idx) => {
        const guru = guruList.find((g) => g.id === Number(item.idGuru));
        const kembali = Math.max(0, Number(item.jumlahSI) - Number(item.gaji));
        return {
          No: idx + 1,
          "Nama Guru / Tendik": guru?.nama || "Guru",
          Jabatan: guru?.jabatan || "-",
          "No. Rekening": guru?.norek || "-",
          Bulan: item.bulan,
          "Hak Gaji Riil (Rp)": Number(item.gaji),
          "Pencairan di SI (Rp)": Number(item.jumlahSI),
          "Wajib Dikembalikan ke Kas (Rp)": kembali,
          Status: kembali > 0 ? "Ada Pengembalian" : "Sesuai / Nihil",
          Keterangan: item.keterangan || "-",
        };
      });

      // Total summary row
      rows.push({
        No: "TOTAL" as any,
        "Nama Guru / Tendik": `${filteredHonor.length} Penerima`,
        Jabatan: "",
        "No. Rekening": "",
        Bulan: selectedBulan === "all" ? "Semua Bulan" : selectedBulan,
        "Hak Gaji Riil (Rp)": totalHakGaji,
        "Pencairan di SI (Rp)": totalCairSI,
        "Wajib Dikembalikan ke Kas (Rp)": totalPengembalian,
        Status: "",
        Keterangan: "",
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);

      // Metadata header sheet
      const meta = [
        { Parameter: "Laporan", Nilai: "Realisasi & Pengembalian Dana SI Honor Guru" },
        { Parameter: "Satuan Pendidikan", Nilai: school.namaSekolah },
        { Parameter: "NPSN", Nilai: school.npsn },
        { Parameter: "Tahun Anggaran", Nilai: school.tahunAnggaran },
        { Parameter: "Filter Bulan", Nilai: selectedBulan === "all" ? "Semua Bulan" : selectedBulan },
        { Parameter: "Total Hak Gaji", Nilai: totalHakGaji },
        { Parameter: "Total Pencairan SI", Nilai: totalCairSI },
        { Parameter: "Total Wajib Dikembalikan", Nilai: totalPengembalian },
        { Parameter: "Tanggal Cetak", Nilai: currentDate },
      ];
      const wsMeta = XLSX.utils.json_to_sheet(meta);

      XLSX.utils.book_append_sheet(wb, wsMeta, "Info Laporan");
      XLSX.utils.book_append_sheet(wb, ws, "Rekap Honor");

      const safeMonth = selectedBulan === "all" ? "Semua" : selectedBulan.replace(/\s+/g, "_");
      const filename = `Laporan_Honor_BOSP_${school.npsn}_${safeMonth}.xlsx`;
      XLSX.writeFile(wb, filename);

      showToast(`Laporan Honor Guru berhasil diekspor: ${filename}`, "success");
    } catch (err) {
      console.error(err);
      showToast("Gagal mengekspor Laporan Honor ke Excel.", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Report Navigation Hub (Hidden in Print) */}
      <div className="no-print bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-1.5 p-1 bg-slate-100/90 rounded-2xl">
          <button
            type="button"
            className="px-4 py-2 bg-indigo-600 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Laporan Honor Guru</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab("laporan-siplah")}
            className="px-4 py-2 hover:bg-white text-slate-600 hover:text-indigo-600 font-bold text-xs rounded-xl transition flex items-center gap-2"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Laporan Belanja SIPLah</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab("laporan")}
            className="px-4 py-2 hover:bg-white text-slate-600 hover:text-indigo-600 font-bold text-xs rounded-xl transition flex items-center gap-2"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Rekapitulasi Gabungan BOSP</span>
          </button>
        </div>

        {/* Paper Size Indicator */}
        <div className="hidden lg:flex items-center gap-2 text-slate-500 text-xs font-semibold px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200/60">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Format Cetak PDF: <strong>A4 Portrait</strong></span>
        </div>
      </div>

      {/* Action and Filter Bar (Hidden in Print) */}
      <div className="no-print bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[11px] font-bold rounded-lg border border-indigo-100">
                Menu Laporan Terpisah
              </span>
              <span className="text-xs text-slate-400">&bull;</span>
              <span className="text-xs text-slate-500 font-medium">{filteredHonor.length} Data Ditampilkan</span>
            </div>
            <h2 className="text-lg font-black text-slate-900 mt-1">
              Laporan Realisasi & Pengembalian Dana Honor Guru
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Rekapitulasi hak gaji riil, pencairan Standing Instruction (SI), dan selisih dana yang wajib disetor ke kas sekolah.
            </p>
          </div>

          <div className="flex items-center space-x-2.5 w-full md:w-auto">
            <button
              onClick={handleExportExcel}
              className="flex-1 md:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center justify-center gap-2"
              title="Ekspor data honor ke spreadsheet Excel"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor Excel</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 md:flex-none px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-sm transition flex items-center justify-center gap-2"
              title="Cetak langsung ke kertas A4 atau Simpan sebagai PDF"
            >
              <Printer className="w-4 h-4 text-indigo-400" />
              <span>Cetak PDF (A4)</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama guru atau jabatan..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={selectedBulan}
              onChange={(e) => setSelectedBulan(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Semua Bulan Anggaran</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  Bulan: {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Semua Status Pengembalian</option>
              <option value="kembali">Wajib Dikembalikan (&gt; Rp 0)</option>
              <option value="nihil">Sesuai / Nihil (Rp 0)</option>
            </select>
          </div>
        </div>

        {/* Financial Stat Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Total Hak Gaji Riil</span>
            <p className="text-base font-black text-slate-900 mt-0.5">{formatRupiah(totalHakGaji)}</p>
          </div>
          <div className="p-3 bg-indigo-50/70 rounded-2xl border border-indigo-100">
            <span className="text-[11px] font-bold text-indigo-700 uppercase">Total Pencairan SI Bank</span>
            <p className="text-base font-black text-indigo-900 mt-0.5">{formatRupiah(totalCairSI)}</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
            <span className="text-[11px] font-bold text-amber-800 uppercase">Wajib Setor Kas Sekolah</span>
            <p className="text-base font-black text-amber-900 mt-0.5">{formatRupiah(totalPengembalian)}</p>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* PRINTABLE OFFICIAL SHEET (Optimized for A4 Paper Layout) */}
      {/* ========================================================= */}
      <div className="print-sheet-a4 bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200/90 text-slate-800 print:p-0 print:border-none print:shadow-none">
        {/* Kop Surat Resmi */}
        <div className="flex items-center gap-5 pb-5 border-b-4 border-slate-900 mb-6">
          <img
            src={school.logoUrl || "/logo.svg"}
            alt="Logo Sekolah"
            className="w-20 h-20 rounded-xl object-contain p-1 bg-white border border-slate-200 shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/logo.svg";
            }}
          />
          <div className="text-center flex-1 pr-8">
            <h1 className="font-black text-slate-900 text-base md:text-lg uppercase tracking-wider">
              {school.namaSekolah}
            </h1>
            <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
              {school.alamatSekolah}
            </p>
            <p className="text-xs text-slate-500 font-medium">
              NPSN: <strong>{school.npsn}</strong> &bull; TAHUN ANGGARAN BOSP:{" "}
              <strong>{school.tahunAnggaran}</strong>
            </p>
          </div>
        </div>

        {/* Title of Document */}
        <div className="text-center my-6 space-y-1">
          <h2 className="text-sm md:text-base font-black text-slate-900 uppercase tracking-wide underline underline-offset-4">
            LAPORAN REALISASI & PENGEMBALIAN DANA STANDING INSTRUCTION (SI)
            <br />
            HONOR GURU & TENAGA KEPENDIDIKAN
          </h2>
          <p className="text-xs text-slate-600 font-semibold">
            Bantuan Operasional Satuan Pendidikan (BOSP) &bull; Periode:{" "}
            {selectedBulan === "all" ? `Tahun Anggaran ${school.tahunAnggaran}` : `Bulan ${selectedBulan}`}
          </p>
        </div>

        {/* Honor Table */}
        <div className="my-6">
          <table className="w-full text-left text-xs border border-slate-300 border-collapse">
            <thead className="bg-slate-100 text-slate-800 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-2 border border-slate-300 text-center w-8">No</th>
                <th className="p-2 border border-slate-300">Nama Guru / Tenaga Pendidik</th>
                <th className="p-2 border border-slate-300">Jabatan & Rekening</th>
                <th className="p-2 border border-slate-300 text-center w-24">Bulan</th>
                <th className="p-2 border border-slate-300 text-right">Hak Gaji (Rp)</th>
                <th className="p-2 border border-slate-300 text-right">Cair di SI (Rp)</th>
                <th className="p-2 border border-slate-300 text-right">Harus Dikembalikan</th>
                <th className="p-2 border border-slate-300">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
              {filteredHonor.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-400 italic">
                    Tidak ada catatan realisasi honor yang sesuai kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredHonor.map((item, idx) => {
                  const guru = guruList.find((g) => g.id === Number(item.idGuru));
                  const kembali = Math.max(0, Number(item.jumlahSI) - Number(item.gaji));
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80">
                      <td className="p-2 border border-slate-300 text-center font-bold">
                        {idx + 1}
                      </td>
                      <td className="p-2 border border-slate-300 font-bold text-slate-900">
                        {guru ? guru.nama : `Guru ID: ${item.idGuru}`}
                      </td>
                      <td className="p-2 border border-slate-300 text-[11px]">
                        <div>{guru?.jabatan || "-"}</div>
                        {guru?.norek && (
                          <div className="text-slate-500 font-mono text-[10px]">
                            Rek: {guru.norek}
                          </div>
                        )}
                      </td>
                      <td className="p-2 border border-slate-300 text-center font-semibold">
                        {item.bulan}
                      </td>
                      <td className="p-2 border border-slate-300 text-right font-semibold">
                        {formatRupiah(item.gaji)}
                      </td>
                      <td className="p-2 border border-slate-300 text-right font-bold text-indigo-700">
                        {formatRupiah(item.jumlahSI)}
                      </td>
                      <td className="p-2 border border-slate-300 text-right font-black text-amber-700">
                        {kembali > 0 ? formatRupiah(kembali) : "-"}
                      </td>
                      <td className="p-2 border border-slate-300 text-[11px] text-slate-600">
                        {item.keterangan || (kembali > 0 ? "Kelebihan SI disetor ke Kas" : "Sesuai SK")}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot className="bg-slate-100 font-black text-slate-900">
              <tr>
                <td colSpan={4} className="p-2.5 border border-slate-300 text-right uppercase tracking-wider">
                  TOTAL REALISASI HONOR GURU:
                </td>
                <td className="p-2.5 border border-slate-300 text-right">
                  {formatRupiah(totalHakGaji)}
                </td>
                <td className="p-2.5 border border-slate-300 text-right text-indigo-700">
                  {formatRupiah(totalCairSI)}
                </td>
                <td className="p-2.5 border border-slate-300 text-right text-amber-700">
                  {formatRupiah(totalPengembalian)}
                </td>
                <td className="p-2.5 border border-slate-300"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Grand Total Summary Box */}
        <div className="my-6 p-4 rounded-2xl bg-amber-50/90 border border-amber-300 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-amber-950 text-xs uppercase tracking-wide">
                TOTAL DANA SI HONOR WAJIB DIKEMBALIKAN KE KAS SEKOLAH (BOSP)
              </h4>
              <p className="text-[11px] text-amber-800 font-medium">
                Selisih antara dana Standing Instruction yang dicairkan bank dengan hak riil guru penerima.
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xl md:text-2xl font-black text-amber-900">
              {formatRupiah(totalPengembalian)}
            </span>
          </div>
        </div>

        {/* Catatan Keterangan Resmi */}
        <div className="my-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 leading-relaxed">
          <strong>Catatan Pertanggungjawaban BOSP:</strong> Laporan ini dicetak sebagai dokumen sah pembukuan realisasi dana BOSP. Apabila terdapat selisih lebih antara jumlah pencairan SI dengan hak gaji riil, dana tersebut wajib disetorkan kembali ke Rekening Kas Sekolah (BOSP) dan dilampiri dengan bukti setoran bank / kuitansi pengembalian.
        </div>

        {/* Tanda Tangan Resmi (A4 Kept Intact) */}
        <div className="print-signature-block mt-10 pt-4 grid grid-cols-2 text-center text-xs font-medium text-slate-900 gap-8">
          <div>
            <p className="mb-20">
              Mengetahui,
              <br />
              <strong>Kepala Sekolah</strong>
            </p>
            <p className="font-black text-sm uppercase underline decoration-2">
              {school.kepalaSekolah}
            </p>
            <p className="text-[11px] text-slate-600 mt-0.5">NIP. {school.nipKepalaSekolah}</p>
          </div>

          <div>
            <p className="mb-20">
              {school.alamatSekolah.split(",")[1]?.trim() || "Bogor"},{" "}
              {currentDate}
              <br />
              <strong>Bendahara BOSP</strong>
            </p>
            <p className="font-black text-sm uppercase underline decoration-2">
              {school.bendahara}
            </p>
            <p className="text-[11px] text-slate-600 mt-0.5">NIP. {school.nipBendahara}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
