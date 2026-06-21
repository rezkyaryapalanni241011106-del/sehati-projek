import { pool } from '../config/database';
import { env } from '../config/env';
import { v4 as uuidv4 } from 'uuid';
import { kirimOTPWhatsApp } from './whatsapp';

// Maks permintaan OTP per nomor per jam
const MAX_OTP_REQUEST_PER_JAM = 5;
// Maks percobaan verify gagal per nomor per 15 menit
const MAX_OTP_VERIFY_GAGAL_PER_15MENIT = 5;

export class OtpService {
  generateKode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Cek apakah nomor HP sudah melebihi batas request OTP per jam
  async cekBatasRequest(nomorHp: string): Promise<boolean> {
    const [[row]] = await pool.execute<any[]>(
      `SELECT COUNT(*) AS jumlah FROM OTP_Attempt
       WHERE nomor_hp = ? AND jenis = 'request'
         AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
      [nomorHp]
    );
    return row.jumlah >= MAX_OTP_REQUEST_PER_JAM;
  }

  // Cek apakah nomor HP sudah melebihi batas percobaan verify gagal per 15 menit
  async cekBatasVerify(nomorHp: string): Promise<boolean> {
    const [[row]] = await pool.execute<any[]>(
      `SELECT COUNT(*) AS jumlah FROM OTP_Attempt
       WHERE nomor_hp = ? AND jenis = 'verify' AND sukses = 0
         AND created_at > DATE_SUB(NOW(), INTERVAL 15 MINUTE)`,
      [nomorHp]
    );
    return row.jumlah >= MAX_OTP_VERIFY_GAGAL_PER_15MENIT;
  }

  // Catat attempt ke tabel OTP_Attempt
  async catatAttempt(nomorHp: string, jenis: 'request' | 'verify', sukses: boolean): Promise<void> {
    await pool.execute(
      'INSERT INTO OTP_Attempt (id, nomor_hp, jenis, sukses) VALUES (?, ?, ?, ?)',
      [uuidv4(), nomorHp, jenis, sukses ? 1 : 0]
    );
  }

  async buat(nomorHp: string): Promise<string> {
    const kode = this.generateKode();

    // Nonaktifkan OTP lama untuk nomor yang sama
    await pool.execute(
      'UPDATE OTP SET digunakan = 1 WHERE nomor_hp = ? AND digunakan = 0',
      [nomorHp]
    );

    await pool.execute(
      `INSERT INTO OTP (id, nomor_hp, kode, expired_at)
       VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))`,
      [uuidv4(), nomorHp, kode, env.OTP_EXPIRY_MINUTES]
    );

    await kirimOTPWhatsApp(nomorHp, kode);

    return kode;
  }

  async verifikasi(nomorHp: string, kode: string): Promise<boolean> {
    // Atomic: satu query UPDATE menggabungkan cek dan tandai — cegah race condition
    const [result] = await pool.execute<any>(
      `UPDATE OTP SET digunakan = 1
       WHERE nomor_hp = ?
         AND kode = ?
         AND digunakan = 0
         AND expired_at > NOW()
       LIMIT 1`,
      [nomorHp, kode]
    );
    return result.affectedRows > 0;
  }
}

// Singleton instance dan fungsi kompatibilitas mundur
const otpService = new OtpService();
export const generateKodeOTP  = (): string => otpService.generateKode();
export const buatOTP           = (nomorHp: string): Promise<string> => otpService.buat(nomorHp);
export const verifikasiOTP     = (nomorHp: string, kode: string): Promise<boolean> => otpService.verifikasi(nomorHp, kode);
export const cekBatasRequestOTP = (nomorHp: string): Promise<boolean> => otpService.cekBatasRequest(nomorHp);
export const cekBatasVerifyOTP  = (nomorHp: string): Promise<boolean> => otpService.cekBatasVerify(nomorHp);
export const catatAttemptOTP    = (nomorHp: string, jenis: 'request' | 'verify', sukses: boolean): Promise<void> => otpService.catatAttempt(nomorHp, jenis, sukses);
