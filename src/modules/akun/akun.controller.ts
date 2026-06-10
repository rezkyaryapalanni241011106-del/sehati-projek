import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { logAudit } from '../../utils/auditLogger';
import { logError } from '../../utils/logger';
import { env } from '../../config/env';
import { v4 as uuidv4 } from 'uuid';
import { AkunModel } from './akun.model';

function randPass(prefix: string): string {
  return prefix + Math.floor(1000 + Math.random() * 9000).toString();
}

async function hashPass(pass: string): Promise<string> {
  return bcrypt.hash(pass, env.BCRYPT_ROUNDS);
}

export class AkunController {
  private model: AkunModel;

  constructor() {
    this.model = new AkunModel();
  }

  // ============================================================
  // Staf (dokter/perawat/resepsionis)
  // ============================================================

  listStaf = async (req: Request, res: Response): Promise<void> => {
    const [users, spesialisasiList] = await Promise.all([
      this.model.findAllStaf(),
      this.model.findSpesialisasiAktif(),
    ]);
    res.render('admin/akun-staf', { title: 'Manajemen Akun Staf', users, spesialisasiList, edit: null });
  };

  showEditStaf = async (req: Request, res: Response): Promise<void> => {
    const edit = await this.model.findStafById(req.params.id);
    if (!edit) {
      req.flash('error', 'Akun tidak ditemukan.');
      res.redirect('/akun/staf');
      return;
    }
    const [users, spesialisasiList] = await Promise.all([
      this.model.findAllStaf(),
      this.model.findSpesialisasiAktif(),
    ]);
    res.render('admin/akun-staf', { title: 'Edit Akun Staf', users, spesialisasiList, edit });
  };

  buatStaf = async (req: Request, res: Response): Promise<void> => {
    const { username, peran, nama_lengkap, email, nomor_hp, spesialisasi, nomor_str, password_custom } = req.body;
    const id = uuidv4();
    const pass = password_custom?.trim() || randPass('sehati');
    const hash = await hashPass(pass);

    try {
      await this.model.createStaf({
        id, username, hash, peran, nama_lengkap,
        email: email || null, nomor_hp: nomor_hp || null,
        spesialisasi: spesialisasi || null, nomor_str: nomor_str || null,
        dibuat_oleh: req.user!.sub,
      });

      console.log(`[AKUN BARU] ${username} / password: ${pass}`);
      await logAudit({ req, user: req.user, aktivitas: 'BUAT_AKUN', tabel_target: 'Users', id_target: id, status: 'sukses', keterangan: `Akun baru: ${username}` });
      req.flash('success', `Akun ${username} berhasil dibuat. Password: ${pass}`);
    } catch (err: any) {
      logError('buatStaf', err, { username });
      if (err.code === 'ER_DUP_ENTRY') {
        req.flash('error', 'Username atau email sudah digunakan.');
      } else {
        req.flash('error', 'Gagal membuat akun. Periksa kembali data yang diisi.');
      }
    }
    res.redirect('/akun/staf');
  };

  updateStaf = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    const { username, nama_lengkap, email, nomor_hp, spesialisasi, nomor_str } = req.body;

    await this.model.updateStaf(id, username, nama_lengkap, email || null, nomor_hp || null, spesialisasi || null, nomor_str || null);
    await logAudit({ req, user: req.user, aktivitas: 'EDIT_AKUN', tabel_target: 'Users', id_target: id, status: 'sukses' });
    req.flash('success', 'Akun berhasil diperbarui.');
    res.redirect('/akun/staf');
  };

  toggleStaf = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    const row = await this.model.findStatusById(id);
    if (!row) {
      req.flash('error', 'Akun tidak ditemukan.');
      res.redirect('/akun/staf');
      return;
    }

    const newStatus = row.status_aktif ? 0 : 1;
    // FR-49: Nonaktifkan TIDAK menghapus data historis
    await this.model.setStatus(id, newStatus);
    await logAudit({ req, user: req.user, aktivitas: 'TOGGLE_AKUN', tabel_target: 'Users', id_target: id, status: 'sukses' });
    req.flash('success', `Akun berhasil ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}.`);
    res.redirect('/akun/staf');
  };

  resetPassword = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    const { password_custom } = req.body;
    const pass = password_custom?.trim() || randPass('sehati');
    const hash = await hashPass(pass);

    await this.model.setPassword(id, hash);
    console.log(`[RESET PASS] User ${id} / password baru: ${pass}`);
    await logAudit({ req, user: req.user, aktivitas: 'RESET_PASSWORD', tabel_target: 'Users', id_target: id, status: 'sukses' });
    req.flash('success', `Password berhasil direset. Password baru: ${pass}`);
    res.redirect('/akun/staf');
  };

  // ============================================================
  // Admin — dikelola Super Admin
  // ============================================================

  listAdmin = async (req: Request, res: Response): Promise<void> => {
    const users = await this.model.findAllAdmin();
    res.render('superadmin/akun-admin', { title: 'Manajemen Akun Admin', users, edit: null });
  };

  showEditAdmin = async (req: Request, res: Response): Promise<void> => {
    const edit = await this.model.findAdminById(req.params.id);
    if (!edit) {
      req.flash('error', 'Akun tidak ditemukan.');
      res.redirect('/akun/admin');
      return;
    }
    const users = await this.model.findAllAdmin();
    res.render('superadmin/akun-admin', { title: 'Edit Akun Admin', users, edit });
  };

  buatAdmin = async (req: Request, res: Response): Promise<void> => {
    const { username, nama_lengkap, email, password_custom } = req.body;
    const id = uuidv4();
    const pass = password_custom?.trim() || randPass('admin');
    const hash = await hashPass(pass);

    try {
      await this.model.createAdmin(id, username, hash, nama_lengkap, email || null, req.user!.sub);
      console.log(`[AKUN ADMIN BARU] ${username} / password: ${pass}`);
      await logAudit({ req, user: req.user, aktivitas: 'BUAT_AKUN_ADMIN', tabel_target: 'Users', id_target: id, status: 'sukses' });
      req.flash('success', `Akun admin ${username} berhasil dibuat. Password: ${pass}`);
    } catch (err: any) {
      logError('buatAdmin', err, { username });
      if (err.code === 'ER_DUP_ENTRY') {
        req.flash('error', 'Username atau email sudah digunakan.');
      } else {
        req.flash('error', 'Gagal membuat akun admin. Periksa kembali data yang diisi.');
      }
    }
    res.redirect('/akun/admin');
  };

  updateAdmin = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    const { nama_lengkap, email } = req.body;

    await this.model.updateAdmin(id, nama_lengkap, email || null);
    await logAudit({ req, user: req.user, aktivitas: 'EDIT_AKUN_ADMIN', tabel_target: 'Users', id_target: id, status: 'sukses' });
    req.flash('success', 'Akun admin berhasil diperbarui.');
    res.redirect('/akun/admin');
  };

  toggleAdmin = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    const row = await this.model.findStatusById(id);
    if (!row) {
      req.flash('error', 'Akun tidak ditemukan.');
      res.redirect('/akun/admin');
      return;
    }
    const newStatus = row.status_aktif ? 0 : 1;
    await this.model.setStatus(id, newStatus);
    await logAudit({ req, user: req.user, aktivitas: 'TOGGLE_AKUN_ADMIN', tabel_target: 'Users', id_target: id, status: 'sukses' });
    req.flash('success', `Akun admin berhasil ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}.`);
    res.redirect('/akun/admin');
  };

  resetPasswordAdmin = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    const { password_custom } = req.body;
    const pass = password_custom?.trim() || randPass('admin');
    const hash = await hashPass(pass);

    await this.model.setPassword(id, hash);
    console.log(`[RESET PASS ADMIN] User ${id} / password baru: ${pass}`);
    await logAudit({ req, user: req.user, aktivitas: 'RESET_PASSWORD_ADMIN', tabel_target: 'Users', id_target: id, status: 'sukses' });
    req.flash('success', `Password admin berhasil direset. Password baru: ${pass}`);
    res.redirect('/akun/admin');
  };
}
