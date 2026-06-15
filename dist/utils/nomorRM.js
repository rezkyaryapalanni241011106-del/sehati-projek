"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateNomorRM = exports.NomorRMService = void 0;
const database_1 = require("../config/database");
class NomorRMService {
    async generate() {
        const tahun = new Date().getFullYear();
        const prefix = `RM-${tahun}-`;
        const lockName = 'nomor_rm_lock';
        // Advisory lock mencegah race condition pada pendaftaran bersamaan
        await database_1.pool.execute('SELECT GET_LOCK(?, 10)', [lockName]);
        try {
            const [rows] = await database_1.pool.execute(`SELECT nomor_rm FROM Pasien
         WHERE nomor_rm LIKE ?
         ORDER BY nomor_rm DESC
         LIMIT 1`, [`${prefix}%`]);
            let urutan = 1;
            if (rows.length > 0) {
                const last = rows[0].nomor_rm;
                const parts = last.split('-');
                urutan = parseInt(parts[parts.length - 1], 10) + 1;
            }
            return `${prefix}${String(urutan).padStart(6, '0')}`;
        }
        finally {
            await database_1.pool.execute('SELECT RELEASE_LOCK(?)', [lockName]);
        }
    }
}
exports.NomorRMService = NomorRMService;
// Singleton instance dan fungsi kompatibilitas mundur
const nomorRMService = new NomorRMService();
const generateNomorRM = () => nomorRMService.generate();
exports.generateNomorRM = generateNomorRM;
//# sourceMappingURL=nomorRM.js.map