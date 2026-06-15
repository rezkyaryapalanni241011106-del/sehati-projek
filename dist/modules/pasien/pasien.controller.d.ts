import { Request, Response } from 'express';
export declare class PasienController {
    private model;
    constructor();
    showRegister: (req: Request, res: Response) => void;
    registerPasien: (req: Request, res: Response) => Promise<void>;
    dashboard: (req: Request, res: Response) => Promise<void>;
    showProfil: (req: Request, res: Response) => Promise<void>;
    updateProfil: (req: Request, res: Response) => Promise<void>;
    showGantiHP: (req: Request, res: Response) => Promise<void>;
    requestGantiHP: (req: Request, res: Response) => Promise<void>;
    showVerifikasiGantiHP: (req: Request, res: Response) => void;
    verifikasiGantiHP: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=pasien.controller.d.ts.map