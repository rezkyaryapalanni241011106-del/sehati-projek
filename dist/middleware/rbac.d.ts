import { Request, Response, NextFunction } from 'express';
export declare function blockSuperAdminWrite(req: Request, res: Response, next: NextFunction): void;
export declare function ownPasienOnly(pasienIdParam?: string): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=rbac.d.ts.map