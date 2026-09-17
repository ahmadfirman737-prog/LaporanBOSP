export interface SchoolData {
  namaSekolah: string;
  alamatSekolah: string;
  npsn: string;
  tahunAnggaran: string;
  kepalaSekolah: string;
  nipKepalaSekolah: string;
  bendahara: string;
  nipBendahara: string;
  logoUrl: string;
}

export interface Guru {
  id: number;
  nama: string;
  jabatan: string;
  status: string;
  gajiDefault: number;
  norek: string;
}

export interface HonorEntry {
  id: number;
  idGuru: number;
  bulan: string;
  gaji: number;
  isGajiLocked: boolean;
  jumlahSI: number;
  keterangan: string;
  statusPengembalian?: "belum" | "sudah";
  tanggalPengembalian?: string;
  jumlahDikembalikan?: number;
}

export interface SiplahEntry {
  id: number;
  tanggal: string;
  toko: string;
  keperluan: string;
  jumlahSIPLah: number;
  jumlahSI: number;
  noSpk: string;
}

export interface ToastNotification {
  id: number;
  message: string;
  type: "success" | "info" | "warning" | "error";
}

export interface AuthUser {
  id: string;
  username: string;
  password?: string;
  nama: string;
  role: string;
  nip?: string;
  email: string;
  avatar?: string;
  status?: "Aktif" | "Nonaktif";
  createdAt?: string;
  lastLogin?: string;
}

export type TabType =
  | "dashboard"
  | "honor"
  | "siplah"
  | "laporan-honor"
  | "laporan-siplah"
  | "laporan-pengembalian"
  | "laporan"
  | "guru"
  | "users"
  | "pengaturan";
