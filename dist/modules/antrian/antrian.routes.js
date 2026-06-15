"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const antrian_controller_1 = require("./antrian.controller");
const auth_1 = require("../../middleware/auth");
const idleTimeout_1 = require("../../middleware/idleTimeout");
const router = (0, express_1.Router)();
const ctrl = new antrian_controller_1.AntrianController();
router.use(auth_1.verifyJWT, idleTimeout_1.idleTimeoutStaf, (0, auth_1.checkRole)('dokter', 'super_admin'));
router.get('/', ctrl.dashboardAntrian);
router.post('/:id/skip', ctrl.skipPasien);
router.post('/:id/standby-back', ctrl.kembaliDariStandby);
router.get('/api/icd10', ctrl.searchICD10);
exports.default = router;
//# sourceMappingURL=antrian.routes.js.map