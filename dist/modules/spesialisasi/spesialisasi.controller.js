"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpesialisasiController = void 0;
const auditLogger_1 = require("../../utils/auditLogger");
const uuid_1 = require("uuid");
const spesialisasi_model_1 = require("./spesialisasi.model");
class SpesialisasiController {
    constructor() {
        this.listSpesialisasi = async (req, res) => {
            const list = await this.model.findAll();
            res.render('admin/spesialisasi', { title: 'Manajemen Spesialisasi', list });
        };
        this.buatSpesialisasi = async (req, res) => {
            const { nama } = req.body;
            if (!nama?.trim()) {
                req.flash('error', 'Nama spesialisasi wajib diisi.');
                res.redirect('/spesialisasi');
                return;
            }
            const id = (0, uuid_1.v4)();
            try {
                await this.model.create(id, nama.trim());
                await (0, auditLogger_1.logAudit)({ req, user: req.user, aktivitas: 'BUAT_SPESIALISASI', tabel_target: 'Spesialisasi', id_target: id, status: 'sukses' });
                req.flash('success', 'Spesialisasi berhasil ditambahkan.');
            }
            catch (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    req.flash('error', `Spesialisasi "${nama.trim()}" sudah ada.`);
                }
                else {
                    req.flash('error', 'Gagal menyimpan spesialisasi.');
                }
            }
            res.redirect('/spesialisasi');
        };
        this.toggleSpesialisasi = async (req, res) => {
            const id = req.params.id;
            const row = await this.model.findById(id);
            if (!row) {
                req.flash('error', 'Spesialisasi tidak ditemukan.');
                res.redirect('/spesialisasi');
                return;
            }
            const newStatus = row.status_aktif ? 0 : 1;
            await this.model.setStatus(id, newStatus);
            await (0, auditLogger_1.logAudit)({ req, user: req.user, aktivitas: 'TOGGLE_SPESIALISASI', tabel_target: 'Spesialisasi', id_target: id, status: 'sukses' });
            req.flash('success', `Spesialisasi berhasil ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}.`);
            res.redirect('/spesialisasi');
        };
        this.hapusSpesialisasi = async (req, res) => {
            const id = req.params.id;
            const isUsed = await this.model.isUsedByDokter(id);
            if (isUsed) {
                req.flash('error', 'Tidak bisa menghapus spesialisasi yang masih digunakan oleh dokter.');
                res.redirect('/spesialisasi');
                return;
            }
            await this.model.delete(id);
            await (0, auditLogger_1.logAudit)({ req, user: req.user, aktivitas: 'HAPUS_SPESIALISASI', tabel_target: 'Spesialisasi', id_target: id, status: 'sukses' });
            req.flash('success', 'Spesialisasi berhasil dihapus.');
            res.redirect('/spesialisasi');
        };
        this.model = new spesialisasi_model_1.SpesialisasiModel();
    }
}
exports.SpesialisasiController = SpesialisasiController;
//# sourceMappingURL=spesialisasi.controller.js.map