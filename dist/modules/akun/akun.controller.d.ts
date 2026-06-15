import { Request, Response } from 'express';
export declare class AkunController {
    private model;
    constructor();
    listStaf: (req: Request, res: Response) => Promise<void>;
    showEditStaf: (req: Request, res: Response) => Promise<void>;
    buatStaf: (req: Request, res: Response) => Promise<void>;
    updateStaf: (req: Request, res: Response) => Promise<void>;
    toggleStaf: (req: Request, res: Response) => Promise<void>;
    resetPassword: (req: Request, res: Response) => Promise<void>;
    listAdmin: (req: Request, res: Response) => Promise<void>;
    showEditAdmin: (req: Request, res: Response) => Promise<void>;
    buatAdmin: (req: Request, res: Response) => Promise<void>;
    updateAdmin: (req: Request, res: Response) => Promise<void>;
    toggleAdmin: (req: Request, res: Response) => Promise<void>;
    resetPasswordAdmin: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=akun.controller.d.ts.map