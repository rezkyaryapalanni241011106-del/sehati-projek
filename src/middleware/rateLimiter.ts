import rateLimit from 'express-rate-limit';

// Rate limiter untuk endpoint login — 5 percobaan gagal → kunci 30 menit
export const loginLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  message: {
    message: 'Terlalu banyak percobaan login. Akun dikunci selama 30 menit.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter umum untuk API publik
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { message: 'Terlalu banyak permintaan. Coba lagi nanti.' },
  standardHeaders: true,
  legacyHeaders: false,
});
