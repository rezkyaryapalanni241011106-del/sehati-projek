"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AkunController = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const auditLogger_1 = require("../../utils/auditLogger");
const logger_1 = require("../../utils/logger");
const env_1 = require("../../config/env");
const uuid_1 = require("uuid");
const akun_model_1 = require("./akun.model");
function randPass(prefix) {
    return prefix + Math.floor(1000 + Math.random() * 9000).toString();
}
async function hashPass(pass) {
    return bcrypt_1.default.hash(pass, env_1.env.BCRYPT_ROUNDS);
}
class AkunController {
    constructor() {
        // ============================================================
        // Staf (dokter/perawat/resepsionis)
        // ============================================================
        this.listStaf = async (req, res) => {
            const [users, spesialisasiList] = await Promise.all([
                this.model.findAllStaf(),
                this.model.findSpesialisasiAktif(),
            ]);
            res.render('admin/akun-staf', { title: 'Manajemen Akun Staf', users, spesialisasiList, edit: null });
        };
        this.showEditStaf = async (req, res) => {
            const edit = await this.model.findStafById(req.params.id);
            if (!edit) {
                req.flash('error', 'Akun tidak ditemukan.');
                res.redirect('/akun/staf');
                return;
            }
            const [users, spesialisasiList] = await Promise.all([
                this.model.findAllStaf(),
                this.model.findSpesialisasiAktif(),
            ]);
            res.render('admin/akun-staf', { title: 'Edit Akun Staf', users, spesialisasiList, edit });
        };
        this.buatStaf = async (req, res) => {
            const { username, peran, nama_lengkap, email, nomor_hp, spesialisasi, nomor_str, password_custom } = req.body;
            const id = (0, uuid_1.v4)();
            const pass = password_custom?.trim() || randPass('sehati');
            const hash = await hashPass(pass);
            try {
                await this.model.createStaf({
                    id, username, hash, peran, nama_lengkap,
                    email: email || null, nomor_hp: nomor_hp || null,
                    spesialisasi: spesialisasi || null, nomor_str: nomor_str || null,
                    dibuat_oleh: req.user.sub,
                });
                console.log(`[AKUN BARU] ${username} / password: ${pass}`);
                await (0, auditLogger_1.logAudit)({ req, user: req.user, aktivitas: 'BUAT_AKUN', tabel_target: 'Users', id_target: id, status: 'sukses', keterangan: `Akun baru: ${username}` });
                req.flash('success', `Akun ${username} berhasil dibuat. Password: ${pass}`);
            }
            catch (err) {
                (0, logger_1.logError)('buatStaf', err, { username });
                if (err.code === 'ER_DUP_ENTRY') {
                    req.flash('error', 'Username atau email sudah digunakan.');
                }
                else {
                    req.flash('error', 'Gagal membuat akun. Periksa kembali data yang diisi.');
                }
            }
            res.redirect('/akun/staf');
        };
        this.updateStaf = async (req, res) => {
            const id = req.params.id;
            const { username, nama_lengkap, email, nomor_hp, spesialisasi, nomor_str } = req.body;
            await this.model.updateStaf(id, username, nama_lengkap, email || null, nomor_hp || null, spesialisasi || null, nomor_str || null);
            await (0, auditLogger_1.logAudit)({ req, user: req.user, aktivitas: 'EDIT_AKUN', tabel_target: 'Users', id_target: id, status: 'sukses' });
            req.flash('success', 'Akun berhasil diperbarui.');
            res.redirect('/akun/staf');
        };
        this.toggleStaf = async (req, res) => {
            const id = req.params.id;
            const row = await this.model.findStatusById(id);
            if (!row) {
                req.flash('error', 'Akun tidak ditemukan.');
                res.redirect('/akun/staf');
                return;
            }
            const newStatus = row.status_aktif ? 0 : 1;
            // FR-49: Nonaktifkan TIDAK menghapus data historis
            await this.model.setStatus(id, newStatus);
            await (0, auditLogger_1.logAudit)({ req, user: req.user, aktivitas: 'TOGGLE_AKUN', tabel_target: 'Users', id_target: id, status: 'sukses' });
            req.flash('success', `Akun berhasil ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}.`);
            res.redirect('/akun/staf');
        };
        this.resetPassword = async (req, res) => {
            const id = req.params.id;
            const { password_custom } = req.body;
            const pass = password_custom?.trim() || randPass('sehati');
            const hash = await hashPass(pass);
            await this.model.setPassword(id, hash);
            console.log(`[RESET PASS] User ${id} / password baru: ${pass}`);
            await (0, auditLogger_1.logAudit)({ req, user: req.user, aktivitas: 'RESET_PASSWORD', tabel_target: 'Users', id_target: id, status: 'sukses' });
            req.flash('success', `Password berhasil direset. Password baru: ${pass}`);
            res.redirect('/akun/staf');
        };
        // ============================================================
        // Admin — dikelola Super Admin
        // ============================================================
        this.listAdmin = async (req, res) => {
            const users = await this.model.findAllAdmin();
            res.render('superadmin/akun-admin', { title: 'Manajemen Akun Admin', users, edit: null });
        };
        this.showEditAdmin = async (req, res) => {
            const edit = await this.model.findAdminById(req.params.id);
            if (!edit) {
                req.flash('error', 'Akun tidak ditemukan.');
                res.redirect('/akun/admin');
                return;
            }
            const users = await this.model.findAllAdmin();
            res.render('superadmin/akun-admin', { title: 'Edit Akun Admin', users, edit });
        };
        this.buatAdmin = async (req, res) => {
            const { username, nama_lengkap, email, password_custom } = req.body;
            const id = (0, uuid_1.v4)();
            const pass = password_custom?.trim() || randPass('admin');
            const hash = await hashPass(pass);
            try {
                await this.model.createAdmin(id, username, hash, nama_lengkap, email || null, req.user.sub);
                console.log(`[AKUN ADMIN BARU] ${username} / password: ${pass}`);
                await (0, auditLogger_1.logAudit)({ req, user: req.user, aktivitas: 'BUAT_AKUN_ADMIN', tabel_target: 'Users', id_target: id, status: 'sukses' });
                req.flash('success', `Akun admin ${username} berhasil dibuat. Password: ${pass}`);
            }
            catch (err) {
                (0, logger_1.logError)('buatAdmin', err, { username });
                if (err.code === 'ER_DUP_ENTRY') {
                    req.flash('error', 'Username atau email sudah digunakan.');
                }
                else {
                    req.flash('error', 'Gagal membuat akun admin. Periksa kembali data yang diisi.');
                }
            }
            res.redirect('/akun/admin');
        };
        this.updateAdmin = async (req, res) => {
            const id = req.params.id;
            const { nama_lengkap, email } = req.body;
            await this.model.updateAdmin(id, nama_lengkap, email || null);
            await (0, auditLogger_1.logAudit)({ req, user: req.user, aktivitas: 'EDIT_AKUN_ADMIN', tabel_target: 'Users', id_target: id, status: 'sukses' });
            req.flash('success', 'Akun admin berhasil diperbarui.');
            res.redirect('/akun/admin');
        };
        this.toggleAdmin = async (req, res) => {
            const id = req.params.id;
            const row = await this.model.findStatusById(id);
            if (!row) {
                req.flash('error', 'Akun tidak ditemukan.');
                res.redirect('/akun/admin');
                return;
            }
            const newStatus = row.status_aktif ? 0 : 1;
            await this.model.setStatus(id, newStatus);
            await (0, auditLogger_1.logAudit)({ req, user: req.user, aktivitas: 'TOGGLE_AKUN_ADMIN', tabel_target: 'Users', id_target: id, status: 'sukses' });
            req.flash('success', `Akun admin berhasil ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}.`);
            res.redirect('/akun/admin');
        };
        this.resetPasswordAdmin = async (req, res) => {
            const id = req.params.id;
            const { password_custom } = req.body;
            const pass = password_custom?.trim() || randPass('admin');
            const hash = await hashPass(pass);
            await this.model.setPassword(id, hash);
            console.log(`[RESET PASS ADMIN] User ${id} / password baru: ${pass}`);
            await (0, auditLogger_1.logAudit)({ req, user: req.user, aktivitas: 'RESET_PASSWORD_ADMIN', tabel_target: 'Users', id_target: id, status: 'sukses' });
            req.flash('success', `Password admin berhasil direset. Password baru: ${pass}`);
            res.redirect('/akun/admin');
        };
        this.model = new akun_model_1.AkunModel();
    }
}
exports.AkunController = AkunController;
//# sourceMappingURL=akun.controller.js.map