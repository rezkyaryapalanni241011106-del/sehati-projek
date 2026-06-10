import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';
import { env } from '../config/env';
import { JwtPayload, Peran } from '../types';

function setNoCache(res: Response): void {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
}

export function verifyJWT(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.token;
  if (!token) {
    res.redirect('/auth/login');
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = payload;
    setNoCache(res);
    next();
  } catch {
    res.clearCookie('token');
    res.redirect('/auth/login');
  }
}

export function verifyJWTPasien(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.token_pasien;
  if (!token) {
    res.redirect('/pasien/login');
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    if (payload.peran !== 'pasien') {
      res.clearCookie('token_pasien');
      res.redirect('/pasien/login');
      return;
    }
    req.user = payload;
    setNoCache(res);
    next();
  } catch {
    res.clearCookie('token_pasien');
    res.redirect('/pasien/login');
  }
}

export function checkRole(...roles: (Peran | 'pasien')[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.peran as Peran | 'pasien')) {
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
export async function verifyJWTOrMfaSetup(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.token;
  if (token) {
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      req.user = payload;
      setNoCache(res);
      return next();
    } catch {
      res.clearCookie('token');
    }
  }

  const pending = (req.session as any).mfa_setup_pending as { id: string; peran: string; nama: string } | undefined;
  if (pending?.id) {
    const [rows] = await pool.execute<any[]>(
      'SELECT id, peran, nama_lengkap FROM Users WHERE id = ? AND status_aktif = 1',
      [pending.id]
    );
    if (rows.length > 0) {
      req.user = { sub: rows[0].id, peran: rows[0].peran, nama: rows[0].nama_lengkap } as JwtPayload;
      setNoCache(res);
      return next();
    }
  }

  res.redirect('/auth/login');
}

export function signToken(payload: Omit<JwtPayload, 'iat' | 'exp' | 'last_active'>): string {
  return jwt.sign(
    { ...payload, last_active: Date.now() },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
  );
}

export function setTokenCookie(res: Response, token: string, isPasien = false): void {
  const cookieName = isPasien ? 'token_pasien' : 'token';
  res.cookie(cookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProd(),
    maxAge: 24 * 60 * 60 * 1000, // 24 jam — idle timeout di middleware
  });
}
