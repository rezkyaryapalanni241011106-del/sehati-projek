import { Request, Response } from 'express';
import { logAudit } from '../../utils/auditLogger';
import { v4 as uuidv4 } from 'uuid';
import { JadwalModel } from './jadwal.model';

export class JadwalController {
  private model: JadwalModel;

  constructor() {
    this.model = new JadwalModel();
  }

  listJadwal = async (req: Request, res: Response): Promise<void> => {
    const [dokterList, rows] = await Promise.all([
      this.model.findAllDokter(),
      this.model.findAllJadwal(),
    ]);
    res.render('admin/jadwal', { title: 'Manajemen Jadwal', rows, dokterList, edit: null });
  };

  showEditJadwal = async (req: Request, res: Response): Promise<void> => {
    const edit = await this.model.findById(req.params.id);
    if (!edit) {
      req.flash('error', 'Jadwal tidak ditemukan.');
      res.redirect('/jadwal');
      return;
    }
    const [dokterList, rows] = await Promise.all([
      this.model.findAllDokter(),
      this.model.findAllJadwal(),
    ]);
    res.render('admin/jadwal', { title: 'Edit Jadwal', rows, dokterList, edit });
  };

  buatJadwal = async (req: Request, res: Response): Promise<void> => {
    const { id_dokter, hari, jam_mulai, jam_selesai, durasi_menit, kuota } = req.body;
    const id = uuidv4();

    await this.model.create(id, id_dokter, hari, jam_mulai, jam_selesai, parseInt(durasi_menit), parseInt(kuota));

    await logAudit({
      req, user: req.user,
      aktivitas: 'BUAT_JADWAL',
      tabel_target: 'Jadwal_Praktek', id_target: id,
      status: 'sukses',
    });

    req.flash('success', 'Jadwal berhasil ditambahkan.');
    res.redirect('/jadwal');
  };

  updateJadwal = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    const { hari, jam_mulai, jam_selesai, durasi_menit, kuota } = req.body;

    await this.model.update(id, hari, jam_mulai, jam_selesai, parseInt(durasi_menit), parseInt(kuota));

    await logAudit({ req, user: req.user, aktivitas: 'EDIT_JADWAL', tabel_target: 'Jadwal_Praktek', id_target: id, status: 'sukses' });
    req.flash('success', 'Jadwal berhasil diperbarui.');
    res.redirect('/jadwal');
  };

  toggleJadwal = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    const jadwal = await this.model.findById(id);
    if (!jadwal) {
      res.json({ ok: false });
      return;
    }

    const newStatus = jadwal.status_aktif ? 0 : 1;
    await this.model.setStatus(id, newStatus);

    if (!newStatus) {
      const bookings = await this.model.findBookingAktifByJadwal(id);
      if (bookings.length > 0) {
        await this.model.batalkanBookingByJadwal(id);
        for (const b of bookings) {
          await logAudit({
            req, user: req.user,
            aktivitas: 'BATAL_OTOMATIS_JADWAL_DIBLOKIR',
            tabel_target: 'Kunjungan', id_target: b.id,
            status: 'sukses',
            keterangan: `Auto-batal: jadwal dinonaktifkan. Pasien: ${b.nama_lengkap} (${b.nomor_hp})`,
          });
        }
        const daftarPasien = bookings.map((b: any) => `${b.nama_lengkap} (${b.nomor_hp})`).join(', ');
        req.flash('error', `${bookings.length} booking otomatis dibatalkan. Hubungi pasien: ${daftarPasien}`);
      }
    }

    await logAudit({ req, user: req.user, aktivitas: 'TOGGLE_JADWAL', tabel_target: 'Jadwal_Praktek', id_target: id, status: 'sukses' });
    req.flash('success', `Jadwal berhasil ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}.`);
    res.redirect('/jadwal');
  };

  hapusJadwal = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    const hasAktif = await this.model.hasKunjunganAktif(id);
    if (hasAktif) {
      req.flash('error', 'Tidak bisa menghapus jadwal yang masih memiliki kunjungan aktif.');
      res.redirect('/jadwal');
      return;
    }

    await this.model.delete(id);
    await logAudit({ req, user: req.user, aktivitas: 'HAPUS_JADWAL', tabel_target: 'Jadwal_Praktek', id_target: id, status: 'sukses' });
    req.flash('success', 'Jadwal berhasil dihapus.');
    res.redirect('/jadwal');
  };
}
