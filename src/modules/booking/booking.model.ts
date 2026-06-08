import { pool } from '../../config/database';

export class BookingModel {
  async findSpesialisasiAktif(): Promise<any[]> {
    const [rows] = await pool.execute<any[]>(
      'SELECT id, nama FROM Spesialisasi WHERE status_aktif = 1 ORDER BY nama'
    );
    return rows;
  }

  async findDokterByHari(hariTerpilih: string, spesialisasi?: string): Promise<any[]> {
    let query = `
      SELECT DISTINCT u.id, u.nama_lengkap, s.nama AS spesialisasi_nama
      FROM Users u
      JOIN Spesialisasi s ON u.spesialisasi = s.id
      JOIN Jadwal_Praktek jp ON jp.id_dokter = u.id
      WHERE u.peran = 'dokter'
        AND u.status_aktif = 1
        AND jp.hari = ?
        AND jp.status_aktif = 1
    `;
    const params: any[] = [hariTerpilih];

    if (spesialisasi) {
      query += ' AND u.spesialisasi = ?';
      params.push(spesialisasi);
    }

    const [rows] = await pool.execute<any[]>(query, params);
    return rows;
  }

  async findJadwalDokter(idDokter: string, hariTerpilih: string): Promise<any | null> {
    const [jadwals] = await pool.execute<any[]>(
      'SELECT id, jam_mulai, jam_selesai, durasi_menit, kuota FROM Jadwal_Praktek WHERE id_dokter = ? AND hari = ? AND status_aktif = 1',
      [idDokter, hariTerpilih]
    );
    return jadwals[0] ?? null;
  }

  async findBookedSlots(idDokter: string, tanggal: string): Promise<string[]> {
    const [bookedRows] = await pool.execute<any[]>(
      `SELECT slot_jam FROM Kunjungan
       WHERE id_dokter = ? AND tanggal = ? AND status NOT IN ('batal', 'skip')`,
      [idDokter, tanggal]
    );
    return bookedRows.map((r: any) => r.slot_jam.substring(0, 8));
  }

  async findExistingBooking(pasienId: string, idDokter: string, tanggal: string): Promise<any | null> {
    const [rows] = await pool.execute<any[]>(
      `SELECT id FROM Kunjungan
       WHERE id_pasien = ? AND id_dokter = ? AND tanggal = ?
         AND status NOT IN ('batal', 'skip')
       LIMIT 1`,
      [pasienId, idDokter, tanggal]
    );
    return rows[0] ?? null;
  }

  async create(id: string, pasienId: string, idDokter: string, idJadwal: string, tanggal: string, slotJam: string): Promise<void> {
    await pool.execute(
      `INSERT INTO Kunjungan (id, id_pasien, id_dokter, id_jadwal, tanggal, slot_jam)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, pasienId, idDokter, idJadwal, tanggal, slotJam]
    );
  }

  async findKunjunganMilikPasien(kunjunganId: string, pasienId: string): Promise<any | null> {
    const [rows] = await pool.execute<any[]>(
      'SELECT id, tanggal, status FROM Kunjungan WHERE id = ? AND id_pasien = ? LIMIT 1',
      [kunjunganId, pasienId]
    );
    return rows[0] ?? null;
  }

  async batalkan(kunjunganId: string): Promise<void> {
    await pool.execute(
      `UPDATE Kunjungan SET status = 'batal', updated_at = NOW() WHERE id = ?`,
      [kunjunganId]
    );
  }
}
