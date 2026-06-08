import 'dotenv/config';
import bcrypt from 'bcrypt';
import speakeasy from 'speakeasy';
import { v4 as uuidv4 } from 'uuid';
import { pool, testConnection } from '../config/database';
import { env } from '../config/env';

const PASS = 'password123';

interface StafSeed {
  id: string;
  username: string;
  peran: string;
  nama_lengkap: string;
  email: string;
  spesialisasi?: string;
  nomor_str?: string;
  dibuat_oleh?: string;
}

const STAF: StafSeed[] = [
  {
    id: 'usr-sa01-0000-0000-000000000001',
    username: 'superadmin',
    peran: 'super_admin',
    nama_lengkap: 'Syahrul Hidayat',
    email: 'superadmin@sehati.id',
  },
  {
    id: 'usr-adm1-0000-0000-000000000002',
    username: 'admin',
    peran: 'admin',
    nama_lengkap: 'Putri Andini',
    email: 'admin@sehati.id',
    dibuat_oleh: 'usr-sa01-0000-0000-000000000001',
  },
  {
    id: 'usr-dr01-0000-0000-000000000003',
    username: 'dr.budi',
    peran: 'dokter',
    nama_lengkap: 'Dr. Budi Santoso',
    email: 'budi@sehati.id',
    spesialisasi: 'sp-umum-0001-0000-000000000001',
    nomor_str: 'STR-001-2024',
    dibuat_oleh: 'usr-adm1-0000-0000-000000000002',
  },
  {
    id: 'usr-dr02-0000-0000-000000000004',
    username: 'dr.sari',
    peran: 'dokter',
    nama_lengkap: 'Dr. Sari Dewi, Sp.A',
    email: 'sari@sehati.id',
    spesialisasi: 'sp-anak-0001-0000-000000000002',
    nomor_str: 'STR-002-2024',
    dibuat_oleh: 'usr-adm1-0000-0000-000000000002',
  },
  {
    id: 'usr-per1-0000-0000-000000000005',
    username: 'ns.rina',
    peran: 'perawat',
    nama_lengkap: 'Ns. Rina Pratiwi',
    email: 'rina@sehati.id',
    dibuat_oleh: 'usr-adm1-0000-0000-000000000002',
  },
  {
    id: 'usr-res1-0000-0000-000000000006',
    username: 'resepsionis',
    peran: 'resepsionis',
    nama_lengkap: 'Dewi Lestari',
    email: 'dewi@sehati.id',
    dibuat_oleh: 'usr-adm1-0000-0000-000000000002',
  },
];

async function seed() {
  await testConnection();
  console.log('\n[SEED] Mulai seeding...\n');

  // Hash password
  const hash = await bcrypt.hash(PASS, env.BCRYPT_ROUNDS);
  console.log(`[SEED] Password hash (cost=${env.BCRYPT_ROUNDS}): ${hash}\n`);

  // Truncate
  await pool.execute('SET FOREIGN_KEY_CHECKS = 0');
  for (const t of ['Resep', 'Catatan_SOAP', 'Kunjungan', 'OTP', 'Jadwal_Praktek', 'Pasien', 'Users', 'Spesialisasi', 'ICD10']) {
    await pool.execute(`DELETE FROM ${t}`);
  }
  await pool.execute('SET FOREIGN_KEY_CHECKS = 1');

  // Spesialisasi
  const specs = [
    ['sp-umum-0001-0000-000000000001', 'Umum'],
    ['sp-anak-0001-0000-000000000002', 'Anak'],
    ['sp-gigi-0001-0000-000000000003', 'Gigi'],
    ['sp-dala-0001-0000-000000000004', 'Penyakit Dalam'],
    ['sp-kand-0001-0000-000000000005', 'Kandungan'],
  ];
  for (const [id, nama] of specs) {
    await pool.execute('INSERT INTO Spesialisasi (id, nama) VALUES (?, ?)', [id, nama]);
  }
  console.log('[SEED] Spesialisasi OK');

  // Users + TOTP
  console.log('\n[SEED] ====== TOTP SETUP CREDENTIALS ======');
  for (const staf of STAF) {
    const totpSecret = speakeasy.generateSecret({ name: `SEHATI:${staf.username}` });

    await pool.execute(
      `INSERT INTO Users
         (id, username, password_hash, peran, nama_lengkap, email, spesialisasi, nomor_str, totp_secret, dibuat_oleh)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        staf.id, staf.username, hash, staf.peran,
        staf.nama_lengkap, staf.email,
        staf.spesialisasi ?? null,
        staf.nomor_str ?? null,
        totpSecret.base32,
        staf.dibuat_oleh ?? null,
      ]
    );

    console.log(`\n  [${staf.peran.toUpperCase()}] ${staf.username}`);
    console.log(`  Password  : ${PASS}`);
    console.log(`  TOTP Base32: ${totpSecret.base32}`);
    console.log(`  TOTP URL  : ${totpSecret.otpauth_url}`);
  }
  console.log('\n[SEED] ====== END TOTP CREDENTIALS ======\n');

  // Jadwal Praktek
  const jadwals = [
    ['usr-dr01-0000-0000-000000000003', 'Senin',  '08:00:00', '12:00:00', 15, 16],
    ['usr-dr01-0000-0000-000000000003', 'Rabu',   '08:00:00', '12:00:00', 15, 16],
    ['usr-dr01-0000-0000-000000000003', 'Jumat',  '08:00:00', '12:00:00', 15, 16],
    ['usr-dr02-0000-0000-000000000004', 'Selasa', '09:00:00', '13:00:00', 20, 12],
    ['usr-dr02-0000-0000-000000000004', 'Kamis',  '09:00:00', '13:00:00', 20, 12],
    ['usr-dr02-0000-0000-000000000004', 'Sabtu',  '08:00:00', '11:00:00', 20,  9],
  ];
  for (const [id_dokter, hari, mulai, selesai, durasi, kuota] of jadwals) {
    await pool.execute(
      'INSERT INTO Jadwal_Praktek (id, id_dokter, hari, jam_mulai, jam_selesai, durasi_menit, kuota) VALUES (UUID(), ?, ?, ?, ?, ?, ?)',
      [id_dokter, hari, mulai, selesai, durasi, kuota]
    );
  }
  console.log('[SEED] Jadwal Praktek OK');

  // ICD-10
  const icd10Data = [
    ['A09',   'Diare dan gastroenteritis akibat penyebab menular dan tidak jelas', 'Penyakit Infeksi'],
    ['A15',   'Tuberkulosis paru', 'Penyakit Infeksi'],
    ['A90',   'Demam dengue (dengue fever)', 'Penyakit Infeksi'],
    ['A91',   'Demam berdarah dengue (dengue hemorrhagic fever)', 'Penyakit Infeksi'],
    ['B05',   'Campak', 'Penyakit Infeksi'],
    ['B15',   'Hepatitis A akut', 'Penyakit Infeksi'],
    ['B50',   'Malaria akibat Plasmodium falciparum', 'Penyakit Infeksi'],
    ['E10',   'Diabetes mellitus tipe 1', 'Penyakit Metabolik'],
    ['E11',   'Diabetes mellitus tipe 2', 'Penyakit Metabolik'],
    ['E66',   'Obesitas', 'Penyakit Metabolik'],
    ['E78',   'Gangguan metabolisme lipoprotein dan lipidemia lain', 'Penyakit Metabolik'],
    ['F32',   'Episode depresif', 'Gangguan Mental'],
    ['F41',   'Gangguan ansietas lainnya', 'Gangguan Mental'],
    ['G43',   'Migrain', 'Penyakit Saraf'],
    ['H10',   'Konjungtivitis', 'Penyakit Mata'],
    ['H66',   'Otitis media supuratif dan tanpa spesifikasi', 'Penyakit Telinga'],
    ['I10',   'Hipertensi esensial (primer)', 'Penyakit Kardiovaskular'],
    ['I20',   'Angina pektoris', 'Penyakit Kardiovaskular'],
    ['I25',   'Penyakit jantung iskemik kronis', 'Penyakit Kardiovaskular'],
    ['I50',   'Gagal jantung', 'Penyakit Kardiovaskular'],
    ['J00',   'Nasofaringitis akut (common cold)', 'Penyakit Saluran Napas'],
    ['J02',   'Faringitis akut', 'Penyakit Saluran Napas'],
    ['J03',   'Tonsilitis akut', 'Penyakit Saluran Napas'],
    ['J06',   'Infeksi saluran napas atas akut tidak spesifik', 'Penyakit Saluran Napas'],
    ['J11',   'Influenza akibat virus tidak teridentifikasi', 'Penyakit Saluran Napas'],
    ['J18',   'Pneumonia tanpa spesifikasi organisme', 'Penyakit Saluran Napas'],
    ['J20',   'Bronkitis akut', 'Penyakit Saluran Napas'],
    ['J45',   'Asma', 'Penyakit Saluran Napas'],
    ['K04',   'Penyakit pulpa dan periapikal', 'Penyakit Gigi'],
    ['K21',   'Penyakit refluks gastroesofageal', 'Penyakit Pencernaan'],
    ['K25',   'Ulkus gaster', 'Penyakit Pencernaan'],
    ['K29',   'Gastritis dan duodenitis', 'Penyakit Pencernaan'],
    ['K35',   'Apendisitis akut', 'Penyakit Pencernaan'],
    ['L20',   'Dermatitis atopik', 'Penyakit Kulit'],
    ['L50',   'Urtikaria', 'Penyakit Kulit'],
    ['M54',   'Nyeri punggung', 'Penyakit Muskuloskeletal'],
    ['M79',   'Gangguan jaringan lunak lainnya', 'Penyakit Muskuloskeletal'],
    ['N39',   'Gangguan saluran kemih lainnya', 'Penyakit Urologi'],
    ['O20',   'Perdarahan pada awal kehamilan', 'Kehamilan & Persalinan'],
    ['R05',   'Batuk', 'Gejala Umum'],
    ['R50',   'Demam tanpa penyebab yang diketahui', 'Gejala Umum'],
    ['R51',   'Sakit kepala', 'Gejala Umum'],
    ['Z00',   'Pemeriksaan umum dan pengkajian pada orang sehat', 'Kunjungan Preventif'],
    ['A36',   'Difteri', 'Penyakit Infeksi'],
    ['B34.9', 'Infeksi virus tanpa spesifikasi', 'Penyakit Infeksi'],
    ['B99',   'Penyakit menular lainnya dan tidak terspesifikasi', 'Penyakit Infeksi'],
    ['K05',   'Gingivitis dan penyakit periodontal', 'Penyakit Gigi'],
    ['K40',   'Hernia inguinal', 'Penyakit Pencernaan'],
    ['G44',   'Sindrom sakit kepala lainnya', 'Penyakit Saraf'],
    ['I25.9', 'Penyakit jantung iskemik kronis tanpa spesifikasi', 'Penyakit Kardiovaskular'],
  ];

  for (const [kode, deskripsi, kategori] of icd10Data) {
    await pool.execute(
      'INSERT IGNORE INTO ICD10 (kode, deskripsi, kategori) VALUES (?, ?, ?)',
      [kode, deskripsi, kategori]
    );
  }
  console.log('[SEED] ICD-10 OK');

  console.log('\n[SEED] Seeding selesai.\n');
  process.exit(0);
}

seed().catch((err) => {
  console.error('[SEED] Error:', err);
  process.exit(1);
});
