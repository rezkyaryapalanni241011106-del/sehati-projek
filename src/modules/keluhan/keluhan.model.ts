import { pool } from '../../config/database';

export class KeluhanModel {
  async findKunjunganPasien(kunjunganId: string, pasienId: string): Promise<any | null> {
    const [rows] = await pool.execute<any[]>(
      `SELECT k.id, k.tanggal, k.slot_jam, k.status, k.keluhan_awal,
              u.nama_lengkap AS nama_dokter
       FROM Kunjungan k
       JOIN Users u ON k.id_dokter = u.id
       WHERE k.id = ? AND k.id_pasien = ? LIMIT 1`,
      [kunjunganId, pasienId]
    );
    return rows[0] ?? null;
  }

  async findStatusKunjungan(kunjunganId: string, pasienId: string): Promise<any | null> {
    const [rows] = await pool.execute<any[]>(
      'SELECT id, status FROM Kunjungan WHERE id = ? AND id_pasien = ? LIMIT 1',
      [kunjunganId, pasienId]
    );
    return rows[0] ?? null;
  }

  async updateKeluhan(kunjunganId: string, keluhan: string): Promise<void> {
    await pool.execute(
      'UPDATE Kunjungan SET keluhan_awal = ? WHERE id = ?',
      [keluhan, kunjunganId]
    );
  }
}
