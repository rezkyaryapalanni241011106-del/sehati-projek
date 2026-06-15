import { pool } from '../../config/database';
import { enkripsi, dekripsi, hashPencarian } from '../../utils/encrypt';

export class PasienModel {
  private tryDekripsi(v: string | null): string | null {
    if (!v) return null;
    if (!v.includes(':')) return v; // data plaintext lama sebelum migrasi
    try { return dekripsi(v); } catch { return v; }
  }

  private dekripsiRow(row: any): any {
    if (!row) return null;
    return {
      ...row,
      nik:          this.tryDekripsi(row.nik),
      nik_wali:     this.tryDekripsi(row.nik_wali),
      nomor_paspor: this.tryDekripsi(row.nomor_paspor),
      nomor_hp:     this.tryDekripsi(row.nomor_hp) ?? row.nomor_hp,
      alamat:       this.tryDekripsi(row.alamat)   ?? row.alamat,
    };
  }

  async findByNik(nik: string): Promise<any | null> {
    const [rows] = await pool.execute<any[]>(
      'SELECT id FROM Pasien WHERE nik_hash = ? LIMIT 1',
      [hashPencarian(nik)]
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
         (id, nomor_rm, nik, nik_hash, nama_lengkap, tanggal_lahir, jenis_kelamin,
          nomor_hp, nomor_hp_hash, alamat, pekerjaan, pendidikan, status_perkawinan,
          agama, golongan_darah, alergi, riwayat_kronis, nomor_paspor, nik_wali)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        data.id, data.nomor_rm,
        data.nik     ? enkripsi(data.nik)     : null,
        data.nik     ? hashPencarian(data.nik): null,
        data.nama_lengkap, data.tanggal_lahir, data.jenis_kelamin,
        enkripsi(data.nomor_hp), hashPencarian(data.nomor_hp),
        enkripsi(data.alamat), data.pekerjaan, data.pendidikan,
        data.status_perkawinan, data.agama, data.golongan_darah,
        data.alergi, data.riwayat_kronis,
        data.nomor_paspor ? enkripsi(data.nomor_paspor) : null,
        data.nik_wali     ? enkripsi(data.nik_wali)     : null,
      ]
    );
  }

  async findByNomorHp(nomorHp: string): Promise<any | null> {
    const [rows] = await pool.execute<any[]>(
      'SELECT id FROM Pasien WHERE nomor_hp_hash = ? LIMIT 1',
      [hashPencarian(nomorHp)]
    );
    return rows[0] ?? null;
  }

  async findById(id: string): Promise<any | null> {
    const [rows] = await pool.execute<any[]>(
      'SELECT * FROM Pasien WHERE id = ? LIMIT 1',
      [id]
    );
    return this.dekripsiRow(rows[0] ?? null);
  }

  async updateNomorHp(id: string, nomor_hp: string): Promise<void> {
    await pool.execute(
      'UPDATE Pasien SET nomor_hp = ?, nomor_hp_hash = ? WHERE id = ?',
      [enkripsi(nomor_hp), hashPencarian(nomor_hp), id]
    );
  }

  async findDashboardData(pasienId: string): Promise<{ pasien: any; mendatang: any[]; riwayat: any[] }> {
    const [pasienRows] = await pool.execute<any[]>(
      'SELECT nama_lengkap, nomor_rm, tanggal_lahir, nomor_hp FROM Pasien WHERE id = ? LIMIT 1',
      [pasienId]
    );

    const pasien = pasienRows[0] ? {
      ...pasienRows[0],
      nomor_hp: this.tryDekripsi(pasienRows[0].nomor_hp),
    } : null;

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

    return { pasien, mendatang, riwayat };
  }

  async update(pasienId: string, data: {
    alamat: string; nomor_hp: string; pekerjaan: string | null;
    pendidikan: string | null; status_perkawinan: string | null; agama: string | null;
    golongan_darah: string | null; alergi: string | null; riwayat_kronis: string | null;
  }): Promise<void> {
    await pool.execute(
      `UPDATE Pasien SET
         alamat = ?, nomor_hp = ?, nomor_hp_hash = ?,
         pekerjaan = ?, pendidikan = ?,
         status_perkawinan = ?, agama = ?, golongan_darah = ?,
         alergi = ?, riwayat_kronis = ?
       WHERE id = ?`,
      [
        enkripsi(data.alamat), enkripsi(data.nomor_hp), hashPencarian(data.nomor_hp),
        data.pekerjaan, data.pendidikan,
        data.status_perkawinan, data.agama, data.golongan_darah,
        data.alergi, data.riwayat_kronis, pasienId,
      ]
    );
  }
}
