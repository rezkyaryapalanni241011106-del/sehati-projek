import { Router } from 'express';
import { AuthController } from './auth.controller';
import { loginLimiter } from '../../middleware/rateLimiter';
import { verifyJWT, verifyJWTOrMfaSetup } from '../../middleware/auth';

const router = Router();
const ctrl = new AuthController();

// ---- Pasien ----
router.get('/pasien/login', ctrl.showPasienLogin);
router.post('/pasien/request-otp', loginLimiter, ctrl.requestOTPPasien);
router.get('/pasien/verify-otp', ctrl.showVerifyOTP);
router.post('/pasien/verify-otp', loginLimiter, ctrl.verifyOTPPasien);
router.get('/pasien/logout', ctrl.logoutPasien);
router.post('/pasien/logout', ctrl.logoutPasien);

// ---- Staf ----
router.get('/login', ctrl.showStafLogin);
router.post('/login', loginLimiter, ctrl.loginStaf);
router.get('/verify-totp', ctrl.showVerifyTOTP);
router.post('/verify-totp', loginLimiter, ctrl.verifyTOTP);
router.get('/logout', ctrl.logoutStaf);
router.post('/logout', ctrl.logoutStaf);

// ---- Ubah Password (staf yang sudah login) ----
router.get('/ubah-password', verifyJWT, ctrl.showUbahPassword);
router.post('/ubah-password', verifyJWT, ctrl.prosesUbahPassword);

// ---- MFA Setup (staf yang sudah login ATAU baru login, belum ada JWT) ----
router.get('/setup-mfa', verifyJWTOrMfaSetup, ctrl.showSetupMFA);
router.post('/setup-mfa/verify', verifyJWTOrMfaSetup, ctrl.verifySetupMFA);

export default router;
