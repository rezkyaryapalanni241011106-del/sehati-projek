import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { buatOTP, verifikasiOTP } from '../../utils/otp';
import { signToken, setTokenCookie } from '../../middleware/auth';
import { logAudit } from '../../utils/auditLogger';
import { env } from '../../config/env';
import { maskNomorHp } from '../../utils/helpers';
import { AuthModel } from './auth.model';

export class AuthController {
  private model: AuthModel;

  constructor() {
    this.model = new AuthModel();
  }

  // ============================================================
  // PASIEN — Login OTP
  // ============================================================

  showPasienLogin = (req: Request, res: Response): void => {
    res.render('auth/pasien-login', { title: 'Login Pasien', otpSent: false });
  };

  requestOTPPasien = async (req: Request, res: Response): Promise<void> => {
    const { nomor_hp } = req.body as { nomor_hp: string };

    if (!nomor_hp || !/^08\d{8,11}$/.test(nomor_hp)) {
      req.flash('error', 'Format nomor HP tidak valid. Contoh: 08123456789');
      res.redirect('/auth/pasien/login');
      return;
    }

    const kode = await buatOTP(nomor_hp);

    await logAudit({
      req,
      aktivitas: 'REQUEST_OTP',
      tabel_target: 'OTP',
      status: 'sukses',
      keterangan: `OTP diminta untuk ${maskNomorHp(nomor_hp)}`,
    });

    (req.session as any).otp_nomor_hp = nomor_hp;

    res.render('auth/pasien-verify-otp', {
      title: 'Verifikasi OTP',
      nomor_hp_masked: maskNomorHp(nomor_hp),
      otp_mock_kode: env.OTP_MOCK ? kode : null,
    });
  };

  showVerifyOTP = (req: Request, res: Response): void => {
    const nomor_hp = (req.session as any).otp_nomor_hp;
    if (!nomor_hp) {
      res.redirect('/auth/pasien/login');
      return;
    }
    res.render('auth/pasien-verify-otp', {
      title: 'Verifikasi OTP',
      nomor_hp_masked: maskNomorHp(nomor_hp),
      otp_mock_kode: null,
    });
  };

  verifyOTPPasien = async (req: Request, res: Response): Promise<void> => {
    const { kode } = req.body as { kode: string };
    const nomor_hp = (req.session as any).otp_nomor_hp as string | undefined;

    if (!nomor_hp) {
      res.redirect('/auth/pasien/login');
      return;
    }

    const valid = await verifikasiOTP(nomor_hp, kode?.trim());

    if (!valid) {
      await logAudit({ req, aktivitas: 'LOGIN_PASIEN', status: 'gagal', keterangan: `OTP salah untuk ${maskNomorHp(nomor_hp)}` });
      req.flash('error', 'Kode OTP salah atau sudah kedaluwarsa. Minta kode baru.');
      res.redirect('/auth/pasien/login');
      return;
    }

    const pasien = await this.model.findPasienByNomorHp(nomor_hp);

    if (!pasien) {
      (req.session as any).otp_verified_hp = nomor_hp;
      delete (req.session as any).otp_nomor_hp;
      res.redirect('/pasien/register');
      return;
    }

    delete (req.session as any).otp_nomor_hp;

    const token = signToken({ sub: pasien.id, peran: 'pasien', nama: pasien.nama_lengkap });
    setTokenCookie(res, token, true);

    await logAudit({
      req,
      user: { sub: pasien.id, peran: 'pasien', nama: pasien.nama_lengkap },
      aktivitas: 'LOGIN_PASIEN',
      tabel_target: 'Pasien',
      id_target: pasien.id,
      status: 'sukses',
    });

    res.redirect('/pasien/dashboard');
  };

  logoutPasien = (req: Request, res: Response): void => {
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

  showStafLogin = (req: Request, res: Response): void => {
    const reason = req.query.reason;
    let info = '';
    if (reason === 'idle') info = 'Sesi Anda habis karena tidak aktif selama 15 menit.';
    res.render('auth/staf-login', { title: 'Login Staf', info });
  };

  loginStaf = async (req: Request, res: Response): Promise<void> => {
    const { username, password } = req.body as { username: string; password: string };

    if (!username || !password) {
      req.flash('error', 'Username dan password wajib diisi.');
      res.redirect('/auth/login');
      return;
    }

    const user = await this.model.findUserByUsername(username);

    if (!user) {
      await logAudit({ req, aktivitas: 'LOGIN_STAF', status: 'gagal', keterangan: `Username tidak ditemukan: ${username}` });
      req.flash('error', 'Username atau password salah.');
      res.redirect('/auth/login');
      return;
    }

    if (!user.status_aktif) {
      req.flash('error', 'Akun Anda tidak aktif. Hubungi administrator.');
      res.redirect('/auth/login');
      return;
    }

    const passOk = await bcrypt.compare(password, user.password_hash);
    if (!passOk) {
      await logAudit({ req, aktivitas: 'LOGIN_STAF', status: 'gagal', keterangan: `Password salah untuk: ${username}` });
      req.flash('error', 'Username atau password salah.');
      res.redirect('/auth/login');
      return;
    }

    (req.session as any).totp_pending = {
      id: user.id,
      username: user.username,
      peran: user.peran,
      nama_lengkap: user.nama_lengkap,
      totp_secret: user.totp_secret,
    };

    res.redirect('/auth/verify-totp');
  };

  showVerifyTOTP = (req: Request, res: Response): void => {
    const pending = (req.session as any).totp_pending;
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

  verifyTOTP = async (req: Request, res: Response): Promise<void> => {
    const { totp_kode } = req.body as { totp_kode: string };
    const pending = (req.session as any).totp_pending;

    if (!pending) {
      res.redirect('/auth/login');
      return;
    }

    if (!pending.totp_secret) {
      await this.completeSendToken(req, res, pending);
      return;
    }

    const valid = speakeasy.totp.verify({
      secret: pending.totp_secret,
      encoding: 'base32',
      token: totp_kode?.trim(),
      window: 1,
    });

    if (!valid) {
      await logAudit({ req, aktivitas: 'LOGIN_STAF', status: 'gagal', keterangan: `TOTP salah untuk: ${pending.username}` });
      req.flash('error', 'Kode autentikator salah atau sudah kedaluwarsa.');
      res.redirect('/auth/verify-totp');
      return;
    }

    await this.completeSendToken(req, res, pending);
  };

  private completeSendToken = async (req: Request, res: Response, pending: any): Promise<void> => {
    delete (req.session as any).totp_pending;

    const token = signToken({ sub: pending.id, peran: pending.peran, nama: pending.nama_lengkap });
    setTokenCookie(res, token, false);

    await logAudit({
      req,
      user: { sub: pending.id, peran: pending.peran, nama: pending.nama_lengkap },
      aktivitas: 'LOGIN_STAF',
      tabel_target: 'Users',
      id_target: pending.id,
      status: 'sukses',
    });

    if (!pending.totp_secret) {
      req.flash('info', 'Selamat datang! Silakan setup autentikator MFA Anda sebelum melanjutkan.');
      res.redirect('/auth/setup-mfa');
      return;
    }

    const redirectMap: Record<string, string> = {
      super_admin: '/audit',
      admin: '/jadwal',
      dokter: '/antrian',
      perawat: '/kedatangan',
      resepsionis: '/kedatangan',
    };

    res.redirect(redirectMap[pending.peran] ?? '/auth/login');
  };

  logoutStaf = (req: Request, res: Response): void => {
    res.clearCookie('token');
    req.session.destroy(() => {
      res.redirect('/');
    });
  };

  // ============================================================
  // Setup MFA — tampilkan QR code
  // ============================================================

  showSetupMFA = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.sub;
    const user = await this.model.findUserById(userId);

    if (!user) {
      res.status(404).render('error', { title: 'Pengguna Tidak Ditemukan', message: '', statusCode: 404 });
      return;
    }

    let secret = user.totp_secret;

    if (!secret) {
      const generated = speakeasy.generateSecret({ name: `SEHATI:${user.username}` });
      secret = generated.base32;
      await this.model.saveTotpSecret(userId, secret);
    }

    const otpAuthUrl = speakeasy.otpauthURL({
      secret,
      label: `SEHATI:${user.username}`,
      encoding: 'base32',
    });

    const qrDataUrl = await QRCode.toDataURL(otpAuthUrl);

    res.render('auth/setup-mfa', {
      title: 'Setup Autentikator MFA',
      qr_data_url: qrDataUrl,
      totp_secret: secret,
    });
  };

  verifySetupMFA = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.sub;
    const { totp_kode } = req.body as { totp_kode: string };

    const user = await this.model.findUserById(userId);

    if (!user || !user.totp_secret) {
      req.flash('error', 'Setup MFA tidak valid. Silakan ulangi.');
      res.redirect('/auth/setup-mfa');
      return;
    }

    const valid = speakeasy.totp.verify({
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

    await logAudit({
      req, user: req.user,
      aktivitas: 'SETUP_MFA',
      tabel_target: 'Users', id_target: userId,
      status: 'sukses',
    });

    req.flash('success', 'Autentikator berhasil dikonfigurasi! Login berikutnya akan memerlukan kode dari aplikasi.');

    const redirectMap: Record<string, string> = {
      super_admin: '/audit',
      admin: '/jadwal',
      dokter: '/antrian',
      perawat: '/kedatangan',
      resepsionis: '/kedatangan',
    };
    res.redirect(redirectMap[user.peran] ?? '/auth/login');
  };
}
