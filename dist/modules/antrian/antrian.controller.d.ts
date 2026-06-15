import { Request, Response } from 'express';
export declare class AntrianController {
    private model;
    constructor();
    dashboardAntrian: (req: Request, res: Response) => Promise<void>;
    skipPasien: (req: Request, res: Response) => Promise<void>;
    kembaliDariStandby: (req: Request, res: Response) => Promise<void>;
    searchICD10: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=antrian.controller.d.ts.map