"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KedatanganController = void 0;
const auditLogger_1 = require("../../utils/auditLogger");
const helpers_1 = require("../../utils/helpers");
const queueSocket_1 = require("../../socket/queueSocket");
const kedatangan_model_1 = require("./kedatangan.model");
class KedatanganController {
    constructor() {
        this.dashboardKedatangan = async (req, res) => {
            let tanggal = req.query.tanggal;
            if (!tanggal) {
                tanggal = await this.model.getTanggalHariIni();
            }
            const kunjungans = await this.model.findKunjunganHarian(tanggal);
            res.render('resepsionis/kedatangan', {
                title: 'Konfirmasi Kedatangan',
                kunjungans,
                tanggal,
                tanggalIndonesia: helpers_1.tanggalIndonesia,
                formatJam: helpers_1.formatJam,
            });
        };
        this.konfirmasiHadir = async (req, res) => {
            const kunjunganId = req.params.id;
            const userId = req.user.sub;
            const k = await this.model.findKunjunganUntukKonfirmasi(kunjunganId);
            if (!k) {
                res.json({ ok: false, message: 'Kunjungan tidak ditemukan.' });
                return;
            }
            if (k.status !== 'booked') {
                res.json({ ok: false, message: 'Status kunjungan sudah bukan booked.' });
                return;
            }
            await this.model.konfirmasiHadir(kunjunganId, userId);
            await (0, auditLogger_1.logAudit)({
                req, user: req.user,
                aktivitas: 'KONFIRMASI_KEDATANGAN',
                tabel_target: 'Kunjungan', id_target: kunjunganId,
                status: 'sukses',
            });
            // FR-26-29: Emit Socket.io ke room dokter untuk update antrian real-time
            const io = req.app.get('io');
            if (io) {
                (0, queueSocket_1.emitQueueUpdate)(io, k.id_dokter, 'add', {
                    kunjungan_id: k.id,
                    patient: {
                        kunjungan_id: k.id,
                        nomor_rm: k.nomor_rm,
                        nama_pasien: k.nama_pasien,
                        usia: k.usia,
                        waktu_konfirmasi: new Date().toISOString(),
                        keluhan_awal: k.keluhan_awal,
                        status: 'hadir',
                    },
                });
            }
            res.json({ ok: true, message: 'Pasien berhasil dikonfirmasi hadir.' });
        };
        this.model = new kedatangan_model_1.KedatanganModel();
    }
}
exports.KedatanganController = KedatanganController;
//# sourceMappingURL=kedatangan.controller.js.map