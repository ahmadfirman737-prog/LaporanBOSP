import React from "react";
import {
  Printer,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  FileCheck,
  ShoppingBag,
} from "lucide-react";
import * as XLSX from "xlsx";
import { SchoolData, HonorEntry, SiplahEntry, Guru, TabType } from "../types";
import { formatRupiah } from "../data/initialData";

interface LaporanViewProps {
  school: SchoolData;
  honorList: HonorEntry[];
  siplahList: SiplahEntry[];
  guruList: Guru[];
  totalHonorGaji: number;
  totalHonorSI: number;
  totalHonorKembali: number;
  totalSIPLahNominal: number;
  totalSIPLahSI: number;
  totalSIPLahKembali: number;
  grandTotalPengembalian: number;
  onNavigateTab?: (tab: TabType) => void;
  showToast: (message: string, type?: "success" | "info" | "warning" | "error") => void;
}

export const LaporanView: React.FC<LaporanViewProps> = ({
  school,
  honorList,
  siplahList,
  guruList,
  totalHonorGaji,
  totalHonorSI,
  totalHonorKembali,
  totalSIPLahNominal,
  totalSIPLahSI,
  totalSIPLahKembali,
  grandTotalPengembalian,
  onNavigateTab,
  showToast,
}) => {
  const currentDate = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    try {
      // 1. Sheet Honor
      const honorData = honorList.map((item, idx) => {
        const guru = guruList.find((g) => g.id === Number(item.idGuru));
        const kembali = Math.max(0, Number(item.jumlahSI) - Number(item.gaji));
        return {
          No: idx + 1,
          "Nama Guru / Tendik": guru?.nama || "Guru",
          Jabatan: guru?.jabatan || "-",
          Bulan: item.bulan,
          "Hak Gaji (Rp)": Number(item.gaji),
          "Jumlah di-SI-kan (Rp)": Number(item.jumlahSI),
          "Harus Dikembalikan (Rp)": kembali,
          Keterangan: item.keterangan || "-",
        };
      });

      // Total row for Honor
      honorData.push({
        No: "TOTAL" as any,
        "Nama Guru / Tendik": "",
        Jabatan: "",
        Bulan: "",
        "Hak Gaji (Rp)": totalHonorGaji,
        "Jumlah di-SI-kan (Rp)": totalHonorSI,
        "Harus Dikembalikan (Rp)": totalHonorKembali,
        Keterangan: "",
      });

      // 2. Sheet SIPLah
      const siplahData = siplahList.map((item, idx) => {
        const kembali = Math.max(0, Number(item.jumlahSI) - Number(item.jumlahSIPLah));
        return {
          No: idx + 1,
          Tanggal: item.tanggal,
          "No SPK": item.noSpk,
          "Toko / Rekanan": item.toko,
          "Keperluan Belanja": item.keperluan,
          "Nominal Invoice SIPLah (Rp)": Number(item.jumlahSIPLah),
          "Jumlah di-SI-kan (Rp)": Number(item.jumlahSI),
          "Harus Dikembalikan (Rp)": kembali,
        };
      });

      // Total row for SIPLah
      siplahData.push({
        No: "TOTAL" as any,
        Tanggal: "",
        "No SPK": "",
        "Toko / Rekanan": "",
        "Keperluan Belanja": "",
        "Nominal Invoice SIPLah (Rp)": totalSIPLahNominal,
        "Jumlah di-SI-kan (Rp)": totalSIPLahSI,
        "Harus Dikembalikan (Rp)": totalSIPLahKembali,
      });

      // 3. Sheet Ringkasan Eksekutif
      const ringkasanData = [
        { Deskripsi: "Nama Sekolah", Nilai: school.namaSekolah },
        { Deskripsi: "NPSN", Nilai: school.npsn },
        { Deskripsi: "Tahun Anggaran", Nilai: school.tahunAnggaran },
        { Deskripsi: "Kepala Sekolah", Nilai: `${school.kepalaSekolah} (NIP: ${school.nipKepalaSekolah})` },
        { Deskripsi: "Bendahara BOSP", Nilai: `${school.bendahara} (NIP: ${school.nipBendahara})` },
        { Deskripsi: "", Nilai: "" },
        { Deskripsi: "Total Hak Gaji Guru", Nilai: totalHonorGaji },
        { Deskripsi: "Total Pencairan SI Guru", Nilai: totalHonorSI },
        { Deskripsi: "Pengembalian Dana SI Guru", Nilai: totalHonorKembali },
        { Deskripsi: "", Nilai: "" },
        { Deskripsi: "Total Realisasi SIPLah", Nilai: totalSIPLahNominal },
        { Deskripsi: "Total Pencairan SI SIPLah", Nilai: totalSIPLahSI },
        { Deskripsi: "Pengembalian Dana SI SIPLah", Nilai: totalSIPLahKembali },
        { Deskripsi: "", Nilai: "" },
        { Deskripsi: "GRAND TOTAL PENGEMBALIAN DANA SI KE KAS BOSP", Nilai: grandTotalPengembalian },
      ];

      const wb = XLSX.utils.book_new();

      const wsSummary = XLSX.utils.json_to_sheet(ringkasanData);
      const wsHonor = XLSX.utils.json_to_sheet(honorData);
      const wsSiplah = XLSX.utils.json_to_sheet(siplahData);

      XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan BOSP");
      XLSX.utils.book_append_sheet(wb, wsHonor, "Realisasi Honor");
      XLSX.utils.book_append_sheet(wb, wsSiplah, "Realisasi SIPLah");

      const fileName = `Laporan_BOSP_${school.npsn}_TA${school.tahunAnggaran}.xlsx`;
      XLSX.writeFile(wb, fileName);

      showToast(`Laporan berhasil diekspor: ${fileName}`);
    } catch (err) {
      console.error(err);
      showToast("Gagal mengekspor file Excel.", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Report Navigation Hub (Hidden in Print) */}
      <div className="no-print bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-1.5 p-1 bg-slate-100/90 rounded-2xl">
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab("laporan-honor")}
            className="px-4 py-2 hover:bg-white text-slate-600 hover:text-indigo-600 font-bold text-xs rounded-xl transition flex items-center gap-2"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Laporan Honor Guru</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab("laporan-siplah")}
            className="px-4 py-2 hover:bg-white text-slate-600 hover:text-indigo-600 font-bold text-xs rounded-xl transition flex items-center gap-2"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Laporan Belanja SIPLah</span>
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-indigo-600 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2"
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

      {/* Action Bar (Hidden during print) */}
      <div className="no-print bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
            <span>Dokumen Laporan Resmi Realisasi & Pengembalian Dana BOSP</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Format resmi siap cetak ke kertas A4 atau diekspor ke Microsoft Excel (.xlsx)
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={handleExportExcel}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs shadow-md shadow-emerald-600/20 transition flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Excel</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-none px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs shadow-md transition flex items-center justify-center space-x-2"
          >
            <Printer className="w-4 h-4 text-indigo-400" />
            <span>Cetak PDF (A4)</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet Container (Optimized for A4) */}
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
          <div className="text-center flex-1 pr-10">
            <h1 className="font-black text-slate-900 text-base md:text-xl uppercase tracking-wider">
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
            LAPORAN REKAPITULASI REALISASI & PENGEMBALIAN DANA STANDING INSTRUCTION (SI)
          </h2>
          <p className="text-xs text-slate-500 font-semibold">
            Bantuan Operasional Satuan Pendidikan (BOSP) &bull; Tahun Anggaran {school.tahunAnggaran}
          </p>
        </div>

        {/* Bagian I: Honor Guru & Tendik */}
        <div className="my-6 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="font-extrabold text-slate-900 text-xs tracking-wide uppercase">
              I. REKAPITULASI PENCAIRAN HONOR GURU & TENAGA KEPENDIDIKAN
            </h3>
            <span className="text-[11px] font-bold text-slate-500">
              {honorList.length} Transaksi
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-2.5 border border-slate-300 text-center w-10">No</th>
                  <th className="p-2.5 border border-slate-300">Nama Guru / Tendik</th>
                  <th className="p-2.5 border border-slate-300">Bulan</th>
                  <th className="p-2.5 border border-slate-300 text-right">Hak Gaji</th>
                  <th className="p-2.5 border border-slate-300 text-right">Jumlah di-SI-kan</th>
                  <th className="p-2.5 border border-slate-300 text-right">Harus Dikembalikan</th>
                  <th className="p-2.5 border border-slate-300">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                {honorList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-slate-400">
                      Belum ada data realisasi honor.
                    </td>
                  </tr>
                ) : (
                  honorList.map((item, idx) => {
                    const guru = guruList.find((g) => g.id === Number(item.idGuru));
                    const kembali = Math.max(0, Number(item.jumlahSI) - Number(item.gaji));
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70">
                        <td className="p-2.5 border border-slate-300 text-center font-bold">
                          {idx + 1}
                        </td>
                        <td className="p-2.5 border border-slate-300">
                          <div className="font-bold">{guru ? guru.nama : "Guru"}</div>
                          <div className="text-[10px] text-slate-500">{guru?.jabatan}</div>
                        </td>
                        <td className="p-2.5 border border-slate-300">{item.bulan}</td>
                        <td className="p-2.5 border border-slate-300 text-right font-bold">
                          {formatRupiah(item.gaji)}
                        </td>
                        <td className="p-2.5 border border-slate-300 text-right font-bold text-indigo-700">
                          {formatRupiah(item.jumlahSI)}
                        </td>
                        <td className="p-2.5 border border-slate-300 text-right font-black text-amber-700">
                          {formatRupiah(kembali)}
                        </td>
                        <td className="p-2.5 border border-slate-300 text-[11px]">
                          {item.keterangan || "-"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot className="bg-slate-100/80 font-black text-slate-900">
                <tr>
                  <td colSpan={3} className="p-2.5 border border-slate-300 text-right uppercase">
                    Subtotal Honor:
                  </td>
                  <td className="p-2.5 border border-slate-300 text-right">
                    {formatRupiah(totalHonorGaji)}
                  </td>
                  <td className="p-2.5 border border-slate-300 text-right text-indigo-700">
                    {formatRupiah(totalHonorSI)}
                  </td>
                  <td className="p-2.5 border border-slate-300 text-right text-amber-700">
                    {formatRupiah(totalHonorKembali)}
                  </td>
                  <td className="p-2.5 border border-slate-300"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Bagian II: Belanja SIPLah */}
        <div className="my-8 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="font-extrabold text-slate-900 text-xs tracking-wide uppercase">
              II. REKAPITULASI REALISASI BELANJA SIPLAH
            </h3>
            <span className="text-[11px] font-bold text-slate-500">
              {siplahList.length} Transaksi
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-2.5 border border-slate-300 text-center w-10">No</th>
                  <th className="p-2.5 border border-slate-300">Toko / Rekanan</th>
                  <th className="p-2.5 border border-slate-300">Uraian / Keperluan</th>
                  <th className="p-2.5 border border-slate-300 text-right">Nominal SIPLah</th>
                  <th className="p-2.5 border border-slate-300 text-right">Jumlah di-SI-kan</th>
                  <th className="p-2.5 border border-slate-300 text-right">Harus Dikembalikan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                {siplahList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-slate-400">
                      Belum ada data transaksi belanja SIPLah.
                    </td>
                  </tr>
                ) : (
                  siplahList.map((item, idx) => {
                    const kembali = Math.max(0, Number(item.jumlahSI) - Number(item.jumlahSIPLah));
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70">
                        <td className="p-2.5 border border-slate-300 text-center font-bold">
                          {idx + 1}
                        </td>
                        <td className="p-2.5 border border-slate-300">
                          <div className="font-bold">{item.toko}</div>
                          <div className="text-[10px] text-slate-500">
                            {item.tanggal} &bull; {item.noSpk}
                          </div>
                        </td>
                        <td className="p-2.5 border border-slate-300 max-w-[220px]">
                          {item.keperluan}
                        </td>
                        <td className="p-2.5 border border-slate-300 text-right font-bold">
                          {formatRupiah(item.jumlahSIPLah)}
                        </td>
                        <td className="p-2.5 border border-slate-300 text-right font-bold text-indigo-700">
                          {formatRupiah(item.jumlahSI)}
                        </td>
                        <td className="p-2.5 border border-slate-300 text-right font-black text-amber-700">
                          {formatRupiah(kembali)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot className="bg-slate-100/80 font-black text-slate-900">
                <tr>
                  <td colSpan={3} className="p-2.5 border border-slate-300 text-right uppercase">
                    Subtotal Belanja SIPLah:
                  </td>
                  <td className="p-2.5 border border-slate-300 text-right">
                    {formatRupiah(totalSIPLahNominal)}
                  </td>
                  <td className="p-2.5 border border-slate-300 text-right text-indigo-700">
                    {formatRupiah(totalSIPLahSI)}
                  </td>
                  <td className="p-2.5 border border-slate-300 text-right text-amber-700">
                    {formatRupiah(totalSIPLahKembali)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Grand Total Box */}
        <div className="my-6 p-5 rounded-2xl bg-amber-50/90 border-2 border-amber-300 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-amber-950 text-sm">
                GRAND TOTAL PENGEMBALIAN DANA STANDING INSTRUCTION (SI)
              </h4>
              <p className="text-[11px] text-amber-800 font-medium">
                Total selisih dana yang wajib disetorkan kembali ke Rekening Kas Sekolah (BOSP)
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl md:text-3xl font-black text-amber-900">
              {formatRupiah(grandTotalPengembalian)}
            </span>
          </div>
        </div>

        {/* Tanda Tangan Resmi (A4 Kept Intact) */}
        <div className="print-signature-block mt-12 pt-6 grid grid-cols-2 text-center text-xs font-medium text-slate-900 gap-8">
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
              {school.alamatSekolah.split(",")[1]?.trim() || "Nusantara"},{" "}
              {currentDate}
              <br />
              <strong>Bendahara BOSP</strong>
            </p>
            <p className="font-black text-sm uppercase underline decoration-2">{school.bendahara}</p>
            <p className="text-[11px] text-slate-600 mt-0.5">NIP. {school.nipBendahara}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
