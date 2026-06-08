import { Router } from 'express';
import { AuthController } from './auth.controller';
import { loginLimiter } from '../../middleware/rateLimiter';
import { verifyJWT } from '../../middleware/auth';

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

// ---- MFA Setup (staf yang sudah login) ----
router.get('/setup-mfa', verifyJWT, ctrl.showSetupMFA);
router.post('/setup-mfa/verify', verifyJWT, ctrl.verifySetupMFA);

export default router;
