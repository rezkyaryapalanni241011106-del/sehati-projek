"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const speakeasy_1 = __importDefault(require("speakeasy"));
const qrcode_1 = __importDefault(require("qrcode"));
const otp_1 = require("../../utils/otp");
const auth_1 = require("../../middleware/auth");
const auditLogger_1 = require("../../utils/auditLogger");
const env_1 = require("../../config/env");
const helpers_1 = require("../../utils/helpers");
const auth_model_1 = require("./auth.model");
class AuthController {
    constructor() {
        // ============================================================
        // PASIEN — Login OTP
        // ============================================================
        this.showPasienLogin = (_req, res) => {
            res.render('auth/pasien-login', { title: 'Login Pasien', otpSent: false });
        };
        this.requestOTPPasien = async (req, res) => {
            const { nomor_hp } = req.body;
            if (!nomor_hp || !/^08\d{8,11}$/.test(nomor_hp)) {
                req.flash('error', 'Format nomor HP tidak valid. Contoh: 08123456789');
                res.redirect('/auth/pasien/login');
                return;
            }
            // Rate limit per-nomor HP: maks 3 request per jam
            const melebihiBatas = await (0, otp_1.cekBatasRequestOTP)(nomor_hp);
            if (melebihiBatas) {
                req.flash('error', 'Terlalu banyak permintaan OTP. Coba lagi dalam 1 jam.');
                res.redirect('/auth/pasien/login');
                return;
            }
            await (0, otp_1.catatAttemptOTP)(nomor_hp, 'request', true);
            const kode = await (0, otp_1.buatOTP)(nomor_hp);
            await (0, auditLogger_1.logAudit)({
                req,
                aktivitas: 'REQUEST_OTP',
                tabel_target: 'OTP',
                status: 'sukses',
                keterangan: `OTP diminta untuk ${(0, helpers_1.maskNomorHp)(nomor_hp)}`,
            });
            req.session.otp_nomor_hp = nomor_hp;
            if (env_1.env.OTP_MOCK)
                req.session.otp_mock_kode = kode;
            req.session.save((err) => {
                if (err) {
                    req.flash('error', 'Terjadi kesalahan sesi. Coba lagi.');
                    res.redirect('/auth/pasien/login');
                    return;
                }
                res.redirect('/auth/pasien/verify-otp');
            });
        };
        this.showVerifyOTP = (req, res) => {
            const nomor_hp = req.session.otp_nomor_hp;
            if (!nomor_hp) {
                res.redirect('/auth/pasien/login');
                return;
            }
            const otp_mock_kode = env_1.env.OTP_MOCK ? req.session.otp_mock_kode ?? null : null;
            res.render('auth/pasien-verify-otp', {
                title: 'Verifikasi OTP',
                nomor_hp_masked: (0, helpers_1.maskNomorHp)(nomor_hp),
                otp_mock_kode,
            });
        };
        this.verifyOTPPasien = async (req, res) => {
            const { kode } = req.body;
            const nomor_hp = req.session.otp_nomor_hp;
            if (!nomor_hp) {
                res.redirect('/auth/pasien/login');
                return;
            }
            if (!kode || kode.trim().length !== 6) {
                req.flash('error', 'Kode OTP harus 6 digit. Pastikan semua kotak terisi.');
                res.redirect('/auth/pasien/login');
                return;
            }
            // Rate limit per-nomor HP: maks 5 percobaan gagal per 15 menit
            const melebihiBatasVerify = await (0, otp_1.cekBatasVerifyOTP)(nomor_hp);
            if (melebihiBatasVerify) {
                req.flash('error', 'Terlalu banyak percobaan gagal. Minta kode OTP baru dan coba lagi dalam 15 menit.');
                res.redirect('/auth/pasien/login');
                return;
            }
            const valid = await (0, otp_1.verifikasiOTP)(nomor_hp, kode.trim());
            if (!valid) {
                await (0, otp_1.catatAttemptOTP)(nomor_hp, 'verify', false);
                await (0, auditLogger_1.logAudit)({ req, aktivitas: 'LOGIN_PASIEN', status: 'gagal', keterangan: `OTP salah untuk ${(0, helpers_1.maskNomorHp)(nomor_hp)}` });
                req.flash('error', 'Kode OTP salah atau sudah kedaluwarsa. Minta kode baru.');
                res.redirect('/auth/pasien/login');
                return;
            }
            await (0, otp_1.catatAttemptOTP)(nomor_hp, 'verify', true);
            const pasien = await this.model.findPasienByNomorHp(nomor_hp);
            if (!pasien) {
                req.session.otp_verified_hp = nomor_hp;
                delete req.session.otp_nomor_hp;
                req.flash('info', 'Nomor HP belum terdaftar. Lengkapi data berikut untuk membuat akun pasien.');
                res.redirect('/pasien/register');
                return;
            }
            delete req.session.otp_nomor_hp;
            const token = (0, auth_1.signToken)({ sub: pasien.id, peran: 'pasien', nama: pasien.nama_lengkap });
            (0, auth_1.setTokenCookie)(res, token, true);
            await (0, auditLogger_1.logAudit)({
                req,
                user: { sub: pasien.id, peran: 'pasien', nama: pasien.nama_lengkap },
                aktivitas: 'LOGIN_PASIEN',
                tabel_target: 'Pasien',
                id_target: pasien.id,
                status: 'sukses',
            });
            res.redirect('/pasien/dashboard');
        };
        this.logoutPasien = (req, res) => {
            res.clearCookie('token_pasien');
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            req.session.destroy(() => {
                res.redirect('/');
            });
        };
        // ============================================================
        // STAF — Login Username + Password + TOTP
        // ============================================================
        this.showStafLogin = (req, res) => {
            const reason = req.query.reason;
            let info = '';
            if (reason === 'idle')
                info = 'Sesi Anda habis karena tidak aktif selama 15 menit.';
            res.render('auth/staf-login', { title: 'Login Staf', info });
        };
        this.loginStaf = async (req, res) => {
            const { username, password } = req.body;
            if (!username || !password) {
                req.flash('error', 'Username dan password wajib diisi.');
                res.redirect('/auth/login');
                return;
            }
            const user = await this.model.findUserByUsername(username);
            if (!user) {
                await (0, auditLogger_1.logAudit)({ req, aktivitas: 'LOGIN_STAF', status: 'gagal', keterangan: `Username tidak ditemukan: ${username}` });
                req.flash('error', 'Username atau password salah.');
                res.redirect('/auth/login');
                return;
            }
            if (!user.status_aktif) {
                req.flash('error', 'Akun Anda tidak aktif. Hubungi administrator.');
                res.redirect('/auth/login');
                return;
            }
            const passOk = await bcrypt_1.default.compare(password, user.password_hash);
            if (!passOk) {
                await (0, auditLogger_1.logAudit)({ req, aktivitas: 'LOGIN_STAF', status: 'gagal', keterangan: `Password salah untuk: ${username}` });
                req.flash('error', 'Username atau password salah.');
                res.redirect('/auth/login');
                return;
            }
            req.session.totp_pending = {
                id: user.id,
                username: user.username,
                peran: user.peran,
                nama_lengkap: user.nama_lengkap,
                totp_secret: user.totp_secret,
            };
            res.redirect('/auth/verify-totp');
        };
        this.showVerifyTOTP = (req, res) => {
            const pending = req.session.totp_pending;
            if (!pending) {
                res.redirect('/auth/login');
                return;
            }
            res.render('auth/staf-verify-totp', {
                title: 'Verifikasi MFA',
                nama: pending.nama_lengkap,
                has_secret: !!pending.totp_secret,
            });
        };
        this.verifyTOTP = async (req, res) => {
            const { totp_kode } = req.body;
            const pending = req.session.totp_pending;
            if (!pending) {
                res.redirect('/auth/login');
                return;
            }
            if (!pending.totp_secret) {
                await this.completeSendToken(req, res, pending);
                return;
            }
            const valid = speakeasy_1.default.totp.verify({
                secret: pending.totp_secret,
                encoding: 'base32',
                token: totp_kode?.trim(),
                window: 1,
            });
            if (!valid) {
                await (0, auditLogger_1.logAudit)({ req, aktivitas: 'LOGIN_STAF', status: 'gagal', keterangan: `TOTP salah untuk: ${pending.username}` });
                req.flash('error', 'Kode autentikator salah atau sudah kedaluwarsa.');
                res.redirect('/auth/verify-totp');
                return;
            }
            await this.completeSendToken(req, res, pending);
        };
        this.completeSendToken = async (req, res, pending) => {
            delete req.session.totp_pending;
            await (0, auditLogger_1.logAudit)({
                req,
                user: { sub: pending.id, peran: pending.peran, nama: pending.nama_lengkap },
                aktivitas: 'LOGIN_STAF',
                tabel_target: 'Users',
                id_target: pending.id,
                status: 'sukses',
            });
            if (!pending.totp_secret) {
                // Simpan identitas di session untuk alur setup MFA — JWT belum diterbitkan
                req.session.mfa_setup_pending = {
                    id: pending.id,
                    peran: pending.peran,
                    nama: pending.nama_lengkap,
                };
                req.flash('info', 'Selamat datang! Silakan setup autentikator MFA Anda sebelum melanjutkan.');
                res.redirect('/auth/setup-mfa');
                return;
            }
            // Token hanya diterbitkan setelah MFA dikonfirmasi sudah terkonfigurasi
            const token = (0, auth_1.signToken)({ sub: pending.id, peran: pending.peran, nama: pending.nama_lengkap });
            (0, auth_1.setTokenCookie)(res, token, false);
            const redirectMap = {
                super_admin: '/audit',
                admin: '/jadwal',
                dokter: '/antrian',
                perawat: '/kedatangan',
                resepsionis: '/kedatangan',
            };
            res.redirect(redirectMap[pending.peran] ?? '/auth/login');
        };
        this.logoutStaf = (req, res) => {
            res.clearCookie('token');
            req.session.destroy(() => {
                res.redirect('/');
            });
        };
        this.showUbahPassword = (req, res) => {
            res.render('auth/ubah-password', { title: 'Ubah Password', user: req.user });
        };
        this.prosesUbahPassword = async (req, res) => {
            const { password_lama, password_baru, konfirmasi_baru } = req.body;
            const userId = req.user.sub;
            if (!password_lama || !password_baru || !konfirmasi_baru) {
                req.flash('error', 'Semua field wajib diisi.');
                res.redirect('/auth/ubah-password');
                return;
            }
            if (password_baru.length < 8) {
                req.flash('error', 'Password baru minimal 8 karakter.');
                res.redirect('/auth/ubah-password');
                return;
            }
            if (password_baru !== konfirmasi_baru) {
                req.flash('error', 'Konfirmasi password tidak cocok.');
                res.redirect('/auth/ubah-password');
                return;
            }
            const user = await this.model.findUserById(userId);
            if (!user || !user.password_hash) {
                req.flash('error', 'Pengguna tidak ditemukan.');
                res.redirect('/auth/ubah-password');
                return;
            }
            const passOk = await bcrypt_1.default.compare(password_lama, user.password_hash);
            if (!passOk) {
                req.flash('error', 'Password lama tidak cocok.');
                res.redirect('/auth/ubah-password');
                return;
            }
            const sameBcrypt = await bcrypt_1.default.compare(password_baru, user.password_hash);
            if (sameBcrypt) {
                req.flash('error', 'Password baru tidak boleh sama dengan password lama.');
                res.redirect('/auth/ubah-password');
                return;
            }
            const newHash = await bcrypt_1.default.hash(password_baru, 12);
            await this.model.updatePassword(userId, newHash);
            await (0, auditLogger_1.logAudit)({
                req, user: req.user,
                aktivitas: 'UBAH_PASSWORD_SENDIRI',
                tabel_target: 'Users', id_target: userId,
                status: 'sukses',
            });
            const redirectMap = {
                super_admin: '/audit',
                admin: '/admin',
                dokter: '/antrian',
                perawat: '/kedatangan',
                resepsionis: '/kedatangan',
            };
            req.flash('success', 'Password berhasil diubah.');
            res.redirect(redirectMap[req.user.peran] ?? '/auth/login');
        };
        // ============================================================
        // Setup MFA — tampilkan QR code
        // ============================================================
        this.showSetupMFA = async (req, res) => {
            const userId = req.user?.sub ?? req.session.mfa_setup_pending?.id;
            if (!userId) {
                res.redirect('/auth/login');
                return;
            }
            const user = await this.model.findUserById(userId);
            if (!user) {
                res.status(404).render('error', { title: 'Pengguna Tidak Ditemukan', message: '', statusCode: 404 });
                return;
            }
            let secret = user.totp_secret;
            if (!secret) {
                const generated = speakeasy_1.default.generateSecret({ name: `SEHATI:${user.username}` });
                secret = generated.base32;
                await this.model.saveTotpSecret(userId, secret);
            }
            const otpAuthUrl = speakeasy_1.default.otpauthURL({
                secret,
                label: `SEHATI:${user.username}`,
                encoding: 'base32',
            });
            const qrDataUrl = await qrcode_1.default.toDataURL(otpAuthUrl);
            res.render('auth/setup-mfa', {
                title: 'Setup Autentikator MFA',
                qr_data_url: qrDataUrl,
                totp_secret: secret,
            });
        };
        this.verifySetupMFA = async (req, res) => {
            const isPostLoginSetup = !req.cookies?.token && req.session.mfa_setup_pending;
            const userId = req.user?.sub ?? req.session.mfa_setup_pending?.id;
            if (!userId) {
                res.redirect('/auth/login');
                return;
            }
            const { totp_kode } = req.body;
            const user = await this.model.findUserById(userId);
            if (!user || !user.totp_secret) {
                req.flash('error', 'Setup MFA tidak valid. Silakan ulangi.');
                res.redirect('/auth/setup-mfa');
                return;
            }
            const valid = speakeasy_1.default.totp.verify({
                secret: user.totp_secret,
                encoding: 'base32',
                token: totp_kode?.trim(),
                window: 1,
            });
            if (!valid) {
                req.flash('error', 'Kode tidak cocok. Pastikan waktu perangkat Anda sudah benar dan scan ulang QR jika perlu.');
                res.redirect('/auth/setup-mfa');
                return;
            }
            await (0, auditLogger_1.logAudit)({
                req, user: req.user,
                aktivitas: 'SETUP_MFA',
                tabel_target: 'Users', id_target: userId,
                status: 'sukses',
            });
            // Jika dari alur post-login (tidak ada JWT sebelumnya): hapus session, baru issue JWT
            if (isPostLoginSetup) {
                delete req.session.mfa_setup_pending;
                const token = (0, auth_1.signToken)({ sub: user.id, peran: user.peran, nama: user.nama_lengkap });
                (0, auth_1.setTokenCookie)(res, token, false);
            }
            req.flash('success', 'Autentikator berhasil dikonfigurasi! Login berikutnya akan memerlukan kode dari aplikasi.');
            const redirectMap = {
                super_admin: '/audit',
                admin: '/jadwal',
                dokter: '/antrian',
                perawat: '/kedatangan',
                resepsionis: '/kedatangan',
            };
            res.redirect(redirectMap[user.peran] ?? '/auth/login');
        };
        this.model = new auth_model_1.AuthModel();
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map