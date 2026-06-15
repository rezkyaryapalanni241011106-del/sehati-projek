"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingModel = void 0;
const database_1 = require("../../config/database");
class BookingModel {
    async findSpesialisasiAktif() {
        const [rows] = await database_1.pool.execute('SELECT id, nama FROM Spesialisasi WHERE status_aktif = 1 ORDER BY nama');
        return rows;
    }
    async findDokterByHari(hariTerpilih, spesialisasi) {
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
        const params = [hariTerpilih];
        if (spesialisasi) {
            query += ' AND u.spesialisasi = ?';
            params.push(spesialisasi);
        }
        const [rows] = await database_1.pool.execute(query, params);
        return rows;
    }
    async findJadwalDokter(idDokter, hariTerpilih) {
        const [jadwals] = await database_1.pool.execute('SELECT id, jam_mulai, jam_selesai, durasi_menit, kuota FROM Jadwal_Praktek WHERE id_dokter = ? AND hari = ? AND status_aktif = 1', [idDokter, hariTerpilih]);
        return jadwals[0] ?? null;
    }
    async findBookedSlots(idDokter, tanggal) {
        const [bookedRows] = await database_1.pool.execute(`SELECT slot_jam FROM Kunjungan
       WHERE id_dokter = ? AND tanggal = ? AND status NOT IN ('batal', 'skip')`, [idDokter, tanggal]);
        return bookedRows.map((r) => r.slot_jam.substring(0, 8));
    }
    async findExistingBooking(pasienId, idDokter, tanggal) {
        const [rows] = await database_1.pool.execute(`SELECT id FROM Kunjungan
       WHERE id_pasien = ? AND id_dokter = ? AND tanggal = ?
         AND status NOT IN ('batal', 'skip')
       LIMIT 1`, [pasienId, idDokter, tanggal]);
        return rows[0] ?? null;
    }
    async create(id, pasienId, idDokter, idJadwal, tanggal, slotJam) {
        await database_1.pool.execute(`INSERT INTO Kunjungan (id, id_pasien, id_dokter, id_jadwal, tanggal, slot_jam)
       VALUES (?, ?, ?, ?, ?, ?)`, [id, pasienId, idDokter, idJadwal, tanggal, slotJam]);
    }
    async findKunjunganMilikPasien(kunjunganId, pasienId) {
        const [rows] = await database_1.pool.execute('SELECT id, tanggal, status FROM Kunjungan WHERE id = ? AND id_pasien = ? LIMIT 1', [kunjunganId, pasienId]);
        return rows[0] ?? null;
    }
    async batalkan(kunjunganId) {
        await database_1.pool.execute(`UPDATE Kunjungan SET status = 'batal', updated_at = NOW() WHERE id = ?`, [kunjunganId]);
    }
    async findKunjunganDetail(kunjunganId, pasienId) {
        const [rows] = await database_1.pool.execute(`SELECT k.id, k.id_dokter, k.id_jadwal, k.tanggal, k.slot_jam, k.status,
              u.nama_lengkap AS nama_dokter, s.nama AS spesialisasi
       FROM Kunjungan k
       JOIN Users u ON k.id_dokter = u.id
       LEFT JOIN Spesialisasi s ON u.spesialisasi = s.id
       WHERE k.id = ? AND k.id_pasien = ? LIMIT 1`, [kunjunganId, pasienId]);
        return rows[0] ?? null;
    }
    async reschedule(kunjunganId, idJadwal, tanggal, slotJam) {
        await database_1.pool.execute(`UPDATE Kunjungan SET id_jadwal = ?, tanggal = ?, slot_jam = ?, updated_at = NOW() WHERE id = ?`, [idJadwal, tanggal, slotJam, kunjunganId]);
    }
}
exports.BookingModel = BookingModel;
//# sourceMappingURL=booking.model.js.map