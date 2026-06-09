import { Router } from 'express';
import { SoapController } from './soap.controller';
import { verifyJWT, checkRole } from '../../middleware/auth';
import { idleTimeoutStaf } from '../../middleware/idleTimeout';
import multer from 'multer';
import path from 'path';
import { env } from '../../config/env';

const storage = multer.diskStorage({
  destination: env.UPLOAD_PATH,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `penunjang-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Format file tidak diizinkan. Gunakan PDF atau JPG.'));
    }
  },
});

const router = Router();
const ctrl = new SoapController();

router.use(verifyJWT, idleTimeoutStaf, checkRole('dokter'));
router.get('/:kunjunganId', ctrl.showSoap);
router.post('/:kunjunganId/simpan', upload.single('file_penunjang'), ctrl.simpanSoap);
router.post('/:kunjunganId/koreksi', ctrl.simpanKoreksi);

export default router;
