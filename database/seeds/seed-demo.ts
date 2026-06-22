/**
 * seed-demo.ts — Seed data DEMO/PRESENTASI (berjaga-jaga)
 * ----------------------------------------------------------------------------
 * Mengisi data yang "hidup" untuk presentasi & pengujian:
 *   • 15 pasien demo (profil lengkap, NIK/HP terenkripsi + hash seperti aplikasi)
 *   • Riwayat ~8 minggu: kunjungan SELESAI + Catatan SOAP + Resep
 *     (diagnosis bervariasi memakai data ICD-10 yang sudah diimpor)
 *   • Antrian HARI INI: campuran status booked / hadir / selesai
 *
 * Sifat:
 *   • IDEMPOTEN — hanya membersihkan datanya sendiri (pasien pas-demo-*),
 *     lalu menanam ulang. Aman dijalankan berkali-kali.
 *   • STANDALONE — tidak menyentuh data seed-harian. Slot HARI INI memakai
 *     band sore (mulai 13:00) agar tidak bentrok dgn seed-harian (pagi).
 *
 * Jalankan: npm run seed:demo   (atau: npx ts-node database/seeds/seed-demo.ts)
 * Prasyarat: jalankan `npm run seed` dulu (butuh user dokter & resepsionis).
 */
import 'dotenv/config';
import { v4 as uuidv4 } from 'uuid';
import { pool, testConnection } from '../../src/config/database';
import { enkripsi, hashPencarian } from '../../src/utils/encrypt';

// ─── Konfigurasi ─────────────────────────────────────────────────────────────
const WEEKS_HISTORY = 8;       // rentang riwayat ke belakang
const MIN_VISITS = 2;          // minimal kunjungan riwayat per pasien
const MAX_VISITS = 5;          // maksimal kunjungan riwayat per pasien

// ─── ID staf (dari seeder utama) ─────────────────────────────────────────────
const DR_BUDI  = 'usr-dr01-0000-0000-000000000003'; // Dokter Umum
const DR_SARI  = 'usr-dr02-0000-0000-000000000004'; // Spesialis Anak
const RESEPSIS = 'usr-res1-0000-0000-000000000006';

// ─── Tanggal ─────────────────────────────────────────────────────────────────
const now = new Date();
const TODAY = ymd(now);
const HARI_MAP = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function hms(totalMin: number): string {
  return `${String(Math.floor(totalMin / 60)).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}:00`;
}
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
/** jitter: base ± spread (integer) */
function j(base: number, spread: number): number {
  return base + randInt(-spread, spread);
}

// ─── Skenario klinis (memetakan ke kode ICD-10 yang sudah diimpor) ──────────
interface Obat { nama: string; dosis: string; frekuensi: string; durasi: string; jumlah: number; cara: string; }
interface Skenario {
  kode_dx: string;
  keluhan: string;
  subjektif: string;
  pemeriksaan_fisik: string;
  tindakan: string;
  anjuran: string;
  // vitals dasar dewasa/anak (akan diberi jitter)
  tds: number; tdd: number; nadi: number; suhu: number; rr: number; spo2: number;
  kontrol?: boolean; // sarankan jadwal kontrol
  resep: Obat[];
}

const SKEN_DEWASA: Record<string, Skenario> = {
  ispa: {
    kode_dx: 'J06', keluhan: 'Demam, batuk berdahak, pilek, dan nyeri tenggorokan',
    subjektif: 'Demam sejak 2 hari disertai batuk berdahak, pilek, dan nyeri menelan.',
    pemeriksaan_fisik: 'Faring hiperemis, tonsil T1-T1, tidak ada sesak. Paru vesikuler.',
    tindakan: 'Pemberian antipiretik dan mukolitik oral, edukasi.',
    anjuran: 'Istirahat cukup, perbanyak minum air putih. Kontrol bila demam menetap 3 hari.',
    tds: 120, tdd: 80, nadi: 88, suhu: 38.2, rr: 20, spo2: 98,
    resep: [
      { nama: 'Paracetamol 500mg', dosis: '500mg', frekuensi: '3x sehari', durasi: '5 hari', jumlah: 15, cara: 'oral' },
      { nama: 'Ambroxol 30mg', dosis: '30mg', frekuensi: '3x sehari', durasi: '5 hari', jumlah: 15, cara: 'oral' },
    ],
  },
  hipertensi: {
    kode_dx: 'I10', keluhan: 'Kontrol rutin hipertensi, kadang pusing dan tengkuk berat',
    subjektif: 'Kontrol rutin hipertensi. Sesekali pusing dan tengkuk terasa berat.',
    pemeriksaan_fisik: 'Tekanan darah meningkat. Bunyi jantung S1-S2 normal, tidak ada edema.',
    tindakan: 'Pengukuran TD serial, lanjutkan antihipertensi, edukasi gaya hidup.',
    anjuran: 'Diet rendah garam, kurangi makanan berlemak, olahraga ringan rutin. Kontrol 1 bulan.',
    tds: 152, tdd: 94, nadi: 78, suhu: 36.7, rr: 18, spo2: 98, kontrol: true,
    resep: [
      { nama: 'Amlodipine 5mg', dosis: '5mg', frekuensi: '1x sehari', durasi: '30 hari', jumlah: 30, cara: 'oral' },
    ],
  },
  diabetes: {
    kode_dx: 'E11', keluhan: 'Kontrol gula darah, sering haus dan sering kencing',
    subjektif: 'Kontrol DM tipe 2. Keluhan sering haus, sering kencing, mudah lelah.',
    pemeriksaan_fisik: 'GDS sewaktu meningkat. Tidak ada luka pada ekstremitas.',
    tindakan: 'Edukasi diet, lanjutkan terapi oral, pantau gula darah.',
    anjuran: 'Diet rendah gula, aktivitas fisik teratur, cek gula darah berkala. Kontrol 1 bulan.',
    tds: 132, tdd: 85, nadi: 82, suhu: 36.6, rr: 18, spo2: 98, kontrol: true,
    resep: [
      { nama: 'Metformin 500mg', dosis: '500mg', frekuensi: '2x sehari', durasi: '30 hari', jumlah: 60, cara: 'oral' },
    ],
  },
  gastritis: {
    kode_dx: 'K29', keluhan: 'Nyeri ulu hati, mual, perut kembung',
    subjektif: 'Nyeri ulu hati, mual, kembung, memberat saat telat makan.',
    pemeriksaan_fisik: 'Nyeri tekan epigastrium (+). Bising usus normal.',
    tindakan: 'Pemberian penghambat asam lambung dan antasida.',
    anjuran: 'Makan teratur, hindari makanan pedas, asam, dan kopi.',
    tds: 118, tdd: 78, nadi: 80, suhu: 36.7, rr: 18, spo2: 99,
    resep: [
      { nama: 'Omeprazole 20mg', dosis: '20mg', frekuensi: '2x sehari sebelum makan', durasi: '14 hari', jumlah: 28, cara: 'oral' },
      { nama: 'Antasida DOEN', dosis: '1 tablet', frekuensi: '3x sehari', durasi: '7 hari', jumlah: 21, cara: 'oral' },
    ],
  },
  asma: {
    kode_dx: 'J45', keluhan: 'Sesak napas berulang disertai mengi dan batuk malam',
    subjektif: 'Sesak napas berulang, mengi, batuk terutama malam hari.',
    pemeriksaan_fisik: 'Wheezing ekspirasi pada kedua lapang paru. Retraksi minimal.',
    tindakan: 'Pemberian bronkodilator, edukasi penggunaan inhaler.',
    anjuran: 'Hindari pencetus (debu, dingin, asap). Gunakan inhaler sesuai anjuran.',
    tds: 122, tdd: 80, nadi: 92, suhu: 36.8, rr: 24, spo2: 96,
    resep: [
      { nama: 'Salbutamol 2mg', dosis: '2mg', frekuensi: '3x sehari', durasi: '7 hari', jumlah: 21, cara: 'oral' },
    ],
  },
  migrain: {
    kode_dx: 'G43', keluhan: 'Nyeri kepala berdenyut sebelah disertai mual dan silau',
    subjektif: 'Nyeri kepala berdenyut sebelah kiri, mual, sensitif cahaya.',
    pemeriksaan_fisik: 'Neurologis dalam batas normal. Tidak ada defisit fokal.',
    tindakan: 'Analgesik dan antiemetik, edukasi pencetus.',
    anjuran: 'Tidur cukup, kelola stres, hindari pencetus. Kontrol bila memberat.',
    tds: 120, tdd: 80, nadi: 78, suhu: 36.6, rr: 18, spo2: 99,
    resep: [
      { nama: 'Ibuprofen 400mg', dosis: '400mg', frekuensi: '3x sehari setelah makan', durasi: '3 hari', jumlah: 9, cara: 'oral' },
    ],
  },
  dislipidemia: {
    kode_dx: 'E78', keluhan: 'Kontrol kolesterol tinggi tanpa keluhan berarti',
    subjektif: 'Kontrol kolesterol. Tidak ada keluhan khusus.',
    pemeriksaan_fisik: 'Status generalis dalam batas normal.',
    tindakan: 'Lanjutkan terapi penurun lipid, edukasi diet.',
    anjuran: 'Kurangi gorengan dan santan, olahraga rutin. Cek profil lipid berkala.',
    tds: 128, tdd: 84, nadi: 76, suhu: 36.6, rr: 18, spo2: 99, kontrol: true,
    resep: [
      { nama: 'Simvastatin 20mg', dosis: '20mg', frekuensi: '1x sehari malam', durasi: '30 hari', jumlah: 30, cara: 'oral' },
    ],
  },
  dermatitis: {
    kode_dx: 'L23', keluhan: 'Gatal dan kemerahan pada kulit setelah kontak bahan tertentu',
    subjektif: 'Gatal dan kemerahan pada kulit lengan sejak terkena deterjen.',
    pemeriksaan_fisik: 'Makula eritematosa berbatas tegas, ekskoriasi minimal.',
    tindakan: 'Antihistamin oral dan kortikosteroid topikal.',
    anjuran: 'Hindari bahan pencetus, jaga kelembapan kulit.',
    tds: 120, tdd: 80, nadi: 78, suhu: 36.6, rr: 18, spo2: 99,
    resep: [
      { nama: 'Cetirizine 10mg', dosis: '10mg', frekuensi: '1x sehari', durasi: '5 hari', jumlah: 5, cara: 'oral' },
      { nama: 'Hidrokortison krim 1%', dosis: 'oles tipis', frekuensi: '2x sehari', durasi: '7 hari', jumlah: 1, cara: 'topikal' },
    ],
  },
  diare: {
    kode_dx: 'A09', keluhan: 'BAB cair beberapa kali sejak kemarin disertai mual',
    subjektif: 'BAB cair 4-5x/hari sejak kemarin, mual, perut mulas.',
    pemeriksaan_fisik: 'Turgor kulit baik, bising usus meningkat. Tanda dehidrasi (-).',
    tindakan: 'Rehidrasi oral dan zinc, edukasi higiene.',
    anjuran: 'Banyak minum oralit, makan lunak, jaga kebersihan makanan.',
    tds: 116, tdd: 76, nadi: 90, suhu: 37.2, rr: 20, spo2: 98,
    resep: [
      { nama: 'Oralit', dosis: '1 sachet', frekuensi: 'tiap BAB cair', durasi: '3 hari', jumlah: 6, cara: 'oral' },
      { nama: 'Zinc 20mg', dosis: '20mg', frekuensi: '1x sehari', durasi: '10 hari', jumlah: 10, cara: 'oral' },
    ],
  },
  isk: {
    kode_dx: 'N39', keluhan: 'Nyeri saat berkemih dan anyang-anyangan',
    subjektif: 'Nyeri saat berkemih, anyang-anyangan, sedikit demam.',
    pemeriksaan_fisik: 'Nyeri tekan suprapubik ringan. Ketok ginjal (-).',
    tindakan: 'Pemberian antibiotik, edukasi hidrasi.',
    anjuran: 'Perbanyak minum, jangan menahan kencing, jaga higiene.',
    tds: 120, tdd: 80, nadi: 84, suhu: 37.5, rr: 18, spo2: 98,
    resep: [
      { nama: 'Ciprofloxacin 500mg', dosis: '500mg', frekuensi: '2x sehari', durasi: '5 hari', jumlah: 10, cara: 'oral' },
    ],
  },
};

const SKEN_ANAK: Record<string, Skenario> = {
  ispa_anak: {
    kode_dx: 'J06', keluhan: 'Batuk, pilek, dan demam, anak rewel',
    subjektif: 'Batuk pilek 3 hari, demam naik turun, anak rewel dan nafsu makan turun.',
    pemeriksaan_fisik: 'Faring hiperemis, tidak ada sesak, paru vesikuler. Tonsil T1-T1.',
    tindakan: 'Antipiretik dan mukolitik sirup sesuai berat badan.',
    anjuran: 'Banyak minum, istirahat, kompres hangat bila demam. Kontrol bila sesak.',
    tds: 95, tdd: 60, nadi: 100, suhu: 37.9, rr: 26, spo2: 98,
    resep: [
      { nama: 'Paracetamol Sirup', dosis: '5ml', frekuensi: '3x sehari bila demam', durasi: '3 hari', jumlah: 1, cara: 'oral' },
      { nama: 'Ambroxol Sirup', dosis: '2.5ml', frekuensi: '3x sehari', durasi: '5 hari', jumlah: 1, cara: 'oral' },
    ],
  },
  diare_anak: {
    kode_dx: 'A09', keluhan: 'BAB cair berulang, anak lemas dan kurang minum',
    subjektif: 'BAB cair 5x sejak semalam, anak lemas, minum berkurang.',
    pemeriksaan_fisik: 'Mata tidak cekung, turgor baik. Dehidrasi ringan.',
    tindakan: 'Rehidrasi oral dan zinc sirup, edukasi tanda bahaya.',
    anjuran: 'Beri oralit tiap BAB cair, lanjut ASI/makan. Segera kembali bila lemas berat.',
    tds: 90, tdd: 58, nadi: 110, suhu: 37.4, rr: 28, spo2: 98,
    resep: [
      { nama: 'Oralit', dosis: '1 sachet/200ml', frekuensi: 'tiap BAB cair', durasi: '3 hari', jumlah: 6, cara: 'oral' },
      { nama: 'Zinc Sirup', dosis: '5ml', frekuensi: '1x sehari', durasi: '10 hari', jumlah: 1, cara: 'oral' },
    ],
  },
  demam_anak: {
    kode_dx: 'R50', keluhan: 'Demam naik turun sejak 2 hari tanpa keluhan lain menonjol',
    subjektif: 'Demam naik turun 2 hari, tidak ada batuk/pilek berarti, anak masih aktif.',
    pemeriksaan_fisik: 'Tampak tidak toksik. Tidak ada ruam, faring tenang.',
    tindakan: 'Antipiretik, observasi, edukasi tanda bahaya demam.',
    anjuran: 'Kompres hangat, banyak minum. Kontrol bila demam >3 hari atau muncul ruam.',
    tds: 95, tdd: 60, nadi: 104, suhu: 38.4, rr: 26, spo2: 98,
    resep: [
      { nama: 'Paracetamol Sirup', dosis: '5ml', frekuensi: '4x sehari bila demam', durasi: '3 hari', jumlah: 1, cara: 'oral' },
    ],
  },
  dermatitis_anak: {
    kode_dx: 'L20', keluhan: 'Gatal dan kemerahan pada lipatan kulit',
    subjektif: 'Gatal dan kemerahan pada lipatan siku dan leher, hilang timbul.',
    pemeriksaan_fisik: 'Plak eritematosa kering pada area fleksural, bekas garukan.',
    tindakan: 'Pelembap, kortikosteroid topikal ringan, antihistamin bila perlu.',
    anjuran: 'Mandi air hangat (bukan panas), gunakan pelembap rutin, hindari sabun keras.',
    tds: 95, tdd: 60, nadi: 96, suhu: 36.8, rr: 24, spo2: 99,
    resep: [
      { nama: 'Pelembap (emolien)', dosis: 'oles', frekuensi: '2-3x sehari', durasi: '14 hari', jumlah: 1, cara: 'topikal' },
    ],
  },
  faringitis_anak: {
    kode_dx: 'J02', keluhan: 'Nyeri menelan dan demam',
    subjektif: 'Nyeri menelan sejak 2 hari, demam, nafsu makan menurun.',
    pemeriksaan_fisik: 'Faring hiperemis, tonsil T2-T2 tanpa eksudat.',
    tindakan: 'Antipiretik/analgesik, edukasi asupan cairan.',
    anjuran: 'Banyak minum hangat, makan lunak. Kontrol bila sulit menelan/sesak.',
    tds: 95, tdd: 60, nadi: 100, suhu: 38.0, rr: 26, spo2: 98,
    resep: [
      { nama: 'Paracetamol Sirup', dosis: '5ml', frekuensi: '3x sehari', durasi: '3 hari', jumlah: 1, cara: 'oral' },
    ],
  },
};

// ─── Data pasien demo (profil lengkap) ───────────────────────────────────────
interface PasienDemo {
  id: string; rm: string; nama: string; lahir: string; gender: 'L' | 'P';
  nik: string; hp: string; alamat: string;
  pekerjaan: string; pendidikan: string; status: string; agama: string; goldar: string;
  alergi: string | null; kronis: string | null;
  bb: number; tb: number;             // antropometri dasar
  dokter: string;                     // DR_BUDI / DR_SARI
  profil: string;                     // kunci skenario utama
  pool: Record<string, Skenario>;     // skenario yang relevan
}

const D = SKEN_DEWASA, A = SKEN_ANAK;

const PASIEN: PasienDemo[] = [
  // ── Dewasa → Dr. Budi (Umum) ──────────────────────────────────────────────
  { id: 'pas-demo-001', rm: 'RM-DEMO-0001', nama: 'Hendra Wijaya',   lahir: '1972-05-14', gender: 'L', nik: '7301011405720001', hp: '0899100000001', alamat: 'Jl. Anggrek No.10, Makassar', pekerjaan: 'Wiraswasta', pendidikan: 'SMA', status: 'Menikah', agama: 'Islam', goldar: 'O', alergi: null, kronis: 'Hipertensi', bb: 78, tb: 168, dokter: DR_BUDI, profil: 'hipertensi', pool: { hipertensi: D.hipertensi, ispa: D.ispa, gastritis: D.gastritis, migrain: D.migrain } },
  { id: 'pas-demo-002', rm: 'RM-DEMO-0002', nama: 'Sri Wahyuni',     lahir: '1968-09-02', gender: 'P', nik: '7301014209680002', hp: '0899100000002', alamat: 'Jl. Kenanga No.3, Makassar', pekerjaan: 'Ibu Rumah Tangga', pendidikan: 'SMP', status: 'Menikah', agama: 'Islam', goldar: 'B', alergi: null, kronis: 'Diabetes Melitus tipe 2', bb: 70, tb: 158, dokter: DR_BUDI, profil: 'diabetes', pool: { diabetes: D.diabetes, hipertensi: D.hipertensi, isk: D.isk, dermatitis: D.dermatitis } },
  { id: 'pas-demo-003', rm: 'RM-DEMO-0003', nama: 'Agus Salim',      lahir: '1985-12-19', gender: 'L', nik: '7301011912850003', hp: '0899100000003', alamat: 'Jl. Flamboyan No.7, Makassar', pekerjaan: 'Karyawan Swasta', pendidikan: 'S1', status: 'Menikah', agama: 'Islam', goldar: 'A', alergi: 'Amoksisilin', kronis: 'Gastritis kronis', bb: 72, tb: 172, dokter: DR_BUDI, profil: 'gastritis', pool: { gastritis: D.gastritis, ispa: D.ispa, migrain: D.migrain, diare: D.diare } },
  { id: 'pas-demo-004', rm: 'RM-DEMO-0004', nama: 'Lestari Ningsih', lahir: '1990-03-28', gender: 'P', nik: '7301016803900004', hp: '0899100000004', alamat: 'Jl. Dahlia No.21, Makassar', pekerjaan: 'Guru', pendidikan: 'S1', status: 'Menikah', agama: 'Kristen', goldar: 'O', alergi: null, kronis: 'Asma bronkial', bb: 58, tb: 160, dokter: DR_BUDI, profil: 'asma', pool: { asma: D.asma, ispa: D.ispa, dermatitis: D.dermatitis } },
  { id: 'pas-demo-005', rm: 'RM-DEMO-0005', nama: 'Bambang Sutrisno',lahir: '1965-07-07', gender: 'L', nik: '7301010707650005', hp: '0899100000005', alamat: 'Jl. Teratai No.5, Makassar', pekerjaan: 'Pensiunan', pendidikan: 'D3', status: 'Menikah', agama: 'Islam', goldar: 'AB', alergi: null, kronis: 'Dislipidemia', bb: 80, tb: 170, dokter: DR_BUDI, profil: 'dislipidemia', pool: { dislipidemia: D.dislipidemia, hipertensi: D.hipertensi, gastritis: D.gastritis } },
  { id: 'pas-demo-006', rm: 'RM-DEMO-0006', nama: 'Putri Maharani',  lahir: '1996-11-11', gender: 'P', nik: '7301015111960006', hp: '0899100000006', alamat: 'Jl. Seroja No.14, Makassar', pekerjaan: 'Karyawan Swasta', pendidikan: 'S1', status: 'Belum Menikah', agama: 'Islam', goldar: 'B', alergi: 'Seafood', kronis: null, bb: 54, tb: 162, dokter: DR_BUDI, profil: 'migrain', pool: { migrain: D.migrain, ispa: D.ispa, isk: D.isk, dermatitis: D.dermatitis } },
  { id: 'pas-demo-007', rm: 'RM-DEMO-0007', nama: 'Rahmat Hidayat',  lahir: '1979-02-23', gender: 'L', nik: '7301012302790007', hp: '0899100000007', alamat: 'Jl. Cempaka No.2, Makassar', pekerjaan: 'Sopir', pendidikan: 'SMA', status: 'Menikah', agama: 'Islam', goldar: 'O', alergi: null, kronis: 'Hipertensi', bb: 76, tb: 167, dokter: DR_BUDI, profil: 'hipertensi', pool: { hipertensi: D.hipertensi, gastritis: D.gastritis, ispa: D.ispa } },
  { id: 'pas-demo-008', rm: 'RM-DEMO-0008', nama: 'Indah Permata',   lahir: '2001-06-05', gender: 'P', nik: '7301014506010008', hp: '0899100000008', alamat: 'Jl. Mawar No.18, Makassar', pekerjaan: 'Mahasiswa', pendidikan: 'SMA', status: 'Belum Menikah', agama: 'Hindu', goldar: 'A', alergi: null, kronis: null, bb: 50, tb: 158, dokter: DR_BUDI, profil: 'ispa', pool: { ispa: D.ispa, diare: D.diare, dermatitis: D.dermatitis, migrain: D.migrain } },
  { id: 'pas-demo-009', rm: 'RM-DEMO-0009', nama: 'Yusuf Maulana',   lahir: '1958-10-30', gender: 'L', nik: '7301013010580009', hp: '0899100000009', alamat: 'Jl. Melati No.9, Makassar', pekerjaan: 'Pensiunan', pendidikan: 'S1', status: 'Menikah', agama: 'Islam', goldar: 'B', alergi: null, kronis: 'Hipertensi, Diabetes Melitus tipe 2', bb: 74, tb: 165, dokter: DR_BUDI, profil: 'diabetes', pool: { diabetes: D.diabetes, hipertensi: D.hipertensi, dislipidemia: D.dislipidemia } },
  { id: 'pas-demo-010', rm: 'RM-DEMO-0010', nama: 'Dewi Anggraini',  lahir: '1988-08-17', gender: 'P', nik: '7301015708880010', hp: '0899100000010', alamat: 'Jl. Bougenville No.4, Makassar', pekerjaan: 'Perawat', pendidikan: 'D3', status: 'Menikah', agama: 'Kristen', goldar: 'O', alergi: 'Debu', kronis: 'Asma bronkial', bb: 60, tb: 163, dokter: DR_BUDI, profil: 'asma', pool: { asma: D.asma, ispa: D.ispa, gastritis: D.gastritis } },

  // ── Anak → Dr. Sari (Sp.A) ────────────────────────────────────────────────
  { id: 'pas-demo-011', rm: 'RM-DEMO-0011', nama: 'Arka Pratama',    lahir: '2018-04-12', gender: 'L', nik: '7301011204180011', hp: '0899100000011', alamat: 'Jl. Nusa Indah No.6, Makassar', pekerjaan: '-', pendidikan: '-', status: 'Belum Menikah', agama: 'Islam', goldar: 'O', alergi: null, kronis: null, bb: 22, tb: 116, dokter: DR_SARI, profil: 'ispa_anak', pool: { ispa_anak: A.ispa_anak, demam_anak: A.demam_anak, faringitis_anak: A.faringitis_anak } },
  { id: 'pas-demo-012', rm: 'RM-DEMO-0012', nama: 'Keisha Azzahra',  lahir: '2020-01-25', gender: 'P', nik: '7301016501200012', hp: '0899100000012', alamat: 'Jl. Kamboja No.11, Makassar', pekerjaan: '-', pendidikan: '-', status: 'Belum Menikah', agama: 'Islam', goldar: 'A', alergi: null, kronis: 'Dermatitis atopik', bb: 14, tb: 92, dokter: DR_SARI, profil: 'dermatitis_anak', pool: { dermatitis_anak: A.dermatitis_anak, ispa_anak: A.ispa_anak, diare_anak: A.diare_anak } },
  { id: 'pas-demo-013', rm: 'RM-DEMO-0013', nama: 'Fathan Ramadhan', lahir: '2019-09-09', gender: 'L', nik: '7301010909190013', hp: '0899100000013', alamat: 'Jl. Sakura No.8, Makassar', pekerjaan: '-', pendidikan: '-', status: 'Belum Menikah', agama: 'Islam', goldar: 'B', alergi: null, kronis: null, bb: 18, tb: 104, dokter: DR_SARI, profil: 'diare_anak', pool: { diare_anak: A.diare_anak, demam_anak: A.demam_anak, ispa_anak: A.ispa_anak } },
  { id: 'pas-demo-014', rm: 'RM-DEMO-0014', nama: 'Aisyah Putri',    lahir: '2021-07-03', gender: 'P', nik: '7301014307210014', hp: '0899100000014', alamat: 'Jl. Tulip No.15, Makassar', pekerjaan: '-', pendidikan: '-', status: 'Belum Menikah', agama: 'Islam', goldar: 'O', alergi: null, kronis: null, bb: 12, tb: 86, dokter: DR_SARI, profil: 'demam_anak', pool: { demam_anak: A.demam_anak, ispa_anak: A.ispa_anak, faringitis_anak: A.faringitis_anak } },
  { id: 'pas-demo-015', rm: 'RM-DEMO-0015', nama: 'Rizky Ananda',    lahir: '2016-12-01', gender: 'L', nik: '7301010112160015', hp: '0899100000015', alamat: 'Jl. Edelweis No.20, Makassar', pekerjaan: '-', pendidikan: '-', status: 'Belum Menikah', agama: 'Kristen', goldar: 'AB', alergi: 'Susu sapi', kronis: null, bb: 26, tb: 122, dokter: DR_SARI, profil: 'faringitis_anak', pool: { faringitis_anak: A.faringitis_anak, ispa_anak: A.ispa_anak, demam_anak: A.demam_anak } },
];

// ─── Helper DB ───────────────────────────────────────────────────────────────
async function ensureJadwal(dokterId: string): Promise<string> {
  const [rows] = await pool.execute<any[]>(
    'SELECT id FROM Jadwal_Praktek WHERE id_dokter = ? AND status_aktif = 1 ORDER BY created_at LIMIT 1',
    [dokterId]
  );
  if (rows.length > 0) return rows[0].id;
  const id = uuidv4();
  await pool.execute(
    'INSERT INTO Jadwal_Praktek (id, id_dokter, hari, jam_mulai, jam_selesai, durasi_menit, kuota) VALUES (?,?,?,?,?,?,?)',
    [id, dokterId, 'Senin', '08:00:00', '12:00:00', 15, 20]
  );
  return id;
}

async function insertKunjungan(p: {
  pasienId: string; dokterId: string; jadwalId: string; tanggal: string;
  slot: string; keluhan: string; status: string; createdAt: Date;
}): Promise<string> {
  const id = uuidv4();
  const sudahHadir = p.status === 'hadir' || p.status === 'selesai';
  const waktuKonfirmasi = sudahHadir
    ? new Date(new Date(`${p.tanggal}T${p.slot}`).getTime() - randInt(5, 40) * 60000)
    : null;
  await pool.execute(
    `INSERT INTO Kunjungan
       (id, id_pasien, id_dokter, id_jadwal, tanggal, slot_jam, status,
        keluhan_awal, dikonfirmasi_oleh, waktu_konfirmasi, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      id, p.pasienId, p.dokterId, p.jadwalId, p.tanggal, p.slot, p.status,
      p.keluhan, sudahHadir ? RESEPSIS : null, waktuKonfirmasi, p.createdAt, p.createdAt,
    ]
  );
  return id;
}

async function insertSoap(kunjunganId: string, s: Skenario, pas: PasienDemo, tanggal: string, createdAt: Date): Promise<string> {
  const id = uuidv4();
  const bb = +(pas.bb + (Math.random() * 1.5 - 0.75)).toFixed(1);
  const tb = pas.tb;
  const imt = +(bb / ((tb / 100) ** 2)).toFixed(1);
  const kontrol = s.kontrol ? ymd(new Date(new Date(tanggal).getTime() + 30 * 86400000)) : null;
  await pool.execute(
    `INSERT INTO Catatan_SOAP
       (id, id_kunjungan, subjektif, riwayat_penyakit_sekarang,
        td_sistolik, td_diastolik, nadi, suhu, frekuensi_napas, spo2,
        berat_badan, tinggi_badan, imt, pemeriksaan_fisik,
        kode_dx, tindakan, anjuran, jadwal_kontrol, alasan_kontrol, created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      id, kunjunganId, s.subjektif, s.keluhan,
      j(s.tds, 6), j(s.tdd, 4), j(s.nadi, 6), +(s.suhu + (Math.random() * 0.6 - 0.3)).toFixed(1),
      j(s.rr, 2), +(s.spo2 + randInt(-1, 1)).toFixed(1),
      bb, tb, imt, s.pemeriksaan_fisik,
      s.kode_dx, s.tindakan, s.anjuran,
      kontrol, kontrol ? 'Evaluasi terapi dan keluhan' : null, createdAt,
    ]
  );
  return id;
}

async function insertResep(soapId: string, obatList: Obat[], createdAt: Date): Promise<void> {
  let urutan = 1;
  for (const o of obatList) {
    await pool.execute(
      `INSERT INTO Resep (id, id_soap, urutan, nama_obat, dosis, frekuensi, durasi, jumlah, cara_pakai, created_at)
       VALUES (UUID(),?,?,?,?,?,?,?,?,?)`,
      [soapId, urutan++, o.nama, o.dosis, o.frekuensi, o.durasi, o.jumlah, o.cara, createdAt]
    );
  }
}

/** Pilih skenario: 60% skenario utama (profil), sisanya acak dari pool pasien. */
function pilihSkenario(pas: PasienDemo): Skenario {
  if (Math.random() < 0.6) return pas.pool[pas.profil];
  return pick(Object.values(pas.pool));
}

/** Daftar tanggal hari kerja (Senin-Sabtu) acak dalam N minggu terakhir, urut menaik. */
function tanggalRiwayat(jumlah: number): string[] {
  const hasil: string[] = [];
  const maxBack = WEEKS_HISTORY * 7;
  const used = new Set<string>();
  let guard = 0;
  while (hasil.length < jumlah && guard++ < 500) {
    const back = randInt(3, maxBack); // minimal 3 hari lalu (bukan hari ini)
    const d = new Date(now.getTime() - back * 86400000);
    if (d.getDay() === 0) continue; // lewati Minggu
    const key = ymd(d);
    if (used.has(key)) continue;
    used.add(key);
    hasil.push(key);
  }
  return hasil.sort();
}

// ─── Pembersihan data demo (idempoten) ───────────────────────────────────────
async function bersihkanDataDemo(): Promise<void> {
  const ids = PASIEN.map((p) => p.id);
  const ph = ids.map(() => '?').join(',');
  const nikHashes = PASIEN.filter((p) => p.nik).map((p) => hashPencarian(p.nik));
  const hpHashes = PASIEN.map((p) => hashPencarian(p.hp));

  await pool.execute('SET FOREIGN_KEY_CHECKS = 0');
  await pool.execute(
    `DELETE FROM Resep WHERE id_soap IN (
       SELECT id FROM Catatan_SOAP WHERE id_kunjungan IN (
         SELECT id FROM Kunjungan WHERE id_pasien IN (${ph})))`, ids
  );
  await pool.execute(
    `DELETE FROM Catatan_SOAP WHERE id_kunjungan IN (
       SELECT id FROM Kunjungan WHERE id_pasien IN (${ph}))`, ids
  );
  await pool.execute(`DELETE FROM Kunjungan WHERE id_pasien IN (${ph})`, ids);
  await pool.execute(
    `DELETE FROM Pasien WHERE id IN (${ph})
       OR nik_hash IN (${nikHashes.map(() => '?').join(',')})
       OR nomor_hp_hash IN (${hpHashes.map(() => '?').join(',')})`,
    [...ids, ...nikHashes, ...hpHashes]
  );
  await pool.execute('SET FOREIGN_KEY_CHECKS = 1');
}

async function insertPasien(p: PasienDemo): Promise<void> {
  await pool.execute(
    `INSERT INTO Pasien
       (id, nomor_rm, nik, nik_hash, nama_lengkap, tanggal_lahir, jenis_kelamin,
        nomor_hp, nomor_hp_hash, alamat, pekerjaan, pendidikan, status_perkawinan,
        agama, golongan_darah, alergi, riwayat_kronis)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      p.id, p.rm, enkripsi(p.nik), hashPencarian(p.nik), p.nama, p.lahir, p.gender,
      enkripsi(p.hp), hashPencarian(p.hp), enkripsi(p.alamat), p.pekerjaan, p.pendidikan,
      p.status, p.agama, p.goldar, p.alergi, p.kronis,
    ]
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function seed(): Promise<void> {
  await testConnection();
  console.log(`\n[SEED-DEMO] Tanggal hari ini: ${TODAY} (${HARI_MAP[now.getDay()]})`);

  // Verifikasi user staf ada
  const [staf] = await pool.execute<any[]>(
    'SELECT id FROM Users WHERE id IN (?,?,?)', [DR_BUDI, DR_SARI, RESEPSIS]
  );
  if (staf.length < 3) {
    throw new Error('User dokter/resepsionis belum ada. Jalankan `npm run seed` terlebih dahulu.');
  }

  console.log('[SEED-DEMO] Membersihkan data demo lama...');
  await bersihkanDataDemo();

  const jadwalBudi = await ensureJadwal(DR_BUDI);
  const jadwalSari = await ensureJadwal(DR_SARI);
  const jadwalOf = (dokter: string) => (dokter === DR_SARI ? jadwalSari : jadwalBudi);

  // Slot occupancy: cegah bentrok UNIQUE (dokter,tanggal,slot) — termasuk
  // dengan data yang SUDAH ADA di DB (mis. sisa seed-harian).
  const occupied = new Set<string>(); // "dokter|tanggal|slot"
  const [existing] = await pool.execute<any[]>(
    `SELECT id_dokter,
            DATE_FORMAT(tanggal, '%Y-%m-%d') AS tgl,
            TIME_FORMAT(slot_jam, '%H:%i:%s') AS slot
     FROM Kunjungan WHERE id_dokter IN (?, ?)`,
    [DR_BUDI, DR_SARI]
  );
  for (const r of existing) occupied.add(`${r.id_dokter}|${r.tgl}|${r.slot}`);

  const slotCounter = new Map<string, number>();
  function nextSlot(dokter: string, tanggal: string, baseMin: number, stepMin: number): string {
    const key = `${dokter}|${tanggal}`;
    let n = slotCounter.get(key) ?? 0;
    let slot: string;
    do {
      slot = hms(baseMin + n * stepMin);
      n++;
    } while (occupied.has(`${dokter}|${tanggal}|${slot}`) && n < 240);
    slotCounter.set(key, n);
    occupied.add(`${dokter}|${tanggal}|${slot}`);
    return slot;
  }

  let totalKunjungan = 0, totalSoap = 0, totalResep = 0;

  console.log('[SEED-DEMO] Menanam pasien + riwayat...');
  for (const p of PASIEN) {
    await insertPasien(p);

    // Riwayat kunjungan SELESAI (tanggal lampau)
    const jumlah = randInt(MIN_VISITS, MAX_VISITS);
    for (const tgl of tanggalRiwayat(jumlah)) {
      const sken = pilihSkenario(p);
      const slot = nextSlot(p.dokter, tgl, 8 * 60, 15); // mulai 08:00
      const createdAt = new Date(`${tgl}T${slot}`);
      const kId = await insertKunjungan({
        pasienId: p.id, dokterId: p.dokter, jadwalId: jadwalOf(p.dokter),
        tanggal: tgl, slot, keluhan: sken.keluhan, status: 'selesai', createdAt,
      });
      const sId = await insertSoap(kId, sken, p, tgl, createdAt);
      await insertResep(sId, sken.resep, createdAt);
      totalKunjungan++; totalSoap++; totalResep += sken.resep.length;
    }
  }

  // ── Antrian HARI INI (band sore mulai 13:00 → tidak bentrok seed-harian) ──
  console.log('[SEED-DEMO] Menanam antrian hari ini...');
  // status yang ingin ditampilkan di antrian hari ini (per pasien terpilih)
  const queueHariIni: Array<{ idx: number; status: string }> = [
    { idx: 0, status: 'selesai' }, { idx: 2, status: 'selesai' },
    { idx: 1, status: 'hadir' },   { idx: 3, status: 'hadir' },
    { idx: 4, status: 'booked' },  { idx: 6, status: 'booked' },
    { idx: 10, status: 'selesai' }, { idx: 11, status: 'hadir' }, { idx: 12, status: 'booked' },
  ];
  for (const q of queueHariIni) {
    const p = PASIEN[q.idx];
    const sken = pilihSkenario(p);
    const slot = nextSlot(p.dokter, TODAY, 13 * 60, 15); // mulai 13:00
    const createdAt = new Date(`${TODAY}T${slot}`);
    const kId = await insertKunjungan({
      pasienId: p.id, dokterId: p.dokter, jadwalId: jadwalOf(p.dokter),
      tanggal: TODAY, slot, keluhan: sken.keluhan, status: q.status, createdAt,
    });
    totalKunjungan++;
    if (q.status === 'selesai') {
      const sId = await insertSoap(kId, sken, p, TODAY, createdAt);
      await insertResep(sId, sken.resep, createdAt);
      totalSoap++; totalResep += sken.resep.length;
    }
  }

  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║                  SEED DEMO SELESAI                                 ║
╠══════════════════════════════════════════════════════════════════╣
║  Pasien demo      : ${String(PASIEN.length).padEnd(4)}                                       ║
║  Kunjungan        : ${String(totalKunjungan).padEnd(4)}  (riwayat ${WEEKS_HISTORY} minggu + hari ini)        ║
║  Catatan SOAP     : ${String(totalSoap).padEnd(4)}                                       ║
║  Resep            : ${String(totalResep).padEnd(4)}                                       ║
╠══════════════════════════════════════════════════════════════════╣
║  Login dr. budi   : dr.budi     / password123  (+ TOTP)           ║
║  Login dr. sari   : dr.sari     / password123  (+ TOTP)           ║
║  Login resepsionis: resepsionis / password123                     ║
╚══════════════════════════════════════════════════════════════════╝
`);

  await pool.end();
}

seed().catch((err) => {
  console.error('[SEED-DEMO] Error:', err);
  process.exit(1);
});
