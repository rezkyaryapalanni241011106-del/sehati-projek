import { env } from '../config/env';

function formatNomorWA(nomor: string): string {
  // Konversi format lokal 08xxx → 628xxx
  if (nomor.startsWith('0')) {
    return '62' + nomor.slice(1);
  }
  return nomor;
}

// ── WhatsApp Cloud API (Meta Official) ────────────────────────────────────────
async function kirimViaMetaCloudAPI(nomorHp: string, kodeOtp: string): Promise<void> {
  const target = formatNomorWA(nomorHp);

  // Komponen body selalu ada
  const components: any[] = [
    {
      type: 'body',
      parameters: [{ type: 'text', text: kodeOtp }],
    },
  ];

  // Tombol "Copy Code" hanya ditambahkan jika template punya button
  if (env.WA_TEMPLATE_HAS_BUTTON) {
    components.push({
      type: 'button',
      sub_type: 'url',
      index: '0',
      parameters: [{ type: 'text', text: kodeOtp }],
    });
  }

  const body = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: target,
    type: 'template',
    template: {
      name: env.WA_TEMPLATE_NAME,
      language: { code: env.WA_TEMPLATE_LANGUAGE },
      components,
    },
  };

  const response = await fetch(
    `https://graph.facebook.com/v19.0/${env.WA_PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.WA_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  const result = await response.json() as any;

  if (!response.ok || result.error) {
    const errMsg = result.error?.message ?? `HTTP ${response.status}`;
    throw new Error(`WhatsApp Cloud API gagal: ${errMsg}`);
  }
}

// ── Fonnte (alternatif) ────────────────────────────────────────────────────────
async function kirimViaFonnte(nomorHp: string, kodeOtp: string): Promise<void> {
  const target = formatNomorWA(nomorHp);

  const pesan =
    `*SEHATI* — Kode OTP Anda:\n\n` +
    `*${kodeOtp}*\n\n` +
    `Berlaku selama *${env.OTP_EXPIRY_MINUTES} menit*.\n` +
    `Jangan bagikan kode ini kepada siapapun.`;

  const response = await fetch('https://api.fonnte.com/send', {
    method: 'POST',
    headers: {
      'Authorization': env.FONNTE_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ target, message: pesan, countryCode: '62' }),
  });

  const result = await response.json() as any;

  if (!response.ok || result.status === false) {
    throw new Error(`Fonnte gagal kirim: ${result.reason ?? `HTTP ${response.status}`}`);
  }
}

// ── Entry point ───────────────────────────────────────────────────────────────
export async function kirimOTPWhatsApp(nomorHp: string, kodeOtp: string): Promise<void> {
  if (env.OTP_MOCK) {
    console.log(`[WA MOCK] → ${nomorHp} | OTP: ${kodeOtp}`);
    return;
  }

  if (env.WA_PROVIDER === 'meta') {
    await kirimViaMetaCloudAPI(nomorHp, kodeOtp);
  } else {
    await kirimViaFonnte(nomorHp, kodeOtp);
  }
}
