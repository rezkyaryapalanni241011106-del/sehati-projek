import { pool } from '../../config/database';

export class SpesialisasiModel {
  async findAll(): Promise<any[]> {
    const [rows] = await pool.execute<any[]>(
      `SELECT s.*, COUNT(u.id) AS dipakai
       FROM Spesialisasi s
       LEFT JOIN Users u ON u.spesialisasi = s.id AND u.status_aktif = 1
       GROUP BY s.id ORDER BY s.nama`
    );
    return rows;
  }

  async findById(id: string): Promise<any | null> {
    const [rows] = await pool.execute<any[]>(
      'SELECT status_aktif FROM Spesialisasi WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] ?? null;
  }

  async isUsedByDokter(id: string): Promise<boolean> {
    const [used] = await pool.execute<any[]>(
      'SELECT id FROM Users WHERE spesialisasi = ? LIMIT 1',
      [id]
    );
    return used.length > 0;
  }

  async create(id: string, nama: string): Promise<void> {
    await pool.execute(
      'INSERT INTO Spesialisasi (id, nama) VALUES (?, ?)',
      [id, nama]
    );
  }

  async setStatus(id: string, status: number): Promise<void> {
    await pool.execute(
      'UPDATE Spesialisasi SET status_aktif = ? WHERE id = ?',
      [status, id]
    );
  }

  async delete(id: string): Promise<void> {
    await pool.execute('DELETE FROM Spesialisasi WHERE id = ?', [id]);
  }
}
