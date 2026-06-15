"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const akun_controller_1 = require("./akun.controller");
const auth_1 = require("../../middleware/auth");
const idleTimeout_1 = require("../../middleware/idleTimeout");
const rbac_1 = require("../../middleware/rbac");
const router = (0, express_1.Router)();
const ctrl = new akun_controller_1.AkunController();
router.use(auth_1.verifyJWT, idleTimeout_1.idleTimeoutStaf);
// Admin kelola dokter/perawat/resepsionis (FR-47-49)
router.get('/staf', (0, auth_1.checkRole)('admin', 'super_admin'), ctrl.listStaf);
router.get('/staf/:id/edit', (0, auth_1.checkRole)('admin', 'super_admin'), ctrl.showEditStaf);
router.post('/staf', (0, auth_1.checkRole)('admin'), rbac_1.blockSuperAdminWrite, ctrl.buatStaf);
router.post('/staf/:id/update', (0, auth_1.checkRole)('admin'), rbac_1.blockSuperAdminWrite, ctrl.updateStaf);
router.post('/staf/:id/toggle', (0, auth_1.checkRole)('admin'), rbac_1.blockSuperAdminWrite, ctrl.toggleStaf);
router.post('/staf/:id/reset-password', (0, auth_1.checkRole)('admin'), rbac_1.blockSuperAdminWrite, ctrl.resetPassword);
// Super Admin kelola Admin (FR-49)
router.get('/admin', (0, auth_1.checkRole)('super_admin'), ctrl.listAdmin);
router.get('/admin/:id/edit', (0, auth_1.checkRole)('super_admin'), ctrl.showEditAdmin);
router.post('/admin', (0, auth_1.checkRole)('super_admin'), ctrl.buatAdmin);
router.post('/admin/:id/update', (0, auth_1.checkRole)('super_admin'), ctrl.updateAdmin);
router.post('/admin/:id/toggle', (0, auth_1.checkRole)('super_admin'), ctrl.toggleAdmin);
router.post('/admin/:id/reset-password', (0, auth_1.checkRole)('super_admin'), ctrl.resetPasswordAdmin);
exports.default = router;
//# sourceMappingURL=akun.routes.js.map