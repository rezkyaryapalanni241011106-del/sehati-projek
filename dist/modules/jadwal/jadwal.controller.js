"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JadwalController = void 0;
const auditLogger_1 = require("../../utils/auditLogger");
const uuid_1 = require("uuid");
const jadwal_model_1 = require("./jadwal.model");
class JadwalController {
    constructor() {
        this.listJadwal = async (req, res) => {
            const [dokterList, rows] = await Promise.all([
                this.model.findAllDokter(),
                this.model.findAllJadwal(),
            ]);
            res.render('admin/jadwal', { title: 'Manajemen Jadwal', rows, dokterList, edit: null });
        };
        this.showEditJadwal = async (req, res) => {
            const edit = await this.model.findById(req.params.id);
            if (!edit) {
                req.flash('error', 'Jadwal tidak ditemukan.');
                res.redirect('/jadwal');
                return;
            }
            const [dokterList, rows] = await Promise.all([
                this.model.findAllDokter(),
                this.model.findAllJadwal(),
            ]);
            res.render('admin/jadwal', { title: 'Edit Jadwal', rows, dokterList, edit });
        };
        this.buatJadwal = async (req, res) => {
            const { id_dokter, hari, jam_mulai, jam_selesai, durasi_menit, kuota } = req.body;
            const id = (0, uuid_1.v4)();
            await this.model.create(id, id_dokter, hari, jam_mulai, jam_selesai, parseInt(durasi_menit), parseInt(kuota));
            await (0, auditLogger_1.logAudit)({
                req, user: req.user,
                aktivitas: 'BUAT_JADWAL',
                tabel_target: 'Jadwal_Praktek', id_target: id,
                status: 'sukses',
            });
            req.flash('success', 'Jadwal berhasil ditambahkan.');
            res.redirect('/jadwal');
        };
        this.updateJadwal = async (req, res) => {
            const id = req.params.id;
            const { hari, jam_mulai, jam_selesai, durasi_menit, kuota } = req.body;
            await this.model.update(id, hari, jam_mulai, jam_selesai, parseInt(durasi_menit), parseInt(kuota));
            await (0, auditLogger_1.logAudit)({ req, user: req.user, aktivitas: 'EDIT_JADWAL', tabel_target: 'Jadwal_Praktek', id_target: id, status: 'sukses' });
            req.flash('success', 'Jadwal berhasil diperbarui.');
            res.redirect('/jadwal');
        };
        this.toggleJadwal = async (req, res) => {
            const id = req.params.id;
            const jadwal = await this.model.findById(id);
            if (!jadwal) {
                res.json({ ok: false });
                return;
            }
            const newStatus = jadwal.status_aktif ? 0 : 1;
            await this.model.setStatus(id, newStatus);
            if (!newStatus) {
                const bookings = await this.model.findBookingAktifByJadwal(id);
                if (bookings.length > 0) {
                    await this.model.batalkanBookingByJadwal(id);
                    for (const b of bookings) {
                        await (0, auditLogger_1.logAudit)({
                            req, user: req.user,
                            aktivitas: 'BATAL_OTOMATIS_JADWAL_DIBLOKIR',
                            tabel_target: 'Kunjungan', id_target: b.id,
                            status: 'sukses',
                            keterangan: `Auto-batal: jadwal dinonaktifkan. Pasien: ${b.nama_lengkap} (${b.nomor_hp})`,
                        });
                    }
                    const daftarPasien = bookings.map((b) => `${b.nama_lengkap} (${b.nomor_hp})`).join(', ');
                    req.flash('error', `${bookings.length} booking otomatis dibatalkan. Hubungi pasien: ${daftarPasien}`);
                }
            }
            await (0, auditLogger_1.logAudit)({ req, user: req.user, aktivitas: 'TOGGLE_JADWAL', tabel_target: 'Jadwal_Praktek', id_target: id, status: 'sukses' });
            req.flash('success', `Jadwal berhasil ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}.`);
            res.redirect('/jadwal');
        };
        this.hapusJadwal = async (req, res) => {
            const id = req.params.id;
            const hasAktif = await this.model.hasKunjunganAktif(id);
            if (hasAktif) {
                req.flash('error', 'Tidak bisa menghapus jadwal yang masih memiliki kunjungan aktif.');
                res.redirect('/jadwal');
                return;
            }
            await this.model.delete(id);
            await (0, auditLogger_1.logAudit)({ req, user: req.user, aktivitas: 'HAPUS_JADWAL', tabel_target: 'Jadwal_Praktek', id_target: id, status: 'sukses' });
            req.flash('success', 'Jadwal berhasil dihapus.');
            res.redirect('/jadwal');
        };
        this.model = new jadwal_model_1.JadwalModel();
    }
}
exports.JadwalController = JadwalController;
//# sourceMappingURL=jadwal.controller.js.map