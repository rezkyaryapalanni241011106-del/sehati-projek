import express from 'express';
import path from 'path';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import flash from 'connect-flash';
import morgan from 'morgan';
import { env } from './config/env';
import { notFoundHandler, globalErrorHandler, logger } from './middleware/errorHandler';

// Route imports
import authRoutes from './modules/auth/auth.routes';
import pasienRoutes from './modules/pasien/pasien.routes';
import bookingRoutes from './modules/booking/booking.routes';
import keluhanRoutes from './modules/keluhan/keluhan.routes';
import kedatanganRoutes from './modules/kedatangan/kedatangan.routes';
import antrianRoutes from './modules/antrian/antrian.routes';
import soapRoutes from './modules/soap/soap.routes';
import resepRoutes from './modules/resep/resep.routes';
import riwayatRoutes from './modules/riwayat/riwayat.routes';
import jadwalRoutes from './modules/jadwal/jadwal.routes';
import akunRoutes from './modules/akun/akun.routes';
import spesialisasiRoutes from './modules/spesialisasi/spesialisasi.routes';
import auditLogRoutes from './modules/auditLog/auditLog.routes';
import adminRoutes from './modules/admin/admin.routes';
import { pool } from './config/database';

const app = express();

// ============================================================
// Security headers
// ============================================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:    ["'self'"],
      styleSrc:      ["'self'", "'unsafe-inline'"],
      scriptSrc:     ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      imgSrc:        ["'self'", "data:"],
      fontSrc:       ["'self'"],
      connectSrc:    ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// ============================================================
// View engine
// ============================================================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ============================================================
// Static files
// ============================================================
app.use('/public', express.static(path.join(__dirname, 'public')));

// ============================================================
// Request parsers
// ============================================================
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// ============================================================
// Session (hanya untuk connect-flash — state di JWT)
// ============================================================
app.use(
  session({
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', secure: env.isProd() },
  })
);
app.use(flash());

// ============================================================
// HTTP logging
// ============================================================
app.use(morgan(env.isProd() ? 'combined' : 'dev', {
  stream: { write: (msg) => logger.info(msg.trim()) },
}));

// ============================================================
// Template globals — tersedia di semua EJS
// ============================================================
app.use((req, res, next) => {
  const s = req.flash('success'); res.locals.flash_success = s.length ? s[0] : null;
  const e = req.flash('error');   res.locals.flash_error   = e.length ? e[0] : null;
  const i = req.flash('info');    res.locals.flash_info    = i.length ? i[0] : null;
  res.locals.app_name = env.APP_NAME;
  res.locals.clinic_name = env.CLINIC_NAME;
  // Lazy getter — dibaca saat render, setelah auth middleware mengisi req.user
  Object.defineProperty(res.locals, 'user', {
    get: () => (req as any).user ?? null,
    enumerable: true,
    configurable: true,
  });
  next();
});

// ============================================================
// Landing page
// ============================================================
app.get('/', (req, res) => {
  res.render('index', { title: `Selamat Datang — ${env.APP_NAME}` });
});

// ============================================================
// Routes
// ============================================================
app.use('/auth', authRoutes);
app.use('/pasien', pasienRoutes);
app.use('/booking', bookingRoutes);
app.use('/keluhan', keluhanRoutes);
app.use('/kedatangan', kedatanganRoutes);
app.use('/antrian', antrianRoutes);
app.use('/soap', soapRoutes);
app.use('/resep', resepRoutes);
app.use('/riwayat', riwayatRoutes);
app.use('/jadwal', jadwalRoutes);
app.use('/akun', akunRoutes);
app.use('/spesialisasi', spesialisasiRoutes);
app.use('/audit', auditLogRoutes);
app.use('/admin', adminRoutes);

// ============================================================
// API — ICD-10 autocomplete (publik, hanya GET)
// ============================================================
app.get('/api/icd10', async (req, res) => {
  const q = ((req.query.q as string) || '').trim();
  if (q.length < 2) { res.json([]); return; }
  const [rows] = await pool.execute<any[]>(
    `SELECT kode, deskripsi FROM ICD10
     WHERE kode LIKE ? OR deskripsi LIKE ?
     ORDER BY CASE WHEN kode LIKE ? THEN 0 ELSE 1 END, kode
     LIMIT 10`,
    [`${q}%`, `%${q}%`, `${q}%`]
  );
  res.json(rows);
});

// ============================================================
// Error handlers
// ============================================================
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
