"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AkunModel = void 0;
const database_1 = require("../../config/database");
class AkunModel {
    async findAllStaf() {
        const [rows] = await database_1.pool.execute(`SELECT u.*, s.nama AS spesialisasi_nama
       FROM Users u
       LEFT JOIN Spesialisasi s ON u.spesialisasi = s.id
       WHERE u.peran IN ('dokter','perawat','resepsionis')
       ORDER BY u.peran, u.nama_lengkap`);
        return rows;
    }
    async findSpesialisasiAktif() {
        const [rows] = await database_1.pool.execute('SELECT id, nama FROM Spesialisasi WHERE status_aktif = 1');
        return rows;
    }
    async findStafById(id) {
        const [rows] = await database_1.pool.execute('SELECT u.*, s.nama AS spesialisasi_nama FROM Users u LEFT JOIN Spesialisasi s ON u.spesialisasi = s.id WHERE u.id = ? LIMIT 1', [id]);
        return rows[0] ?? null;
    }
    async createStaf(data) {
        await database_1.pool.execute(`INSERT INTO Users (id, username, password_hash, peran, nama_lengkap, email, nomor_hp, spesialisasi, nomor_str, dibuat_oleh)
       VALUES (?,?,?,?,?,?,?,?,?,?)`, [data.id, data.username, data.hash, data.peran, data.nama_lengkap,
            data.email, data.nomor_hp, data.spesialisasi, data.nomor_str, data.dibuat_oleh]);
    }
    async updateStaf(id, username, nama_lengkap, email, nomor_hp, spesialisasi, nomor_str) {
        await database_1.pool.execute('UPDATE Users SET username=?, nama_lengkap=?, email=?, nomor_hp=?, spesialisasi=?, nomor_str=? WHERE id=?', [username, nama_lengkap, email, nomor_hp, spesialisasi, nomor_str, id]);
    }
    async findStatusById(id) {
        const [rows] = await database_1.pool.execute('SELECT status_aktif FROM Users WHERE id = ? LIMIT 1', [id]);
        return rows[0] ?? null;
    }
    async setStatus(id, status) {
        await database_1.pool.execute('UPDATE Users SET status_aktif = ? WHERE id = ?', [status, id]);
    }
    async setPassword(id, hash) {
        await database_1.pool.execute('UPDATE Users SET password_hash = ? WHERE id = ?', [hash, id]);
    }
    async findAllAdmin() {
        const [rows] = await database_1.pool.execute("SELECT * FROM Users WHERE peran = 'admin' ORDER BY nama_lengkap");
        return rows;
    }
    async findAdminById(id) {
        const [rows] = await database_1.pool.execute('SELECT * FROM Users WHERE id = ? LIMIT 1', [id]);
        return rows[0] ?? null;
    }
    async createAdmin(id, username, hash, nama_lengkap, email, dibuat_oleh) {
        await database_1.pool.execute(`INSERT INTO Users (id, username, password_hash, peran, nama_lengkap, email, dibuat_oleh) VALUES (?,?,?,'admin',?,?,?)`, [id, username, hash, nama_lengkap, email, dibuat_oleh]);
    }
    async updateAdmin(id, nama_lengkap, email) {
        await database_1.pool.execute('UPDATE Users SET nama_lengkap=?, email=? WHERE id=?', [nama_lengkap, email, id]);
    }
}
exports.AkunModel = AkunModel;
//# sourceMappingURL=akun.model.js.map