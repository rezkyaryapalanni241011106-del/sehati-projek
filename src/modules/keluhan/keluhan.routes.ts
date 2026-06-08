import { Router } from 'express';
import { KeluhanController } from './keluhan.controller';
import { verifyJWTPasien } from '../../middleware/auth';

const router = Router();
const ctrl = new KeluhanController();

router.use(verifyJWTPasien);
router.get('/:id', ctrl.showKeluhan);
router.post('/:id', ctrl.updateKeluhan);

export default router;
