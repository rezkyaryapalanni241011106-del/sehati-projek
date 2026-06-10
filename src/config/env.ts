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

  // WhatsApp provider: 'meta' = WhatsApp Cloud API, 'fonnte' = Fonnte
  WA_PROVIDER: optional('WA_PROVIDER', 'fonnte') as 'meta' | 'fonnte',

  // Fonnte (https://fonnte.com)
  FONNTE_TOKEN: optional('FONNTE_TOKEN', ''),

  // WhatsApp Cloud API — Meta (https://developers.facebook.com)
  WA_PHONE_NUMBER_ID: optional('WA_PHONE_NUMBER_ID', ''),
  WA_ACCESS_TOKEN: optional('WA_ACCESS_TOKEN', ''),
  WA_TEMPLATE_NAME: optional('WA_TEMPLATE_NAME', 'otp_sehati'),
  WA_TEMPLATE_LANGUAGE: optional('WA_TEMPLATE_LANGUAGE', 'id'),
  // true jika template punya tombol "Copy Code", false jika hanya teks biasa
  WA_TEMPLATE_HAS_BUTTON: optional('WA_TEMPLATE_HAS_BUTTON', 'true') === 'true',

  UPLOAD_PATH: optional('UPLOAD_PATH', 'src/public/uploads'),
  MAX_FILE_SIZE_MB: parseInt(optional('MAX_FILE_SIZE_MB', '10'), 10),

  APP_NAME: optional('APP_NAME', 'SEHATI'),
  CLINIC_NAME: optional('CLINIC_NAME', 'Klinik Sehat Bersama'),
  CLINIC_ADDRESS: optional('CLINIC_ADDRESS', 'Jl. Kesehatan No. 1, Jakarta'),
  CLINIC_PHONE: optional('CLINIC_PHONE', '(021) 1234-5678'),

  isProd: () => process.env.NODE_ENV === 'production',
};

// Validasi saat startup: jika OTP nyata diaktifkan, kredensial WA harus ada
if (!env.OTP_MOCK) {
  if (env.WA_PROVIDER === 'meta') {
    if (!process.env.WA_PHONE_NUMBER_ID || process.env.WA_PHONE_NUMBER_ID.startsWith('ISI_')) {
      throw new Error('[SEHATI] WA_PROVIDER=meta tapi WA_PHONE_NUMBER_ID belum diisi di .env');
    }
    if (!process.env.WA_ACCESS_TOKEN || process.env.WA_ACCESS_TOKEN.startsWith('ISI_')) {
      throw new Error('[SEHATI] WA_PROVIDER=meta tapi WA_ACCESS_TOKEN belum diisi di .env');
    }
  } else if (env.WA_PROVIDER === 'fonnte') {
    if (!process.env.FONNTE_TOKEN) {
      throw new Error('[SEHATI] WA_PROVIDER=fonnte tapi FONNTE_TOKEN belum diisi di .env');
    }
  }
}
