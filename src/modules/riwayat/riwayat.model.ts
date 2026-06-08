import { pool } from '../../config/database';

export class RiwayatModel {
  async findKunjunganPasien(pasienId: string): Promise<any[]> {
    const [rows] = await pool.execute<any[]>(
      `SELECT k.id, k.tanggal, k.slot_jam, k.status,
              u.nama_lengkap AS nama_dokter,
              s.nama AS spesialisasi,
              cs.id AS soap_id, cs.kode_dx,
              i.deskripsi AS dx_label
       FROM Kunjungan k
       JOIN Users u ON k.id_dokter = u.id
       LEFT JOIN Spesialisasi s ON u.spesialisasi = s.id
       LEFT JOIN Catatan_SOAP cs ON cs.id_kunjungan = k.id
       LEFT JOIN ICD10 i ON i.kode = cs.kode_dx
       WHERE k.id_pasien = ?
       ORDER BY k.tanggal DESC, k.slot_jam DESC`,
      [pasienId]
    );
    return rows;
  }

  async findDetailKunjunganPasien(kunjunganId: string, pasienId: string): Promise<any | null> {
    const [rows] = await pool.execute<any[]>(
      `SELECT k.id, k.tanggal, k.slot_jam, k.status, k.keluhan_awal,
              u.nama_lengkap AS nama_dokter, u.nomor_str,
              s.nama AS spesialisasi
       FROM Kunjungan k
       JOIN Users u ON k.id_dokter = u.id
       LEFT JOIN Spesialisasi s ON u.spesialisasi = s.id
       WHERE k.id = ? AND k.id_pasien = ? LIMIT 1`,
      [kunjunganId, pasienId]
    );
    return rows[0] ?? null;
  }

  async findSoap(kunjunganId: string): Promise<any | null> {
    const [rows] = await pool.execute<any[]>(
      `SELECT cs.*, i.deskripsi AS dx_label
       FROM Catatan_SOAP cs
       LEFT JOIN ICD10 i ON i.kode = cs.kode_dx
       WHERE cs.id_kunjungan = ? LIMIT 1`,
      [kunjunganId]
    );
    return rows[0] ?? null;
  }

  async findResepBySoap(soapId: string): Promise<any[]> {
    const [rows] = await pool.execute<any[]>(
      'SELECT * FROM Resep WHERE id_soap = ? ORDER BY urutan',
      [soapId]
    );
    return rows;
  }

  async findPasienById(pasienId: string): Promise<any | null> {
    const [rows] = await pool.execute<any[]>(
      'SELECT id, nama_lengkap, nomor_rm, tanggal_lahir, jenis_kelamin, alergi, riwayat_kronis FROM Pasien WHERE id = ? LIMIT 1',
      [pasienId]
    );
    return rows[0] ?? null;
  }

  async findKunjunganLengkap(pasienId: string): Promise<any[]> {
    const [rows] = await pool.execute<any[]>(
      `SELECT k.id, k.tanggal, k.slot_jam, k.status, k.keluhan_awal,
              u.nama_lengkap AS nama_dokter,
              cs.id AS soap_id, cs.kode_dx, cs.tindakan, cs.anjuran,
              cs.td_sistolik, cs.td_diastolik, cs.nadi, cs.suhu,
              i.deskripsi AS dx_label
       FROM Kunjungan k
       JOIN Users u ON k.id_dokter = u.id
       LEFT JOIN Catatan_SOAP cs ON cs.id_kunjungan = k.id
       LEFT JOIN ICD10 i ON i.kode = cs.kode_dx
       WHERE k.id_pasien = ?
       ORDER BY k.tanggal DESC, k.slot_jam DESC`,
      [pasienId]
    );
    return rows;
  }
}
