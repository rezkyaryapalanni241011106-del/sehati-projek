import { JwtPayload, StatusAudit } from '../types';
import { Request } from 'express';
interface AuditOptions {
    req?: Request;
    user?: JwtPayload | null;
    aktivitas: string;
    tabel_target?: string;
    id_target?: string;
    status: StatusAudit;
    keterangan?: string;
}
export declare class AuditLogger {
    log(opts: AuditOptions): Promise<void>;
}
export declare const logAudit: (opts: AuditOptions) => Promise<void>;
export {};
//# sourceMappingURL=auditLogger.d.ts.map