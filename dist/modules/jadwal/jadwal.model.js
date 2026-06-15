"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JadwalModel = void 0;
const database_1 = require("../../config/database");
const DOKTER_QUERY = `
  SELECT u.id, u.nama_lengkap, s.nama AS spesialisasi
  FROM Users u
  LEFT JOIN Spesialisasi s ON u.spesialisasi = s.id
  WHERE u.peran = 'dokter' AND u.status_aktif = 1
  ORDER BY u.nama_lengkap`;
const JADWAL_QUERY = `
  SELECT jp.*, u.nama_lengkap AS dokter, s.nama AS spesialisasi
  FROM Jadwal_Praktek jp
  JOIN Users u ON jp.id_dokter = u.id
  LEFT JOIN Spesialisasi s ON u.spesialisasi = s.id
  ORDER BY u.nama_lengkap, FIELD(jp.hari,'Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'), jp.jam_mulai`;
class JadwalModel {
    async findAllDokter() {
        const [rows] = await database_1.pool.execute(DOKTER_QUERY);
        return rows;
    }
    async findAllJadwal() {
        const [rows] = await database_1.pool.execute(JADWAL_QUERY);
        return rows;
    }
    async findById(id) {
        const [rows] = await database_1.pool.execute('SELECT * FROM Jadwal_Praktek WHERE id = ? LIMIT 1', [id]);
        return rows[0] ?? null;
    }
    async create(id, idDokter, hari, jamMulai, jamSelesai, durasiMenit, kuota) {
        await database_1.pool.execute('INSERT INTO Jadwal_Praktek (id, id_dokter, hari, jam_mulai, jam_selesai, durasi_menit, kuota) VALUES (?,?,?,?,?,?,?)', [id, idDokter, hari, jamMulai, jamSelesai, durasiMenit, kuota]);
    }
    async update(id, hari, jamMulai, jamSelesai, durasiMenit, kuota) {
        await database_1.pool.execute('UPDATE Jadwal_Praktek SET hari=?, jam_mulai=?, jam_selesai=?, durasi_menit=?, kuota=? WHERE id=?', [hari, jamMulai, jamSelesai, durasiMenit, kuota, id]);
    }
    async setStatus(id, status) {
        await database_1.pool.execute('UPDATE Jadwal_Praktek SET status_aktif = ? WHERE id = ?', [status, id]);
    }
    async findBookingAktifByJadwal(jadwalId) {
        const [rows] = await database_1.pool.execute(`SELECT k.id, p.nomor_hp, p.nama_lengkap
       FROM Kunjungan k
       JOIN Jadwal_Praktek jp ON k.id_jadwal = jp.id
       JOIN Pasien p ON k.id_pasien = p.id
       WHERE k.id_jadwal = ? AND k.tanggal >= CURDATE() AND k.status = 'booked'`, [jadwalId]);
        return rows;
    }
    async hasKunjunganAktif(jadwalId) {
        const [rows] = await database_1.pool.execute("SELECT id FROM Kunjungan WHERE id_jadwal = ? AND status IN ('booked','hadir') LIMIT 1", [jadwalId]);
        return rows.length > 0;
    }
    async batalkanBookingByJadwal(jadwalId) {
        await database_1.pool.execute(`UPDATE Kunjungan SET status = 'batal', updated_at = NOW()
       WHERE id_jadwal = ? AND tanggal >= CURDATE() AND status = 'booked'`, [jadwalId]);
    }
    async delete(id) {
        await database_1.pool.execute('DELETE FROM Jadwal_Praktek WHERE id = ?', [id]);
    }
}
exports.JadwalModel = JadwalModel;
//# sourceMappingURL=jadwal.model.js.map