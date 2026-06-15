"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AntrianModel = void 0;
const database_1 = require("../../config/database");
class AntrianModel {
    async findAntrianAktif(dokterId, tanggal) {
        const [rows] = await database_1.pool.execute(`SELECT k.id, k.slot_jam, k.keluhan_awal, k.waktu_konfirmasi, k.status,
              p.nama_lengkap AS nama_pasien, p.nomor_rm,
              TIMESTAMPDIFF(YEAR, p.tanggal_lahir, CURDATE()) AS usia,
              cs.id AS soap_id
       FROM Kunjungan k
       JOIN Pasien p ON k.id_pasien = p.id
       LEFT JOIN Catatan_SOAP cs ON cs.id_kunjungan = k.id
       WHERE k.id_dokter = ? AND k.tanggal = ? AND k.status = 'hadir'
       ORDER BY k.waktu_konfirmasi ASC`, [dokterId, tanggal]);
        return rows;
    }
    async findStandby(dokterId, tanggal) {
        const [rows] = await database_1.pool.execute(`SELECT k.id, k.slot_jam, k.alasan_skip, k.keluhan_awal,
              p.nama_lengkap AS nama_pasien, p.nomor_rm,
              TIMESTAMPDIFF(YEAR, p.tanggal_lahir, CURDATE()) AS usia
       FROM Kunjungan k
       JOIN Pasien p ON k.id_pasien = p.id
       WHERE k.id_dokter = ? AND k.tanggal = ? AND k.status = 'skip'
       ORDER BY k.updated_at ASC`, [dokterId, tanggal]);
        return rows;
    }
    async countKunjunganByStatus(dokterId, tanggal, status) {
        const [[row]] = await database_1.pool.execute(`SELECT COUNT(*) AS jumlah FROM Kunjungan WHERE id_dokter = ? AND tanggal = ? AND status = ?`, [dokterId, tanggal, status]);
        return row.jumlah;
    }
    async findDokterInfo(dokterId) {
        const [[row]] = await database_1.pool.execute(`SELECT u.nama_lengkap, s.nama AS spesialisasi_nama
       FROM Users u LEFT JOIN Spesialisasi s ON u.spesialisasi = s.id
       WHERE u.id = ? LIMIT 1`, [dokterId]);
        return row ?? null;
    }
    async findKunjunganHadir(kunjunganId, dokterId) {
        const [rows] = await database_1.pool.execute('SELECT id, status, id_pasien FROM Kunjungan WHERE id = ? AND id_dokter = ? LIMIT 1', [kunjunganId, dokterId]);
        return rows[0] ?? null;
    }
    async setSkip(kunjunganId, alasanSkip) {
        await database_1.pool.execute(`UPDATE Kunjungan SET status = 'skip', alasan_skip = ? WHERE id = ?`, [alasanSkip, kunjunganId]);
    }
    async setKembaliHadir(kunjunganId, dokterId) {
        await database_1.pool.execute(`UPDATE Kunjungan SET status = 'hadir', waktu_konfirmasi = NOW(), alasan_skip = NULL WHERE id = ? AND id_dokter = ?`, [kunjunganId, dokterId]);
    }
    async searchICD10(q) {
        const [rows] = await database_1.pool.execute(`SELECT kode, deskripsi, kategori FROM ICD10
       WHERE MATCH(deskripsi) AGAINST (? IN BOOLEAN MODE) OR kode LIKE ?
       LIMIT 15`, [`${q}*`, `${q}%`]);
        return rows;
    }
    async findSelesaiHariIni(dokterId, tanggal) {
        const [rows] = await database_1.pool.execute(`SELECT k.id, k.slot_jam, k.updated_at,
              p.nama_lengkap AS nama_pasien, p.nomor_rm,
              TIMESTAMPDIFF(YEAR, p.tanggal_lahir, CURDATE()) AS usia
       FROM Kunjungan k
       JOIN Pasien p ON k.id_pasien = p.id
       WHERE k.id_dokter = ? AND k.tanggal = ? AND k.status = 'selesai'
       ORDER BY k.updated_at DESC`, [dokterId, tanggal]);
        return rows;
    }
    async getTanggalHariIni() {
        const [[row]] = await database_1.pool.execute('SELECT DATE_FORMAT(CURDATE(), "%Y-%m-%d") AS tanggal');
        return row.tanggal;
    }
    // Monitoring Super Admin — semua dokter aktif hari ini beserta status antrian
    async findMonitoringSemuaDokter(tanggal) {
        const [rows] = await database_1.pool.execute(`SELECT
         u.id AS dokter_id,
         u.nama_lengkap AS nama_dokter,
         s.nama AS spesialisasi,
         COALESCE(SUM(k.status = 'hadir'),   0) AS jumlah_hadir,
         COALESCE(SUM(k.status = 'selesai'), 0) AS jumlah_selesai,
         COALESCE(SUM(k.status = 'booked'),  0) AS jumlah_booked,
         COALESCE(SUM(k.status = 'skip'),    0) AS jumlah_skip,
         COALESCE(COUNT(k.id),               0) AS jumlah_total
       FROM Users u
       LEFT JOIN Spesialisasi s ON u.spesialisasi = s.id
       LEFT JOIN Kunjungan k ON k.id_dokter = u.id AND k.tanggal = ?
       WHERE u.peran = 'dokter' AND u.status_aktif = 1
       GROUP BY u.id, u.nama_lengkap, s.nama
       ORDER BY jumlah_hadir DESC, u.nama_lengkap ASC`, [tanggal]);
        return rows;
    }
    // Detail antrian satu dokter untuk Super Admin (read-only)
    async findAntrianDokterById(dokterId, tanggal) {
        const [rows] = await database_1.pool.execute(`SELECT k.id, k.slot_jam, k.keluhan_awal, k.waktu_konfirmasi, k.status,
              p.nama_lengkap AS nama_pasien, p.nomor_rm,
              TIMESTAMPDIFF(YEAR, p.tanggal_lahir, CURDATE()) AS usia
       FROM Kunjungan k
       JOIN Pasien p ON k.id_pasien = p.id
       WHERE k.id_dokter = ? AND k.tanggal = ? AND k.status IN ('hadir','skip')
       ORDER BY FIELD(k.status,'hadir','skip'), k.waktu_konfirmasi ASC`, [dokterId, tanggal]);
        return rows;
    }
}
exports.AntrianModel = AntrianModel;
//# sourceMappingURL=antrian.model.js.map