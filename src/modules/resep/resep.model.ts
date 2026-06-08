import { pool } from '../../config/database';

export class ResepModel {
  async findResepData(soapId: string): Promise<any | null> {
    const [soaps] = await pool.execute<any[]>(
      `SELECT cs.id, cs.tindakan, cs.anjuran, cs.kode_dx,
              k.tanggal AS tanggal_kunjungan,
              p.nama_lengkap AS nama_pasien, p.nomor_rm, p.tanggal_lahir, p.jenis_kelamin,
              u.nama_lengkap AS nama_dokter, u.nomor_str,
              s.nama AS spesialisasi_nama,
              i.deskripsi AS dx_label
       FROM Catatan_SOAP cs
       JOIN Kunjungan k ON cs.id_kunjungan = k.id
       JOIN Pasien p ON k.id_pasien = p.id
       JOIN Users u ON k.id_dokter = u.id
       LEFT JOIN Spesialisasi s ON u.spesialisasi = s.id
       LEFT JOIN ICD10 i ON i.kode = cs.kode_dx
       WHERE cs.id = ? LIMIT 1`,
      [soapId]
    );

    if (soaps.length === 0) return null;

    const soap = soaps[0];
    const [obatRows] = await pool.execute<any[]>(
      'SELECT * FROM Resep WHERE id_soap = ? ORDER BY urutan',
      [soapId]
    );

    return {
      pasien: {
        nama_lengkap: soap.nama_pasien,
        nomor_rm: soap.nomor_rm,
        tanggal_lahir: soap.tanggal_lahir,
        jenis_kelamin: soap.jenis_kelamin,
      },
      dokter: {
        nama_lengkap: soap.nama_dokter,
        nomor_str: soap.nomor_str,
        spesialisasi_nama: soap.spesialisasi_nama,
      },
      tanggal_kunjungan: soap.tanggal_kunjungan,
      obat: obatRows,
      tindakan: soap.tindakan,
      anjuran: soap.anjuran,
      kode_dx: soap.kode_dx ?? null,
      dx_label: soap.dx_label ?? null,
    };
  }

  async verifySoapMilikPasien(soapId: string, pasienId: string): Promise<boolean> {
    const [rows] = await pool.execute<any[]>(
      `SELECT cs.id FROM Catatan_SOAP cs
       JOIN Kunjungan k ON cs.id_kunjungan = k.id
       WHERE cs.id = ? AND k.id_pasien = ? LIMIT 1`,
      [soapId, pasienId]
    );
    return rows.length > 0;
  }
}
