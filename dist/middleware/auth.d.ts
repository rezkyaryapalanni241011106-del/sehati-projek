import { Request, Response, NextFunction } from 'express';
import { JwtPayload, Peran } from '../types';
export declare function verifyJWT(req: Request, res: Response, next: NextFunction): void;
export declare function verifyJWTPasien(req: Request, res: Response, next: NextFunction): void;
export declare function checkRole(...roles: (Peran | 'pasien')[]): (req: Request, res: Response, next: NextFunction) => void;
export declare function verifyJWTOrMfaSetup(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function signToken(payload: Omit<JwtPayload, 'iat' | 'exp' | 'last_active'>): string;
export declare function setTokenCookie(res: Response, token: string, isPasien?: boolean): void;
//# sourceMappingURL=auth.d.ts.map