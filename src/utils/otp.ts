import { pool } from '../config/database';
import { env } from '../config/env';
import { v4 as uuidv4 } from 'uuid';

export class OtpService {
  generateKode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async buat(nomorHp: string): Promise<string> {
    const kode = this.generateKode();
    const expiredAt = new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000);

    // Nonaktifkan OTP lama untuk nomor yang sama
    await pool.execute(
      'UPDATE OTP SET digunakan = 1 WHERE nomor_hp = ? AND digunakan = 0',
      [nomorHp]
    );

    await pool.execute(
      'INSERT INTO OTP (id, nomor_hp, kode, expired_at) VALUES (?, ?, ?, ?)',
      [uuidv4(), nomorHp, kode, expiredAt]
    );

    if (env.OTP_MOCK) {
      console.log(`[OTP MOCK] Nomor: ${nomorHp} | Kode: ${kode} | Berlaku: ${env.OTP_EXPIRY_MINUTES} menit`);
    }

    return kode;
  }

  async verifikasi(nomorHp: string, kode: string): Promise<boolean> {
    const now = new Date();
    const [rows] = await pool.execute<any[]>(
      `SELECT id FROM OTP
       WHERE nomor_hp = ?
         AND kode = ?
         AND digunakan = 0
         AND expired_at > ?
       LIMIT 1`,
      [nomorHp, kode, now]
    );

    if (rows.length === 0) return false;

    // Tandai sebagai digunakan (one-time use — FR-02)
    await pool.execute('UPDATE OTP SET digunakan = 1 WHERE id = ?', [rows[0].id]);
    return true;
  }
}

// Singleton instance dan fungsi kompatibilitas mundur
const otpService = new OtpService();
export const generateKodeOTP = (): string => otpService.generateKode();
export const buatOTP = (nomorHp: string): Promise<string> => otpService.buat(nomorHp);
export const verifikasiOTP = (nomorHp: string, kode: string): Promise<boolean> => otpService.verifikasi(nomorHp, kode);
