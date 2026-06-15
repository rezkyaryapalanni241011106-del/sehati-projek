"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pasien_controller_1 = require("./pasien.controller");
const auth_1 = require("../../middleware/auth");
const riwayat_controller_1 = require("../riwayat/riwayat.controller");
const router = (0, express_1.Router)();
const ctrl = new pasien_controller_1.PasienController();
const riwayatCtrl = new riwayat_controller_1.RiwayatController();
// Login & registrasi tidak butuh auth
router.get('/login', (req, res) => res.redirect('/auth/pasien/login'));
router.get('/register', ctrl.showRegister);
router.post('/register', ctrl.registerPasien);
// Area pasien — wajib login
router.use(auth_1.verifyJWTPasien);
router.get('/booking', (req, res) => res.redirect('/booking'));
router.get('/dashboard', ctrl.dashboard);
router.get('/profil', ctrl.showProfil);
router.post('/profil', ctrl.updateProfil);
router.get('/ganti-hp', ctrl.showGantiHP);
router.post('/ganti-hp', ctrl.requestGantiHP);
router.get('/ganti-hp/verifikasi', ctrl.showVerifikasiGantiHP);
router.post('/ganti-hp/verifikasi', ctrl.verifikasiGantiHP);
router.get('/riwayat', riwayatCtrl.riwayatPasien);
router.get('/riwayat/:kunjunganId', riwayatCtrl.detailRiwayatPasien);
exports.default = router;
//# sourceMappingURL=pasien.routes.js.map