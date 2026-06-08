import 'dotenv/config';
import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'db_sehati',
  });
  const conn = await pool.getConnection();

  const today = new Date().toISOString().split('T')[0];
  const hariMap: Record<number, string> = { 0:'Minggu',1:'Senin',2:'Selasa',3:'Rabu',4:'Kamis',5:'Jumat',6:'Sabtu' };
  const hariIni = hariMap[new Date().getDay()];
  console.log(`Menambah kunjungan untuk ${hariIni}, ${today}`);

  // Ambil semua jadwal yang cocok dengan hari ini
  const [jadwals] = await conn.execute<any[]>(
    `SELECT jp.id, jp.hari, jp.jam_mulai, jp.durasi_menit, u.id AS dokter_id, u.nama_lengkap
     FROM Jadwal_Praktek jp JOIN Users u ON jp.id_dokter = u.id
     WHERE u.peran='dokter' AND jp.hari=? AND jp.status_aktif=1`,
    [hariIni]
  );
  console.log(`Jadwal ${hariIni}: ${(jadwals as any[]).length} dokter`);

  const [pasiens] = await conn.execute<any[]>('SELECT id, nama_lengkap FROM Pasien LIMIT 8');

  for (const j of jadwals as any[]) {
    console.log(`\nDokter: ${j.nama_lengkap}`);
    const jamStr: string = typeof j.jam_mulai === 'string'
      ? j.jam_mulai
      : new Date(j.jam_mulai).toTimeString().slice(0, 8);
    const [startH, startM] = jamStr.split(':').map(Number);
    const dur: number = j.durasi_menit;

    const statuses = ['booked', 'booked', 'hadir', 'booked', 'booked'];
    const keluhanList = ['Demam tinggi sejak kemarin', 'Batuk dan pilek', 'Kontrol rutin', 'Nyeri kepala', 'Mual dan pusing'];

    for (let i = 0; i < 5; i++) {
      const totalMins = startH * 60 + startM + i * dur;
      const hh = String(Math.floor(totalMins / 60)).padStart(2, '0');
      const mm = String(totalMins % 60).padStart(2, '0');
      const slot = `${hh}:${mm}:00`;
      const pid = (pasiens as any[])[i % (pasiens as any[]).length].id;
      const pNama = (pasiens as any[])[i % (pasiens as any[]).length].nama_lengkap;

      try {
        await conn.execute(
          'INSERT INTO Kunjungan (id,id_pasien,id_dokter,id_jadwal,tanggal,slot_jam,status,keluhan_awal) VALUES (?,?,?,?,?,?,?,?)',
          [uuidv4(), pid, j.dokter_id, j.id, today, slot, statuses[i], keluhanList[i]]
        );
        console.log(`  ✓ ${slot} ${statuses[i]} — ${pNama}`);
      } catch (e: any) {
        console.log(`  skip ${slot} — ${e.code || e.message}`);
      }
    }
  }

  conn.release();
  await pool.end();
  console.log('\nSelesai.');
}

run().catch(console.error);
