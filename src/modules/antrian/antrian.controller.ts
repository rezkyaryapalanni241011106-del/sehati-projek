import { Request, Response } from 'express';
import { logAudit } from '../../utils/auditLogger';
import { emitQueueUpdate } from '../../socket/queueSocket';
import { AntrianModel } from './antrian.model';

export class AntrianController {
  private model: AntrianModel;

  constructor() {
    this.model = new AntrianModel();
  }

  dashboardAntrian = async (req: Request, res: Response): Promise<void> => {
    const tanggal = await this.model.getTanggalHariIni();

    // Super Admin: tampilkan monitoring semua dokter
    if (req.user!.peran === 'super_admin') {
      const semuaDokter = await this.model.findMonitoringSemuaDokter(tanggal);

      // Jika ada filter dokter tertentu via query param
      const filterDokter = req.query.dokter as string | undefined;
      let detailAntrian: any[] = [];
      let dokterDipilih: any = null;
      if (filterDokter) {
        dokterDipilih = semuaDokter.find((d: any) => d.dokter_id === filterDokter) || null;
        detailAntrian = await this.model.findAntrianDokterById(filterDokter, tanggal);
      }

      res.render('superadmin/monitoring-antrian', {
        title: 'Monitoring Antrian Hari Ini',
        semuaDokter,
        tanggal,
        detailAntrian,
        dokterDipilih,
        filterDokter: filterDokter || null,
      });
      return;
    }

    // Dokter: tampilkan antrian milik sendiri
    const dokterId = req.user!.sub;
    const [antrian, standby, selesaiHariIni, jumlah_selesai, jumlah_booked, dokterInfo] = await Promise.all([
      this.model.findAntrianAktif(dokterId, tanggal),
      this.model.findStandby(dokterId, tanggal),
      this.model.findSelesaiHariIni(dokterId, tanggal),
      this.model.countKunjunganByStatus(dokterId, tanggal, 'selesai'),
      this.model.countKunjunganByStatus(dokterId, tanggal, 'booked'),
      this.model.findDokterInfo(dokterId),
    ]);

    res.render('dokter/antrian', {
      title: 'Dashboard Antrian',
      antrian,
      standby,
      selesaiHariIni,
      dokterId,
      tanggal,
      jumlah_selesai,
      jumlah_booked,
      spesialisasi_nama: dokterInfo?.spesialisasi_nama || null,
    });
  };

  skipPasien = async (req: Request, res: Response): Promise<void> => {
    const kunjunganId = req.params.id;
    const dokterId = req.user!.sub;
    const { alasan_skip } = req.body as { alasan_skip: string };

    // FR-33: Skip wajib isi alasan
    if (!alasan_skip || alasan_skip.trim().length === 0) {
      res.json({ ok: false, message: 'Alasan skip wajib diisi.' });
      return;
    }

    const kunjungan = await this.model.findKunjunganHadir(kunjunganId, dokterId);

    if (!kunjungan || kunjungan.status !== 'hadir') {
      res.json({ ok: false, message: 'Kunjungan tidak valid untuk di-skip.' });
      return;
    }

    await this.model.setSkip(kunjunganId, alasan_skip.trim());

    await logAudit({
      req, user: req.user,
      aktivitas: 'SKIP_ANTRIAN',
      tabel_target: 'Kunjungan', id_target: kunjunganId,
      status: 'sukses', keterangan: alasan_skip.trim(),
    });

    const io = req.app.get('io');
    if (io) emitQueueUpdate(io, dokterId, 'skip', { kunjungan_id: kunjunganId });

    res.json({ ok: true });
  };

  kembaliDariStandby = async (req: Request, res: Response): Promise<void> => {
    const kunjunganId = req.params.id;
    const dokterId = req.user!.sub;

    await this.model.setKembaliHadir(kunjunganId, dokterId);

    const io = req.app.get('io');
    if (io) emitQueueUpdate(io, dokterId, 'standby_back', { kunjungan_id: kunjunganId });

    res.json({ ok: true });
  };

  searchICD10 = async (req: Request, res: Response): Promise<void> => {
    const q = (req.query.q as string)?.trim();
    if (!q || q.length < 2) {
      res.json({ results: [] });
      return;
    }

    const results = await this.model.searchICD10(q);
    res.json({ results });
  };
}
