"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogController = void 0;
const auditLog_model_1 = require("./auditLog.model");
class AuditLogController {
    constructor() {
        this.overviewSistem = async (req, res) => {
            const data = await this.model.getOverviewData();
            res.render('superadmin/overview', { title: 'Overview Sistem', ...data });
        };
        this.listAuditLog = async (req, res) => {
            const page = parseInt(req.query.page || '1', 10);
            const limit = 50;
            const filter = {
                peran: req.query.peran || '',
                aktivitas: req.query.aktivitas || '',
                status: req.query.status || '',
                tanggal: req.query.tanggal || '',
            };
            const { rows, total, stats } = await this.model.getAuditLog(filter, page, limit);
            res.render('superadmin/audit', {
                title: 'Audit Log',
                rows,
                page, limit,
                totalPages: Math.ceil(total / limit),
                total,
                stats,
                filter,
            });
        };
        this.model = new auditLog_model_1.AuditLogModel();
    }
}
exports.AuditLogController = AuditLogController;
//# sourceMappingURL=auditLog.controller.js.map