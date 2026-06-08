import { Router } from 'express';
import { RiwayatController } from './riwayat.controller';
import { verifyJWT, verifyJWTPasien, checkRole } from '../../middleware/auth';
import { idleTimeoutStaf } from '../../middleware/idleTimeout';

const router = Router();
const ctrl = new RiwayatController();

// Riwayat untuk pasien (FR-40: pasien lihat riwayat sendiri)
router.get('/pasien', verifyJWTPasien, ctrl.riwayatPasien);
router.get('/pasien/:kunjunganId', verifyJWTPasien, ctrl.detailRiwayatPasien);

// Riwayat untuk dokter (FR-40: dokter lihat semua riwayat pasien aktif)
router.get('/dokter', verifyJWT, idleTimeoutStaf, checkRole('dokter', 'super_admin'), (_req, res) => res.redirect('/antrian'));
router.get('/dokter/:pasienId', verifyJWT, idleTimeoutStaf, checkRole('dokter', 'super_admin'), ctrl.riwayatDokter);

export default router;
