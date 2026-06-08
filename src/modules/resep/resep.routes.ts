import { Router } from 'express';
import { ResepController } from './resep.controller';
import { verifyJWT, verifyJWTPasien, checkRole } from '../../middleware/auth';

const router = Router();
const ctrl = new ResepController();

// Dokter unduh resep
router.get('/dokter/:soapId/pdf', verifyJWT, checkRole('dokter', 'super_admin'), ctrl.downloadResepPDF);

// Pasien unduh resep
router.get('/pasien/:soapId/pdf', verifyJWTPasien, ctrl.downloadResepPDFPasien);

export default router;
