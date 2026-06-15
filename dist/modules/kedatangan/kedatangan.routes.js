"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const kedatangan_controller_1 = require("./kedatangan.controller");
const auth_1 = require("../../middleware/auth");
const idleTimeout_1 = require("../../middleware/idleTimeout");
const router = (0, express_1.Router)();
const ctrl = new kedatangan_controller_1.KedatanganController();
router.use(auth_1.verifyJWT, idleTimeout_1.idleTimeoutStaf, (0, auth_1.checkRole)('resepsionis', 'perawat', 'admin', 'super_admin'));
router.get('/', ctrl.dashboardKedatangan);
router.post('/:id/konfirmasi', ctrl.konfirmasiHadir);
exports.default = router;
//# sourceMappingURL=kedatangan.routes.js.map