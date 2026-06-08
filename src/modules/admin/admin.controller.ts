import { Request, Response } from 'express';
import { AdminModel } from './admin.model';

export class AdminController {
  private model: AdminModel;

  constructor() {
    this.model = new AdminModel();
  }

  ringkasan = async (req: Request, res: Response): Promise<void> => {
    const stats = await this.model.getRingkasan();
    res.render('admin/ringkasan', { title: 'Ringkasan Admin', ...stats });
  };
}
