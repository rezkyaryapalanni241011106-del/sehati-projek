"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_session_1 = __importDefault(require("express-session"));
const connect_flash_1 = __importDefault(require("connect-flash"));
const morgan_1 = __importDefault(require("morgan"));
const env_1 = require("./config/env");
const errorHandler_1 = require("./middleware/errorHandler");
// Route imports
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const pasien_routes_1 = __importDefault(require("./modules/pasien/pasien.routes"));
const booking_routes_1 = __importDefault(require("./modules/booking/booking.routes"));
const keluhan_routes_1 = __importDefault(require("./modules/keluhan/keluhan.routes"));
const kedatangan_routes_1 = __importDefault(require("./modules/kedatangan/kedatangan.routes"));
const antrian_routes_1 = __importDefault(require("./modules/antrian/antrian.routes"));
const soap_routes_1 = __importDefault(require("./modules/soap/soap.routes"));
const resep_routes_1 = __importDefault(require("./modules/resep/resep.routes"));
const riwayat_routes_1 = __importDefault(require("./modules/riwayat/riwayat.routes"));
const jadwal_routes_1 = __importDefault(require("./modules/jadwal/jadwal.routes"));
const akun_routes_1 = __importDefault(require("./modules/akun/akun.routes"));
const spesialisasi_routes_1 = __importDefault(require("./modules/spesialisasi/spesialisasi.routes"));
const auditLog_routes_1 = __importDefault(require("./modules/auditLog/auditLog.routes"));
const admin_routes_1 = __importDefault(require("./modules/admin/admin.routes"));
const database_1 = require("./config/database");
const app = (0, express_1.default)();
// ============================================================
// View engine
// ============================================================
app.set('view engine', 'ejs');
app.set('views', path_1.default.join(__dirname, 'views'));
// ============================================================
// Static files
// ============================================================
app.use('/public', express_1.default.static(path_1.default.join(__dirname, 'public')));
// ============================================================
// Request parsers
// ============================================================
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use(express_1.default.json({ limit: '10mb' }));
app.use((0, cookie_parser_1.default)());
// ============================================================
// Session (hanya untuk connect-flash — state di JWT)
// ============================================================
app.use((0, express_session_1.default)({
    secret: env_1.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', secure: env_1.env.isProd() },
}));
app.use((0, connect_flash_1.default)());
// ============================================================
// HTTP logging
// ============================================================
app.use((0, morgan_1.default)(env_1.env.isProd() ? 'combined' : 'dev', {
    stream: { write: (msg) => errorHandler_1.logger.info(msg.trim()) },
}));
// ============================================================
// Template globals — tersedia di semua EJS
// ============================================================
app.use((req, res, next) => {
    const s = req.flash('success');
    res.locals.flash_success = s.length ? s[0] : null;
    const e = req.flash('error');
    res.locals.flash_error = e.length ? e[0] : null;
    const i = req.flash('info');
    res.locals.flash_info = i.length ? i[0] : null;
    res.locals.app_name = env_1.env.APP_NAME;
    res.locals.clinic_name = env_1.env.CLINIC_NAME;
    // Lazy getter — dibaca saat render, setelah auth middleware mengisi req.user
    Object.defineProperty(res.locals, 'user', {
        get: () => req.user ?? null,
        enumerable: true,
        configurable: true,
    });
    next();
});
// ============================================================
// Landing page
// ============================================================
app.get('/', (req, res) => {
    res.render('index', { title: `Selamat Datang — ${env_1.env.APP_NAME}` });
});
// ============================================================
// Routes
// ============================================================
app.use('/auth', auth_routes_1.default);
app.use('/pasien', pasien_routes_1.default);
app.use('/booking', booking_routes_1.default);
app.use('/keluhan', keluhan_routes_1.default);
app.use('/kedatangan', kedatangan_routes_1.default);
app.use('/antrian', antrian_routes_1.default);
app.use('/soap', soap_routes_1.default);
app.use('/resep', resep_routes_1.default);
app.use('/riwayat', riwayat_routes_1.default);
app.use('/jadwal', jadwal_routes_1.default);
app.use('/akun', akun_routes_1.default);
app.use('/spesialisasi', spesialisasi_routes_1.default);
app.use('/audit', auditLog_routes_1.default);
app.use('/admin', admin_routes_1.default);
// ============================================================
// API — ICD-10 autocomplete (publik, hanya GET)
// ============================================================
app.get('/api/icd10', async (req, res) => {
    const q = (req.query.q || '').trim();
    if (q.length < 2) {
        res.json([]);
        return;
    }
    const [rows] = await database_1.pool.execute(`SELECT kode, deskripsi FROM ICD10
     WHERE kode LIKE ? OR deskripsi LIKE ?
     ORDER BY CASE WHEN kode LIKE ? THEN 0 ELSE 1 END, kode
     LIMIT 10`, [`${q}%`, `%${q}%`, `${q}%`]);
    res.json(rows);
});
// ============================================================
// Error handlers
// ============================================================
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.globalErrorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map