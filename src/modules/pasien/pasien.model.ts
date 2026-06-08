import { pool } from '../../config/database';

export class PasienModel {
  async findByNik(nik: string): Promise<any | null> {
    const [rows] = await pool.execute<any[]>(
      'SELECT id FROM Pasien WHERE nik = ? LIMIT 1',
      [nik]
    );
    return rows[0] ?? null;
  }

  async create(data: {
    id: string; nomor_rm: string; nik: string | null; nama_lengkap: string;
    tanggal_lahir: string; jenis_kelamin: string; nomor_hp: string; alamat: string;
    pekerjaan: string | null; pendidikan: string | null; status_perkawinan: string | null;
    agama: string | null; golongan_darah: string | null; alergi: string | null;
    riwayat_kronis: string | null; nomor_paspor: string | null; nik_wali: string | null;
  }): Promise<void> {
    await pool.execute(
      `INSERT INTO Pasien
         (id, nomor_rm, nik, nama_lengkap, tanggal_lahir, jenis_kelamin, nomor_hp,
          alamat, pekerjaan, pendidikan, status_perkawinan, agama, golongan_darah,
          alergi, riwayat_kronis, nomor_paspor, nik_wali)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        data.id, data.nomor_rm,
        data.nik, data.nama_lengkap, data.tanggal_lahir, data.jenis_kelamin, data.nomor_hp,
        data.alamat, data.pekerjaan, data.pendidikan,
        data.status_perkawinan, data.agama, data.golongan_darah,
        data.alergi, data.riwayat_kronis, data.nomor_paspor, data.nik_wali,
      ]
    );
  }

  async findById(id: string): Promise<any | null> {
    const [rows] = await pool.execute<any[]>(
      'SELECT * FROM Pasien WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] ?? null;
  }

  async findDashboardData(pasienId: string): Promise<{ pasien: any; mendatang: any[]; riwayat: any[] }> {
    const [pasienRows] = await pool.execute<any[]>(
      'SELECT nama_lengkap, nomor_rm, tanggal_lahir FROM Pasien WHERE id = ? LIMIT 1',
      [pasienId]
    );

    const [mendatang] = await pool.execute<any[]>(
      `SELECT k.id, k.tanggal, k.slot_jam, k.status,
              u.nama_lengkap AS nama_dokter, s.nama AS spesialisasi
       FROM Kunjungan k
       JOIN Users u ON k.id_dokter = u.id
       LEFT JOIN Spesialisasi s ON u.spesialisasi = s.id
       WHERE k.id_pasien = ? AND k.status IN ('booked','hadir') AND k.tanggal >= CURDATE()
       ORDER BY k.tanggal ASC, k.slot_jam ASC
       LIMIT 3`,
      [pasienId]
    );

    const [riwayat] = await pool.execute<any[]>(
      `SELECT k.id, k.tanggal, k.slot_jam, k.status,
              u.nama_lengkap AS nama_dokter, s.nama AS spesialisasi,
              cs.kode_dx, i.deskripsi AS dx_label
       FROM Kunjungan k
       JOIN Users u ON k.id_dokter = u.id
       LEFT JOIN Spesialisasi s ON u.spesialisasi = s.id
       LEFT JOIN Catatan_SOAP cs ON cs.id_kunjungan = k.id
       LEFT JOIN ICD10 i ON i.kode = cs.kode_dx
       WHERE k.id_pasien = ? AND k.status = 'selesai'
       ORDER BY k.tanggal DESC, k.slot_jam DESC
       LIMIT 5`,
      [pasienId]
    );

    return { pasien: pasienRows[0] ?? null, mendatang, riwayat };
  }

  async update(pasienId: string, data: {
    alamat: string; nomor_hp: string; pekerjaan: string | null;
    pendidikan: string | null; status_perkawinan: string | null; agama: string | null;
    golongan_darah: string | null; alergi: string | null; riwayat_kronis: string | null;
  }): Promise<void> {
    await pool.execute(
      `UPDATE Pasien SET
         alamat = ?, nomor_hp = ?, pekerjaan = ?, pendidikan = ?,
         status_perkawinan = ?, agama = ?, golongan_darah = ?,
         alergi = ?, riwayat_kronis = ?
       WHERE id = ?`,
      [
        data.alamat, data.nomor_hp, data.pekerjaan, data.pendidikan,
        data.status_perkawinan, data.agama, data.golongan_darah,
        data.alergi, data.riwayat_kronis, pasienId,
      ]
    );
  }
}
