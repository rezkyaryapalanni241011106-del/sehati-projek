"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeluhanController = void 0;
const auditLogger_1 = require("../../utils/auditLogger");
const keluhan_model_1 = require("./keluhan.model");
class KeluhanController {
    constructor() {
        this.showKeluhan = async (req, res) => {
            const kunjunganId = req.params.id;
            const pasienId = req.user.sub;
            const kunjungan = await this.model.findKunjunganPasien(kunjunganId, pasienId);
            if (!kunjungan) {
                res.status(404).render('error', { title: 'Tidak Ditemukan', message: '', statusCode: 404 });
                return;
            }
            res.render('pasien/keluhan', { title: 'Input Keluhan', kunjungan });
        };
        this.updateKeluhan = async (req, res) => {
            const kunjunganId = req.params.id;
            const pasienId = req.user.sub;
            const { keluhan_awal } = req.body;
            const kunjungan = await this.model.findStatusKunjungan(kunjunganId, pasienId);
            if (!kunjungan) {
                req.flash('error', 'Kunjungan tidak ditemukan.');
                res.redirect('/pasien/dashboard');
                return;
            }
            // FR-23/24: Keluhan hanya bisa diedit saat status = booked
            if (kunjungan.status !== 'booked') {
                req.flash('error', 'Keluhan tidak dapat diubah setelah Anda tiba di klinik.');
                res.redirect(`/keluhan/${kunjunganId}`);
                return;
            }
            if (!keluhan_awal || keluhan_awal.trim().length === 0) {
                req.flash('error', 'Keluhan tidak boleh kosong.');
                res.redirect(`/keluhan/${kunjunganId}`);
                return;
            }
            if (keluhan_awal.length > 500) {
                req.flash('error', 'Keluhan maksimal 500 karakter.');
                res.redirect(`/keluhan/${kunjunganId}`);
                return;
            }
            await this.model.updateKeluhan(kunjunganId, keluhan_awal.trim());
            await (0, auditLogger_1.logAudit)({
                req, user: req.user,
                aktivitas: 'INPUT_KELUHAN',
                tabel_target: 'Kunjungan', id_target: kunjunganId,
                status: 'sukses',
            });
            req.flash('success', 'Keluhan berhasil disimpan.');
            res.redirect('/pasien/dashboard');
        };
        this.model = new keluhan_model_1.KeluhanModel();
    }
}
exports.KeluhanController = KeluhanController;
//# sourceMappingURL=keluhan.controller.js.map