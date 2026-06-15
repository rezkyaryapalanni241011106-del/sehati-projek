"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResepController = void 0;
const pdf_1 = require("../../utils/pdf");
const resep_model_1 = require("./resep.model");
class ResepController {
    constructor() {
        this.downloadResepPDF = async (req, res) => {
            const data = await this.model.findResepData(req.params.soapId);
            if (!data) {
                res.status(404).render('error', { title: 'Resep Tidak Ditemukan', message: '', statusCode: 404 });
                return;
            }
            (0, pdf_1.generateResepPDF)(res, data);
        };
        this.downloadResepPDFPasien = async (req, res) => {
            const soapId = req.params.soapId;
            const pasienId = req.user.sub;
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
            (0, pdf_1.generateResepPDF)(res, data);
        };
        this.model = new resep_model_1.ResepModel();
    }
}
exports.ResepController = ResepController;
//# sourceMappingURL=resep.controller.js.map