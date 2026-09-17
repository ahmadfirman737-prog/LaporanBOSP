import React, { useState, useMemo } from "react";
import {
  Printer,
  Download,
  Landmark,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  ShoppingBag,
  FileSpreadsheet,
  Coins,
  ArrowDownLeft,
  Calendar,
  Layers,
  Percent,
} from "lucide-react";
import * as XLSX from "xlsx";
import { SchoolData, HonorEntry, SiplahEntry, Guru, TabType } from "../types";
import { formatRupiah } from "../data/initialData";

interface LaporanPengembalianViewProps {
  school: SchoolData;
  honorList: HonorEntry[];
  siplahList: SiplahEntry[];
  guruList: Guru[];
  onNavigateTab?: (tab: TabType) => void;
  showToast: (message: string, type?: "success" | "info" | "warning" | "error") => void;
}

export interface PengembalianItem {
  id: string;
  sourceType: "honor" | "siplah";
  sourceLabel: string;
  periode: string;
  pihak: string;
  subInfo: string;
  keperluan: string;
  jumlahSI: number;
  nominalRiil: number;
  wajibKembali: number;
  jumlahDikembalikan: number;
  sisaBelumKembali: number;
  status: "lunas" | "cicil" | "belum" | "nihil";
  statusText: string;
  tanggalSetor?: string;
  keterangan: string;
}

export const LaporanPengembalianView: React.FC<LaporanPengembalianViewProps> = ({
  school,
  honorList,
  siplahList,
  guruList,
  onNavigateTab,
  showToast,
}) => {
  const [sourceFilter, setSourceFilter] = useState<"all" | "honor" | "siplah">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "lunas" | "belum_lunas" | "ada_kembali">("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [viewMode, setViewMode] = useState<"gabungan" | "kategori">("gabungan");

  const currentDate = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  // 1. Map Honor items to unified structure
  const mappedHonorItems = useMemo<PengembalianItem[]>(() => {
    return honorList.map((h) => {
      const guru = guruList.find((g) => g.id === Number(h.idGuru));
      const kembali = Math.max(0, Number(h.jumlahSI || 0) - Number(h.gaji || 0));
      const dikembalikan =
        h.jumlahDikembalikan !== undefined
          ? Number(h.jumlahDikembalikan)
          : h.statusPengembalian === "sudah"
          ? kembali
          : 0;
      const sisa = Math.max(0, kembali - dikembalikan);

      let status: "lunas" | "cicil" | "belum" | "nihil" = "nihil";
      let statusText = "Sesuai / Nihil";

      if (kembali > 0) {
        if (sisa === 0) {
          status = "lunas";
          statusText = `Lunas Masuk Kas ${h.tanggalPengembalian ? `(${h.tanggalPengembalian})` : ""}`;
        } else if (dikembalikan > 0) {
          status = "cicil";
          statusText = `Belum Lunas (Sisa: ${formatRupiah(sisa)})`;
        } else {
          status = "belum";
          statusText = "Belum Dikembalikan";
        }
      }

      return {
        id: `honor-${h.id}`,
        sourceType: "honor",
        sourceLabel: "Honor Guru",
        periode: h.bulan,
        pihak: guru?.nama || `Guru ID: ${h.idGuru}`,
        subInfo: guru?.jabatan ? `${guru.jabatan}${guru.norek ? ` • Rek: ${guru.norek}` : ""}` : "-",
        keperluan: h.keterangan || "Pencairan Honor Guru & Tendik",
        jumlahSI: Number(h.jumlahSI || 0),
        nominalRiil: Number(h.gaji || 0),
        wajibKembali: kembali,
        jumlahDikembalikan: dikembalikan,
        sisaBelumKembali: sisa,
        status,
        statusText,
        tanggalSetor: h.tanggalPengembalian,
        keterangan: h.keterangan || (kembali > 0 ? "Kelebihan SI disetor ke Kas Sekolah" : "Sesuai SK"),
      };
    });
  }, [honorList, guruList]);

  // 2. Map SIPLah items to unified structure
  const mappedSiplahItems = useMemo<PengembalianItem[]>(() => {
    return siplahList.map((s) => {
      const kembali = Math.max(0, Number(s.jumlahSI || 0) - Number(s.jumlahSIPLah || 0));
      // Kelebihan pencairan SI SIPLah langsung disetorkan kembali ke kas sekolah
      const dikembalikan = kembali;
      const sisa = 0;

      let status: "lunas" | "cicil" | "belum" | "nihil" = "nihil";
      let statusText = "Sesuai / Nihil";

      if (kembali > 0) {
        status = "lunas";
        statusText = "Lunas Disetor ke Kas Sekolah";
      }

      return {
        id: `siplah-${s.id}`,
        sourceType: "siplah",
        sourceLabel: "Belanja SIPLah",
        periode: s.tanggal,
        pihak: s.toko,
        subInfo: s.noSpk ? `SPK: ${s.noSpk}` : "Pengadaan SIPLah",
        keperluan: s.keperluan,
        jumlahSI: Number(s.jumlahSI || 0),
        nominalRiil: Number(s.jumlahSIPLah || 0),
        wajibKembali: kembali,
        jumlahDikembalikan: dikembalikan,
        sisaBelumKembali: sisa,
        status,
        statusText,
        tanggalSetor: s.tanggal,
        keterangan: kembali > 0 ? "Selisih pencairan SI disetor kembali ke Kas Sekolah" : "Sesuai Faktur",
      };
    });
  }, [siplahList]);

  // 3. Combined list
  const allItems = useMemo(() => {
    return [...mappedHonorItems, ...mappedSiplahItems];
  }, [mappedHonorItems, mappedSiplahItems]);

  // 4. Filtered list
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      // Source filter
      if (sourceFilter !== "all" && item.sourceType !== sourceFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === "lunas" && item.status !== "lunas") {
        return false;
      }
      if (statusFilter === "belum_lunas" && (item.status === "lunas" || item.status === "nihil")) {
        return false;
      }
      if (statusFilter === "ada_kembali" && item.wajibKembali === 0) {
        return false;
      }

      // Search filter
      if (searchTerm.trim() !== "") {
        const query = searchTerm.toLowerCase();
        const match =
          item.pihak.toLowerCase().includes(query) ||
          item.subInfo.toLowerCase().includes(query) ||
          item.periode.toLowerCase().includes(query) ||
          item.keperluan.toLowerCase().includes(query) ||
          item.sourceLabel.toLowerCase().includes(query);
        if (!match) return false;
      }

      return true;
    });
  }, [allItems, sourceFilter, statusFilter, searchTerm]);

  // 5. Total Calculations (TOTAL KESELURUHAN)
  const totals = useMemo(() => {
    // Totals for all items (overall school scope)
    const totalWajibKembaliSemua = allItems.reduce((acc, it) => acc + it.wajibKembali, 0);
    const totalSudahKembaliSemua = allItems.reduce((acc, it) => acc + it.jumlahDikembalikan, 0);
    const totalSisaBelumKembaliSemua = allItems.reduce((acc, it) => acc + it.sisaBelumKembali, 0);
    const totalSISemua = allItems.reduce((acc, it) => acc + it.jumlahSI, 0);
    const totalRiilSemua = allItems.reduce((acc, it) => acc + it.nominalRiil, 0);

    // Totals Honor
    const honorWajib = mappedHonorItems.reduce((acc, it) => acc + it.wajibKembali, 0);
    const honorSudah = mappedHonorItems.reduce((acc, it) => acc + it.jumlahDikembalikan, 0);
    const honorSisa = mappedHonorItems.reduce((acc, it) => acc + it.sisaBelumKembali, 0);
    const honorSI = mappedHonorItems.reduce((acc, it) => acc + it.jumlahSI, 0);
    const honorRiil = mappedHonorItems.reduce((acc, it) => acc + it.nominalRiil, 0);

    // Totals SIPLah
    const siplahWajib = mappedSiplahItems.reduce((acc, it) => acc + it.wajibKembali, 0);
    const siplahSudah = mappedSiplahItems.reduce((acc, it) => acc + it.jumlahDikembalikan, 0);
    const siplahSisa = mappedSiplahItems.reduce((acc, it) => acc + it.sisaBelumKembali, 0);
    const siplahSI = mappedSiplahItems.reduce((acc, it) => acc + it.jumlahSI, 0);
    const siplahRiil = mappedSiplahItems.reduce((acc, it) => acc + it.nominalRiil, 0);

    // Filtered Totals
    const filteredWajib = filteredItems.reduce((acc, it) => acc + it.wajibKembali, 0);
    const filteredSudah = filteredItems.reduce((acc, it) => acc + it.jumlahDikembalikan, 0);
    const filteredSisa = filteredItems.reduce((acc, it) => acc + it.sisaBelumKembali, 0);
    const filteredSI = filteredItems.reduce((acc, it) => acc + it.jumlahSI, 0);
    const filteredRiil = filteredItems.reduce((acc, it) => acc + it.nominalRiil, 0);

    const persentaseRealisasiSemua =
      totalWajibKembaliSemua > 0
        ? Math.round((totalSudahKembaliSemua / totalWajibKembaliSemua) * 100)
        : 100;

    return {
      totalWajibKembaliSemua,
      totalSudahKembaliSemua,
      totalSisaBelumKembaliSemua,
      totalSISemua,
      totalRiilSemua,
      persentaseRealisasiSemua,

      honorWajib,
      honorSudah,
      honorSisa,
      honorSI,
      honorRiil,

      siplahWajib,
      siplahSudah,
      siplahSisa,
      siplahSI,
      siplahRiil,

      filteredWajib,
      filteredSudah,
      filteredSisa,
      filteredSI,
      filteredRiil,
    };
  }, [allItems, mappedHonorItems, mappedSiplahItems, filteredItems]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    try {
      // Sheet 1: Rincian Lengkap Pengembalian Dana
      const rowsRincian = filteredItems.map((item, idx) => ({
        No: idx + 1,
        "Sumber Dana": item.sourceLabel,
        "Periode / Tanggal": item.periode,
        "Pihak Penyetor / Penerima": item.pihak,
        "Jabatan / Keterangan SPK": item.subInfo,
        "Keperluan Transaksi": item.keperluan,
        "Pencairan di SI (Rp)": item.jumlahSI,
        "Realisasi Riil (Rp)": item.nominalRiil,
        "Wajib Dikembalikan ke Kas (Rp)": item.wajibKembali,
        "Jumlah Sudah Dikembalikan (Rp)": item.jumlahDikembalikan,
        "Sisa Belum Dikembalikan (Rp)": item.sisaBelumKembali,
        "Status Pengembalian": item.statusText,
        "Tanggal Setor": item.tanggalSetor || "-",
        Catatan: item.keterangan,
      }));

      // Total row in Sheet 1
      rowsRincian.push({
        No: "TOTAL" as any,
        "Sumber Dana": `${filteredItems.length} Transaksi`,
        "Periode / Tanggal": "-",
        "Pihak Penyetor / Penerima": "-",
        "Jabatan / Keterangan SPK": "-",
        "Keperluan Transaksi": "-",
        "Pencairan di SI (Rp)": totals.filteredSI,
        "Realisasi Riil (Rp)": totals.filteredRiil,
        "Wajib Dikembalikan ke Kas (Rp)": totals.filteredWajib,
        "Jumlah Sudah Dikembalikan (Rp)": totals.filteredSudah,
        "Sisa Belum Dikembalikan (Rp)": totals.filteredSisa,
        "Status Pengembalian": `Realisasi: ${totals.persentaseRealisasiSemua}%`,
        "Tanggal Setor": "-",
        Catatan: `Sisa Kas: ${formatRupiah(totals.filteredSisa)}`,
      });

      // Sheet 2: Ringkasan Total Keseluruhan
      const summaryRows = [
        { Parameter: "Satuan Pendidikan", Nilai: school.namaSekolah },
        { Parameter: "NPSN", Nilai: school.npsn },
        { Parameter: "Tahun Anggaran BOSP", Nilai: school.tahunAnggaran },
        { Parameter: "Kepala Sekolah", Nilai: `${school.kepalaSekolah} (NIP: ${school.nipKepalaSekolah})` },
        { Parameter: "Bendahara BOSP", Nilai: `${school.bendahara} (NIP: ${school.nipBendahara})` },
        { Parameter: "Tanggal Cetak Laporan", Nilai: currentDate },
        { Parameter: "", Nilai: "" },
        { Parameter: "--- RINGKASAN TOTAL KESELURUHAN DANA PENGEMBALIAN ---", Nilai: "" },
        { Parameter: "TOTAL DANA SUDAH DIKEMBALIKAN KE SEKOLAH (KAS MASUK)", Nilai: totals.totalSudahKembaliSemua },
        { Parameter: "TOTAL SISA BELUM DIKEMBALIKAN (TUNGGAKAN SETOR)", Nilai: totals.totalSisaBelumKembaliSemua },
        { Parameter: "TOTAL TARGET WAJIB DIKEMBALIKAN (HONOR + SIPLAH)", Nilai: totals.totalWajibKembaliSemua },
        { Parameter: "PERSENTASE TINGKAT PENGEMBALIAN KAS", Nilai: `${totals.persentaseRealisasiSemua}%` },
        { Parameter: "", Nilai: "" },
        { Parameter: "--- RINCIAN PER KATEGORI SUMBER DANA ---", Nilai: "" },
        { Parameter: "A. Dana Sudah Kembali dari Kelebihan SI Honor Guru", Nilai: totals.honorSudah },
        { Parameter: "   - Sisa Belum Dikembalikan dari Honor Guru", Nilai: totals.honorSisa },
        { Parameter: "   - Total Wajib Kembali dari Honor Guru", Nilai: totals.honorWajib },
        { Parameter: "B. Dana Sudah Kembali dari Kelebihan SI Belanja SIPLah", Nilai: totals.siplahSudah },
        { Parameter: "   - Total Wajib Kembali dari Belanja SIPLah", Nilai: totals.siplahWajib },
        { Parameter: "C. Total Pencairan SI Keseluruhan", Nilai: totals.totalSISemua },
        { Parameter: "D. Total Pengeluaran Riil Keseluruhan", Nilai: totals.totalRiilSemua },
      ];

      const wb = XLSX.utils.book_new();
      const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
      const wsRincian = XLSX.utils.json_to_sheet(rowsRincian);

      XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan Total Kas");
      XLSX.utils.book_append_sheet(wb, wsRincian, "Rincian Transaksi Setoran");

      const filename = `Laporan_Dana_Dikembalikan_BOSP_${school.npsn}_Total.xlsx`;
      XLSX.writeFile(wb, filename);

      showToast(`Laporan Dana Dikembalikan ke Sekolah berhasil diekspor: ${filename}`, "success");
    } catch (err) {
      console.error(err);
      showToast("Gagal mengekspor Laporan Dana Dikembalikan ke Excel.", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Report Navigation Hub (Hidden in Print) */}
      <div className="no-print bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-1.5 p-1 bg-slate-100/90 rounded-2xl overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab("laporan-honor")}
            className="px-4 py-2 hover:bg-white text-slate-600 hover:text-indigo-600 font-bold text-xs rounded-xl transition flex items-center gap-2 shrink-0"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Laporan Honor Guru</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab("laporan-siplah")}
            className="px-4 py-2 hover:bg-white text-slate-600 hover:text-indigo-600 font-bold text-xs rounded-xl transition flex items-center gap-2 shrink-0"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Laporan Belanja SIPLah</span>
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-indigo-600 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 shrink-0"
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>Dana Dikembalikan (Total)</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab("laporan")}
            className="px-4 py-2 hover:bg-white text-slate-600 hover:text-indigo-600 font-bold text-xs rounded-xl transition flex items-center gap-2 shrink-0"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Rekap Gabungan BOSP</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200/60 shrink-0">
          <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
          <span>Format Cetak Resmi: <strong>A4 Portrait</strong></span>
        </div>
      </div>

      {/* Control & KPI Header (Hidden in Print) */}
      <div className="no-print bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                <Landmark className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Laporan Dana Yang Sudah Dikembalikan ke Sekolah
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
              Monitoring total keseluruhan dana pengembalian ke kas sekolah dari kelebihan pencairan Standing Instruction (SI) Honor Guru & Belanja SIPLah.
            </p>
          </div>

          <div className="flex items-center space-x-2.5 w-full md:w-auto">
            <button
              onClick={handleExportExcel}
              className="flex-1 md:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center justify-center gap-2"
              title="Ekspor seluruh data pengembalian dana ke file Excel"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor Excel</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 md:flex-none px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-sm transition flex items-center justify-center gap-2"
              title="Cetak format surat resmi A4 atau Simpan sebagai PDF"
            >
              <Printer className="w-4 h-4 text-teal-400" />
              <span>Cetak PDF (A4)</span>
            </button>
          </div>
        </div>

        {/* Grand Total Highlight Cards (TOTAL KESELURUHAN) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Dana Sudah Dikembalikan (Highlight Utama) */}
          <div className="p-5 bg-gradient-to-br from-teal-500 to-emerald-600 text-white rounded-3xl shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between opacity-90">
              <span className="text-xs font-bold uppercase tracking-wider">
                Total Sudah Dikembalikan
              </span>
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-2xl font-black mt-2 tracking-tight">
              {formatRupiah(totals.totalSudahKembaliSemua)}
            </p>
            <div className="mt-2.5 pt-2 border-t border-white/20 flex items-center justify-between text-[11px]">
              <span className="opacity-90">Tingkat Realisasi Kas:</span>
              <span className="font-extrabold bg-white/20 px-2 py-0.5 rounded-md">
                {totals.persentaseRealisasiSemua}% Lunas
              </span>
            </div>
          </div>

          {/* Card 2: Sisa Belum Dikembalikan */}
          <div className="p-5 bg-amber-50 rounded-3xl border border-amber-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                Sisa Belum Dikembalikan
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-amber-950 mt-2 tracking-tight">
              {formatRupiah(totals.totalSisaBelumKembaliSemua)}
            </p>
            <div className="mt-2.5 pt-2 border-t border-amber-200/70 flex items-center justify-between text-[11px] text-amber-800 font-medium">
              <span>Tunggakan Setoran:</span>
              <span className="font-bold">
                {totals.totalSisaBelumKembaliSemua === 0 ? "Nihil (Semua Lunas)" : "Wajib Ditagihkan"}
              </span>
            </div>
          </div>

          {/* Card 3: Total Wajib Dikembalikan */}
          <div className="p-5 bg-slate-50 rounded-3xl border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Total Wajib Dikembalikan
              </span>
              <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
              {formatRupiah(totals.totalWajibKembaliSemua)}
            </p>
            <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Target Pengembalian Kas:</span>
              <span className="font-bold text-slate-700">Honor & SIPLah</span>
            </div>
          </div>

          {/* Card 4: Sumber Rincian Pengembalian */}
          <div className="p-5 bg-indigo-50/70 rounded-3xl border border-indigo-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                Komparasi Sumber Dana
              </span>
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 space-y-1 text-xs">
              <div className="flex justify-between items-center text-slate-700 font-medium">
                <span>Honor Guru:</span>
                <span className="font-bold text-indigo-900">{formatRupiah(totals.honorSudah)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-700 font-medium">
                <span>Belanja SIPLah:</span>
                <span className="font-bold text-indigo-900">{formatRupiah(totals.siplahSudah)}</span>
              </div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-indigo-100 flex items-center justify-between text-[11px] text-indigo-700 font-semibold">
              <span>Total Kas Masuk:</span>
              <span className="font-black">{formatRupiah(totals.totalSudahKembaliSemua)}</span>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama guru, toko, keperluan..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as any)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">Semua Sumber Dana (Honor & SIPLah)</option>
              <option value="honor">Khusus Kelebihan SI Honor Guru</option>
              <option value="siplah">Khusus Kelebihan SI Belanja SIPLah</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">Semua Status Pengembalian</option>
              <option value="ada_kembali">Hanya Yang Ada Selisih Pengembalian</option>
              <option value="lunas">✓ Sudah Lunas / Masuk Kas</option>
              <option value="belum_lunas">⏳ Belum Lunas / Masih Ada Sisa</option>
            </select>
          </div>
        </div>

        {/* Tab Sub-Filter for Table View Mode */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode("gabungan")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === "gabungan"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Daftar Rincian Semua Transaksi ({filteredItems.length})</span>
            </button>
            <button
              onClick={() => setViewMode("kategori")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === "kategori"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Rekapitulasi Komparasi per Sumber</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-500 font-semibold">
            Menampilkan <strong>{filteredItems.length}</strong> transaksi terpilih
          </span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SCREEN TABLE PREVIEW (Hidden in Print)                     */}
      {/* ========================================================= */}
      <div className="no-print bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        {viewMode === "kategori" ? (
          // Comparison Summary Table
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-2xl overflow-hidden">
              <thead className="bg-slate-100/90 text-slate-800 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3 border-b border-slate-200">Kategori Sumber Dana</th>
                  <th className="p-3 border-b border-slate-200 text-right">Pencairan SI (Rp)</th>
                  <th className="p-3 border-b border-slate-200 text-right">Realisasi Riil (Rp)</th>
                  <th className="p-3 border-b border-slate-200 text-right text-rose-700">Wajib Kembali (Rp)</th>
                  <th className="p-3 border-b border-slate-200 text-right text-emerald-700">Sudah Masuk Kas (Rp)</th>
                  <th className="p-3 border-b border-slate-200 text-right text-amber-700">Sisa Belum Setor (Rp)</th>
                  <th className="p-3 border-b border-slate-200 text-center">% Realisasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                <tr className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 font-bold text-[10px]">
                      Honor Guru
                    </span>
                    <span>Pencairan Standing Instruction Honor Guru & Tendik</span>
                  </td>
                  <td className="p-3 text-right font-semibold">{formatRupiah(totals.honorSI)}</td>
                  <td className="p-3 text-right font-semibold">{formatRupiah(totals.honorRiil)}</td>
                  <td className="p-3 text-right font-bold text-rose-700">{formatRupiah(totals.honorWajib)}</td>
                  <td className="p-3 text-right font-black text-emerald-700">{formatRupiah(totals.honorSudah)}</td>
                  <td className="p-3 text-right font-black text-amber-700">{formatRupiah(totals.honorSisa)}</td>
                  <td className="p-3 text-center font-bold">
                    {totals.honorWajib > 0
                      ? `${Math.round((totals.honorSudah / totals.honorWajib) * 100)}%`
                      : "100%"}
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                      Belanja SIPLah
                    </span>
                    <span>Pengadaan Barang & Jasa via SIPLah</span>
                  </td>
                  <td className="p-3 text-right font-semibold">{formatRupiah(totals.siplahSI)}</td>
                  <td className="p-3 text-right font-semibold">{formatRupiah(totals.siplahRiil)}</td>
                  <td className="p-3 text-right font-bold text-rose-700">{formatRupiah(totals.siplahWajib)}</td>
                  <td className="p-3 text-right font-black text-emerald-700">{formatRupiah(totals.siplahSudah)}</td>
                  <td className="p-3 text-right font-black text-amber-700">Rp 0</td>
                  <td className="p-3 text-center font-bold">100%</td>
                </tr>
              </tbody>
              <tfoot className="bg-slate-900 text-white font-black">
                <tr>
                  <td className="p-3 uppercase tracking-wider text-xs">TOTAL KESELURUHAN PENGEMBALIAN DANA KAS SEKOLAH:</td>
                  <td className="p-3 text-right">{formatRupiah(totals.totalSISemua)}</td>
                  <td className="p-3 text-right">{formatRupiah(totals.totalRiilSemua)}</td>
                  <td className="p-3 text-right text-rose-300">{formatRupiah(totals.totalWajibKembaliSemua)}</td>
                  <td className="p-3 text-right text-emerald-300 text-sm">{formatRupiah(totals.totalSudahKembaliSemua)}</td>
                  <td className="p-3 text-right text-amber-300">{formatRupiah(totals.totalSisaBelumKembaliSemua)}</td>
                  <td className="p-3 text-center text-teal-300">{totals.persentaseRealisasiSemua}%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          // Unified detailed list
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-2xl overflow-hidden">
              <thead className="bg-slate-100 text-slate-800 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3 text-center w-10">No</th>
                  <th className="p-3">Sumber Dana</th>
                  <th className="p-3">Pihak Terkait</th>
                  <th className="p-3 text-center">Periode</th>
                  <th className="p-3 text-right">Cair di SI (Rp)</th>
                  <th className="p-3 text-right">Riil / Tagihan</th>
                  <th className="p-3 text-right text-rose-800">Wajib Kembali</th>
                  <th className="p-3 text-right text-emerald-800">Sudah Kembali</th>
                  <th className="p-3 text-right text-amber-800">Sisa Belum</th>
                  <th className="p-3 text-center">Status Setor</th>
                  <th className="p-3">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-slate-400 italic">
                      Tidak ada transaksi pengembalian dana yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 text-center font-bold text-slate-500">{idx + 1}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] ${
                            item.sourceType === "honor"
                              ? "bg-indigo-100 text-indigo-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {item.sourceLabel}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{item.pihak}</div>
                        <div className="text-[10px] text-slate-500">{item.subInfo}</div>
                      </td>
                      <td className="p-3 text-center font-semibold text-slate-700">{item.periode}</td>
                      <td className="p-3 text-right font-semibold text-slate-700">{formatRupiah(item.jumlahSI)}</td>
                      <td className="p-3 text-right font-semibold text-slate-700">{formatRupiah(item.nominalRiil)}</td>
                      <td className="p-3 text-right font-black text-rose-700">
                        {item.wajibKembali > 0 ? formatRupiah(item.wajibKembali) : "-"}
                      </td>
                      <td className="p-3 text-right font-black text-emerald-700">
                        {item.jumlahDikembalikan > 0 ? formatRupiah(item.jumlahDikembalikan) : item.wajibKembali > 0 ? "Rp 0" : "-"}
                      </td>
                      <td className="p-3 text-right font-black text-amber-700">
                        {item.sisaBelumKembali > 0 ? formatRupiah(item.sisaBelumKembali) : item.wajibKembali > 0 ? "Rp 0" : "-"}
                      </td>
                      <td className="p-3 text-center">
                        {item.wajibKembali === 0 ? (
                          <span className="text-[10px] font-semibold text-slate-400">Sesuai / Nihil</span>
                        ) : item.status === "lunas" ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            ✓ Lunas
                          </span>
                        ) : item.status === "cicil" ? (
                          <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                            ⏳ Belum Lunas
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            ⏳ Belum Setor
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-[11px] text-slate-500 max-w-[180px] truncate" title={item.keterangan}>
                        {item.keterangan}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-slate-100 font-black text-slate-900">
                <tr>
                  <td colSpan={4} className="p-3 text-right uppercase tracking-wider text-xs">
                    TOTAL TRANSAKSI TERFILTER:
                  </td>
                  <td className="p-3 text-right font-bold text-slate-800">{formatRupiah(totals.filteredSI)}</td>
                  <td className="p-3 text-right font-bold text-slate-800">{formatRupiah(totals.filteredRiil)}</td>
                  <td className="p-3 text-right font-black text-rose-700">{formatRupiah(totals.filteredWajib)}</td>
                  <td className="p-3 text-right font-black text-emerald-700">{formatRupiah(totals.filteredSudah)}</td>
                  <td className="p-3 text-right font-black text-amber-700">{formatRupiah(totals.filteredSisa)}</td>
                  <td colSpan={2} className="p-3 text-center text-xs text-slate-600">
                    Kas Masuk: {formatRupiah(totals.filteredSudah)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
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
            LAPORAN REKAPITULASI DANA YANG SUDAH DIKEMBALIKAN KE KAS SEKOLAH
            <br />
            TOTAL KESELURUHAN REALISASI PENGEMBALIAN STANDING INSTRUCTION (SI) BOSP
          </h2>
          <p className="text-xs text-slate-600 font-semibold">
            Bantuan Operasional Satuan Pendidikan (BOSP) &bull; Tahun Anggaran {school.tahunAnggaran}
          </p>
        </div>

        {/* Executive Summary Cards in Print */}
        <div className="grid grid-cols-3 gap-3 my-4">
          <div className="p-3 border-2 border-slate-900 rounded-xl bg-slate-50 text-center">
            <span className="text-[10px] font-bold text-slate-600 uppercase block">
              TOTAL WAJIB DIKEMBALIKAN
            </span>
            <span className="text-sm font-black text-slate-900 mt-1 block">
              {formatRupiah(totals.totalWajibKembaliSemua)}
            </span>
          </div>
          <div className="p-3 border-2 border-emerald-700 rounded-xl bg-emerald-50 text-center">
            <span className="text-[10px] font-bold text-emerald-800 uppercase block">
              TOTAL SUDAH DIKEMBALIKAN (KAS MASUK)
            </span>
            <span className="text-sm font-black text-emerald-900 mt-1 block">
              {formatRupiah(totals.totalSudahKembaliSemua)}
            </span>
          </div>
          <div className="p-3 border-2 border-amber-600 rounded-xl bg-amber-50 text-center">
            <span className="text-[10px] font-bold text-amber-800 uppercase block">
              SISA BELUM DIKEMBALIKAN
            </span>
            <span className="text-sm font-black text-amber-900 mt-1 block">
              {formatRupiah(totals.totalSisaBelumKembaliSemua)}
            </span>
          </div>
        </div>

        {/* Section 1: Honor Guru */}
        <div className="my-5">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2 flex items-center justify-between border-b pb-1 border-slate-300">
            <span>A. Pengembalian Kelebihan SI Pencairan Honor Guru & Tendik</span>
            <span className="text-[10px] text-slate-600 font-bold">
              Total Sudah Masuk Kas: {formatRupiah(totals.honorSudah)}
            </span>
          </h3>
          <table className="w-full text-left text-[11px] border border-slate-300 border-collapse">
            <thead className="bg-slate-100 text-slate-800 font-bold uppercase">
              <tr>
                <th className="p-1.5 border border-slate-300 text-center w-8">No</th>
                <th className="p-1.5 border border-slate-300">Nama Guru / Tendik</th>
                <th className="p-1.5 border border-slate-300 text-center w-20">Bulan</th>
                <th className="p-1.5 border border-slate-300 text-right">Hak Gaji (Rp)</th>
                <th className="p-1.5 border border-slate-300 text-right">Cair SI (Rp)</th>
                <th className="p-1.5 border border-slate-300 text-right">Wajib Kembali</th>
                <th className="p-1.5 border border-slate-300 text-right font-black text-emerald-800">Sudah Kembali</th>
                <th className="p-1.5 border border-slate-300 text-right font-black text-amber-800">Sisa Belum</th>
                <th className="p-1.5 border border-slate-300 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {mappedHonorItems.map((item, idx) => (
                <tr key={item.id}>
                  <td className="p-1.5 border border-slate-300 text-center font-bold">{idx + 1}</td>
                  <td className="p-1.5 border border-slate-300 font-semibold">{item.pihak}</td>
                  <td className="p-1.5 border border-slate-300 text-center">{item.periode}</td>
                  <td className="p-1.5 border border-slate-300 text-right">{formatRupiah(item.nominalRiil)}</td>
                  <td className="p-1.5 border border-slate-300 text-right">{formatRupiah(item.jumlahSI)}</td>
                  <td className="p-1.5 border border-slate-300 text-right font-bold text-rose-700">
                    {item.wajibKembali > 0 ? formatRupiah(item.wajibKembali) : "-"}
                  </td>
                  <td className="p-1.5 border border-slate-300 text-right font-black text-emerald-700">
                    {item.jumlahDikembalikan > 0 ? formatRupiah(item.jumlahDikembalikan) : item.wajibKembali > 0 ? "Rp 0" : "-"}
                  </td>
                  <td className="p-1.5 border border-slate-300 text-right font-black text-amber-700">
                    {item.sisaBelumKembali > 0 ? formatRupiah(item.sisaBelumKembali) : item.wajibKembali > 0 ? "Rp 0" : "-"}
                  </td>
                  <td className="p-1.5 border border-slate-300 text-center text-[10px]">
                    {item.wajibKembali === 0 ? "Nihil" : item.status === "lunas" ? "✓ Lunas" : "⏳ Belum Lunas"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100 font-bold text-slate-900">
              <tr>
                <td colSpan={3} className="p-1.5 border border-slate-300 text-right uppercase">Subtotal Honor:</td>
                <td className="p-1.5 border border-slate-300 text-right">{formatRupiah(totals.honorRiil)}</td>
                <td className="p-1.5 border border-slate-300 text-right">{formatRupiah(totals.honorSI)}</td>
                <td className="p-1.5 border border-slate-300 text-right text-rose-700">{formatRupiah(totals.honorWajib)}</td>
                <td className="p-1.5 border border-slate-300 text-right text-emerald-700 font-black">{formatRupiah(totals.honorSudah)}</td>
                <td className="p-1.5 border border-slate-300 text-right text-amber-700 font-black">{formatRupiah(totals.honorSisa)}</td>
                <td className="p-1.5 border border-slate-300 text-center text-[10px]">
                  {totals.honorWajib > 0 ? `${Math.round((totals.honorSudah / totals.honorWajib) * 100)}%` : "100%"}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Section 2: Belanja SIPLah */}
        <div className="my-5">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2 flex items-center justify-between border-b pb-1 border-slate-300">
            <span>B. Pengembalian Kelebihan SI Belanja Pengadaan Barang & Jasa (SIPLah)</span>
            <span className="text-[10px] text-slate-600 font-bold">
              Total Sudah Masuk Kas: {formatRupiah(totals.siplahSudah)}
            </span>
          </h3>
          <table className="w-full text-left text-[11px] border border-slate-300 border-collapse">
            <thead className="bg-slate-100 text-slate-800 font-bold uppercase">
              <tr>
                <th className="p-1.5 border border-slate-300 text-center w-8">No</th>
                <th className="p-1.5 border border-slate-300">Toko / Rekanan & No SPK</th>
                <th className="p-1.5 border border-slate-300 text-center w-24">Tanggal</th>
                <th className="p-1.5 border border-slate-300 text-right">Invoice SIPLah (Rp)</th>
                <th className="p-1.5 border border-slate-300 text-right">Cair SI (Rp)</th>
                <th className="p-1.5 border border-slate-300 text-right">Wajib Kembali</th>
                <th className="p-1.5 border border-slate-300 text-right font-black text-emerald-800">Sudah Masuk Kas</th>
                <th className="p-1.5 border border-slate-300 text-right">Sisa Belum</th>
                <th className="p-1.5 border border-slate-300 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {mappedSiplahItems.map((item, idx) => (
                <tr key={item.id}>
                  <td className="p-1.5 border border-slate-300 text-center font-bold">{idx + 1}</td>
                  <td className="p-1.5 border border-slate-300 font-semibold">
                    <div>{item.pihak}</div>
                    <div className="text-[9px] text-slate-500">{item.subInfo}</div>
                  </td>
                  <td className="p-1.5 border border-slate-300 text-center">{item.periode}</td>
                  <td className="p-1.5 border border-slate-300 text-right">{formatRupiah(item.nominalRiil)}</td>
                  <td className="p-1.5 border border-slate-300 text-right">{formatRupiah(item.jumlahSI)}</td>
                  <td className="p-1.5 border border-slate-300 text-right font-bold text-rose-700">
                    {item.wajibKembali > 0 ? formatRupiah(item.wajibKembali) : "-"}
                  </td>
                  <td className="p-1.5 border border-slate-300 text-right font-black text-emerald-700">
                    {item.jumlahDikembalikan > 0 ? formatRupiah(item.jumlahDikembalikan) : "-"}
                  </td>
                  <td className="p-1.5 border border-slate-300 text-right font-bold text-slate-400">Rp 0</td>
                  <td className="p-1.5 border border-slate-300 text-center text-[10px]">
                    {item.wajibKembali === 0 ? "Nihil" : "✓ Lunas"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100 font-bold text-slate-900">
              <tr>
                <td colSpan={3} className="p-1.5 border border-slate-300 text-right uppercase">Subtotal SIPLah:</td>
                <td className="p-1.5 border border-slate-300 text-right">{formatRupiah(totals.siplahRiil)}</td>
                <td className="p-1.5 border border-slate-300 text-right">{formatRupiah(totals.siplahSI)}</td>
                <td className="p-1.5 border border-slate-300 text-right text-rose-700">{formatRupiah(totals.siplahWajib)}</td>
                <td className="p-1.5 border border-slate-300 text-right text-emerald-700 font-black">{formatRupiah(totals.siplahSudah)}</td>
                <td className="p-1.5 border border-slate-300 text-right font-bold">Rp 0</td>
                <td className="p-1.5 border border-slate-300 text-center text-[10px]">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Section 3: Grand Total Table Box */}
        <div className="my-6 border-2 border-slate-900 rounded-2xl overflow-hidden">
          <div className="bg-slate-900 text-white p-3 font-black text-xs uppercase tracking-wider flex items-center justify-between">
            <span>REKAPITULASI TOTAL KESELURUHAN DANA PENGEMBALIAN KAS BOSP</span>
            <span>Tahun Anggaran {school.tahunAnggaran}</span>
          </div>
          <div className="p-4 bg-slate-50 space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="font-semibold text-slate-700">1. Total Pencairan di Standing Instruction (SI) Bank:</span>
              <span className="font-bold text-slate-900">{formatRupiah(totals.totalSISemua)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="font-semibold text-slate-700">2. Total Realisasi Pengeluaran Riil (Gaji & Faktur):</span>
              <span className="font-bold text-slate-900">{formatRupiah(totals.totalRiilSemua)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="font-semibold text-slate-700">3. Total Target Dana Wajib Dikembalikan ke Kas:</span>
              <span className="font-bold text-rose-800">{formatRupiah(totals.totalWajibKembaliSemua)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b-2 border-slate-400 bg-emerald-50/70 px-2 rounded-lg">
              <span className="font-black text-emerald-900 uppercase">
                4. TOTAL DANA YANG SUDAH DIKEMBALIKAN KE KAS SEKOLAH:
              </span>
              <span className="text-sm font-black text-emerald-950">
                {formatRupiah(totals.totalSudahKembaliSemua)}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-200 bg-amber-50/70 px-2 rounded-lg">
              <span className="font-black text-amber-900 uppercase">
                5. TOTAL SISA DANA BELUM DIKEMBALIKAN (TUNGGAKAN):
              </span>
              <span className="text-sm font-black text-amber-950">
                {formatRupiah(totals.totalSisaBelumKembaliSemua)}
              </span>
            </div>
            <div className="flex justify-between pt-1 text-[11px] text-slate-600 font-medium">
              <span>Tingkat Persentase Realisasi Kas Pengembalian:</span>
              <span className="font-bold text-teal-800">{totals.persentaseRealisasiSemua}% Telah Masuk Kas</span>
            </div>
          </div>
        </div>

        {/* Tanda Tangan Resmi */}
        <div className="mt-8 pt-4 flex justify-between items-start text-xs font-medium text-slate-900">
          <div className="text-center w-64">
            <p>Mengetahui,</p>
            <p className="font-bold">Kepala Sekolah</p>
            <div className="h-20" />
            <p className="font-black underline uppercase">{school.kepalaSekolah}</p>
            <p className="text-slate-600">NIP. {school.nipKepalaSekolah}</p>
          </div>

          <div className="text-center w-64">
            <p>Bogor, {currentDate}</p>
            <p className="font-bold">Bendahara BOSP</p>
            <div className="h-20" />
            <p className="font-black underline uppercase">{school.bendahara}</p>
            <p className="text-slate-600">NIP. {school.nipBendahara}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
