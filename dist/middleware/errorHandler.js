"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.notFoundHandler = notFoundHandler;
exports.globalErrorHandler = globalErrorHandler;
const env_1 = require("../config/env");
const winston_1 = __importDefault(require("winston"));
exports.logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json()),
    transports: [
        new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple()),
        }),
    ],
});
function notFoundHandler(req, res) {
    res.status(404).render('error', {
        title: 'Halaman Tidak Ditemukan',
        message: `Halaman ${req.path} tidak tersedia.`,
        statusCode: 404,
    });
}
function globalErrorHandler(err, req, res, _next) {
    exports.logger.error(err.message, { stack: err.stack, path: req.path });
    const statusCode = err.status ?? 500;
    const message = env_1.env.isProd()
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
//# sourceMappingURL=errorHandler.js.map