"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAudit = exports.AuditLogger = void 0;
const database_1 = require("../config/database");
class AuditLogger {
    async log(opts) {
        try {
            const ip = opts.req
                ? opts.req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                    opts.req.socket?.remoteAddress ||
                    null
                : null;
            await database_1.pool.execute(`INSERT INTO Audit_Log
           (id_user, peran_user, aktivitas, tabel_target, id_target, ip_address, status, keterangan)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
                opts.user?.sub ?? null,
                opts.user?.peran ?? null,
                opts.aktivitas,
                opts.tabel_target ?? null,
                opts.id_target ?? null,
                ip,
                opts.status,
                opts.keterangan ?? null,
            ]);
        }
        catch (err) {
            // Audit gagal tidak boleh crash aplikasi
            console.error('[AUDIT] Gagal menyimpan log:', err);
        }
    }
}
exports.AuditLogger = AuditLogger;
// Singleton instance untuk kompatibilitas mundur
const auditLogger = new AuditLogger();
const logAudit = (opts) => auditLogger.log(opts);
exports.logAudit = logAudit;
//# sourceMappingURL=auditLogger.js.map