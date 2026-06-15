"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModel = void 0;
const database_1 = require("../../config/database");
class AdminModel {
    async getRingkasan() {
        const results = await Promise.all([
            database_1.pool.execute("SELECT COUNT(*) AS total_dokter FROM Users WHERE peran = 'dokter' AND status_aktif = 1"),
            database_1.pool.execute("SELECT COUNT(*) AS total_perawat FROM Users WHERE peran = 'perawat' AND status_aktif = 1"),
            database_1.pool.execute("SELECT COUNT(*) AS total_resepsionis FROM Users WHERE peran = 'resepsionis' AND status_aktif = 1"),
            database_1.pool.execute("SELECT COUNT(*) AS total_jadwal FROM Jadwal_Praktek WHERE status_aktif = 1"),
            database_1.pool.execute("SELECT COUNT(*) AS total_spesialisasi FROM Spesialisasi WHERE status_aktif = 1"),
        ]);
        return {
            total_dokter: results[0][0]?.[0]?.total_dokter ?? 0,
            total_perawat: results[1][0]?.[0]?.total_perawat ?? 0,
            total_resepsionis: results[2][0]?.[0]?.total_resepsionis ?? 0,
            total_jadwal: results[3][0]?.[0]?.total_jadwal ?? 0,
            total_spesialisasi: results[4][0]?.[0]?.total_spesialisasi ?? 0,
        };
    }
}
exports.AdminModel = AdminModel;
//# sourceMappingURL=admin.model.js.map