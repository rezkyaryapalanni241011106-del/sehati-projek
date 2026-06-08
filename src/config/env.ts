import 'dotenv/config';

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Environment variable ${key} is required`);
  return val;
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const env = {
  NODE_ENV: optional('NODE_ENV', 'development'),
  PORT: parseInt(optional('PORT', '3000'), 10),

  DB_HOST: optional('DB_HOST', 'localhost'),
  DB_PORT: parseInt(optional('DB_PORT', '3306'), 10),
  DB_USER: optional('DB_USER', 'root'),
  DB_PASSWORD: optional('DB_PASSWORD', ''),
  DB_NAME: optional('DB_NAME', 'db_sehati'),

  JWT_SECRET: optional('JWT_SECRET', 'dev_secret_ganti_di_production_minimal_64_karakter'),
  JWT_EXPIRES_IN: optional('JWT_EXPIRES_IN', '15m'),
  SESSION_SECRET: optional('SESSION_SECRET', 'dev_session_secret_ganti_di_production'),

  BCRYPT_ROUNDS: parseInt(optional('BCRYPT_ROUNDS', '12'), 10),

  OTP_MOCK: optional('OTP_MOCK', 'true') === 'true',
  OTP_EXPIRY_MINUTES: parseInt(optional('OTP_EXPIRY_MINUTES', '5'), 10),

  UPLOAD_PATH: optional('UPLOAD_PATH', 'src/public/uploads'),
  MAX_FILE_SIZE_MB: parseInt(optional('MAX_FILE_SIZE_MB', '10'), 10),

  APP_NAME: optional('APP_NAME', 'SEHATI'),
  CLINIC_NAME: optional('CLINIC_NAME', 'Klinik Sehat Bersama'),
  CLINIC_ADDRESS: optional('CLINIC_ADDRESS', 'Jl. Kesehatan No. 1, Jakarta'),
  CLINIC_PHONE: optional('CLINIC_PHONE', '(021) 1234-5678'),

  isProd: () => process.env.NODE_ENV === 'production',
};
