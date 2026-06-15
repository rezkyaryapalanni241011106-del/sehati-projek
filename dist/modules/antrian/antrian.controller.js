"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AntrianController = void 0;
const auditLogger_1 = require("../../utils/auditLogger");
const queueSocket_1 = require("../../socket/queueSocket");
const antrian_model_1 = require("./antrian.model");
class AntrianController {
    constructor() {
        this.dashboardAntrian = async (req, res) => {
            const tanggal = await this.model.getTanggalHariIni();
            // Super Admin: tampilkan monitoring semua dokter
            if (req.user.peran === 'super_admin') {
                const semuaDokter = await this.model.findMonitoringSemuaDokter(tanggal);
                // Jika ada filter dokter tertentu via query param
                const filterDokter = req.query.dokter;
                let detailAntrian = [];
                let dokterDipilih = null;
                if (filterDokter) {
                    dokterDipilih = semuaDokter.find((d) => d.dokter_id === filterDokter) || null;
                    detailAntrian = await this.model.findAntrianDokterById(filterDokter, tanggal);
                }
                res.render('superadmin/monitoring-antrian', {
                    title: 'Monitoring Antrian Hari Ini',
                    semuaDokter,
                    tanggal,
                    detailAntrian,
                    dokterDipilih,
                    filterDokter: filterDokter || null,
                });
                return;
            }
            // Dokter: tampilkan antrian milik sendiri
            const dokterId = req.user.sub;
            const [antrian, standby, selesaiHariIni, jumlah_selesai, jumlah_booked, dokterInfo] = await Promise.all([
                this.model.findAntrianAktif(dokterId, tanggal),
                this.model.findStandby(dokterId, tanggal),
                this.model.findSelesaiHariIni(dokterId, tanggal),
                this.model.countKunjunganByStatus(dokterId, tanggal, 'selesai'),
                this.model.countKunjunganByStatus(dokterId, tanggal, 'booked'),
                this.model.findDokterInfo(dokterId),
            ]);
            res.render('dokter/antrian', {
                title: 'Dashboard Antrian',
                antrian,
                standby,
                selesaiHariIni,
                dokterId,
                tanggal,
                jumlah_selesai,
                jumlah_booked,
                spesialisasi_nama: dokterInfo?.spesialisasi_nama || null,
            });
        };
        this.skipPasien = async (req, res) => {
            const kunjunganId = req.params.id;
            const dokterId = req.user.sub;
            const { alasan_skip } = req.body;
            // FR-33: Skip wajib isi alasan
            if (!alasan_skip || alasan_skip.trim().length === 0) {
                res.json({ ok: false, message: 'Alasan skip wajib diisi.' });
                return;
            }
            const kunjungan = await this.model.findKunjunganHadir(kunjunganId, dokterId);
            if (!kunjungan || kunjungan.status !== 'hadir') {
                res.json({ ok: false, message: 'Kunjungan tidak valid untuk di-skip.' });
                return;
            }
            await this.model.setSkip(kunjunganId, alasan_skip.trim());
            await (0, auditLogger_1.logAudit)({
                req, user: req.user,
                aktivitas: 'SKIP_ANTRIAN',
                tabel_target: 'Kunjungan', id_target: kunjunganId,
                status: 'sukses', keterangan: alasan_skip.trim(),
            });
            const io = req.app.get('io');
            if (io)
                (0, queueSocket_1.emitQueueUpdate)(io, dokterId, 'skip', { kunjungan_id: kunjunganId });
            res.json({ ok: true });
        };
        this.kembaliDariStandby = async (req, res) => {
            const kunjunganId = req.params.id;
            const dokterId = req.user.sub;
            await this.model.setKembaliHadir(kunjunganId, dokterId);
            const io = req.app.get('io');
            if (io)
                (0, queueSocket_1.emitQueueUpdate)(io, dokterId, 'standby_back', { kunjungan_id: kunjunganId });
            res.json({ ok: true });
        };
        this.searchICD10 = async (req, res) => {
            const q = req.query.q?.trim();
            if (!q || q.length < 2) {
                res.json({ results: [] });
                return;
            }
            const results = await this.model.searchICD10(q);
            res.json({ results });
        };
        this.model = new antrian_model_1.AntrianModel();
    }
}
exports.AntrianController = AntrianController;
//# sourceMappingURL=antrian.controller.js.map