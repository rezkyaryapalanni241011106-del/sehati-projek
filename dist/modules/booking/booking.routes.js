"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const booking_controller_1 = require("./booking.controller");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
const ctrl = new booking_controller_1.BookingController();
router.use(auth_1.verifyJWTPasien);
router.get('/', ctrl.showBookingForm);
router.get('/dokter', ctrl.getDokterList);
router.get('/slots', ctrl.getSlots);
router.post('/', ctrl.buatBooking);
router.get('/:id/reschedule', ctrl.showReschedule);
router.post('/:id/reschedule', ctrl.doReschedule);
router.post('/:id/batal', ctrl.batalBooking);
exports.default = router;
//# sourceMappingURL=booking.routes.js.map