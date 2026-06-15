"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyJWT = verifyJWT;
exports.verifyJWTPasien = verifyJWTPasien;
exports.checkRole = checkRole;
exports.verifyJWTOrMfaSetup = verifyJWTOrMfaSetup;
exports.signToken = signToken;
exports.setTokenCookie = setTokenCookie;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const env_1 = require("../config/env");
function setNoCache(res) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
}
function verifyJWT(req, res, next) {
    const token = req.cookies?.token;
    if (!token) {
        res.redirect('/auth/login');
        return;
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        req.user = payload;
        setNoCache(res);
        next();
    }
    catch {
        res.clearCookie('token');
        res.redirect('/auth/login');
    }
}
function verifyJWTPasien(req, res, next) {
    const token = req.cookies?.token_pasien;
    if (!token) {
        res.redirect('/pasien/login');
        return;
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        if (payload.peran !== 'pasien') {
            res.clearCookie('token_pasien');
            res.redirect('/pasien/login');
            return;
        }
        req.user = payload;
        setNoCache(res);
        next();
    }
    catch {
        res.clearCookie('token_pasien');
        res.redirect('/pasien/login');
    }
}
function checkRole(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.peran)) {
            res.status(403).render('error', {
                title: 'Akses Ditolak',
                message: 'Anda tidak memiliki izin untuk mengakses halaman ini.',
                statusCode: 403,
            });
            return;
        }
        next();
    };
}
// Middleware untuk route setup-mfa: izinkan akses via JWT (staf sudah login)
// ATAU via session mfa_setup_pending (staf baru selesai password login, belum punya JWT)
async function verifyJWTOrMfaSetup(req, res, next) {
    const token = req.cookies?.token;
    if (token) {
        try {
            const payload = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
            req.user = payload;
            setNoCache(res);
            return next();
        }
        catch {
            res.clearCookie('token');
        }
    }
    const pending = req.session.mfa_setup_pending;
    if (pending?.id) {
        const [rows] = await database_1.pool.execute('SELECT id, peran, nama_lengkap FROM Users WHERE id = ? AND status_aktif = 1', [pending.id]);
        if (rows.length > 0) {
            req.user = { sub: rows[0].id, peran: rows[0].peran, nama: rows[0].nama_lengkap };
            setNoCache(res);
            return next();
        }
    }
    res.redirect('/auth/login');
}
function signToken(payload) {
    return jsonwebtoken_1.default.sign({ ...payload, last_active: Date.now() }, env_1.env.JWT_SECRET, { expiresIn: env_1.env.JWT_EXPIRES_IN });
}
function setTokenCookie(res, token, isPasien = false) {
    const cookieName = isPasien ? 'token_pasien' : 'token';
    res.cookie(cookieName, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: env_1.env.isProd(),
        maxAge: 24 * 60 * 60 * 1000, // 24 jam — idle timeout di middleware
    });
}
//# sourceMappingURL=auth.js.map