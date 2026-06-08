import { Router } from 'express';
import { SpesialisasiController } from './spesialisasi.controller';
import { verifyJWT, checkRole } from '../../middleware/auth';
import { idleTimeoutStaf } from '../../middleware/idleTimeout';

const router = Router();
const ctrl = new SpesialisasiController();

router.use(verifyJWT, idleTimeoutStaf, checkRole('admin', 'super_admin'));

router.get('/', ctrl.listSpesialisasi);
router.post('/create', ctrl.buatSpesialisasi);
router.post('/:id/toggle', ctrl.toggleSpesialisasi);
router.post('/:id/delete', ctrl.hapusSpesialisasi);

export default router;
