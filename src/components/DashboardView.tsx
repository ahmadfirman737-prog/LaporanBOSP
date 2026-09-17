import React from "react";
import {
  Award,
  MapPin,
  Printer,
  Plus,
  UserCheck,
  ShoppingCart,
  RotateCcw,
  ArrowRight,
  Store,
  Wallet,
  FileCheck,
  ReceiptText,
} from "lucide-react";
import { SchoolData, HonorEntry, SiplahEntry, Guru, TabType } from "../types";
import { formatRupiah } from "../data/initialData";

interface DashboardViewProps {
  school: SchoolData;
  totalHonorGaji: number;
  totalHonorSI: number;
  totalHonorKembali: number;
  totalSIPLahNominal: number;
  totalSIPLahSI: number;
  totalSIPLahKembali: number;
  grandTotalPengembalian: number;
  honorList: HonorEntry[];
  siplahList: SiplahEntry[];
  guruList: Guru[];
  setActiveTab: (tab: TabType) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  school,
  totalHonorGaji,
  totalHonorSI,
  totalHonorKembali,
  totalSIPLahNominal,
  totalSIPLahSI,
  totalSIPLahKembali,
  grandTotalPengembalian,
  honorList,
  siplahList,
  guruList,
  setActiveTab,
}) => {
  return (
    <div className="space-y-6">
      {/* Main Hero Banner */}
      <div className="relative rounded-3xl bg-white p-6 md:p-8 text-slate-900 shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-50/80 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <img
              src={school.logoUrl || "/logo.svg"}
              alt="Logo Sekolah"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-contain bg-white p-1.5 border border-slate-200/90 shadow-sm shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/logo.svg";
              }}
            />
            <div className="space-y-1.5">
              <div className="inline-flex items-center space-x-2 bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs px-3.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                <Award className="w-3.5 h-3.5" />
                <span>Realisasi Dana BOSP Tahun {school.tahunAnggaran}</span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-slate-900">
                {school.namaSekolah}
              </h1>
              <p className="text-slate-600 text-xs md:text-sm max-w-xl font-medium leading-relaxed flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>{school.alamatSekolah}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => setActiveTab("laporan-honor")}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-bold rounded-2xl text-xs transition border border-slate-200/80 flex items-center space-x-2"
              title="Buka Laporan Honor Guru format A4"
            >
              <FileCheck className="w-4 h-4 text-indigo-600" />
              <span>Laporan Honor (A4)</span>
            </button>
            <button
              onClick={() => setActiveTab("laporan-siplah")}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-bold rounded-2xl text-xs transition border border-slate-200/80 flex items-center space-x-2"
              title="Buka Laporan Belanja SIPLah format A4"
            >
              <ReceiptText className="w-4 h-4 text-emerald-600" />
              <span>Laporan SIPLah (A4)</span>
            </button>
            <button
              onClick={() => setActiveTab("laporan")}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs shadow-sm transition flex items-center space-x-2"
              title="Cetak Dokumen Rekapitulasi Gabungan BOSP"
            >
              <Printer className="w-4 h-4 text-indigo-400" />
              <span>Rekap BOSP</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Honor Summary */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 hover:shadow-md transition duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Pencairan Honor Guru
            </span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-slate-900">
              {formatRupiah(totalHonorSI)}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Total Hak Gaji:</span>
                <strong className="text-slate-700">{formatRupiah(totalHonorGaji)}</strong>
              </div>
              <div className="flex justify-between font-bold text-amber-600">
                <span>Total Kembalian:</span>
                <span>{formatRupiah(totalHonorKembali)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* SIPLah Summary */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 hover:shadow-md transition duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Belanja SIPLah
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-slate-900">
              {formatRupiah(totalSIPLahSI)}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Nominal Invoice SIPLah:</span>
                <strong className="text-slate-700">{formatRupiah(totalSIPLahNominal)}</strong>
              </div>
              <div className="flex justify-between font-bold text-amber-600">
                <span>Total Kembalian:</span>
                <span>{formatRupiah(totalSIPLahKembali)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Total Refund Summary */}
        <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white rounded-3xl p-6 shadow-lg hover:shadow-xl transition duration-300 relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold text-amber-100 uppercase tracking-wider">
              Total Pengembalian Dana SI
            </span>
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center font-bold">
              <RotateCcw className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 relative z-10">
            <div className="text-3xl font-black">{formatRupiah(grandTotalPengembalian)}</div>
            <p className="text-xs text-amber-100 mt-2 font-medium leading-relaxed">
              Akumulasi selisih dana SI yang harus disetorkan kembali ke Rekening Kas Sekolah / BOSP.
            </p>
          </div>
        </div>
      </div>

      {/* Preview Activity Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Honor Transactions Preview */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Wallet className="w-4 h-4 text-indigo-500" />
              <span>Transaksi Honor Terakhir</span>
            </h3>
            <button
              onClick={() => setActiveTab("honor")}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-3">
            {honorList.slice(0, 3).map((item) => {
              const guru = guruList.find((g) => g.id === Number(item.idGuru));
              const kembali = Math.max(0, Number(item.jumlahSI) - Number(item.gaji));
              return (
                <div
                  key={item.id}
                  className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-slate-900 text-xs">
                      {guru ? guru.nama : "Guru"}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {item.bulan} &bull; SI: {formatRupiah(item.jumlahSI)}
                    </p>
                  </div>
                  <div>
                    <span
                      className={`px-3 py-1 rounded-xl font-bold text-[11px] ${
                        kembali > 0
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {kembali > 0 ? `Kembali ${formatRupiah(kembali)}` : "Sesuai Gaji"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SIPLah Transactions Preview */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Store className="w-4 h-4 text-emerald-500" />
              <span>Transaksi SIPLah Terakhir</span>
            </h3>
            <button
              onClick={() => setActiveTab("siplah")}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-3">
            {siplahList.slice(0, 3).map((item) => {
              const kembali = Math.max(0, Number(item.jumlahSI) - Number(item.jumlahSIPLah));
              return (
                <div
                  key={item.id}
                  className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 flex items-center justify-between"
                >
                  <div className="max-w-[200px] truncate">
                    <p className="font-bold text-slate-900 text-xs truncate">{item.toko}</p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {item.tanggal} &bull; SIPLah: {formatRupiah(item.jumlahSIPLah)}
                    </p>
                  </div>
                  <div>
                    <span
                      className={`px-3 py-1 rounded-xl font-bold text-[11px] ${
                        kembali > 0
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {kembali > 0 ? `Kembali ${formatRupiah(kembali)}` : "Sesuai SIPLah"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
