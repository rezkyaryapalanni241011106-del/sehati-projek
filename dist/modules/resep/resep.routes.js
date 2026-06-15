"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const resep_controller_1 = require("./resep.controller");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
const ctrl = new resep_controller_1.ResepController();
// Dokter unduh resep
router.get('/dokter/:soapId/pdf', auth_1.verifyJWT, (0, auth_1.checkRole)('dokter', 'super_admin'), ctrl.downloadResepPDF);
// Pasien unduh resep
router.get('/pasien/:soapId/pdf', auth_1.verifyJWTPasien, ctrl.downloadResepPDFPasien);
exports.default = router;
//# sourceMappingURL=resep.routes.js.map