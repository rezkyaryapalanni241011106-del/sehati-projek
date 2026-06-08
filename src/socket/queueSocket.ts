import { Server as SocketServer, Socket } from 'socket.io';

export function setupQueueSocket(io: SocketServer): void {
  io.on('connection', (socket: Socket) => {
    // Dokter join room saat buka dashboard
    socket.on('join:doctor', (doctorId: string) => {
      if (typeof doctorId === 'string' && doctorId.length > 0) {
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
