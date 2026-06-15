/**
 * Script migrasi data: enkripsi & hash data pasien yang sudah ada.
 * Jalankan SEKALI setelah migrate_enkripsi_pasien.sql dieksekusi.
 * Perintah: npx ts-node database/migrate_enkripsi_data.ts
 */
import * as dotenv from 'dotenv';
dotenv.config();

import { createCipheriv, randomBytes, createHmac } from 'crypto';
import { createPool } from 'mysql2/promise';

const ALGO = 'aes-256-gcm';
const ENC_KEY = process.env.ENCRYPTION_KEY!;
const HMAC_KEY = process.env.HMAC_KEY!;

if (!ENC_KEY || !HMAC_KEY) {
  console.error('ERROR: ENCRYPTION_KEY dan HMAC_KEY harus ada di .env');
  process.exit(1);
}

function enkripsi(plaintext: string): string {
  const key = Buffer.from(ENC_KEY, 'hex');
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`;
}

function hashPencarian(value: string): string {
  return createHmac('sha256', HMAC_KEY)
    .update(value.toLowerCase().trim())
    .digest('hex');
}

function sudahDienkripsi(v: string | null): boolean {
  if (!v) return false;
  const parts = v.split(':');
  // format: ivHex:tagHex:encHex — ketiganya harus ada dan merupakan hex
  return parts.length === 3 && parts.every(p => /^[0-9a-f]+$/i.test(p));
}

async function main() {
  const pool = createPool({
    host:     process.env.DB_HOST     || 'localhost',
    port:     Number(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'db_sehati',
  });

  const [rows] = await pool.execute<any[]>(
    'SELECT id, nik, nik_wali, nomor_paspor, nomor_hp, alamat FROM Pasien WHERE nomor_hp_hash IS NULL'
  );

  console.log(`Ditemukan ${rows.length} pasien yang belum dienkripsi`);

  let sukses = 0, dilewati = 0;
  for (const row of rows) {
    // Jangan enkripsi ulang jika sudah berbentuk ciphertext
    if (sudahDienkripsi(row.nomor_hp)) {
      console.log(`  [LEWATI] ${row.id} — nomor_hp sudah dienkripsi`);
      dilewati++;
      continue;
    }

    const encNik          = row.nik          && !sudahDienkripsi(row.nik)          ? enkripsi(row.nik)          : row.nik;
    const hashNik         = row.nik          ? hashPencarian(row.nik)               : null;
    const encNikWali      = row.nik_wali     && !sudahDienkripsi(row.nik_wali)     ? enkripsi(row.nik_wali)     : row.nik_wali;
    const encNomorPaspor  = row.nomor_paspor && !sudahDienkripsi(row.nomor_paspor) ? enkripsi(row.nomor_paspor) : row.nomor_paspor;
    const encNomorHp      = enkripsi(row.nomor_hp);
    const hashNomorHp     = hashPencarian(row.nomor_hp);
    const encAlamat       = !sudahDienkripsi(row.alamat)                           ? enkripsi(row.alamat)       : row.alamat;

    await pool.execute(
      `UPDATE Pasien SET
         nik = ?, nik_hash = ?,
         nik_wali = ?,
         nomor_paspor = ?,
         nomor_hp = ?, nomor_hp_hash = ?,
         alamat = ?
       WHERE id = ?`,
      [encNik, hashNik, encNikWali, encNomorPaspor, encNomorHp, hashNomorHp, encAlamat, row.id]
    );
    console.log(`  [OK] Pasien ${row.id}`);
    sukses++;
  }

  await pool.end();
  console.log(`\nSelesai: ${sukses} dienkripsi, ${dilewati} dilewati.`);
}

main().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
