"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.testConnection = testConnection;
const promise_1 = __importDefault(require("mysql2/promise"));
const env_1 = require("./env");
exports.pool = promise_1.default.createPool({
    host: env_1.env.DB_HOST,
    port: env_1.env.DB_PORT,
    user: env_1.env.DB_USER,
    password: env_1.env.DB_PASSWORD,
    database: env_1.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+07:00',
    charset: 'utf8mb4',
});
async function testConnection() {
    const conn = await exports.pool.getConnection();
    conn.release();
    console.log(`[DB] Terhubung ke ${env_1.env.DB_NAME}@${env_1.env.DB_HOST}:${env_1.env.DB_PORT}`);
}
//# sourceMappingURL=database.js.map