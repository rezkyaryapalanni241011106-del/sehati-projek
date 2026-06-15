"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const spesialisasi_controller_1 = require("./spesialisasi.controller");
const auth_1 = require("../../middleware/auth");
const idleTimeout_1 = require("../../middleware/idleTimeout");
const router = (0, express_1.Router)();
const ctrl = new spesialisasi_controller_1.SpesialisasiController();
router.use(auth_1.verifyJWT, idleTimeout_1.idleTimeoutStaf, (0, auth_1.checkRole)('admin', 'super_admin'));
router.get('/', ctrl.listSpesialisasi);
router.post('/create', ctrl.buatSpesialisasi);
router.post('/:id/toggle', ctrl.toggleSpesialisasi);
router.post('/:id/delete', ctrl.hapusSpesialisasi);
exports.default = router;
//# sourceMappingURL=spesialisasi.routes.js.map