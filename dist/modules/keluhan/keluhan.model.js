"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeluhanModel = void 0;
const database_1 = require("../../config/database");
class KeluhanModel {
    async findKunjunganPasien(kunjunganId, pasienId) {
        const [rows] = await database_1.pool.execute(`SELECT k.id, k.tanggal, k.slot_jam, k.status, k.keluhan_awal,
              u.nama_lengkap AS nama_dokter
       FROM Kunjungan k
       JOIN Users u ON k.id_dokter = u.id
       WHERE k.id = ? AND k.id_pasien = ? LIMIT 1`, [kunjunganId, pasienId]);
        return rows[0] ?? null;
    }
    async findStatusKunjungan(kunjunganId, pasienId) {
        const [rows] = await database_1.pool.execute('SELECT id, status FROM Kunjungan WHERE id = ? AND id_pasien = ? LIMIT 1', [kunjunganId, pasienId]);
        return rows[0] ?? null;
    }
    async updateKeluhan(kunjunganId, keluhan) {
        await database_1.pool.execute('UPDATE Kunjungan SET keluhan_awal = ? WHERE id = ?', [keluhan, kunjunganId]);
    }
}
exports.KeluhanModel = KeluhanModel;
//# sourceMappingURL=keluhan.model.js.map