import { pool } from '../../config/database';

export class AkunModel {
  async findAllStaf(): Promise<any[]> {
    const [rows] = await pool.execute<any[]>(
      `SELECT u.*, s.nama AS spesialisasi_nama
       FROM Users u
       LEFT JOIN Spesialisasi s ON u.spesialisasi = s.id
       WHERE u.peran IN ('dokter','perawat','resepsionis')
       ORDER BY u.peran, u.nama_lengkap`
    );
    return rows;
  }

  async findSpesialisasiAktif(): Promise<any[]> {
    const [rows] = await pool.execute<any[]>(
      'SELECT id, nama FROM Spesialisasi WHERE status_aktif = 1'
    );
    return rows;
  }

  async findStafById(id: string): Promise<any | null> {
    const [rows] = await pool.execute<any[]>(
      'SELECT u.*, s.nama AS spesialisasi_nama FROM Users u LEFT JOIN Spesialisasi s ON u.spesialisasi = s.id WHERE u.id = ? LIMIT 1',
      [id]
    );
    return rows[0] ?? null;
  }

  async createStaf(data: {
    id: string; username: string; hash: string; peran: string; nama_lengkap: string;
    email: string | null; nomor_hp: string | null; spesialisasi: string | null;
    nomor_str: string | null; dibuat_oleh: string;
  }): Promise<void> {
    await pool.execute(
      `INSERT INTO Users (id, username, password_hash, peran, nama_lengkap, email, nomor_hp, spesialisasi, nomor_str, dibuat_oleh)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [data.id, data.username, data.hash, data.peran, data.nama_lengkap,
       data.email, data.nomor_hp, data.spesialisasi, data.nomor_str, data.dibuat_oleh]
    );
  }

  async updateStaf(id: string, username: string, nama_lengkap: string, email: string | null, nomor_hp: string | null, spesialisasi: string | null, nomor_str: string | null): Promise<void> {
    await pool.execute(
      'UPDATE Users SET username=?, nama_lengkap=?, email=?, nomor_hp=?, spesialisasi=?, nomor_str=? WHERE id=?',
      [username, nama_lengkap, email, nomor_hp, spesialisasi, nomor_str, id]
    );
  }

  async findStatusById(id: string): Promise<any | null> {
    const [rows] = await pool.execute<any[]>(
      'SELECT status_aktif FROM Users WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] ?? null;
  }

  async setStatus(id: string, status: number): Promise<void> {
    await pool.execute('UPDATE Users SET status_aktif = ? WHERE id = ?', [status, id]);
  }

  async setPassword(id: string, hash: string): Promise<void> {
    await pool.execute('UPDATE Users SET password_hash = ? WHERE id = ?', [hash, id]);
  }

  async findAllAdmin(): Promise<any[]> {
    const [rows] = await pool.execute<any[]>(
      "SELECT * FROM Users WHERE peran = 'admin' ORDER BY nama_lengkap"
    );
    return rows;
  }

  async findAdminById(id: string): Promise<any | null> {
    const [rows] = await pool.execute<any[]>(
      'SELECT * FROM Users WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] ?? null;
  }

  async createAdmin(id: string, username: string, hash: string, nama_lengkap: string, email: string | null, dibuat_oleh: string): Promise<void> {
    await pool.execute(
      `INSERT INTO Users (id, username, password_hash, peran, nama_lengkap, email, dibuat_oleh) VALUES (?,?,?,'admin',?,?,?)`,
      [id, username, hash, nama_lengkap, email, dibuat_oleh]
    );
  }

  async updateAdmin(id: string, nama_lengkap: string, email: string | null): Promise<void> {
    await pool.execute(
      'UPDATE Users SET nama_lengkap=?, email=? WHERE id=?',
      [nama_lengkap, email, id]
    );
  }
}
