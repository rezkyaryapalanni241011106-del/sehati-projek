import 'dotenv/config';
import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '3306'),
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'db_sehati',
  waitForConnections: true,
});

// ─── Data pasien fiktif ────────────────────────────────────────────
const PASIEN_RAW = [
  { nama: 'Ahmad Fauzi',         tgl: '1985-03-15', jk: 'L', hp: '081200000001', nik: '3171010001850001', alamat: 'Jl. Mawar No. 12, Jakarta Pusat',         pekerjaan: 'Karyawan Swasta' },
  { nama: 'Siti Nurhaliza',      tgl: '1990-07-22', jk: 'P', hp: '081200000002', nik: '3171010001900002', alamat: 'Jl. Anggrek No. 5, Jakarta Selatan',       pekerjaan: 'Ibu Rumah Tangga' },
  { nama: 'Budi Hartono',        tgl: '1978-11-30', jk: 'L', hp: '081200000003', nik: '3171010001780003', alamat: 'Jl. Melati No. 8, Bekasi',                 pekerjaan: 'Wiraswasta' },
  { nama: 'Dewi Rahayu',         tgl: '1995-04-18', jk: 'P', hp: '081200000004', nik: '3171010001950004', alamat: 'Jl. Flamboyan No. 3, Tangerang',           pekerjaan: 'Mahasiswa' },
  { nama: 'Rizky Pratama',       tgl: '2000-09-05', jk: 'L', hp: '081200000005', nik: '3171010002000005', alamat: 'Jl. Cempaka No. 17, Depok',               pekerjaan: 'Pelajar' },
  { nama: 'Nurul Hidayah',       tgl: '1988-12-11', jk: 'P', hp: '081200000006', nik: '3171010001880006', alamat: 'Jl. Dahlia No. 9, Bogor',                 pekerjaan: 'Guru' },
  { nama: 'Agus Setiawan',       tgl: '1972-06-25', jk: 'L', hp: '081200000007', nik: '3171010001720007', alamat: 'Jl. Teratai No. 21, Jakarta Barat',       pekerjaan: 'Pensiunan' },
  { nama: 'Fitri Handayani',     tgl: '1993-02-14', jk: 'P', hp: '081200000008', nik: '3171010001930008', alamat: 'Jl. Kenanga No. 6, Jakarta Timur',        pekerjaan: 'Perawat' },
  { nama: 'Hendra Kurniawan',    tgl: '1982-08-07', jk: 'L', hp: '081200000009', nik: '3171010001820009', alamat: 'Jl. Bougenville No. 14, Tangerang Selatan',pekerjaan: 'PNS' },
  { nama: 'Indah Permatasari',   tgl: '1997-01-20', jk: 'P', hp: '081200000010', nik: '3171010001970010', alamat: 'Jl. Kamboja No. 2, Bekasi Barat',         pekerjaan: 'Karyawan Swasta' },
  { nama: 'Joko Widodo',         tgl: '1969-04-10', jk: 'L', hp: '081200000011', nik: '3171010001690011', alamat: 'Jl. Anyelir No. 33, Jakarta Pusat',       pekerjaan: 'Wiraswasta' },
  { nama: 'Kartini Susanti',     tgl: '1986-10-03', jk: 'P', hp: '081200000012', nik: '3171010001860012', alamat: 'Jl. Sakura No. 7, Depok',                 pekerjaan: 'Bidan' },
  { nama: 'Lukman Hakim',        tgl: '1975-05-28', jk: 'L', hp: '081200000013', nik: '3171010001750013', alamat: 'Jl. Tulip No. 19, Bogor Selatan',         pekerjaan: 'Supir' },
  { nama: 'Maya Anggraini',      tgl: '1992-09-16', jk: 'P', hp: '081200000014', nik: '3171010001920014', alamat: 'Jl. Chrysant No. 4, Jakarta Selatan',     pekerjaan: 'Akuntan' },
  { nama: 'Nanang Sulaiman',     tgl: '1980-03-02', jk: 'L', hp: '081200000015', nik: '3171010001800015', alamat: 'Jl. Seruni No. 11, Tangerang',            pekerjaan: 'Teknisi' },
  { nama: 'Okta Wulandari',      tgl: '1999-07-08', jk: 'P', hp: '081200000016', nik: '3171010001990016', alamat: 'Jl. Lavender No. 25, Bekasi Timur',       pekerjaan: 'Mahasiswa' },
  { nama: 'Pandu Wibisono',      tgl: '1987-11-14', jk: 'L', hp: '081200000017', nik: '3171010001870017', alamat: 'Jl. Rosemari No. 8, Jakarta Utara',       pekerjaan: 'Pengusaha' },
  { nama: 'Qori Ramadhani',      tgl: '1994-06-30', jk: 'P', hp: '081200000018', nik: '3171010001940018', alamat: 'Jl. Azalea No. 16, Depok',               pekerjaan: 'Desainer' },
  { nama: 'Rendi Firmansyah',    tgl: '2001-12-19', jk: 'L', hp: '081200000019', nik: '3171010002010019', alamat: 'Jl. Petunias No. 3, Tangerang Selatan',   pekerjaan: 'Pelajar' },
  { nama: 'Sri Wahyuni',         tgl: '1970-08-24', jk: 'P', hp: '081200000020', nik: '3171010001700020', alamat: 'Jl. Edelweis No. 9, Bogor',              pekerjaan: 'Petani' },
];

const KELUHAN = [
  'Demam tinggi sejak 2 hari', 'Batuk dan pilek tidak sembuh-sembuh', 'Sakit kepala berulang',
  'Nyeri perut bagian atas', 'Sesak napas saat beraktivitas', 'Mual dan muntah sejak kemarin',
  'Gatal-gatal di kulit', 'Nyeri sendi lutut kiri', 'Tekanan darah tinggi, pusing',
  'Diare lebih dari 5 kali sehari', 'Luka di kaki tidak sembuh', 'Sulit tidur dan mudah lelah',
  'Berdebar-debar tanpa sebab', 'Sering kencing malam hari', 'Nyeri dada kiri ringan',
  'Kontrol rutin diabetes', 'Kontrol tekanan darah', 'Pemeriksaan kesehatan umum',
  'Radang tenggorokan', 'Bengkak di kaki kanan',
];

const ICD10_KODE = [
  'J00','J06','J18','K29','I10','R50','R51','A09','L20','M54',
  'E11','J45','F41','G43','H66','J02','J03','R05','E14','Z00',
];

const TINDAKAN = [
  'Pemberian obat oral. Istirahat cukup.',
  'Resep antibiotik dan antipiretik. Kontrol 3 hari.',
  'Pemeriksaan fisik lengkap. Rujukan jika tidak membaik.',
  'Edukasi pola makan. Diet rendah garam.',
  'Suntikan antinyeri. Kompres hangat.',
  'Nebulisasi. Resep bronkodilator.',
  'Perawatan luka. Ganti verban 2 hari sekali.',
  'EKG. Konsultasi spesialis jantung.',
  'Cek gula darah sewaktu. Sesuaikan dosis metformin.',
  'Rehidrasi oral. Pemberian probiotik.',
];

const OBAT_LIST = [
  { nama: 'Paracetamol 500mg', dosis: '500mg', freq: '3x1', dur: '5 hari', jml: 15, cara: 'oral' },
  { nama: 'Amoxicillin 500mg', dosis: '500mg', freq: '3x1', dur: '7 hari', jml: 21, cara: 'oral' },
  { nama: 'Cetirizine 10mg',   dosis: '10mg',  freq: '1x1', dur: '7 hari', jml: 7,  cara: 'oral' },
  { nama: 'Omeprazole 20mg',   dosis: '20mg',  freq: '2x1', dur: '14 hari',jml: 28, cara: 'oral' },
  { nama: 'Amlodipine 5mg',    dosis: '5mg',   freq: '1x1', dur: '30 hari',jml: 30, cara: 'oral' },
  { nama: 'Metformin 500mg',   dosis: '500mg', freq: '2x1', dur: '30 hari',jml: 60, cara: 'oral' },
  { nama: 'Salbutamol 2mg',    dosis: '2mg',   freq: '3x1', dur: '5 hari', jml: 15, cara: 'oral' },
  { nama: 'Ibuprofen 400mg',   dosis: '400mg', freq: '3x1', dur: '5 hari', jml: 15, cara: 'oral' },
];

function addDays(base: Date, n: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}:00`;
}

function pick<T>(arr: T[], i: number): T { return arr[i % arr.length]; }

// Kembalikan daftar tanggal N hari ke belakang yang harinya cocok dengan hari yang diizinkan
function getDatesForHari(hariList: string[], count: number): string[] {
  const HARI_ID: Record<string, number> = { Minggu:0, Senin:1, Selasa:2, Rabu:3, Kamis:4, Jumat:5, Sabtu:6 };
  const allowed = new Set(hariList.map(h => HARI_ID[h]));
  const dates: string[] = [];
  const today = new Date();
  let cursor = new Date(today);
  cursor.setDate(cursor.getDate() - 1); // mulai kemarin
  while (dates.length < count) {
    if (allowed.has(cursor.getDay())) dates.push(toDateStr(cursor));
    cursor.setDate(cursor.getDate() - 1);
  }
  return dates;
}

async function run() {
  const conn = await pool.getConnection();
  try {
    // ── 1. Ambil semua dokter aktif ────────────────────────────────
    const [dokters] = await conn.execute<any[]>(
      "SELECT id, nama_lengkap FROM Users WHERE peran='dokter' AND status_aktif=1"
    );
    if (!dokters.length) { console.log('Tidak ada dokter aktif.'); return; }
    console.log(`Ditemukan ${dokters.length} dokter:`, dokters.map(d => d.nama_lengkap));

    // ── 2. Buat 20 pasien (skip jika nomor_hp sudah ada) ──────────
    console.log('\nMembuat pasien...');
    const pasienIds: string[] = [];
    for (let i = 0; i < PASIEN_RAW.length; i++) {
      const p = PASIEN_RAW[i];
      const [ex] = await conn.execute<any[]>('SELECT id FROM Pasien WHERE nomor_hp=? LIMIT 1', [p.hp]);
      if ((ex as any[]).length > 0) {
        pasienIds.push((ex as any[])[0].id);
        console.log(`  Skip (sudah ada): ${p.nama}`);
        continue;
      }
      const id = uuidv4();
      // Cari nomor RM berikutnya
      const tahun = new Date().getFullYear();
      const [rmRows] = await conn.execute<any[]>(
        'SELECT nomor_rm FROM Pasien WHERE nomor_rm LIKE ? ORDER BY nomor_rm DESC LIMIT 1',
        [`RM-${tahun}-%`]
      );
      let urutan = i + 1;
      if ((rmRows as any[]).length > 0) {
        const parts = (rmRows as any[])[0].nomor_rm.split('-');
        urutan = parseInt(parts[parts.length - 1], 10) + 1;
      }
      const nomor_rm = `RM-${tahun}-${String(urutan).padStart(6,'0')}`;

      await conn.execute(
        `INSERT INTO Pasien (id, nomor_rm, nik, nama_lengkap, tanggal_lahir, jenis_kelamin, nomor_hp, alamat, pekerjaan, golongan_darah, status_perkawinan)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [id, nomor_rm, p.nik, p.nama, p.tgl, p.jk, p.hp, p.alamat, p.pekerjaan,
          ['A','B','AB','O'][i%4], i%3===0 ? 'Menikah' : i%3===1 ? 'Belum Menikah' : 'Janda/Duda']
      );
      pasienIds.push(id);
      console.log(`  Dibuat: ${p.nama} (${nomor_rm})`);
    }

    // ── 3. Per dokter: buat 20 kunjungan ──────────────────────────
    for (const dokter of dokters) {
      console.log(`\nMembuat kunjungan untuk ${dokter.nama_lengkap}...`);

      // Ambil semua jadwal dokter ini
      const [jadwals] = await conn.execute<any[]>(
        'SELECT id, hari, jam_mulai, durasi_menit FROM Jadwal_Praktek WHERE id_dokter=? AND status_aktif=1',
        [dokter.id]
      );
      if (!(jadwals as any[]).length) {
        console.log(`  Tidak ada jadwal aktif untuk ${dokter.nama_lengkap}, skip.`);
        continue;
      }

      const hariList = [...new Set((jadwals as any[]).map(j => j.hari))];
      const dates = getDatesForHari(hariList, 30); // lebih banyak kandidat
      // status distribution: 12 selesai, 3 hadir, 3 booked, 2 batal
      const statuses = [
        ...Array(12).fill('selesai'),
        ...Array(3).fill('hadir'),
        ...Array(3).fill('booked'),
        ...Array(2).fill('batal'),
      ];

      let created = 0;
      let dateIdx = 0;
      let slotOffset = 0;

      while (created < 20 && dateIdx < dates.length) {
        const tgl = dates[dateIdx];
        const dayOfWeek = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'][new Date(tgl + 'T00:00:00').getDay()];
        const jadwal = (jadwals as any[]).find(j => j.hari === dayOfWeek);
        if (!jadwal) { dateIdx++; slotOffset = 0; continue; }

        const slot_jam = addMinutes(
          typeof jadwal.jam_mulai === 'string' ? jadwal.jam_mulai : new Date(jadwal.jam_mulai).toTimeString().slice(0,8),
          slotOffset * jadwal.durasi_menit
        );

        // Cek sudah ada slot ini?
        const [slotEx] = await conn.execute<any[]>(
          'SELECT id FROM Kunjungan WHERE id_dokter=? AND tanggal=? AND slot_jam=? LIMIT 1',
          [dokter.id, tgl, slot_jam]
        );
        if ((slotEx as any[]).length > 0) {
          slotOffset++;
          if (slotOffset >= 8) { dateIdx++; slotOffset = 0; }
          continue;
        }

        const kunjId = uuidv4();
        const pasienId = pick(pasienIds, created);
        const status = pick(statuses, created);
        const keluhan = pick(KELUHAN, created);

        await conn.execute(
          `INSERT INTO Kunjungan (id, id_pasien, id_dokter, id_jadwal, tanggal, slot_jam, status, keluhan_awal)
           VALUES (?,?,?,?,?,?,?,?)`,
          [kunjId, pasienId, dokter.id, jadwal.id, tgl, slot_jam, status, keluhan]
        );

        // Buat SOAP untuk status selesai
        if (status === 'selesai') {
          const soapId = uuidv4();
          const icd = pick(ICD10_KODE, created);
          const td_s = 100 + (created % 40);
          const td_d = 60 + (created % 30);
          await conn.execute(
            `INSERT INTO Catatan_SOAP
             (id, id_kunjungan, subjektif, riwayat_penyakit_sekarang,
              td_sistolik, td_diastolik, nadi, suhu, frekuensi_napas, spo2,
              berat_badan, tinggi_badan, imt, pemeriksaan_fisik,
              kode_dx, tindakan, anjuran)
             VALUES (?,?,?,?, ?,?,?,?,?,?, ?,?,?,?, ?,?,?)`,
            [
              soapId, kunjId,
              keluhan, 'Pasien datang dengan keluhan ' + keluhan.toLowerCase() + '. Sudah berlangsung beberapa hari.',
              td_s, td_d, 70 + (created%20), (36.0 + (created%15)/10).toFixed(1), 18 + (created%6), (95 + (created%5)).toFixed(1),
              (50 + created).toFixed(1), (155 + (created%20)).toFixed(1), (22 + (created%8)).toFixed(2),
              'Dalam batas normal. Tidak ditemukan kelainan bermakna.',
              icd, pick(TINDAKAN, created), 'Minum obat teratur. Kembali jika tidak membaik dalam 3 hari.',
            ]
          );

          // Tambah 1–2 resep
          const obat1 = OBAT_LIST[created % OBAT_LIST.length];
          await conn.execute(
            `INSERT INTO Resep (id, id_soap, urutan, nama_obat, dosis, frekuensi, durasi, jumlah, cara_pakai)
             VALUES (?,?,?,?,?,?,?,?,?)`,
            [uuidv4(), soapId, 1, obat1.nama, obat1.dosis, obat1.freq, obat1.dur, obat1.jml, obat1.cara]
          );
          if (created % 3 === 0) {
            const obat2 = OBAT_LIST[(created + 1) % OBAT_LIST.length];
            await conn.execute(
              `INSERT INTO Resep (id, id_soap, urutan, nama_obat, dosis, frekuensi, durasi, jumlah, cara_pakai)
               VALUES (?,?,?,?,?,?,?,?,?)`,
              [uuidv4(), soapId, 2, obat2.nama, obat2.dosis, obat2.freq, obat2.dur, obat2.jml, obat2.cara]
            );
          }
        }

        console.log(`  [${created+1}/20] ${tgl} ${slot_jam} — ${status} — ${pick(PASIEN_RAW, created).nama}`);
        created++;
        slotOffset++;
        if (slotOffset >= 8) { dateIdx++; slotOffset = 0; }
      }

      if (created < 20) console.log(`  Peringatan: hanya ${created}/20 kunjungan berhasil dibuat (jadwal tidak cukup).`);
    }

    console.log('\nSelesai! Data kunjungan berhasil dibuat.');
  } finally {
    conn.release();
    await pool.end();
  }
}

run().catch(console.error);
