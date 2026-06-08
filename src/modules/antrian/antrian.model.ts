import { pool } from '../../config/database';

export class AntrianModel {
  async findAntrianAktif(dokterId: string, tanggal: string): Promise<any[]> {
    const [rows] = await pool.execute<any[]>(
      `SELECT k.id, k.slot_jam, k.keluhan_awal, k.waktu_konfirmasi, k.status,
              p.nama_lengkap AS nama_pasien, p.nomor_rm,
              TIMESTAMPDIFF(YEAR, p.tanggal_lahir, CURDATE()) AS usia,
              cs.id AS soap_id
       FROM Kunjungan k
       JOIN Pasien p ON k.id_pasien = p.id
       LEFT JOIN Catatan_SOAP cs ON cs.id_kunjungan = k.id
       WHERE k.id_dokter = ? AND k.tanggal = ? AND k.status = 'hadir'
       ORDER BY k.waktu_konfirmasi ASC`,
      [dokterId, tanggal]
    );
    return rows;
  }

  async findStandby(dokterId: string, tanggal: string): Promise<any[]> {
    const [rows] = await pool.execute<any[]>(
      `SELECT k.id, k.slot_jam, k.alasan_skip, k.keluhan_awal,
              p.nama_lengkap AS nama_pasien, p.nomor_rm,
              TIMESTAMPDIFF(YEAR, p.tanggal_lahir, CURDATE()) AS usia
       FROM Kunjungan k
       JOIN Pasien p ON k.id_pasien = p.id
       WHERE k.id_dokter = ? AND k.tanggal = ? AND k.status = 'skip'
       ORDER BY k.updated_at ASC`,
      [dokterId, tanggal]
    );
    return rows;
  }

  async countKunjunganByStatus(dokterId: string, tanggal: string, status: string): Promise<number> {
    const [[row]] = await pool.execute<any[]>(
      `SELECT COUNT(*) AS jumlah FROM Kunjungan WHERE id_dokter = ? AND tanggal = ? AND status = ?`,
      [dokterId, tanggal, status]
    );
    return row.jumlah;
  }

  async findDokterInfo(dokterId: string): Promise<any | null> {
    const [[row]] = await pool.execute<any[]>(
      `SELECT u.nama_lengkap, s.nama AS spesialisasi_nama
       FROM Users u LEFT JOIN Spesialisasi s ON u.spesialisasi = s.id
       WHERE u.id = ? LIMIT 1`,
      [dokterId]
    );
    return row ?? null;
  }

  async findKunjunganHadir(kunjunganId: string, dokterId: string): Promise<any | null> {
    const [rows] = await pool.execute<any[]>(
      'SELECT id, status, id_pasien FROM Kunjungan WHERE id = ? AND id_dokter = ? LIMIT 1',
      [kunjunganId, dokterId]
    );
    return rows[0] ?? null;
  }

  async setSkip(kunjunganId: string, alasanSkip: string): Promise<void> {
    await pool.execute(
      `UPDATE Kunjungan SET status = 'skip', alasan_skip = ? WHERE id = ?`,
      [alasanSkip, kunjunganId]
    );
  }

  async setKembaliHadir(kunjunganId: string, dokterId: string): Promise<void> {
    await pool.execute(
      `UPDATE Kunjungan SET status = 'hadir', waktu_konfirmasi = NOW(), alasan_skip = NULL WHERE id = ? AND id_dokter = ?`,
      [kunjunganId, dokterId]
    );
  }

  async searchICD10(q: string): Promise<any[]> {
    const [rows] = await pool.execute<any[]>(
      `SELECT kode, deskripsi, kategori FROM ICD10
       WHERE MATCH(deskripsi) AGAINST (? IN BOOLEAN MODE) OR kode LIKE ?
       LIMIT 15`,
      [`${q}*`, `${q}%`]
    );
    return rows;
  }

  async getTanggalHariIni(): Promise<string> {
    const [[row]] = await pool.execute<any[]>(
      'SELECT DATE_FORMAT(CURDATE(), "%Y-%m-%d") AS tanggal'
    );
    return row.tanggal;
  }
}
