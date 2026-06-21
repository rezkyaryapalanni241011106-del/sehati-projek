import { Request, Response } from 'express';
import { logAudit } from '../../utils/auditLogger';
import { generateSlots, formatJam } from '../../utils/helpers';
import { v4 as uuidv4 } from 'uuid';
import { BookingModel } from './booking.model';

const HARI_MAP = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export class BookingController {
  private model: BookingModel;

  constructor() {
    this.model = new BookingModel();
  }

  showBookingForm = async (req: Request, res: Response): Promise<void> => {
    const spesialisasiList = await this.model.findSpesialisasiAktif();
    res.render('pasien/booking', { title: 'Buat Janji Temu', spesialisasiList });
  };

  getDokterList = async (req: Request, res: Response): Promise<void> => {
    const { spesialisasi, tanggal } = req.query as { spesialisasi?: string; tanggal?: string };

    if (!tanggal) {
      res.json({ dokters: [] });
      return;
    }

    const hariTerpilih = HARI_MAP[new Date(tanggal).getDay()];
    const dokters = await this.model.findDokterByHari(hariTerpilih, spesialisasi);
    res.json({ dokters });
  };

  getSlots = async (req: Request, res: Response): Promise<void> => {
    const { id_dokter, tanggal } = req.query as { id_dokter?: string; tanggal?: string };

    if (!id_dokter || !tanggal) {
      res.json({ slots: [] });
      return;
    }

    const hariTerpilih = HARI_MAP[new Date(tanggal).getDay()];
    const jadwal = await this.model.findJadwalDokter(id_dokter, hariTerpilih);

    if (!jadwal) {
      res.json({ slots: [] });
      return;
    }

    const allSlots = generateSlots(jadwal.jam_mulai, jadwal.jam_selesai, jadwal.durasi_menit);
    const bookedSlots = new Set(await this.model.findBookedSlots(id_dokter, tanggal));

    const slots = allSlots.map(slot => ({
      jam: slot,
      jam_display: formatJam(slot),
      tersedia: !bookedSlots.has(slot),
    }));

    res.json({ slots, jadwal_id: jadwal.id });
  };

  getInfoDokter = async (req: Request, res: Response): Promise<void> => {
    const { id_dokter } = req.query as { id_dokter?: string };
    if (!id_dokter) { res.json(null); return; }
    const info = await this.model.findInfoDokter(id_dokter);
    res.json(info);
  };

  buatBooking = async (req: Request, res: Response): Promise<void> => {
    const pasienId = req.user!.sub;
    const { id_dokter, id_jadwal, tanggal, slot_jam } = req.body;

    if (!id_dokter || !id_jadwal || !tanggal || !slot_jam) {
      req.flash('error', 'Data booking tidak lengkap.');
      res.redirect('/booking');
      return;
    }

    const existing = await this.model.findExistingBooking(pasienId, id_dokter, tanggal);
    if (existing) {
      req.flash('error', 'Anda sudah memiliki jadwal dengan dokter ini pada tanggal tersebut.');
      res.redirect('/booking');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    if (tanggal < today) {
      req.flash('error', 'Tidak bisa booking tanggal yang sudah lewat.');
      res.redirect('/booking');
      return;
    }

    const id = uuidv4();

    try {
      await this.model.create(id, pasienId, id_dokter, id_jadwal, tanggal, slot_jam);

      await logAudit({
        req, user: req.user,
        aktivitas: 'BOOKING',
        tabel_target: 'Kunjungan', id_target: id,
        status: 'sukses',
      });

      req.flash('success', 'Booking berhasil! Jangan lupa datang tepat waktu.');
      res.redirect('/pasien/dashboard');
    } catch (err: any) {
      if (err.code === 'ER_DUP_ENTRY') {
        req.flash('error', 'Slot waktu tersebut sudah tidak tersedia. Pilih slot lain.');
      } else {
        req.flash('error', 'Gagal membuat booking. Coba lagi.');
      }
      res.redirect('/booking');
    }
  };

  showReschedule = async (req: Request, res: Response): Promise<void> => {
    const kunjunganId = req.params.id;
    const pasienId = req.user!.sub;

    const kunjungan = await this.model.findKunjunganDetail(kunjunganId, pasienId);
    if (!kunjungan || kunjungan.status !== 'booked') {
      req.flash('error', 'Kunjungan tidak ditemukan atau tidak bisa dijadwalkan ulang.');
      res.redirect('/pasien/dashboard');
      return;
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const tanggalKunjungan = new Date(kunjungan.tanggal).toISOString().split('T')[0];

    if (tanggalKunjungan < tomorrowStr) {
      req.flash('error', 'Penjadwalan ulang hanya bisa dilakukan maksimal H-1 sebelum jadwal.');
      res.redirect('/pasien/dashboard');
      return;
    }

    const spesialisasiList = await this.model.findSpesialisasiAktif();
    res.render('pasien/reschedule', { title: 'Jadwalkan Ulang', kunjungan, spesialisasiList });
  };

  doReschedule = async (req: Request, res: Response): Promise<void> => {
    const kunjunganId = req.params.id;
    const pasienId = req.user!.sub;
    const { id_dokter, id_jadwal, tanggal, slot_jam } = req.body;

    if (!id_dokter || !id_jadwal || !tanggal || !slot_jam) {
      req.flash('error', 'Data jadwal baru tidak lengkap.');
      res.redirect(`/booking/${kunjunganId}/reschedule`);
      return;
    }

    const kunjungan = await this.model.findKunjunganDetail(kunjunganId, pasienId);
    if (!kunjungan || kunjungan.status !== 'booked') {
      req.flash('error', 'Kunjungan tidak ditemukan.');
      res.redirect('/pasien/dashboard');
      return;
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const tanggalKunjungan = new Date(kunjungan.tanggal).toISOString().split('T')[0];

    if (tanggalKunjungan < tomorrowStr) {
      req.flash('error', 'Penjadwalan ulang hanya bisa dilakukan maksimal H-1.');
      res.redirect('/pasien/dashboard');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    if (tanggal < today) {
      req.flash('error', 'Tidak bisa reschedule ke tanggal yang sudah lewat.');
      res.redirect(`/booking/${kunjunganId}/reschedule`);
      return;
    }

    try {
      await this.model.reschedule(kunjunganId, id_jadwal, tanggal, slot_jam);
      await logAudit({
        req, user: req.user,
        aktivitas: 'RESCHEDULE_BOOKING',
        tabel_target: 'Kunjungan', id_target: kunjunganId,
        status: 'sukses',
      });
      req.flash('success', 'Booking berhasil dijadwalkan ulang.');
      res.redirect('/pasien/dashboard');
    } catch (err: any) {
      if (err.code === 'ER_DUP_ENTRY') {
        req.flash('error', 'Slot waktu tersebut sudah tidak tersedia. Pilih slot lain.');
      } else {
        req.flash('error', 'Gagal menjadwalkan ulang. Coba lagi.');
      }
      res.redirect(`/booking/${kunjunganId}/reschedule`);
    }
  };

  batalBooking = async (req: Request, res: Response): Promise<void> => {
    const kunjunganId = req.params.id;
    const pasienId = req.user!.sub;

    const kunjungan = await this.model.findKunjunganMilikPasien(kunjunganId, pasienId);

    if (!kunjungan) {
      req.flash('error', 'Kunjungan tidak ditemukan.');
      res.redirect('/pasien/dashboard');
      return;
    }

    if (kunjungan.status !== 'booked') {
      req.flash('error', 'Hanya kunjungan berstatus "Terjadwal" yang bisa dibatalkan.');
      res.redirect('/pasien/dashboard');
      return;
    }

    // FR-21: Pembatalan maksimal H-1
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const tanggalKunjungan = new Date(kunjungan.tanggal).toISOString().split('T')[0];

    if (tanggalKunjungan < tomorrowStr) {
      req.flash('error', 'Pembatalan hanya bisa dilakukan maksimal H-1 (sehari sebelum jadwal).');
      res.redirect('/pasien/dashboard');
      return;
    }

    await this.model.batalkan(kunjunganId);

    await logAudit({
      req, user: req.user,
      aktivitas: 'BATAL_BOOKING',
      tabel_target: 'Kunjungan', id_target: kunjunganId,
      status: 'sukses',
    });

    req.flash('success', 'Booking berhasil dibatalkan.');
    res.redirect('/pasien/dashboard');
  };
}
