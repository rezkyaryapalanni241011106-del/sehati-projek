"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jadwal_controller_1 = require("./jadwal.controller");
const auth_1 = require("../../middleware/auth");
const idleTimeout_1 = require("../../middleware/idleTimeout");
const router = (0, express_1.Router)();
const ctrl = new jadwal_controller_1.JadwalController();
router.use(auth_1.verifyJWT, idleTimeout_1.idleTimeoutStaf);
const adminOnly = (0, auth_1.checkRole)('admin', 'super_admin');
// Resepsionis boleh melihat jadwal (read-only)
router.get('/', (0, auth_1.checkRole)('admin', 'super_admin', 'resepsionis'), ctrl.listJadwal);
// Hanya admin yang boleh mengelola jadwal
router.get('/:id/edit', adminOnly, ctrl.showEditJadwal);
router.post('/create', adminOnly, ctrl.buatJadwal);
router.post('/:id/update', adminOnly, ctrl.updateJadwal);
router.post('/:id/toggle', adminOnly, ctrl.toggleJadwal);
router.post('/:id/delete', adminOnly, ctrl.hapusJadwal);
exports.default = router;
//# sourceMappingURL=jadwal.routes.js.map