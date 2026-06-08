import { Router } from 'express';
import { JadwalController } from './jadwal.controller';
import { verifyJWT, checkRole } from '../../middleware/auth';
import { idleTimeoutStaf } from '../../middleware/idleTimeout';

const router = Router();
const ctrl = new JadwalController();

router.use(verifyJWT, idleTimeoutStaf);

const adminOnly = checkRole('admin', 'super_admin');

// Resepsionis boleh melihat jadwal (read-only)
router.get('/', checkRole('admin', 'super_admin', 'resepsionis'), ctrl.listJadwal);

// Hanya admin yang boleh mengelola jadwal
router.get('/:id/edit', adminOnly, ctrl.showEditJadwal);
router.post('/create', adminOnly, ctrl.buatJadwal);
router.post('/:id/update', adminOnly, ctrl.updateJadwal);
router.post('/:id/toggle', adminOnly, ctrl.toggleJadwal);
router.post('/:id/delete', adminOnly, ctrl.hapusJadwal);

export default router;
