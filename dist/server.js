"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const database_1 = require("./config/database");
const queueSocket_1 = require("./socket/queueSocket");
async function main() {
    await (0, database_1.testConnection)();
    const server = http_1.default.createServer(app_1.default);
    const io = new socket_io_1.Server(server, {
        cors: { origin: false },
    });
    (0, queueSocket_1.setupQueueSocket)(io);
    // Inject io ke app agar bisa dipakai di controller
    app_1.default.set('io', io);
    server.listen(env_1.env.PORT, () => {
        console.log(`[SEHATI] Server berjalan di http://localhost:${env_1.env.PORT}`);
        console.log(`[SEHATI] Environment: ${env_1.env.NODE_ENV}`);
        if (env_1.env.OTP_MOCK) {
            console.log('[SEHATI] OTP_MOCK=true — OTP akan dicetak ke console');
        }
    });
}
main().catch((err) => {
    console.error('[SEHATI] Gagal start server:', err);
    process.exit(1);
});
//# sourceMappingURL=server.js.map