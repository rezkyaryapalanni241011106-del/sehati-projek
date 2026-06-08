import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayload } from '../types';
import { signToken, setTokenCookie } from './auth';

const IDLE_MS = 15 * 60 * 1000; // 15 menit — NFR-15

export function idleTimeoutStaf(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) return next();
  if (req.user.peran === 'pasien') return next();

  const lastActive = req.user.last_active ?? 0;
  const now = Date.now();

  if (now - lastActive > IDLE_MS) {
    res.clearCookie('token');
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      res.status(401).json({ message: 'Sesi habis karena tidak aktif. Silakan login kembali.' });
    } else {
      res.redirect('/auth/login?reason=idle');
    }
    return;
  }

  // Perbarui last_active dengan re-issue token (slide window)
  const newToken = signToken({
    sub: req.user.sub,
    peran: req.user.peran,
    nama: req.user.nama,
  });
  setTokenCookie(res, newToken, false);
  req.user.last_active = now;

  next();
}
