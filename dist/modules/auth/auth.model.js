"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModel = void 0;
const database_1 = require("../../config/database");
class AuthModel {
    async findPasienByNomorHp(nomorHp) {
        const [rows] = await database_1.pool.execute('SELECT id, nomor_rm, nama_lengkap FROM Pasien WHERE nomor_hp = ? LIMIT 1', [nomorHp]);
        return rows[0] ?? null;
    }
    async findUserByUsername(username) {
        const [rows] = await database_1.pool.execute('SELECT id, username, password_hash, peran, nama_lengkap, status_aktif, totp_secret FROM Users WHERE username = ? LIMIT 1', [username]);
        return rows[0] ?? null;
    }
    async findUserById(id) {
        const [rows] = await database_1.pool.execute('SELECT id, username, peran, nama_lengkap, password_hash, totp_secret FROM Users WHERE id = ? LIMIT 1', [id]);
        return rows[0] ?? null;
    }
    async updatePassword(id, passwordHash) {
        await database_1.pool.execute('UPDATE Users SET password_hash = ? WHERE id = ?', [passwordHash, id]);
    }
    async saveTotpSecret(userId, secret) {
        await database_1.pool.execute('UPDATE Users SET totp_secret = ? WHERE id = ?', [secret, userId]);
    }
}
exports.AuthModel = AuthModel;
//# sourceMappingURL=auth.model.js.map