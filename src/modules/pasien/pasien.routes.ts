import { Router } from 'express';
import { PasienController } from './pasien.controller';
import { verifyJWTPasien } from '../../middleware/auth';
import { RiwayatController } from '../riwayat/riwayat.controller';

const router = Router();
const ctrl = new PasienController();
const riwayatCtrl = new RiwayatController();

// Login & registrasi tidak butuh auth
router.get('/login', (req, res) => res.redirect('/auth/pasien/login'));
router.get('/register', ctrl.showRegister);
router.post('/register', ctrl.registerPasien);

// Area pasien — wajib login
router.use(verifyJWTPasien);
router.get('/booking', (req, res) => res.redirect('/booking'));
router.get('/dashboard', ctrl.dashboard);
router.get('/profil', ctrl.showProfil);
router.post('/profil', ctrl.updateProfil);
router.get('/riwayat', riwayatCtrl.riwayatPasien);
router.get('/riwayat/:kunjunganId', riwayatCtrl.detailRiwayatPasien);

export default router;
