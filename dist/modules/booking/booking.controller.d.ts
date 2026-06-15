import { Request, Response } from 'express';
export declare class BookingController {
    private model;
    constructor();
    showBookingForm: (req: Request, res: Response) => Promise<void>;
    getDokterList: (req: Request, res: Response) => Promise<void>;
    getSlots: (req: Request, res: Response) => Promise<void>;
    buatBooking: (req: Request, res: Response) => Promise<void>;
    showReschedule: (req: Request, res: Response) => Promise<void>;
    doReschedule: (req: Request, res: Response) => Promise<void>;
    batalBooking: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=booking.controller.d.ts.map