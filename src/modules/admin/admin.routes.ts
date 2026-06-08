import { Router } from 'express';
import { AdminController } from './admin.controller';
import { verifyJWT, checkRole } from '../../middleware/auth';
import { idleTimeoutStaf } from '../../middleware/idleTimeout';

const router = Router();
const ctrl = new AdminController();

router.use(verifyJWT, idleTimeoutStaf, checkRole('admin', 'super_admin'));
router.get('/', ctrl.ringkasan);

export default router;
