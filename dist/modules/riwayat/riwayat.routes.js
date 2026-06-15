"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const riwayat_controller_1 = require("./riwayat.controller");
const auth_1 = require("../../middleware/auth");
const idleTimeout_1 = require("../../middleware/idleTimeout");
const router = (0, express_1.Router)();
const ctrl = new riwayat_controller_1.RiwayatController();
// Riwayat untuk pasien (FR-40: pasien lihat riwayat sendiri)
router.get('/pasien', auth_1.verifyJWTPasien, ctrl.riwayatPasien);
router.get('/pasien/:kunjunganId', auth_1.verifyJWTPasien, ctrl.detailRiwayatPasien);
// Riwayat untuk dokter (FR-40: dokter lihat semua riwayat pasien aktif)
router.get('/dokter', auth_1.verifyJWT, idleTimeout_1.idleTimeoutStaf, (0, auth_1.checkRole)('dokter', 'super_admin'), (_req, res) => res.redirect('/antrian'));
router.get('/dokter/:pasienId', auth_1.verifyJWT, idleTimeout_1.idleTimeoutStaf, (0, auth_1.checkRole)('dokter', 'super_admin'), ctrl.riwayatDokter);
exports.default = router;
//# sourceMappingURL=riwayat.routes.js.map