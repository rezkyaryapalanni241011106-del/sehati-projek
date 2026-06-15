"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catatAttemptOTP = exports.cekBatasVerifyOTP = exports.cekBatasRequestOTP = exports.verifikasiOTP = exports.buatOTP = exports.generateKodeOTP = exports.OtpService = void 0;
const database_1 = require("../config/database");
const env_1 = require("../config/env");
const uuid_1 = require("uuid");
const whatsapp_1 = require("./whatsapp");
// Maks permintaan OTP per nomor per jam
const MAX_OTP_REQUEST_PER_JAM = 3;
// Maks percobaan verify gagal per nomor per 15 menit
const MAX_OTP_VERIFY_GAGAL_PER_15MENIT = 5;
class OtpService {
    generateKode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    // Cek apakah nomor HP sudah melebihi batas request OTP per jam
    async cekBatasRequest(nomorHp) {
        const [[row]] = await database_1.pool.execute(`SELECT COUNT(*) AS jumlah FROM OTP_Attempt
       WHERE nomor_hp = ? AND jenis = 'request'
         AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)`, [nomorHp]);
        return row.jumlah >= MAX_OTP_REQUEST_PER_JAM;
    }
    // Cek apakah nomor HP sudah melebihi batas percobaan verify gagal per 15 menit
    async cekBatasVerify(nomorHp) {
        const [[row]] = await database_1.pool.execute(`SELECT COUNT(*) AS jumlah FROM OTP_Attempt
       WHERE nomor_hp = ? AND jenis = 'verify' AND sukses = 0
         AND created_at > DATE_SUB(NOW(), INTERVAL 15 MINUTE)`, [nomorHp]);
        return row.jumlah >= MAX_OTP_VERIFY_GAGAL_PER_15MENIT;
    }
    // Catat attempt ke tabel OTP_Attempt
    async catatAttempt(nomorHp, jenis, sukses) {
        await database_1.pool.execute('INSERT INTO OTP_Attempt (id, nomor_hp, jenis, sukses) VALUES (?, ?, ?, ?)', [(0, uuid_1.v4)(), nomorHp, jenis, sukses ? 1 : 0]);
    }
    async buat(nomorHp) {
        const kode = this.generateKode();
        // Nonaktifkan OTP lama untuk nomor yang sama
        await database_1.pool.execute('UPDATE OTP SET digunakan = 1 WHERE nomor_hp = ? AND digunakan = 0', [nomorHp]);
        await database_1.pool.execute('INSERT INTO OTP (id, nomor_hp, kode, expired_at) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))', [(0, uuid_1.v4)(), nomorHp, kode, env_1.env.OTP_EXPIRY_MINUTES]);
        await (0, whatsapp_1.kirimOTPWhatsApp)(nomorHp, kode);
        return kode;
    }
    async verifikasi(nomorHp, kode) {
        // Atomic: satu query UPDATE menggabungkan cek dan tandai — cegah race condition
        const [result] = await database_1.pool.execute(`UPDATE OTP SET digunakan = 1
       WHERE nomor_hp = ?
         AND kode = ?
         AND digunakan = 0
         AND expired_at > NOW()
       LIMIT 1`, [nomorHp, kode]);
        return result.affectedRows > 0;
    }
}
exports.OtpService = OtpService;
// Singleton instance dan fungsi kompatibilitas mundur
const otpService = new OtpService();
const generateKodeOTP = () => otpService.generateKode();
exports.generateKodeOTP = generateKodeOTP;
const buatOTP = (nomorHp) => otpService.buat(nomorHp);
exports.buatOTP = buatOTP;
const verifikasiOTP = (nomorHp, kode) => otpService.verifikasi(nomorHp, kode);
exports.verifikasiOTP = verifikasiOTP;
const cekBatasRequestOTP = (nomorHp) => otpService.cekBatasRequest(nomorHp);
exports.cekBatasRequestOTP = cekBatasRequestOTP;
const cekBatasVerifyOTP = (nomorHp) => otpService.cekBatasVerify(nomorHp);
exports.cekBatasVerifyOTP = cekBatasVerifyOTP;
const catatAttemptOTP = (nomorHp, jenis, sukses) => otpService.catatAttempt(nomorHp, jenis, sukses);
exports.catatAttemptOTP = catatAttemptOTP;
//# sourceMappingURL=otp.js.map