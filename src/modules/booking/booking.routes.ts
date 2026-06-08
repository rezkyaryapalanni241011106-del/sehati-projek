import { Router } from 'express';
import { BookingController } from './booking.controller';
import { verifyJWTPasien } from '../../middleware/auth';

const router = Router();
const ctrl = new BookingController();

router.use(verifyJWTPasien);

router.get('/', ctrl.showBookingForm);
router.get('/dokter', ctrl.getDokterList);
router.get('/slots', ctrl.getSlots);
router.post('/', ctrl.buatBooking);
router.post('/:id/batal', ctrl.batalBooking);

export default router;
