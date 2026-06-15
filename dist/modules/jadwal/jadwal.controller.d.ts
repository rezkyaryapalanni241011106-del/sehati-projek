import { Request, Response } from 'express';
export declare class JadwalController {
    private model;
    constructor();
    listJadwal: (req: Request, res: Response) => Promise<void>;
    showEditJadwal: (req: Request, res: Response) => Promise<void>;
    buatJadwal: (req: Request, res: Response) => Promise<void>;
    updateJadwal: (req: Request, res: Response) => Promise<void>;
    toggleJadwal: (req: Request, res: Response) => Promise<void>;
    hapusJadwal: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=jadwal.controller.d.ts.map