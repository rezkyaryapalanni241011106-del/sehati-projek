import { Router } from 'express';
import { KedatanganController } from './kedatangan.controller';
import { verifyJWT, checkRole } from '../../middleware/auth';
import { idleTimeoutStaf } from '../../middleware/idleTimeout';

const router = Router();
const ctrl = new KedatanganController();

router.use(verifyJWT, idleTimeoutStaf, checkRole('resepsionis', 'perawat', 'admin', 'super_admin'));
router.get('/', ctrl.dashboardKedatangan);
router.post('/:id/konfirmasi', ctrl.konfirmasiHadir);

export default router;
