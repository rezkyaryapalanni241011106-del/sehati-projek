import { Request, Response } from 'express';
import { generateResepPDF } from '../../utils/pdf';
import { ResepModel } from './resep.model';

export class ResepController {
  private model: ResepModel;

  constructor() {
    this.model = new ResepModel();
  }

  downloadResepPDF = async (req: Request, res: Response): Promise<void> => {
    const data = await this.model.findResepData(req.params.soapId);
    if (!data) {
      res.status(404).render('error', { title: 'Resep Tidak Ditemukan', message: '', statusCode: 404 });
      return;
    }
    generateResepPDF(res, data);
  };

  downloadResepPDFPasien = async (req: Request, res: Response): Promise<void> => {
    const soapId = req.params.soapId;
    const pasienId = req.user!.sub;

    const milikPasien = await this.model.verifySoapMilikPasien(soapId, pasienId);
    if (!milikPasien) {
      res.status(403).render('error', { title: 'Akses Ditolak', message: '', statusCode: 403 });
      return;
    }

    const data = await this.model.findResepData(soapId);
    if (!data) {
      res.status(404).render('error', { title: 'Resep Tidak Ditemukan', message: '', statusCode: 404 });
      return;
    }
    generateResepPDF(res, data);
  };
}
