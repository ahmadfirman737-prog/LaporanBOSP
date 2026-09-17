import React, { useState, useMemo } from "react";
import {
  Printer,
  Download,
  ShoppingBag,
  Search,
  Filter,
  CheckCircle2,
  FileCheck,
  FileSpreadsheet,
  Landmark,
} from "lucide-react";
import * as XLSX from "xlsx";
import { SchoolData, SiplahEntry, TabType } from "../types";
import { formatRupiah } from "../data/initialData";

interface LaporanSiplahViewProps {
  school: SchoolData;
  siplahList: SiplahEntry[];
  onNavigateTab: (tab: TabType) => void;
  showToast: (message: string, type?: "success" | "info" | "warning" | "error") => void;
}

export const LaporanSiplahView: React.FC<LaporanSiplahViewProps> = ({
  school,
  siplahList,
  onNavigateTab,
  showToast,
}) => {
  const [selectedToko, setSelectedToko] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "kembali" | "nihil">("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const currentDate = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  // Distinct vendors/shops in siplah list
  const availableVendors = useMemo(() => {
    const set = new Set<string>();
    siplahList.forEach((s) => {
      if (s.toko) set.add(s.toko);
    });
    return Array.from(set);
  }, [siplahList]);

  // Filtered SIPLah list
  const filteredSiplah = useMemo(() => {
    return siplahList.filter((item) => {
      const tokoMatch = selectedToko === "all" || item.toko === selectedToko;
      const searchMatch =
        searchTerm === "" ||
        item.toko.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.keperluan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.noSpk && item.noSpk.toLowerCase().includes(searchTerm.toLowerCase())) ||
        item.tanggal.includes(searchTerm);

      const kembali = Math.max(0, Number(item.jumlahSI) - Number(item.jumlahSIPLah));
      const statusMatch =
        statusFilter === "all" ||
        (statusFilter === "kembali" && kembali > 0) ||
        (statusFilter === "nihil" && kembali === 0);

      return tokoMatch && searchMatch && statusMatch;
    });
  }, [siplahList, selectedToko, searchTerm, statusFilter]);

  // Financial calculations
  const totalNominalSIPLah = useMemo(
    () => filteredSiplah.reduce((sum, s) => sum + Number(s.jumlahSIPLah || 0), 0),
    [filteredSiplah]
  );

  const totalCairSI = useMemo(
    () => filteredSiplah.reduce((sum, s) => sum + Number(s.jumlahSI || 0), 0),
    [filteredSiplah]
  );

  const totalPengembalian = useMemo(
    () =>
      filteredSiplah.reduce(
        (sum, s) =>
          sum + Math.max(0, Number(s.jumlahSI || 0) - Number(s.jumlahSIPLah || 0)),
        0
      ),
    [filteredSiplah]
  );

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    try {
      const rows = filteredSiplah.map((item, idx) => {
        const kembali = Math.max(0, Number(item.jumlahSI) - Number(item.jumlahSIPLah));
        return {
          No: idx + 1,
          Tanggal: item.tanggal,
          "No. SPK / Pesanan": item.noSpk || "-",
          "Toko / Mitra SIPLah": item.toko,
          "Uraian / Keperluan Belanja": item.keperluan,
          "Nominal Invoice SIPLah (Rp)": Number(item.jumlahSIPLah),
          "Jumlah di-SI-kan (Rp)": Number(item.jumlahSI),
          "Harus Dikembalikan ke Kas (Rp)": kembali,
          Status: kembali > 0 ? "Ada Pengembalian" : "Sesuai / Nihil",
        };
      });

      // Total summary row
      rows.push({
        No: "TOTAL" as any,
        Tanggal: "",
        "No. SPK / Pesanan": "",
        "Toko / Mitra SIPLah": `${filteredSiplah.length} Transaksi`,
        "Uraian / Keperluan Belanja": "",
        "Nominal Invoice SIPLah (Rp)": totalNominalSIPLah,
        "Jumlah di-SI-kan (Rp)": totalCairSI,
        "Harus Dikembalikan ke Kas (Rp)": totalPengembalian,
        Status: "",
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);

      // Metadata sheet
      const meta = [
        { Parameter: "Laporan", Nilai: "Realisasi & Pengembalian Belanja Barang/Jasa SIPLah" },
        { Parameter: "Satuan Pendidikan", Nilai: school.namaSekolah },
        { Parameter: "NPSN", Nilai: school.npsn },
        { Parameter: "Tahun Anggaran", Nilai: school.tahunAnggaran },
        { Parameter: "Filter Toko", Nilai: selectedToko === "all" ? "Semua Mitra Toko" : selectedToko },
        { Parameter: "Total Invoice SIPLah", Nilai: totalNominalSIPLah },
        { Parameter: "Total Pencairan SI", Nilai: totalCairSI },
        { Parameter: "Total Pengembalian ke Kas", Nilai: totalPengembalian },
        { Parameter: "Tanggal Cetak", Nilai: currentDate },
      ];
      const wsMeta = XLSX.utils.json_to_sheet(meta);

      XLSX.utils.book_append_sheet(wb, wsMeta, "Info Laporan");
      XLSX.utils.book_append_sheet(wb, ws, "Rekap Belanja SIPLah");

      const safeVendor = selectedToko === "all" ? "Semua" : selectedToko.replace(/[^a-zA-Z0-9]/g, "_");
      const filename = `Laporan_SIPLah_BOSP_${school.npsn}_${safeVendor}.xlsx`;
      XLSX.writeFile(wb, filename);

      showToast(`Laporan SIPLah berhasil diekspor: ${filename}`, "success");
    } catch (err) {
      console.error(err);
      showToast("Gagal mengekspor Laporan SIPLah ke Excel.", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Report Navigation Hub (Hidden in Print) */}
      <div className="no-print bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-1.5 p-1 bg-slate-100/90 rounded-2xl">
          <button
            type="button"
            onClick={() => onNavigateTab("laporan-honor")}
            className="px-4 py-2 hover:bg-white text-slate-600 hover:text-indigo-600 font-bold text-xs rounded-xl transition flex items-center gap-2"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Laporan Honor Guru</span>
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-indigo-600 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Laporan Belanja SIPLah</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab("laporan-pengembalian")}
            className="px-4 py-2 hover:bg-white text-slate-600 hover:text-indigo-600 font-bold text-xs rounded-xl transition flex items-center gap-2"
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>Dana Dikembalikan (Total)</span>
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
              <span className="text-xs text-slate-500 font-medium">
                {filteredSiplah.length} Transaksi Ditampilkan
              </span>
            </div>
            <h2 className="text-lg font-black text-slate-900 mt-1">
              Laporan Realisasi & Pengembalian Belanja SIPLah
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Dokumen rekapitulasi pembelanjaan barang/jasa via SIPLah, nominal pencairan SI bank, dan sisa dana yang disetorkan kembali ke kas sekolah.
            </p>
          </div>

          <div className="flex items-center space-x-2.5 w-full md:w-auto">
            <button
              onClick={handleExportExcel}
              className="flex-1 md:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center justify-center gap-2"
              title="Ekspor data belanja SIPLah ke Microsoft Excel"
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
              placeholder="Cari toko, SPK, atau keperluan..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={selectedToko}
              onChange={(e) => setSelectedToko(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Semua Toko / Mitra SIPLah</option>
              {availableVendors.map((toko) => (
                <option key={toko} value={toko}>
                  Toko: {toko}
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
              <option value="all">Semua Status Selisih SI</option>
              <option value="kembali">Ada Selisih Dikembalikan (&gt; Rp 0)</option>
              <option value="nihil">Sesuai / Nihil (Rp 0)</option>
            </select>
          </div>
        </div>

        {/* Financial Stat Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Total Invoice SIPLah</span>
            <p className="text-base font-black text-slate-900 mt-0.5">{formatRupiah(totalNominalSIPLah)}</p>
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
            BELANJA BARANG / JASA (SIPLah)
          </h2>
          <p className="text-xs text-slate-600 font-semibold">
            Bantuan Operasional Satuan Pendidikan (BOSP) &bull; Tahun Anggaran {school.tahunAnggaran}
          </p>
        </div>

        {/* SIPLah Table */}
        <div className="my-6">
          <table className="w-full text-left text-xs border border-slate-300 border-collapse">
            <thead className="bg-slate-100 text-slate-800 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-2 border border-slate-300 text-center w-8">No</th>
                <th className="p-2 border border-slate-300 w-24">Tanggal</th>
                <th className="p-2 border border-slate-300">Toko / Mitra SIPLah</th>
                <th className="p-2 border border-slate-300">No. SPK & Keperluan Belanja</th>
                <th className="p-2 border border-slate-300 text-right">Invoice SIPLah (Rp)</th>
                <th className="p-2 border border-slate-300 text-right">Cair di SI (Rp)</th>
                <th className="p-2 border border-slate-300 text-right">Harus Dikembalikan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
              {filteredSiplah.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400 italic">
                    Tidak ada data belanja SIPLah yang sesuai kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredSiplah.map((item, idx) => {
                  const kembali = Math.max(0, Number(item.jumlahSI) - Number(item.jumlahSIPLah));
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80">
                      <td className="p-2 border border-slate-300 text-center font-bold">
                        {idx + 1}
                      </td>
                      <td className="p-2 border border-slate-300 text-slate-700 whitespace-nowrap">
                        {item.tanggal}
                      </td>
                      <td className="p-2 border border-slate-300 font-bold text-slate-900">
                        {item.toko}
                      </td>
                      <td className="p-2 border border-slate-300">
                        <div className="font-semibold text-slate-800">{item.keperluan}</div>
                        {item.noSpk && (
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            SPK: {item.noSpk}
                          </div>
                        )}
                      </td>
                      <td className="p-2 border border-slate-300 text-right font-semibold">
                        {formatRupiah(item.jumlahSIPLah)}
                      </td>
                      <td className="p-2 border border-slate-300 text-right font-bold text-indigo-700">
                        {formatRupiah(item.jumlahSI)}
                      </td>
                      <td className="p-2 border border-slate-300 text-right font-black text-amber-700">
                        {kembali > 0 ? formatRupiah(kembali) : "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot className="bg-slate-100 font-black text-slate-900">
              <tr>
                <td colSpan={4} className="p-2.5 border border-slate-300 text-right uppercase tracking-wider">
                  TOTAL REALISASI BELANJA SIPLAH:
                </td>
                <td className="p-2.5 border border-slate-300 text-right">
                  {formatRupiah(totalNominalSIPLah)}
                </td>
                <td className="p-2.5 border border-slate-300 text-right text-indigo-700">
                  {formatRupiah(totalCairSI)}
                </td>
                <td className="p-2.5 border border-slate-300 text-right text-amber-700">
                  {formatRupiah(totalPengembalian)}
                </td>
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
                TOTAL DANA SI SIPLAH WAJIB DIKEMBALIKAN KE KAS SEKOLAH (BOSP)
              </h4>
              <p className="text-[11px] text-amber-800 font-medium">
                Selisih dana Standing Instruction bank dengan nilai transaksi invoice resmi rekanan penyedia SIPLah.
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
          <strong>Catatan Pertanggungjawaban BOSP:</strong> Pembelanjaan melalui platform SIPLah telah diverifikasi sesuai Surat Pesanan / SPK dan Berita Acara Serah Terima (BAST). Setiap kelebihan nominal pencairan SI di atas nilai tagihan invoice wajib disetorkan kembali ke Rekening Kas Sekolah (BOSP) dan dibukukan dalam Buku Pembantu Kas.
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
