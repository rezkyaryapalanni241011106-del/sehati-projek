import { Router } from 'express';
import { AntrianController } from './antrian.controller';
import { verifyJWT, checkRole } from '../../middleware/auth';
import { idleTimeoutStaf } from '../../middleware/idleTimeout';

const router = Router();
const ctrl = new AntrianController();

router.use(verifyJWT, idleTimeoutStaf, checkRole('dokter', 'super_admin'));
router.get('/', ctrl.dashboardAntrian);
router.post('/:id/skip', ctrl.skipPasien);
router.post('/:id/standby-back', ctrl.kembaliDariStandby);
router.get('/api/icd10', ctrl.searchICD10);

export default router;
