import { Request, Response } from 'express';
import { logAudit } from '../../utils/auditLogger';
import { v4 as uuidv4 } from 'uuid';
import { SpesialisasiModel } from './spesialisasi.model';

export class SpesialisasiController {
  private model: SpesialisasiModel;

  constructor() {
    this.model = new SpesialisasiModel();
  }

  listSpesialisasi = async (req: Request, res: Response): Promise<void> => {
    const list = await this.model.findAll();
    res.render('admin/spesialisasi', { title: 'Manajemen Spesialisasi', list });
  };

  buatSpesialisasi = async (req: Request, res: Response): Promise<void> => {
    const { nama } = req.body as { nama: string };
    if (!nama?.trim()) {
      req.flash('error', 'Nama spesialisasi wajib diisi.');
      res.redirect('/spesialisasi');
      return;
    }

    const id = uuidv4();
    try {
      await this.model.create(id, nama.trim());
      await logAudit({ req, user: req.user, aktivitas: 'BUAT_SPESIALISASI', tabel_target: 'Spesialisasi', id_target: id, status: 'sukses' });
      req.flash('success', 'Spesialisasi berhasil ditambahkan.');
    } catch (err: any) {
      if (err.code === 'ER_DUP_ENTRY') {
        req.flash('error', `Spesialisasi "${nama.trim()}" sudah ada.`);
      } else {
        req.flash('error', 'Gagal menyimpan spesialisasi.');
      }
    }
    res.redirect('/spesialisasi');
  };

  toggleSpesialisasi = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    const row = await this.model.findById(id);
    if (!row) {
      req.flash('error', 'Spesialisasi tidak ditemukan.');
      res.redirect('/spesialisasi');
      return;
    }

    const newStatus = row.status_aktif ? 0 : 1;
    await this.model.setStatus(id, newStatus);
    await logAudit({ req, user: req.user, aktivitas: 'TOGGLE_SPESIALISASI', tabel_target: 'Spesialisasi', id_target: id, status: 'sukses' });
    req.flash('success', `Spesialisasi berhasil ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}.`);
    res.redirect('/spesialisasi');
  };

  hapusSpesialisasi = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    const isUsed = await this.model.isUsedByDokter(id);
    if (isUsed) {
      req.flash('error', 'Tidak bisa menghapus spesialisasi yang masih digunakan oleh dokter.');
      res.redirect('/spesialisasi');
      return;
    }
    await this.model.delete(id);
    await logAudit({ req, user: req.user, aktivitas: 'HAPUS_SPESIALISASI', tabel_target: 'Spesialisasi', id_target: id, status: 'sukses' });
    req.flash('success', 'Spesialisasi berhasil dihapus.');
    res.redirect('/spesialisasi');
  };
}
