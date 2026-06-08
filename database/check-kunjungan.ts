import 'dotenv/config';
import mysql from 'mysql2/promise';

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'db_sehati',
  });
  const conn = await pool.getConnection();

  const [time] = await conn.execute<any[]>('SELECT NOW() AS server_time, CURDATE() AS server_date');
  console.log('Server time:', time[0].server_time, '| Server date:', time[0].server_date);

  const [rows] = await conn.execute<any[]>(
    `SELECT k.tanggal, k.slot_jam, k.status, p.nama_lengkap AS pasien, u.nama_lengkap AS dokter
     FROM Kunjungan k
     JOIN Pasien p ON k.id_pasien = p.id
     JOIN Users u ON k.id_dokter = u.id
     ORDER BY k.tanggal DESC, k.slot_jam
     LIMIT 15`
  );
  console.log('\n15 kunjungan terbaru:');
  console.table(rows);

  conn.release();
  await pool.end();
}
run().catch(console.error);
