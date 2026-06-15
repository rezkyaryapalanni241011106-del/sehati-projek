"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasienModel = void 0;
const database_1 = require("../../config/database");
class PasienModel {
    async findByNik(nik) {
        const [rows] = await database_1.pool.execute('SELECT id FROM Pasien WHERE nik = ? LIMIT 1', [nik]);
        return rows[0] ?? null;
    }
    async create(data) {
        await database_1.pool.execute(`INSERT INTO Pasien
         (id, nomor_rm, nik, nama_lengkap, tanggal_lahir, jenis_kelamin, nomor_hp,
          alamat, pekerjaan, pendidikan, status_perkawinan, agama, golongan_darah,
          alergi, riwayat_kronis, nomor_paspor, nik_wali)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
            data.id, data.nomor_rm,
            data.nik, data.nama_lengkap, data.tanggal_lahir, data.jenis_kelamin, data.nomor_hp,
            data.alamat, data.pekerjaan, data.pendidikan,
            data.status_perkawinan, data.agama, data.golongan_darah,
            data.alergi, data.riwayat_kronis, data.nomor_paspor, data.nik_wali,
        ]);
    }
    async findByNomorHp(nomorHp) {
        const [rows] = await database_1.pool.execute('SELECT id FROM Pasien WHERE nomor_hp = ? LIMIT 1', [nomorHp]);
        return rows[0] ?? null;
    }
    async findById(id) {
        const [rows] = await database_1.pool.execute('SELECT * FROM Pasien WHERE id = ? LIMIT 1', [id]);
        return rows[0] ?? null;
    }
    async updateNomorHp(id, nomor_hp) {
        await database_1.pool.execute('UPDATE Pasien SET nomor_hp = ? WHERE id = ?', [nomor_hp, id]);
    }
    async findDashboardData(pasienId) {
        const [pasienRows] = await database_1.pool.execute('SELECT nama_lengkap, nomor_rm, tanggal_lahir, nomor_hp FROM Pasien WHERE id = ? LIMIT 1', [pasienId]);
        const [mendatang] = await database_1.pool.execute(`SELECT k.id, k.tanggal, k.slot_jam, k.status,
              u.nama_lengkap AS nama_dokter, s.nama AS spesialisasi
       FROM Kunjungan k
       JOIN Users u ON k.id_dokter = u.id
       LEFT JOIN Spesialisasi s ON u.spesialisasi = s.id
       WHERE k.id_pasien = ? AND k.status IN ('booked','hadir') AND k.tanggal >= CURDATE()
       ORDER BY k.tanggal ASC, k.slot_jam ASC
       LIMIT 3`, [pasienId]);
        const [riwayat] = await database_1.pool.execute(`SELECT k.id, k.tanggal, k.slot_jam, k.status,
              u.nama_lengkap AS nama_dokter, s.nama AS spesialisasi,
              cs.kode_dx, i.deskripsi AS dx_label
       FROM Kunjungan k
       JOIN Users u ON k.id_dokter = u.id
       LEFT JOIN Spesialisasi s ON u.spesialisasi = s.id
       LEFT JOIN Catatan_SOAP cs ON cs.id_kunjungan = k.id
       LEFT JOIN ICD10 i ON i.kode = cs.kode_dx
       WHERE k.id_pasien = ? AND k.status = 'selesai'
       ORDER BY k.tanggal DESC, k.slot_jam DESC
       LIMIT 5`, [pasienId]);
        return { pasien: pasienRows[0] ?? null, mendatang, riwayat };
    }
    async update(pasienId, data) {
        await database_1.pool.execute(`UPDATE Pasien SET
         alamat = ?, nomor_hp = ?, pekerjaan = ?, pendidikan = ?,
         status_perkawinan = ?, agama = ?, golongan_darah = ?,
         alergi = ?, riwayat_kronis = ?
       WHERE id = ?`, [
            data.alamat, data.nomor_hp, data.pekerjaan, data.pendidikan,
            data.status_perkawinan, data.agama, data.golongan_darah,
            data.alergi, data.riwayat_kronis, pasienId,
        ]);
    }
}
exports.PasienModel = PasienModel;
//# sourceMappingURL=pasien.model.js.map