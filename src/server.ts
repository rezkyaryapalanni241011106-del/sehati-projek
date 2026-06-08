import 'dotenv/config';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import app from './app';
import { env } from './config/env';
import { testConnection } from './config/database';
import { setupQueueSocket } from './socket/queueSocket';

async function main() {
  await testConnection();

  const server = http.createServer(app);
  const io = new SocketServer(server, {
    cors: { origin: false },
  });

  setupQueueSocket(io);

  // Inject io ke app agar bisa dipakai di controller
  app.set('io', io);

  server.listen(env.PORT, () => {
    console.log(`[SEHATI] Server berjalan di http://localhost:${env.PORT}`);
    console.log(`[SEHATI] Environment: ${env.NODE_ENV}`);
    if (env.OTP_MOCK) {
      console.log('[SEHATI] OTP_MOCK=true — OTP akan dicetak ke console');
    }
  });
}

main().catch((err) => {
  console.error('[SEHATI] Gagal start server:', err);
  process.exit(1);
});
