"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blockSuperAdminWrite = blockSuperAdminWrite;
exports.ownPasienOnly = ownPasienOnly;
// Super Admin hanya bisa READ — tidak bisa submit form apapun di halaman orang lain (FR-48)
function blockSuperAdminWrite(req, res, next) {
    if (req.user?.peran === 'super_admin' && req.method !== 'GET') {
        res.status(403).json({
            message: 'Super Admin hanya memiliki akses baca. Operasi tulis tidak diizinkan.',
        });
        return;
    }
    next();
}
// Middleware untuk memastikan data pasien hanya bisa dibaca oleh pasien itu sendiri
function ownPasienOnly(pasienIdParam = 'id') {
    return (req, res, next) => {
        if (req.user?.peran === 'pasien' && req.user.sub !== req.params[pasienIdParam]) {
            res.status(403).render('error', {
                title: 'Akses Ditolak',
                message: 'Anda hanya bisa mengakses data milik sendiri.',
                statusCode: 403,
            });
            return;
        }
        next();
    };
}
//# sourceMappingURL=rbac.js.map