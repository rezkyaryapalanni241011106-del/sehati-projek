import { Request, Response } from 'express';
import { logAudit } from '../../utils/auditLogger';
import { tanggalIndonesia, formatJam } from '../../utils/helpers';
import { emitQueueUpdate } from '../../socket/queueSocket';
import { KedatanganModel } from './kedatangan.model';

export class KedatanganController {
  private model: KedatanganModel;

  constructor() {
    this.model = new KedatanganModel();
  }

  dashboardKedatangan = async (req: Request, res: Response): Promise<void> => {
    let tanggal = req.query.tanggal as string;
    if (!tanggal) {
      tanggal = await this.model.getTanggalHariIni();
    }

    const kunjungans = await this.model.findKunjunganHarian(tanggal);

    res.render('resepsionis/kedatangan', {
      title: 'Konfirmasi Kedatangan',
      kunjungans,
      tanggal,
      tanggalIndonesia,
      formatJam,
    });
  };

  konfirmasiHadir = async (req: Request, res: Response): Promise<void> => {
    const kunjunganId = req.params.id;
    const userId = req.user!.sub;

    const k = await this.model.findKunjunganUntukKonfirmasi(kunjunganId);

    if (!k) {
      res.json({ ok: false, message: 'Kunjungan tidak ditemukan.' });
      return;
    }

    if (k.status !== 'booked') {
      res.json({ ok: false, message: 'Status kunjungan sudah bukan booked.' });
      return;
    }

    await this.model.konfirmasiHadir(kunjunganId, userId);

    await logAudit({
      req, user: req.user,
      aktivitas: 'KONFIRMASI_KEDATANGAN',
      tabel_target: 'Kunjungan', id_target: kunjunganId,
      status: 'sukses',
    });

    // FR-26-29: Emit Socket.io ke room dokter untuk update antrian real-time
    const io = req.app.get('io');
    if (io) {
      emitQueueUpdate(io, k.id_dokter, 'add', {
        kunjungan_id: k.id,
        patient: {
          kunjungan_id: k.id,
          nomor_rm: k.nomor_rm,
          nama_pasien: k.nama_pasien,
          usia: k.usia,
          waktu_konfirmasi: new Date().toISOString(),
          keluhan_awal: k.keluhan_awal,
          status: 'hadir',
        },
      });
    }

    res.json({ ok: true, message: 'Pasien berhasil dikonfirmasi hadir.' });
  };
}
