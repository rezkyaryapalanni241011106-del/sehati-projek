"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KedatanganModel = void 0;
const database_1 = require("../../config/database");
class KedatanganModel {
    async findKunjunganHarian(tanggal) {
        const [rows] = await database_1.pool.execute(`SELECT k.id, k.tanggal, k.slot_jam, k.status,
              p.nama_lengkap AS nama_pasien, p.nomor_rm,
              u.nama_lengkap AS nama_dokter,
              s.nama AS spesialisasi,
              kf.nama_lengkap AS dikonfirmasi_oleh_nama,
              k.waktu_konfirmasi,
              k.keluhan_awal
       FROM Kunjungan k
       JOIN Pasien p ON k.id_pasien = p.id
       JOIN Users u ON k.id_dokter = u.id
       LEFT JOIN Spesialisasi s ON u.spesialisasi = s.id
       LEFT JOIN Users kf ON k.dikonfirmasi_oleh = kf.id
       WHERE k.tanggal = ? AND k.status IN ('booked', 'hadir')
       ORDER BY k.slot_jam ASC`, [tanggal]);
        return rows;
    }
    async findKunjunganUntukKonfirmasi(kunjunganId) {
        const [rows] = await database_1.pool.execute(`SELECT k.id, k.status, k.id_dokter, k.id_pasien, k.keluhan_awal, k.slot_jam, k.tanggal,
              p.nama_lengkap AS nama_pasien, p.nomor_rm,
              TIMESTAMPDIFF(YEAR, p.tanggal_lahir, CURDATE()) AS usia
       FROM Kunjungan k
       JOIN Pasien p ON k.id_pasien = p.id
       WHERE k.id = ? LIMIT 1`, [kunjunganId]);
        return rows[0] ?? null;
    }
    async konfirmasiHadir(kunjunganId, userId) {
        await database_1.pool.execute(`UPDATE Kunjungan
       SET status = 'hadir', dikonfirmasi_oleh = ?, waktu_konfirmasi = NOW()
       WHERE id = ?`, [userId, kunjunganId]);
    }
    async getTanggalHariIni() {
        const [[row]] = await database_1.pool.execute('SELECT DATE_FORMAT(CURDATE(), "%Y-%m-%d") AS tgl');
        return row.tgl;
    }
}
exports.KedatanganModel = KedatanganModel;
//# sourceMappingURL=kedatangan.model.js.map