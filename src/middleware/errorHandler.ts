import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  ],
});

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).render('error', {
    title: 'Halaman Tidak Ditemukan',
    message: `Halaman ${req.path} tidak tersedia.`,
    statusCode: 404,
  });
}

export function globalErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error(err.message, { stack: err.stack, path: req.path });

  const statusCode = (err as any).status ?? 500;
  const message = env.isProd()
    ? 'Terjadi kesalahan pada server. Silakan coba lagi nanti.'
    : err.message;

  if (req.xhr || req.headers.accept?.includes('application/json')) {
    res.status(statusCode).json({ message });
    return;
  }

  res.status(statusCode).render('error', {
    title: 'Terjadi Kesalahan',
    message,
    statusCode,
  });
}
