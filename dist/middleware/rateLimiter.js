"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiLimiter = exports.loginLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// Rate limiter untuk endpoint login — 5 percobaan gagal → kunci 30 menit (FR-03)
exports.loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 30 * 60 * 1000,
    max: 5,
    skipSuccessfulRequests: true,
    message: {
        message: 'Terlalu banyak percobaan login. Akun dikunci selama 30 menit.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Rate limiter umum untuk API publik
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 60,
    message: { message: 'Terlalu banyak permintaan. Coba lagi nanti.' },
    standardHeaders: true,
    legacyHeaders: false,
});
//# sourceMappingURL=rateLimiter.js.map