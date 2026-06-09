import { pool } from '../../config/database';

export class AuthModel {
  async findPasienByNomorHp(nomorHp: string): Promise<any | null> {
    const [rows] = await pool.execute<any[]>(
      'SELECT id, nomor_rm, nama_lengkap FROM Pasien WHERE nomor_hp = ? LIMIT 1',
      [nomorHp]
    );
    return rows[0] ?? null;
  }

  async findUserByUsername(username: string): Promise<any | null> {
    const [rows] = await pool.execute<any[]>(
      'SELECT id, username, password_hash, peran, nama_lengkap, status_aktif, totp_secret FROM Users WHERE username = ? LIMIT 1',
      [username]
    );
    return rows[0] ?? null;
  }

  async findUserById(id: string): Promise<any | null> {
    const [rows] = await pool.execute<any[]>(
      'SELECT id, username, peran, nama_lengkap, password_hash, totp_secret FROM Users WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] ?? null;
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await pool.execute(
      'UPDATE Users SET password_hash = ? WHERE id = ?',
      [passwordHash, id]
    );
  }

  async saveTotpSecret(userId: string, secret: string): Promise<void> {
    await pool.execute(
      'UPDATE Users SET totp_secret = ? WHERE id = ?',
      [secret, userId]
    );
  }
}
