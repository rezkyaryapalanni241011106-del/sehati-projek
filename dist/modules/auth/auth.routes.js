"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const rateLimiter_1 = require("../../middleware/rateLimiter");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
const ctrl = new auth_controller_1.AuthController();
// ---- Pasien ----
router.get('/pasien/login', ctrl.showPasienLogin);
router.post('/pasien/request-otp', rateLimiter_1.loginLimiter, ctrl.requestOTPPasien);
router.get('/pasien/verify-otp', ctrl.showVerifyOTP);
router.post('/pasien/verify-otp', rateLimiter_1.loginLimiter, ctrl.verifyOTPPasien);
router.get('/pasien/logout', ctrl.logoutPasien);
router.post('/pasien/logout', ctrl.logoutPasien);
// ---- Staf ----
router.get('/login', ctrl.showStafLogin);
router.post('/login', rateLimiter_1.loginLimiter, ctrl.loginStaf);
router.get('/verify-totp', ctrl.showVerifyTOTP);
router.post('/verify-totp', rateLimiter_1.loginLimiter, ctrl.verifyTOTP);
router.get('/logout', ctrl.logoutStaf);
router.post('/logout', ctrl.logoutStaf);
// ---- Ubah Password (staf yang sudah login) ----
router.get('/ubah-password', auth_1.verifyJWT, ctrl.showUbahPassword);
router.post('/ubah-password', auth_1.verifyJWT, ctrl.prosesUbahPassword);
// ---- MFA Setup (staf yang sudah login ATAU baru login, belum ada JWT) ----
router.get('/setup-mfa', auth_1.verifyJWTOrMfaSetup, ctrl.showSetupMFA);
router.post('/setup-mfa/verify', auth_1.verifyJWTOrMfaSetup, ctrl.verifySetupMFA);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map