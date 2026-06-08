import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayload, Peran } from '../types';

export function verifyJWT(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.token;
  if (!token) {
    res.redirect('/auth/login');
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = payload;
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
