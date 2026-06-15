"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpesialisasiModel = void 0;
const database_1 = require("../../config/database");
class SpesialisasiModel {
    async findAll() {
        const [rows] = await database_1.pool.execute(`SELECT s.*, COUNT(u.id) AS dipakai
       FROM Spesialisasi s
       LEFT JOIN Users u ON u.spesialisasi = s.id AND u.status_aktif = 1
       GROUP BY s.id ORDER BY s.nama`);
        return rows;
    }
    async findById(id) {
        const [rows] = await database_1.pool.execute('SELECT status_aktif FROM Spesialisasi WHERE id = ? LIMIT 1', [id]);
        return rows[0] ?? null;
    }
    async isUsedByDokter(id) {
        const [used] = await database_1.pool.execute('SELECT id FROM Users WHERE spesialisasi = ? LIMIT 1', [id]);
        return used.length > 0;
    }
    async create(id, nama) {
        await database_1.pool.execute('INSERT INTO Spesialisasi (id, nama) VALUES (?, ?)', [id, nama]);
    }
    async setStatus(id, status) {
        await database_1.pool.execute('UPDATE Spesialisasi SET status_aktif = ? WHERE id = ?', [status, id]);
    }
    async delete(id) {
        await database_1.pool.execute('DELETE FROM Spesialisasi WHERE id = ?', [id]);
    }
}
exports.SpesialisasiModel = SpesialisasiModel;
//# sourceMappingURL=spesialisasi.model.js.map