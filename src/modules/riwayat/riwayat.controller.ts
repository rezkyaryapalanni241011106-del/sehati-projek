import { Request, Response } from 'express';
import { tanggalIndonesia, hitungUsia, formatJam } from '../../utils/helpers';
import { RiwayatModel } from './riwayat.model';

export class RiwayatController {
  private model: RiwayatModel;

  constructor() {
    this.model = new RiwayatModel();
  }

  riwayatPasien = async (req: Request, res: Response): Promise<void> => {
    const pasienId = req.user!.sub;
    const kunjungans = await this.model.findKunjunganPasien(pasienId);

    res.render('pasien/riwayat', {
      title: 'Riwayat Kunjungan',
      kunjungans,
      tanggalIndonesia,
      formatJam,
    });
  };

  detailRiwayatPasien = async (req: Request, res: Response): Promise<void> => {
    const pasienId = req.user!.sub;
    const kunjunganId = req.params.kunjunganId;

    const kunjungan = await this.model.findDetailKunjunganPasien(kunjunganId, pasienId);

    if (!kunjungan) {
      res.status(404).render('error', {
        title: 'Tidak Ditemukan',
        message: 'Detail kunjungan tidak ditemukan atau tidak dapat diakses.',
        statusCode: 404,
      });
      return;
    }

    const soap = await this.model.findSoap(kunjunganId);
    const resepList = soap ? await this.model.findResepBySoap(soap.id) : [];

    res.render('pasien/riwayat-detail', {
      title: 'Detail Kunjungan',
      kunjungan,
      soap,
      resep: resepList,
      tanggalIndonesia,
    });
  };

  riwayatDokter = async (req: Request, res: Response): Promise<void> => {
    const pasienId = req.params.pasienId;

    const pasien = await this.model.findPasienById(pasienId);

    if (!pasien) {
      res.status(404).render('error', {
        title: 'Pasien Tidak Ditemukan',
        message: 'Data pasien tidak ditemukan.',
        statusCode: 404,
      });
      return;
    }

    const kunjungans = await this.model.findKunjunganLengkap(pasienId);

    res.render('dokter/riwayat-pasien', {
      title: `Riwayat Medis — ${pasien.nama_lengkap}`,
      pasien,
      kunjungans,
      hitungUsia,
      tanggalIndonesia,
    });
  };
}
