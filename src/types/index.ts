// ============================================================
// TypeScript Interfaces — sesuai SRS ERD Section 4.3
// ============================================================

export type Peran = 'super_admin' | 'admin' | 'dokter' | 'perawat' | 'resepsionis';
export type JenisKelamin = 'L' | 'P';
export type StatusKunjungan = 'booked' | 'hadir' | 'selesai' | 'batal' | 'skip';
export type CaraPakai = 'oral' | 'topikal' | 'injeksi' | 'inhalasi' | 'lainnya';
export type GolonganDarah = 'A' | 'B' | 'AB' | 'O' | 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type HariPraktek = 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu';
export type StatusAudit = 'sukses' | 'gagal';

export interface Spesialisasi {
  id: string;
  nama: string;
  status_aktif: boolean;
  created_at: Date;
}

export interface User {
  id: string;
  username: string;
  password_hash: string;
  peran: Peran;
  nama_lengkap: string;
  email: string | null;
  nomor_hp: string | null;
  spesialisasi: string | null;
  nomor_str: string | null;
  totp_secret: string | null;
  status_aktif: boolean;
  dibuat_oleh: string | null;
  created_at: Date;
}

export interface Pasien {
  id: string;
  nomor_rm: string;
  nik: string | null;
  nama_lengkap: string;
  tanggal_lahir: Date;
  jenis_kelamin: JenisKelamin;
  nomor_hp: string;
  alamat: string;
  pekerjaan: string | null;
  pendidikan: string | null;
  status_perkawinan: string | null;
  agama: string | null;
  golongan_darah: GolonganDarah | null;
  alergi: string | null;
  riwayat_kronis: string | null;
  nomor_paspor: string | null;
  nik_wali: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface OTP {
  id: string;
  nomor_hp: string;
  kode: string;
  expired_at: Date;
  digunakan: boolean;
  created_at: Date;
}

export interface ICD10 {
  kode: string;
  deskripsi: string;
  kategori: string | null;
}

export interface JadwalPraktek {
  id: string;
  id_dokter: string;
  hari: HariPraktek;
  jam_mulai: string;
  jam_selesai: string;
  durasi_menit: number;
  kuota: number;
  status_aktif: boolean;
  created_at: Date;
}

export interface Kunjungan {
  id: string;
  id_pasien: string;
  id_dokter: string;
  id_jadwal: string;
  tanggal: Date;
  slot_jam: string;
  status: StatusKunjungan;
  keluhan_awal: string | null;
  dikonfirmasi_oleh: string | null;
  waktu_konfirmasi: Date | null;
  alasan_skip: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CatatanSOAP {
  id: string;
  id_kunjungan: string;
  subjektif: string | null;
  riwayat_penyakit_sekarang: string | null;
  td_sistolik: number | null;
  td_diastolik: number | null;
  nadi: number | null;
  suhu: number | null;
  frekuensi_napas: number | null;
  spo2: number | null;
  berat_badan: number | null;
  tinggi_badan: number | null;
  imt: number | null;
  pemeriksaan_fisik: string | null;
  hasil_penunjang: string | null;
  file_penunjang_url: string | null;
  kode_dx: string;
  kode_dx_banding: string | null;
  tindakan: string | null;
  anjuran: string | null;
  pemeriksaan_lanjutan: string | null;
  jadwal_kontrol: Date | null;
  alasan_kontrol: string | null;
  created_at: Date;
}

export interface Resep {
  id: string;
  id_soap: string;
  urutan: number;
  nama_obat: string;
  dosis: string | null;
  frekuensi: string | null;
  durasi: string | null;
  jumlah: number | null;
  cara_pakai: CaraPakai;
  catatan: string | null;
  created_at: Date;
}

export interface AuditLog {
  id: number;
  waktu: Date;
  id_user: string | null;
  peran_user: string | null;
  aktivitas: string;
  tabel_target: string | null;
  id_target: string | null;
  ip_address: string | null;
  status: StatusAudit;
  keterangan: string | null;
}

// ============================================================
// Payload JWT — disimpan di httpOnly cookie
// ============================================================
export interface JwtPayload {
  sub: string;
  peran: Peran | 'pasien';
  nama: string;
  iat?: number;
  exp?: number;
  last_active?: number;
}

// ============================================================
// Request extension — user yang sudah terautentikasi
// ============================================================
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// ============================================================
// Slot waktu yang di-generate dari jadwal praktek
// ============================================================
export interface SlotWaktu {
  jam: string;
  tersedia: boolean;
  sisa_kuota?: number;
}

// ============================================================
// Data tampilan antrian dokter
// ============================================================
export interface AntrianItem {
  kunjungan_id: string;
  nomor_rm: string;
  nama_pasien: string;
  usia: number;
  waktu_konfirmasi: Date;
  keluhan_awal: string | null;
  status: StatusKunjungan;
  alasan_skip: string | null;
}
