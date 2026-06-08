import { pool } from '../config/database';
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

export class AuditLogger {
  async log(opts: AuditOptions): Promise<void> {
    try {
      const ip = opts.req
        ? (opts.req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
          opts.req.socket?.remoteAddress ||
          null
        : null;

      await pool.execute(
        `INSERT INTO Audit_Log
           (id_user, peran_user, aktivitas, tabel_target, id_target, ip_address, status, keterangan)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          opts.user?.sub ?? null,
          opts.user?.peran ?? null,
          opts.aktivitas,
          opts.tabel_target ?? null,
          opts.id_target ?? null,
          ip,
          opts.status,
          opts.keterangan ?? null,
        ]
      );
    } catch (err) {
      // Audit gagal tidak boleh crash aplikasi
      console.error('[AUDIT] Gagal menyimpan log:', err);
    }
  }
}

// Singleton instance untuk kompatibilitas mundur
const auditLogger = new AuditLogger();
export const logAudit = (opts: AuditOptions): Promise<void> => auditLogger.log(opts);
