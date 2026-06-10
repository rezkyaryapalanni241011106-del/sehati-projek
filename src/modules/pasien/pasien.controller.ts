import { Request, Response } from 'express';
import { logAudit } from '../../utils/auditLogger';
import { generateNomorRM } from '../../utils/nomorRM';
import { signToken, setTokenCookie } from '../../middleware/auth';
import { hitungUsia, tanggalIndonesia, maskNomorHp } from '../../utils/helpers';
import { buatOTP, verifikasiOTP, cekBatasRequestOTP, cekBatasVerifyOTP, catatAttemptOTP } from '../../utils/otp';
import { env } from '../../config/env';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { PasienModel } from './pasien.model';

const schemaRegister = z.object({
  nama_lengkap: z.string().min(3).max(200),
  tanggal_lahir: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  jenis_kelamin: z.enum(['L', 'P']),
  alamat: z.string().min(10),
  nik: z.string().length(16).optional().or(z.literal('')),
  nomor_paspor: z.string().max(50).optional().or(z.literal('')),
  nik_wali: z.string().length(16).optional().or(z.literal('')),
  pekerjaan: z.string().max(100).optional(),
  pendidikan: z.string().max(100).optional(),
  status_perkawinan: z.string().max(50).optional(),
  agama: z.string().max(50).optional(),
  golongan_darah: z.enum(['A','B','AB','O','A+','A-','B+','B-','AB+','AB-','O+','O-']).optional().or(z.literal('')),
  alergi: z.string().optional(),
  riwayat_kronis: z.string().optional(),
});

export class PasienController {
  private model: PasienModel;

  constructor() {
    this.model = new PasienModel();
  }

  showRegister = (req: Request, res: Response): void => {
    const nomor_hp = (req.session as any).otp_verified_hp;
    if (!nomor_hp) {
      res.redirect('/auth/pasien/login');
      return;
    }
    res.render('pasien/register', { title: 'Daftar Akun Pasien', nomor_hp });
  };

  registerPasien = async (req: Request, res: Response): Promise<void> => {
    const nomor_hp = (req.session as any).otp_verified_hp as string | undefined;
    if (!nomor_hp) {
      res.redirect('/auth/pasien/login');
      return;
    }

    const parse = schemaRegister.safeParse(req.body);
    if (!parse.success) {
      req.flash('error', parse.error.errors.map(e => e.message).join(', '));
      res.redirect('/pasien/register');
      return;
    }

    const d = parse.data;

    if (d.nik) {
      const existing = await this.model.findByNik(d.nik);
      if (existing) {
        req.flash('error', 'NIK sudah terdaftar. Silakan login dengan nomor HP yang terdaftar.');
        res.redirect('/auth/pasien/login');
        return;
      }
    }

    if (!d.nik) {
      if (!d.nomor_paspor && !d.nik_wali) {
        req.flash('error', 'Pasien tanpa NIK wajib mengisi Nomor Paspor atau NIK Wali.');
        res.redirect('/pasien/register');
        return;
      }
    }

    const id = uuidv4();
    const nomor_rm = await generateNomorRM();

    await this.model.create({
      id, nomor_rm,
      nik: d.nik || null,
      nama_lengkap: d.nama_lengkap,
      tanggal_lahir: d.tanggal_lahir,
      jenis_kelamin: d.jenis_kelamin,
      nomor_hp,
      alamat: d.alamat,
      pekerjaan: d.pekerjaan || null,
      pendidikan: d.pendidikan || null,
      status_perkawinan: d.status_perkawinan || null,
      agama: d.agama || null,
      golongan_darah: d.golongan_darah || null,
      alergi: d.alergi || null,
      riwayat_kronis: d.riwayat_kronis || null,
      nomor_paspor: d.nomor_paspor || null,
      nik_wali: d.nik_wali || null,
    });

    delete (req.session as any).otp_verified_hp;

    await logAudit({
      req,
      user: { sub: id, peran: 'pasien', nama: d.nama_lengkap },
      aktivitas: 'REGISTRASI_PASIEN',
      tabel_target: 'Pasien',
      id_target: id,
      status: 'sukses',
      keterangan: `Pasien baru: ${nomor_rm}`,
    });

    const token = signToken({ sub: id, peran: 'pasien', nama: d.nama_lengkap });
    setTokenCookie(res, token, true);
    req.flash('success', `Pendaftaran berhasil! Nomor RM Anda: ${nomor_rm}`);
    res.redirect('/pasien/dashboard');
  };

  dashboard = async (req: Request, res: Response): Promise<void> => {
    const pasienId = req.user!.sub;
    const { pasien, mendatang, riwayat } = await this.model.findDashboardData(pasienId);

    res.render('pasien/dashboard', {
      title: 'Dashboard Pasien',
      pasien,
      mendatang,
      riwayat,
      hitungUsia,
      tanggalIndonesia,
      maskNomorHp,
    });
  };

  showProfil = async (req: Request, res: Response): Promise<void> => {
    const pasien = await this.model.findById(req.user!.sub);
    if (!pasien) {
      res.status(404).render('error', { title: 'Tidak Ditemukan', message: '', statusCode: 404 });
      return;
    }
    res.render('pasien/profil', { title: 'Profil Saya', pasien, tanggalIndonesia });
  };

  updateProfil = async (req: Request, res: Response): Promise<void> => {
    const pasienId = req.user!.sub;
    const { alamat, nomor_hp, pekerjaan, pendidikan, status_perkawinan, agama, golongan_darah, alergi, riwayat_kronis } = req.body;

    // Validasi format nomor HP
    if (!nomor_hp || !/^08\d{8,11}$/.test(nomor_hp)) {
      req.flash('error', 'Format nomor HP tidak valid. Contoh: 08123456789');
      res.redirect('/pasien/profil');
      return;
    }

    // Cek uniqueness nomor HP — tolak jika sudah dipakai pasien lain
    const existing = await this.model.findByNomorHp(nomor_hp);
    if (existing && existing.id !== pasienId) {
      req.flash('error', 'Nomor HP sudah digunakan oleh akun lain.');
      res.redirect('/pasien/profil');
      return;
    }

    await this.model.update(pasienId, {
      alamat, nomor_hp,
      pekerjaan: pekerjaan || null,
      pendidikan: pendidikan || null,
      status_perkawinan: status_perkawinan || null,
      agama: agama || null,
      golongan_darah: golongan_darah || null,
      alergi: alergi || null,
      riwayat_kronis: riwayat_kronis || null,
    });

    await logAudit({
      req, user: req.user,
      aktivitas: 'UPDATE_PROFIL_PASIEN',
      tabel_target: 'Pasien', id_target: pasienId,
      status: 'sukses',
    });

    req.flash('success', 'Profil berhasil diperbarui.');
    res.redirect('/pasien/profil');
  };

  showGantiHP = async (req: Request, res: Response): Promise<void> => {
    const pasien = await this.model.findById(req.user!.sub);
    if (!pasien) { res.redirect('/pasien/dashboard'); return; }
    res.render('pasien/ganti-hp', {
      title: 'Ganti Nomor HP',
      nomor_hp_masked: maskNomorHp(pasien.nomor_hp),
    });
  };

  requestGantiHP = async (req: Request, res: Response): Promise<void> => {
    const pasienId = req.user!.sub;
    const { nomor_hp_baru } = req.body as { nomor_hp_baru: string };

    if (!nomor_hp_baru || !/^08\d{8,11}$/.test(nomor_hp_baru)) {
      req.flash('error', 'Format nomor HP tidak valid. Contoh: 08123456789');
      res.redirect('/pasien/ganti-hp');
      return;
    }

    const existing = await this.model.findByNomorHp(nomor_hp_baru);
    if (existing && existing.id !== pasienId) {
      req.flash('error', 'Nomor HP sudah digunakan oleh akun lain.');
      res.redirect('/pasien/ganti-hp');
      return;
    }

    const pasien = await this.model.findById(pasienId);
    if (pasien && pasien.nomor_hp === nomor_hp_baru) {
      req.flash('error', 'Nomor HP baru tidak boleh sama dengan nomor HP saat ini.');
      res.redirect('/pasien/ganti-hp');
      return;
    }

    const melebihiBatas = await cekBatasRequestOTP(nomor_hp_baru);
    if (melebihiBatas) {
      req.flash('error', 'Terlalu banyak permintaan OTP. Coba lagi dalam 1 jam.');
      res.redirect('/pasien/ganti-hp');
      return;
    }

    await catatAttemptOTP(nomor_hp_baru, 'request', true);
    const kode = await buatOTP(nomor_hp_baru);

    (req.session as any).ganti_hp_pending = nomor_hp_baru;
    if (env.OTP_MOCK) (req.session as any).ganti_hp_mock_kode = kode;

    req.session.save((err) => {
      if (err) {
        req.flash('error', 'Terjadi kesalahan sesi. Coba lagi.');
        res.redirect('/pasien/ganti-hp');
        return;
      }
      res.redirect('/pasien/ganti-hp/verifikasi');
    });
  };

  showVerifikasiGantiHP = (req: Request, res: Response): void => {
    const nomor_hp_baru = (req.session as any).ganti_hp_pending;
    if (!nomor_hp_baru) { res.redirect('/pasien/ganti-hp'); return; }
    const otp_mock_kode = env.OTP_MOCK ? (req.session as any).ganti_hp_mock_kode ?? null : null;
    res.render('pasien/ganti-hp-verifikasi', {
      title: 'Verifikasi Nomor HP Baru',
      nomor_hp_masked: maskNomorHp(nomor_hp_baru),
      otp_mock_kode,
    });
  };

  verifikasiGantiHP = async (req: Request, res: Response): Promise<void> => {
    const pasienId = req.user!.sub;
    const nomor_hp_baru = (req.session as any).ganti_hp_pending as string | undefined;
    if (!nomor_hp_baru) { res.redirect('/pasien/ganti-hp'); return; }

    const { kode } = req.body as { kode: string };

    const melebihiBatas = await cekBatasVerifyOTP(nomor_hp_baru);
    if (melebihiBatas) {
      req.flash('error', 'Terlalu banyak percobaan verifikasi. Coba lagi dalam 15 menit.');
      res.redirect('/pasien/ganti-hp/verifikasi');
      return;
    }

    const valid = await verifikasiOTP(nomor_hp_baru, kode);
    await catatAttemptOTP(nomor_hp_baru, 'verify', valid);

    if (!valid) {
      req.flash('error', 'Kode OTP tidak valid atau sudah kedaluwarsa.');
      res.redirect('/pasien/ganti-hp/verifikasi');
      return;
    }

    await this.model.updateNomorHp(pasienId, nomor_hp_baru);

    delete (req.session as any).ganti_hp_pending;
    delete (req.session as any).ganti_hp_mock_kode;

    await logAudit({
      req, user: req.user,
      aktivitas: 'GANTI_NOMOR_HP',
      tabel_target: 'Pasien', id_target: pasienId,
      status: 'sukses',
      keterangan: `Nomor HP diubah ke ${maskNomorHp(nomor_hp_baru)}`,
    });

    req.flash('success', 'Nomor HP berhasil diperbarui.');
    res.redirect('/pasien/dashboard');
  };
}
