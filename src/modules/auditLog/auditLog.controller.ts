import { Request, Response } from 'express';
import { AuditLogModel } from './auditLog.model';

export class AuditLogController {
  private model: AuditLogModel;

  constructor() {
    this.model = new AuditLogModel();
  }

  overviewSistem = async (req: Request, res: Response): Promise<void> => {
    const data = await this.model.getOverviewData();
    res.render('superadmin/overview', { title: 'Overview Sistem', ...data });
  };

  listAuditLog = async (req: Request, res: Response): Promise<void> => {
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = 50;

    const filter = {
      peran:     (req.query.peran     as string) || '',
      aktivitas: (req.query.aktivitas as string) || '',
      status:    (req.query.status    as string) || '',
      tanggal:   (req.query.tanggal   as string) || '',
    };

    const { rows, total, stats } = await this.model.getAuditLog(filter, page, limit);

    res.render('superadmin/audit', {
      title: 'Audit Log',
      rows,
      page, limit,
      totalPages: Math.ceil(total / limit),
      total,
      stats,
      filter,
    });
  };
}
