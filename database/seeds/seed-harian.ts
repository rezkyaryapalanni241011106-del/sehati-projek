/**
 * seed-harian.ts
 * Mengisi data kunjungan hari ini untuk keperluan pengujian manual.
 * Jalankan: npx ts-node database/seeds/seed-harian.ts
 */
import 'dotenv/config';
import { v4 as uuidv4 } from 'uuid';
import { pool, testConnection } from '../../src/config/database';

// ─── Tanggal & hari hari ini ─────────────────────────────────────────────────
const now   = new Date();
const TODAY = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
const HARI_MAP = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const HARI_INI  = HARI_MAP[now.getDay()];

// ─── ID staf (dari seeder utama) ─────────────────────────────────────────────
const DR_BUDI  = 'usr-dr01-0000-0000-000000000003';
const DR_SARI  = 'usr-dr02-0000-0000-000000000004';
const RESEPSIS = 'usr-res1-0000-0000-000000000006';

// ─── Data pasien uji ─────────────────────────────────────────────────────────
const PASIEN = [
  { id:'pas-test-001', rm:'RM-2026-000010', nama:'Ahmad Fauzi',   lahir:'1991-03-15', gender:'L', hp:'081234567001', nik:'3201010315910001', alamat:'Jl. Merdeka No.1, Makassar' },
  { id:'pas-test-002', rm:'RM-2026-000011', nama:'Siti Rahayu',   lahir:'1998-07-22', gender:'P', hp:'081234567002', nik:'3201017207980002', alamat:'Jl. Sudirman No.12, Makassar' },
  { id:'pas-test-003', rm:'RM-2026-000012', nama:'Budi Prakoso',  lahir:'1981-11-08', gender:'L', hp:'081234567003', nik:'3201010811810003', alamat:'Jl. Veteran No.5, Makassar' },
  { id:'pas-test-004', rm:'RM-2026-000013', nama:'Nur Hidayah',   lahir:'2003-04-30', gender:'P', hp:'081234567004', nik:'3201014304030004', alamat:'Jl. Pattimura No.8, Makassar' },
  { id:'pas-test-005', rm:'RM-2026-000014', nama:'Rudi Hermawan', lahir:'1966-09-12', gender:'L', hp:'081234567005', nik:'3201011209660005', alamat:'Jl. Cendrawasih No.3, Makassar' },
  { id:'pas-test-006', rm:'RM-2026-000015', nama:'Maya Putri',    lahir:'2018-02-14', gender:'P', hp:'081234567006', nik:'3201014402180006', alamat:'Jl. Bougenville No.7, Makassar' },
  { id:'pas-test-007', rm:'RM-2026-000016', nama:'Dian Kurnia',   lahir:'2021-06-20', gender:'P', hp:'081234567007', nik:'3201012006210007', alamat:'Jl. Melati No.2, Makassar' },
  { id:'pas-test-008', rm:'RM-2026-000017', nama:'Eko Prasetyo',  lahir:'2023-01-10', gender:'L', hp:'081234567008', nik:'3201011001230008', alamat:'Jl. Mawar No.9, Makassar' },
];

// ─── Helper: buat slot jam berdasarkan jam mulai + offset ────────────────────
function buatSlot(jamMulai: string, offsetMenit: number): string {
  const [h, m] = jamMulai.substring(0, 5).split(':').map(Number);
  const total  = h * 60 + m + offsetMenit;
  return `${String(Math.floor(total / 60)).padStart(2,'0')}:${String(total % 60).padStart(2,'0')}:00`;
}

// ─── Helper: insert kunjungan ─────────────────────────────────────────────────
async function insertKunjungan(p: {
  pasienId: string; dokterId: string; jadwalId: string;
  slot: string; keluhan: string; status: string;
}): Promise<string> {
  const id = uuidv4();
  const sudahHadir = p.status === 'hadir' || p.status === 'selesai';
  await pool.execute(
    `INSERT INTO Kunjungan
       (id, id_pasien, id_dokter, id_jadwal, tanggal, slot_jam, status,
        keluhan_awal, dikonfirmasi_oleh, waktu_konfirmasi)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [
      id, p.pasienId, p.dokterId, p.jadwalId,
      TODAY, p.slot, p.status, p.keluhan,
      sudahHadir ? RESEPSIS : null,
      sudahHadir ? new Date(now.getTime() - Math.random() * 90 * 60000) : null,
    ]
  );
  return id;
}

// ─── Helper: insert SOAP ──────────────────────────────────────────────────────
async function insertSoap(kunjunganId: string, data: {
  subjektif: string; tds: number; tdd: number; nadi: number; suhu: number;
  bb: number; tb: number; kode_dx: string; tindakan: string; anjuran: string;
}): Promise<string> {
  const id  = uuidv4();
  const imt = parseFloat((data.bb / ((data.tb / 100) ** 2)).toFixed(1));
  await pool.execute(
    `INSERT INTO Catatan_SOAP
       (id, id_kunjungan, subjektif,
        td_sistolik, td_diastolik, nadi, suhu,
        berat_badan, tinggi_badan, imt,
        kode_dx, tindakan, anjuran)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [id, kunjunganId, data.subjektif,
     data.tds, data.tdd, data.nadi, data.suhu,
     data.bb, data.tb, imt,
     data.kode_dx, data.tindakan, data.anjuran]
  );
  return id;
}

// ─── Helper: insert resep ─────────────────────────────────────────────────────
async function insertResep(soapId: string, urutan: number, obat: {
  nama: string; dosis: string; frekuensi: string; durasi: string; jumlah: number; cara: string;
}): Promise<void> {
  await pool.execute(
    `INSERT INTO Resep (id,id_soap,urutan,nama_obat,dosis,frekuensi,durasi,jumlah,cara_pakai)
     VALUES (UUID(),?,?,?,?,?,?,?,?)`,
    [soapId, urutan, obat.nama, obat.dosis, obat.frekuensi, obat.durasi, obat.jumlah, obat.cara]
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function seed() {
  await testConnection();
  console.log(`\n[SEED-HARIAN] Tanggal : ${TODAY}  (${HARI_INI})\n`);

  // 1. Bersihkan & insert pasien uji
  // Tiga kolom UNIQUE (nomor_rm, nik, nomor_hp) bisa menyebabkan konflik
  // dengan row lain yang sudah ada → hapus semua row yang konflik dulu,
  // baru INSERT segar (tidak pakai ON DUPLICATE KEY UPDATE).
  const pIds  = PASIEN.map(p => p.id);
  const pRms  = PASIEN.map(p => p.rm);
  const pNiks = PASIEN.map(p => p.nik);
  const pHps  = PASIEN.map(p => p.hp);
  const ph    = (n: number) => Array(n).fill('?').join(',');

  await pool.execute('SET FOREIGN_KEY_CHECKS = 0');

  // Hapus row yang mempunyai ID atau nilai UNIQUE yang sama
  const [delRes] = await pool.execute<any>(
    `DELETE FROM Pasien
     WHERE id IN (${ph(pIds.length)})
        OR nomor_rm  IN (${ph(pRms.length)})
        OR nik       IN (${ph(pNiks.length)})
        OR nomor_hp  IN (${ph(pHps.length)})`,
    [...pIds, ...pRms, ...pNiks, ...pHps]
  );
  console.log(`[SEED-HARIAN] Pasien lama dihapus : ${(delRes as any).affectedRows} row`);

  for (const p of PASIEN) {
    await pool.execute(
      `INSERT INTO Pasien (id, nomor_rm, nama_lengkap, tanggal_lahir, jenis_kelamin, nomor_hp, nik, alamat)
       VALUES (?,?,?,?,?,?,?,?)`,
      [p.id, p.rm, p.nama, p.lahir, p.gender, p.hp, p.nik, p.alamat]
    );
  }

  await pool.execute('SET FOREIGN_KEY_CHECKS = 1');

  // Verifikasi
  const [verPasien] = await pool.execute<any[]>(
    `SELECT COUNT(*) AS cnt FROM Pasien WHERE id IN (${ph(pIds.length)})`,
    pIds
  );
  const pasienCount = (verPasien as any[])[0].cnt;
  console.log(`[SEED-HARIAN] Pasien : ${pasienCount}/${PASIEN.length} data terverifikasi`);

  // 2. Pastikan jadwal Dr. Budi ada untuk hari ini
  const [rowsBudi] = await pool.execute<any[]>(
    'SELECT id, jam_mulai FROM Jadwal_Praktek WHERE id_dokter=? AND hari=? AND status_aktif=1 LIMIT 1',
    [DR_BUDI, HARI_INI]
  );
  let jadwalBudiId: string;
  let budiMulai: string;
  if (rowsBudi.length === 0) {
    jadwalBudiId = uuidv4();
    budiMulai    = '08:00:00';
    await pool.execute(
      'INSERT INTO Jadwal_Praktek (id,id_dokter,hari,jam_mulai,jam_selesai,durasi_menit,kuota) VALUES (?,?,?,?,?,?,?)',
      [jadwalBudiId, DR_BUDI, HARI_INI, '08:00:00', '12:00:00', 15, 8]
    );
    console.log(`[SEED-HARIAN] Jadwal Dr. Budi (${HARI_INI}) → dibuat baru`);
  } else {
    jadwalBudiId = rowsBudi[0].id;
    budiMulai    = typeof rowsBudi[0].jam_mulai === 'string'
      ? rowsBudi[0].jam_mulai : '08:00:00';
    console.log(`[SEED-HARIAN] Jadwal Dr. Budi (${HARI_INI}) → sudah ada`);
  }

  // 3. Pastikan jadwal Dr. Sari ada untuk hari ini
  const [rowsSari] = await pool.execute<any[]>(
    'SELECT id, jam_mulai FROM Jadwal_Praktek WHERE id_dokter=? AND hari=? AND status_aktif=1 LIMIT 1',
    [DR_SARI, HARI_INI]
  );
  let jadwalSariId: string;
  let sariMulai: string;
  if (rowsSari.length === 0) {
    jadwalSariId = uuidv4();
    sariMulai    = '09:00:00';
    await pool.execute(
      'INSERT INTO Jadwal_Praktek (id,id_dokter,hari,jam_mulai,jam_selesai,durasi_menit,kuota) VALUES (?,?,?,?,?,?,?)',
      [jadwalSariId, DR_SARI, HARI_INI, '09:00:00', '12:00:00', 20, 9]
    );
    console.log(`[SEED-HARIAN] Jadwal Dr. Sari (${HARI_INI}) → dibuat baru`);
  } else {
    jadwalSariId = rowsSari[0].id;
    sariMulai    = typeof rowsSari[0].jam_mulai === 'string'
      ? rowsSari[0].jam_mulai : '09:00:00';
    console.log(`[SEED-HARIAN] Jadwal Dr. Sari (${HARI_INI}) → sudah ada`);
  }

  // 4. Bersihkan kunjungan hari ini (agar bisa di-reset ulang)
  const [existing] = await pool.execute<any[]>(
    'SELECT id FROM Kunjungan WHERE tanggal=?', [TODAY]
  );
  if (existing.length > 0) {
    const ids = (existing as any[]).map((r: any) => r.id);
    const placeholders = ids.map(() => '?').join(',');
    await pool.execute(`DELETE FROM Resep WHERE id_soap IN (SELECT id FROM Catatan_SOAP WHERE id_kunjungan IN (${placeholders}))`, ids);
    await pool.execute(`DELETE FROM Catatan_SOAP WHERE id_kunjungan IN (${placeholders})`, ids);
    await pool.execute(`DELETE FROM Kunjungan WHERE tanggal=?`, [TODAY]);
    console.log(`[SEED-HARIAN] ${ids.length} kunjungan lama dihapus`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DR. BUDI SANTOSO — Dokter Umum
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n[SEED-HARIAN] Membuat kunjungan Dr. Budi...');

  // Slot 1 → 08:00 — Ahmad Fauzi — SELESAI
  const k1 = await insertKunjungan({
    pasienId: 'pas-test-001', dokterId: DR_BUDI, jadwalId: jadwalBudiId,
    slot: buatSlot(budiMulai, 0), status: 'selesai',
    keluhan: 'Demam tinggi sejak 2 hari, batuk berdahak, pilek dan sakit tenggorokan',
  });
  const s1 = await insertSoap(k1, {
    subjektif : 'Demam sejak 2 hari, batuk berdahak, pilek, nyeri tenggorokan',
    tds:120, tdd:80, nadi:88, suhu:38.5, bb:68, tb:170,
    kode_dx  : 'J06',
    tindakan : 'Pemberian antipiretik dan mukolitik oral',
    anjuran  : 'Istirahat cukup, perbanyak minum air putih. Kembali kontrol jika demam tidak turun dalam 3 hari.',
  });
  await insertResep(s1, 1, { nama:'Paracetamol 500mg', dosis:'500mg', frekuensi:'3x sehari', durasi:'5 hari', jumlah:15, cara:'oral' });
  await insertResep(s1, 2, { nama:'Ambroxol',          dosis:'30mg',  frekuensi:'3x sehari', durasi:'5 hari', jumlah:15, cara:'oral' });
  await pool.execute(`UPDATE Kunjungan SET status='selesai' WHERE id=?`, [k1]);

  // Slot 2 → 08:15 — Siti Rahayu — SELESAI
  const k2 = await insertKunjungan({
    pasienId: 'pas-test-002', dokterId: DR_BUDI, jadwalId: jadwalBudiId,
    slot: buatSlot(budiMulai, 15), status: 'selesai',
    keluhan: 'Kepala pusing, tengkuk berat, tensi tinggi saat diukur di rumah',
  });
  const s2 = await insertSoap(k2, {
    subjektif : 'Hipertensi rutin kontrol. Keluhan pusing dan tengkuk berat. TD 155/95 mmHg',
    tds:155, tdd:95, nadi:76, suhu:36.8, bb:62, tb:158,
    kode_dx  : 'I10',
    tindakan : 'Pemeriksaan fisik dan pengukuran TD serial, edukasi gaya hidup',
    anjuran  : 'Kurangi garam dan makanan berlemak, olahraga ringan rutin 30 menit/hari. Kontrol 1 bulan lagi.',
  });
  await insertResep(s2, 1, { nama:'Amlodipine', dosis:'5mg', frekuensi:'1x sehari', durasi:'30 hari', jumlah:30, cara:'oral' });
  await pool.execute(`UPDATE Kunjungan SET status='selesai' WHERE id=?`, [k2]);

  // Slot 3 → 08:30 — Budi Prakoso — HADIR (di antrian dokter)
  await insertKunjungan({
    pasienId: 'pas-test-003', dokterId: DR_BUDI, jadwalId: jadwalBudiId,
    slot: buatSlot(budiMulai, 30), status: 'hadir',
    keluhan: 'Nyeri ulu hati, mual-mual, tidak nafsu makan sejak kemarin',
  });

  // Slot 4 → 08:45 — Nur Hidayah — HADIR (di antrian dokter)
  await insertKunjungan({
    pasienId: 'pas-test-004', dokterId: DR_BUDI, jadwalId: jadwalBudiId,
    slot: buatSlot(budiMulai, 45), status: 'hadir',
    keluhan: 'Batuk kering sudah 1 minggu, suara serak, nyeri menelan',
  });

  // Slot 5 → 09:00 — Rudi Hermawan — BOOKED (belum datang)
  await insertKunjungan({
    pasienId: 'pas-test-005', dokterId: DR_BUDI, jadwalId: jadwalBudiId,
    slot: buatSlot(budiMulai, 60), status: 'booked',
    keluhan: 'Gula darah tidak terkontrol, sering haus dan kencing, lemas',
  });

  console.log('[SEED-HARIAN] Dr. Budi → 5 pasien (2 selesai · 2 hadir · 1 booked)');

  // ══════════════════════════════════════════════════════════════════════════
  // DR. SARI DEWI, Sp.A — Spesialis Anak
  // ══════════════════════════════════════════════════════════════════════════
  console.log('[SEED-HARIAN] Membuat kunjungan Dr. Sari...');

  // Slot 1 → sariMulai+0 — Maya Putri — SELESAI
  const k6 = await insertKunjungan({
    pasienId: 'pas-test-006', dokterId: DR_SARI, jadwalId: jadwalSariId,
    slot: buatSlot(sariMulai, 0), status: 'selesai',
    keluhan: 'Batuk pilek 3 hari, anak rewel, demam 37.8°C',
  });
  const s6 = await insertSoap(k6, {
    subjektif : 'Anak usia 8 tahun. Batuk pilek 3 hari, demam subfebris 37.8°C, rewel',
    tds:90, tdd:60, nadi:96, suhu:37.8, bb:25, tb:128,
    kode_dx  : 'R05',
    tindakan : 'Pemeriksaan fisik lengkap. Tidak ada tanda sesak. Faring hiperemis (+)',
    anjuran  : 'Banyak minum air putih, istirahat, kompres hangat jika demam. Kontrol jika tidak membaik 3 hari.',
  });
  await insertResep(s6, 1, { nama:'Ambroxol Sirup', dosis:'2.5ml', frekuensi:'3x sehari', durasi:'5 hari', jumlah:1, cara:'oral' });
  await insertResep(s6, 2, { nama:'Paracetamol Sirup', dosis:'5ml', frekuensi:'3x sehari (jika demam)', durasi:'3 hari', jumlah:1, cara:'oral' });
  await pool.execute(`UPDATE Kunjungan SET status='selesai' WHERE id=?`, [k6]);

  // Slot 2 → sariMulai+20 — Dian Kurnia — HADIR (di antrian dokter)
  await insertKunjungan({
    pasienId: 'pas-test-007', dokterId: DR_SARI, jadwalId: jadwalSariId,
    slot: buatSlot(sariMulai, 20), status: 'hadir',
    keluhan: 'Diare sejak semalam, BAB cair 5x, anak lemas dan kurang minum',
  });

  // Slot 3 → sariMulai+40 — Eko Prasetyo — BOOKED (belum datang)
  await insertKunjungan({
    pasienId: 'pas-test-008', dokterId: DR_SARI, jadwalId: jadwalSariId,
    slot: buatSlot(sariMulai, 40), status: 'booked',
    keluhan: 'Ruam merah di kulit sejak pagi, gatal-gatal di badan dan tangan',
  });

  console.log('[SEED-HARIAN] Dr. Sari  → 3 pasien (1 selesai · 1 hadir · 1 booked)');

  // ─── Ringkasan ────────────────────────────────────────────────────────────
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║         SEED HARIAN SELESAI — ${TODAY} (${HARI_INI})
╠══════════════════════════════════════════════════════════════════╣
║  DR. BUDI SANTOSO — Dokter Umum                                 ║
║  ${buatSlot(budiMulai,  0).substring(0,5)}  Ahmad Fauzi    → ✅ SELESAI  (ISPA — 2 resep)     ║
║  ${buatSlot(budiMulai, 15).substring(0,5)}  Siti Rahayu    → ✅ SELESAI  (Hipertensi — 1 resep)║
║  ${buatSlot(budiMulai, 30).substring(0,5)}  Budi Prakoso   → 🟡 HADIR    (antrian dokter)     ║
║  ${buatSlot(budiMulai, 45).substring(0,5)}  Nur Hidayah    → 🟡 HADIR    (antrian dokter)     ║
║  ${buatSlot(budiMulai, 60).substring(0,5)}  Rudi Hermawan  → 🔵 BOOKED   (belum datang)       ║
╠══════════════════════════════════════════════════════════════════╣
║  DR. SARI DEWI, Sp.A — Spesialis Anak                          ║
║  ${buatSlot(sariMulai,  0).substring(0,5)}  Maya Putri     → ✅ SELESAI  (Batuk — 2 resep)    ║
║  ${buatSlot(sariMulai, 20).substring(0,5)}  Dian Kurnia    → 🟡 HADIR    (antrian dokter)     ║
║  ${buatSlot(sariMulai, 40).substring(0,5)}  Eko Prasetyo   → 🔵 BOOKED   (belum datang)       ║
╠══════════════════════════════════════════════════════════════════╣
║  Login resepsionis : resepsionis / password123                  ║
║  Login dr. budi    : dr.budi     / password123  (+ TOTP)        ║
║  Login dr. sari    : dr.sari     / password123  (+ TOTP)        ║
╚══════════════════════════════════════════════════════════════════╝
`);

  process.exit(0);
}

seed().catch((err) => {
  console.error('[SEED-HARIAN] Error:', err);
  process.exit(1);
});
