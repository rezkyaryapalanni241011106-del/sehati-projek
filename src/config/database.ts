import mysql from 'mysql2/promise';
import { env } from './env';

export const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+07:00',
  charset: 'utf8mb4',
});

export async function testConnection(): Promise<void> {
  const conn = await pool.getConnection();
  conn.release();
  console.log(`[DB] Terhubung ke ${env.DB_NAME}@${env.DB_HOST}:${env.DB_PORT}`);
}
