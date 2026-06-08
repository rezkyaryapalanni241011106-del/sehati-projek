import { Router } from 'express';
import { AkunController } from './akun.controller';
import { verifyJWT, checkRole } from '../../middleware/auth';
import { idleTimeoutStaf } from '../../middleware/idleTimeout';
import { blockSuperAdminWrite } from '../../middleware/rbac';

const router = Router();
const ctrl = new AkunController();

router.use(verifyJWT, idleTimeoutStaf);

// Admin kelola dokter/perawat/resepsionis (FR-47-49)
router.get('/staf', checkRole('admin', 'super_admin'), ctrl.listStaf);
router.get('/staf/:id/edit', checkRole('admin', 'super_admin'), ctrl.showEditStaf);
router.post('/staf', checkRole('admin'), blockSuperAdminWrite, ctrl.buatStaf);
router.post('/staf/:id/update', checkRole('admin'), blockSuperAdminWrite, ctrl.updateStaf);
router.post('/staf/:id/toggle', checkRole('admin'), blockSuperAdminWrite, ctrl.toggleStaf);
router.post('/staf/:id/reset-password', checkRole('admin'), blockSuperAdminWrite, ctrl.resetPassword);

// Super Admin kelola Admin (FR-49)
router.get('/admin', checkRole('super_admin'), ctrl.listAdmin);
router.get('/admin/:id/edit', checkRole('super_admin'), ctrl.showEditAdmin);
router.post('/admin', checkRole('super_admin'), ctrl.buatAdmin);
router.post('/admin/:id/update', checkRole('super_admin'), ctrl.updateAdmin);
router.post('/admin/:id/toggle', checkRole('super_admin'), ctrl.toggleAdmin);
router.post('/admin/:id/reset-password', checkRole('super_admin'), ctrl.resetPasswordAdmin);

export default router;
