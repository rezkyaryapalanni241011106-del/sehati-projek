import { Router } from 'express';
import { AuditLogController } from './auditLog.controller';
import { verifyJWT, checkRole } from '../../middleware/auth';
import { idleTimeoutStaf } from '../../middleware/idleTimeout';

const router = Router();
const ctrl = new AuditLogController();

router.use(verifyJWT, idleTimeoutStaf, checkRole('super_admin'));
router.get('/', ctrl.overviewSistem);
router.get('/log', ctrl.listAuditLog);

export default router;
