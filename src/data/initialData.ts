import { SchoolData, Guru, HonorEntry, SiplahEntry, AuthUser } from "../types";

export const initialSchoolData: SchoolData = {
  namaSekolah: "YAYASAN PENDIDIKAN KUSUMA BANGSA BOGOR",
  alamatSekolah: "Jl. Pendidikan No. 45, Kota Bogor, Jawa Barat",
  npsn: "20231234",
  tahunAnggaran: "2026",
  kepalaSekolah: "Drs. H. Ahmad Dahlan, M.Pd.",
  nipKepalaSekolah: "19720315 199803 1 004",
  bendahara: "Siti Rahmawati, S.E.",
  nipBendahara: "19850722 201001 2 015",
  logoUrl: "/logo.svg?v=kusuma2",
};

export const initialUsersList: AuthUser[] = [
  {
    id: "usr-1",
    username: "bendahara",
    password: "123",
    nama: "Siti Rahmawati, S.E.",
    role: "Bendahara BOSP",
    nip: "19850722 201001 2 015",
    email: "bendahara@kusumabangsa.sch.id",
    status: "Aktif",
    createdAt: "2026-01-01",
  },
  {
    id: "usr-2",
    username: "kepsek",
    password: "123",
    nama: "Drs. H. Ahmad Dahlan, M.Pd.",
    role: "Kepala Sekolah",
    nip: "19720315 199803 1 004",
    email: "kepsek@kusumabangsa.sch.id",
    status: "Aktif",
    createdAt: "2026-01-01",
  },
  {
    id: "usr-3",
    username: "admin",
    password: "123",
    nama: "Ahmad Firman",
    role: "Operator Keuangan",
    nip: "19940812 202102 1 008",
    email: "operator@kusumabangsa.sch.id",
    status: "Aktif",
    createdAt: "2026-01-01",
  },
];

export const initialGuruList: Guru[] = [
  {
    id: 1,
    nama: "Budi Santoso, S.Pd.",
    jabatan: "Guru Kelas 6",
    status: "GTT / Honorer",
    gajiDefault: 2500000,
    norek: "Bank BJB - 123-456-7890",
  },
  {
    id: 2,
    nama: "Ani Wijaya, S.Pd.",
    jabatan: "Guru Bahasa Inggris",
    status: "Guru P3K",
    gajiDefault: 2800000,
    norek: "Bank BJB - 234-567-8901",
  },
  {
    id: 3,
    nama: "Rahmat Hidayat, S.Kom.",
    jabatan: "Operator Sekolah / Tendik",
    status: "Tenaga Kependidikan",
    gajiDefault: 2200000,
    norek: "Bank Mandiri - 345-678-9012",
  },
  {
    id: 4,
    nama: "Dewi Lestari, S.Pd.SD",
    jabatan: "Guru Kelas 3",
    status: "GTT / Honorer",
    gajiDefault: 2400000,
    norek: "Bank BJB - 456-789-0123",
  },
];

export const initialHonorList: HonorEntry[] = [
  {
    id: 101,
    idGuru: 1,
    bulan: "Januari 2026",
    gaji: 2500000,
    isGajiLocked: true,
    jumlahSI: 2750000,
    keterangan: "Pencairan Honor Jan",
    statusPengembalian: "sudah",
    tanggalPengembalian: "2026-01-25",
    jumlahDikembalikan: 250000,
  },
  {
    id: 102,
    idGuru: 2,
    bulan: "Januari 2026",
    gaji: 2800000,
    isGajiLocked: true,
    jumlahSI: 2800000,
    keterangan: "Pencairan Honor Jan",
    statusPengembalian: "sudah",
    jumlahDikembalikan: 0,
  },
  {
    id: 103,
    idGuru: 3,
    bulan: "Januari 2026",
    gaji: 2200000,
    isGajiLocked: false,
    jumlahSI: 2500000,
    keterangan: "Pencairan Honor Jan",
    statusPengembalian: "belum",
    jumlahDikembalikan: 0,
  },
];

export const initialSiplahList: SiplahEntry[] = [
  {
    id: 201,
    tanggal: "2026-01-12",
    toko: "CV. Buku Media Pendidikan",
    keperluan: "Pembelian Buku Teks Utama Kurikulum Merdeka",
    jumlahSIPLah: 12500000,
    jumlahSI: 13000000,
    noSpk: "050/SPK/BOSP/2026",
    statusPengembalian: "sudah",
    tanggalPengembalian: "2026-01-18",
    jumlahDikembalikan: 500000,
  },
  {
    id: 202,
    tanggal: "2026-01-20",
    toko: "PT. Sarana Perabot Sekolah",
    keperluan: "Pengadaan Meja Kursi Siswa",
    jumlahSIPLah: 8400000,
    jumlahSI: 8400000,
    noSpk: "051/SPK/BOSP/2026",
    statusPengembalian: "sudah",
    jumlahDikembalikan: 0,
  },
  {
    id: 203,
    tanggal: "2026-02-05",
    toko: "Toko ATK Berkah",
    keperluan: "Pengadaan Kertas A4, Tinta Printer & Alat Tulis",
    jumlahSIPLah: 3200000,
    jumlahSI: 3500000,
    noSpk: "052/SPK/BOSP/2026",
    statusPengembalian: "belum",
    tanggalPengembalian: undefined,
    jumlahDikembalikan: 0,
  },
];

export const formatRupiah = (val: number | string): string => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
};
