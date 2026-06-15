import { Request, Response } from 'express';
export declare class AuthController {
    private model;
    constructor();
    showPasienLogin: (_req: Request, res: Response) => void;
    requestOTPPasien: (req: Request, res: Response) => Promise<void>;
    showVerifyOTP: (req: Request, res: Response) => void;
    verifyOTPPasien: (req: Request, res: Response) => Promise<void>;
    logoutPasien: (req: Request, res: Response) => void;
    showStafLogin: (req: Request, res: Response) => void;
    loginStaf: (req: Request, res: Response) => Promise<void>;
    showVerifyTOTP: (req: Request, res: Response) => void;
    verifyTOTP: (req: Request, res: Response) => Promise<void>;
    private completeSendToken;
    logoutStaf: (req: Request, res: Response) => void;
    showUbahPassword: (req: Request, res: Response) => void;
    prosesUbahPassword: (req: Request, res: Response) => Promise<void>;
    showSetupMFA: (req: Request, res: Response) => Promise<void>;
    verifySetupMFA: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=auth.controller.d.ts.map