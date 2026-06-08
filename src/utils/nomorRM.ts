import { pool } from '../config/database';

export class NomorRMService {
  async generate(): Promise<string> {
    const tahun = new Date().getFullYear();
    const prefix = `RM-${tahun}-`;

    const [rows] = await pool.execute<any[]>(
      `SELECT nomor_rm FROM Pasien
       WHERE nomor_rm LIKE ?
       ORDER BY nomor_rm DESC
       LIMIT 1`,
      [`${prefix}%`]
    );

    let urutan = 1;
    if (rows.length > 0) {
      const last: string = rows[0].nomor_rm;
      const parts = last.split('-');
      urutan = parseInt(parts[parts.length - 1], 10) + 1;
    }

    return `${prefix}${String(urutan).padStart(6, '0')}`;
  }
}

// Singleton instance dan fungsi kompatibilitas mundur
const nomorRMService = new NomorRMService();
export const generateNomorRM = (): Promise<string> => nomorRMService.generate();
