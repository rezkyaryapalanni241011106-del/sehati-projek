"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupQueueSocket = setupQueueSocket;
exports.emitQueueUpdate = emitQueueUpdate;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
function setupQueueSocket(io) {
    // Verifikasi JWT dari cookie sebelum koneksi diterima
    io.use((socket, next) => {
        const cookieHeader = socket.handshake.headers.cookie ?? '';
        const tokenMatch = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
        if (!tokenMatch) {
            return next(new Error('Unauthorized'));
        }
        try {
            const payload = jsonwebtoken_1.default.verify(tokenMatch[1], env_1.env.JWT_SECRET);
            socket.data.user = payload;
            next();
        }
        catch {
            next(new Error('Unauthorized'));
        }
    });
    io.on('connection', (socket) => {
        // Dokter hanya bisa join room miliknya sendiri
        socket.on('join:doctor', (doctorId) => {
            const user = socket.data.user;
            if (typeof doctorId === 'string' &&
                doctorId.length > 0 &&
                user?.peran === 'dokter' &&
                user?.sub === doctorId) {
                socket.join(`doctor-${doctorId}`);
            }
        });
        socket.on('leave:doctor', (doctorId) => {
            socket.leave(`doctor-${doctorId}`);
        });
    });
}
// Dipanggil dari kedatangan controller saat pasien dikonfirmasi hadir
function emitQueueUpdate(io, doctorId, action, payload) {
    io.to(`doctor-${doctorId}`).emit('queue:update', { action, ...payload });
}
//# sourceMappingURL=queueSocket.js.map