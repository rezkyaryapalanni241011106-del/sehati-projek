import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayload } from '../types';

export function setupQueueSocket(io: SocketServer): void {
  // Verifikasi JWT dari cookie sebelum koneksi diterima
  io.use((socket, next) => {
    const cookieHeader = socket.handshake.headers.cookie ?? '';
    const tokenMatch = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
    if (!tokenMatch) {
      return next(new Error('Unauthorized'));
    }
    try {
      const payload = jwt.verify(tokenMatch[1], env.JWT_SECRET) as JwtPayload;
      socket.data.user = payload;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket: Socket) => {
    // Dokter hanya bisa join room miliknya sendiri
    socket.on('join:doctor', (doctorId: string) => {
      const user: JwtPayload = socket.data.user;
      if (
        typeof doctorId === 'string' &&
        doctorId.length > 0 &&
        user?.peran === 'dokter' &&
        user?.sub === doctorId
      ) {
        socket.join(`doctor-${doctorId}`);
      }
    });

    socket.on('leave:doctor', (doctorId: string) => {
      socket.leave(`doctor-${doctorId}`);
    });
  });
}

// Dipanggil dari kedatangan controller saat pasien dikonfirmasi hadir
export function emitQueueUpdate(
  io: SocketServer,
  doctorId: string,
  action: 'add' | 'remove' | 'skip' | 'standby_back',
  payload: Record<string, unknown>
): void {
  io.to(`doctor-${doctorId}`).emit('queue:update', { action, ...payload });
}
