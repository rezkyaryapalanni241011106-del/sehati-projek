"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogModel = void 0;
const database_1 = require("../../config/database");
class AuditLogModel {
    async getOverviewData() {
        const [[[pasienStats]], [stafStats], [[kunjunganHariIni]], [[kunjunganBulanIni]], [[auditHariIni]], [aktivitasTerbaru],] = await Promise.all([
            database_1.pool.execute('SELECT COUNT(*) AS total FROM Pasien'),
            database_1.pool.execute('SELECT peran, COUNT(*) AS total, SUM(status_aktif) AS aktif FROM Users GROUP BY peran ORDER BY peran'),
            database_1.pool.execute(`SELECT COUNT(*) AS total,
           SUM(status = 'booked')   AS booked,
           SUM(status = 'hadir')    AS hadir,
           SUM(status = 'selesai')  AS selesai,
           SUM(status = 'batal')    AS batal
         FROM Kunjungan WHERE tanggal = CURDATE()`),
            database_1.pool.execute('SELECT COUNT(*) AS total FROM Kunjungan WHERE YEAR(tanggal) = YEAR(CURDATE()) AND MONTH(tanggal) = MONTH(CURDATE())'),
            database_1.pool.execute("SELECT COUNT(*) AS total, SUM(status = 'gagal') AS gagal FROM Audit_Log WHERE DATE(waktu) = CURDATE()"),
            database_1.pool.execute(`SELECT al.waktu, al.aktivitas, al.status, al.peran_user, u.username
         FROM Audit_Log al
         LEFT JOIN Users u ON al.id_user = u.id
         ORDER BY al.waktu DESC LIMIT 10`),
        ]);
        return { pasienStats, stafStats, kunjunganHariIni, kunjunganBulanIni, auditHariIni, aktivitasTerbaru };
    }
    async getAuditLog(filter, page, limit) {
        let where = 'WHERE 1=1';
        const params = [];
        if (filter.peran) {
            where += ' AND u.peran = ?';
            params.push(filter.peran);
        }
        if (filter.aktivitas) {
            where += ' AND al.aktivitas LIKE ?';
            params.push(`%${filter.aktivitas}%`);
        }
        if (filter.status) {
            where += ' AND al.status = ?';
            params.push(filter.status);
        }
        if (filter.tanggal) {
            where += ' AND DATE(al.waktu) = ?';
            params.push(filter.tanggal);
        }
        const offset = (page - 1) * limit;
        const [rows] = await database_1.pool.execute(`SELECT al.*, u.username, u.peran FROM Audit_Log al
       LEFT JOIN Users u ON al.id_user = u.id
       ${where}
       ORDER BY al.waktu DESC
       LIMIT ${limit} OFFSET ${offset}`, params);
        const [[{ total }]] = await database_1.pool.execute(`SELECT COUNT(*) AS total FROM Audit_Log al
       LEFT JOIN Users u ON al.id_user = u.id
       ${where}`, params);
        const [[stats]] = await database_1.pool.execute(`SELECT COUNT(*) AS total_hari_ini, SUM(status = 'gagal') AS gagal_hari_ini
       FROM Audit_Log WHERE DATE(waktu) = CURDATE()`);
        return { rows, total, stats };
    }
}
exports.AuditLogModel = AuditLogModel;
//# sourceMappingURL=auditLog.model.js.map