import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { pool, testConnection } from '../config/database';
import { ICD10_ID_OVERRIDES } from './icd10-id-overrides';

/**
 * Impor kode ICD-10 dari file ClaML resmi WHO (database/icd102019en.xml)
 * ke dalam tabel ICD10 yang sudah ada.
 *
 * Strategi (sesuai keputusan):
 *  1. Ambil HANYA Class kind="category" (kode diagnosis sebenarnya).
 *  2. deskripsi  = Rubric kind="preferred" (Bahasa Inggris resmi WHO).
 *     kategori   = judul Chapter (bab) hasil telusur SuperClass ke atas.
 *  3. INSERT IGNORE — kode yang sudah ada (50 entri Bahasa Indonesia)
 *     TIDAK ditimpa.
 *  4. Setelah impor, terapkan terjemahan Bahasa Indonesia untuk subset
 *     kode umum (icd10-id-overrides.ts) via UPDATE.
 *
 * Idempoten: aman dijalankan berulang kali.
 */

const XML_PATH = path.resolve(__dirname, '../../database/icd102019en.xml');
const BATCH_SIZE = 500;
const DESKRIPSI_MAX = 500; // VARCHAR(500)
const KATEGORI_MAX = 200; // VARCHAR(200)

interface ParsedClass {
  code: string;
  kind: string;
  superClass: string | null;
  label: string | null;
}

/** Buang semua tag XML, decode entity dasar, rapikan spasi. */
function cleanLabel(raw: string): string {
  return raw
    // Cross-reference dagger/asterisk "in brackets" -> beri kurung siku + spasi
    // (mis. "Varicella pneumonia<Reference ...>J17.1</Reference>" -> "... [J17.1]")
    .replace(/<Reference\b[^>]*\bclass="in brackets"[^>]*>([\s\S]*?)<\/Reference>/g, ' [$1]')
    // Reference lain -> pertahankan teksnya, beri spasi pemisah agar tak menempel
    .replace(/<Reference\b[^>]*>([\s\S]*?)<\/Reference>/g, ' $1')
    // Sisa tag (Para, Term/subscript, Include, dll.) dibuang TANPA spasi
    // agar subscript tetap menyatu (mis. "Vitamin B<Term>12</Term>" -> "Vitamin B12")
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&amp;/g, '&') // terakhir, agar tidak men-double-decode
    .replace(/\s+/g, ' ')
    .trim();
}

/** Parse seluruh elemen <Class> menjadi peta code -> ParsedClass. */
function parseClasses(xml: string): Map<string, ParsedClass> {
  const map = new Map<string, ParsedClass>();
  const classRe = /<Class\b[^>]*>[\s\S]*?<\/Class>/g;
  let m: RegExpExecArray | null;

  while ((m = classRe.exec(xml)) !== null) {
    const block = m[0];
    const open = block.slice(0, block.indexOf('>') + 1);

    const code = open.match(/\bcode="([^"]*)"/)?.[1];
    const kind = open.match(/\bkind="([^"]*)"/)?.[1];
    if (!code || !kind) continue;

    const superClass = block.match(/<SuperClass\b[^>]*\bcode="([^"]*)"/)?.[1] ?? null;

    // Rubric "preferred" (BUKAN "preferredLong" — kutip penutup memastikan exact match).
    let label: string | null = null;
    const pref = block.match(
      /<Rubric\b[^>]*\skind="preferred"[^>]*>([\s\S]*?)<\/Rubric>/
    );
    if (pref) {
      const lbl = pref[1].match(/<Label\b[^>]*>([\s\S]*?)<\/Label>/);
      if (lbl) label = cleanLabel(lbl[1]);
    }

    map.set(code, { code, kind, superClass, label: label || null });
  }

  return map;
}

/** Telusur SuperClass ke atas sampai menemukan Chapter; kembalikan labelnya. */
function resolveChapterLabel(code: string, map: Map<string, ParsedClass>): string | null {
  let cur: string | null = code;
  let guard = 0;
  while (cur && guard++ < 25) {
    const node = map.get(cur);
    if (!node) break;
    if (node.kind === 'chapter') return node.label;
    cur = node.superClass;
  }
  return null;
}

async function run(): Promise<void> {
  if (!fs.existsSync(XML_PATH)) {
    throw new Error(`File XML tidak ditemukan: ${XML_PATH}`);
  }

  await testConnection();

  console.log(`[ICD10] Membaca ${path.basename(XML_PATH)} ...`);
  const xml = fs.readFileSync(XML_PATH, 'utf8');

  console.log('[ICD10] Mem-parsing elemen <Class> ...');
  const classes = parseClasses(xml);
  console.log(`[ICD10] Total Class terbaca: ${classes.size}`);

  // Susun baris untuk kode diagnosis (kind="category") yang punya deskripsi.
  const rows: Array<[string, string, string | null]> = [];
  let skippedNoLabel = 0;
  for (const cls of classes.values()) {
    if (cls.kind !== 'category') continue;
    if (!cls.label) {
      skippedNoLabel++;
      continue;
    }
    const kategori = resolveChapterLabel(cls.code, classes);
    rows.push([
      cls.code.slice(0, 10),
      cls.label.slice(0, DESKRIPSI_MAX),
      kategori ? kategori.slice(0, KATEGORI_MAX) : null,
    ]);
  }
  console.log(
    `[ICD10] Kode diagnosis siap impor: ${rows.length}` +
      (skippedNoLabel ? ` (dilewati tanpa deskripsi: ${skippedNoLabel})` : '')
  );

  const [[{ cnt_before }]] = await pool.query<any[]>('SELECT COUNT(*) AS cnt_before FROM ICD10');

  // Upsert per-batch: XML = sumber kebenaran untuk deskripsi Inggris, jadi
  // deskripsi/kategori disegarkan tiap run. Override Bahasa Indonesia di bawah
  // dijalankan TERAKHIR sehingga tetap menjadi nilai final (otoritatif).
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await pool.query(
      `INSERT INTO ICD10 (kode, deskripsi, kategori) VALUES ?
       ON DUPLICATE KEY UPDATE deskripsi = VALUES(deskripsi), kategori = VALUES(kategori)`,
      [batch]
    );
  }
  const [[{ cnt_after }]] = await pool.query<any[]>('SELECT COUNT(*) AS cnt_after FROM ICD10');
  console.log(`[ICD10] Diproses: ${rows.length} kode | baris baru: ${cnt_after - cnt_before} | total: ${cnt_after}`);

  // Terapkan terjemahan Bahasa Indonesia untuk subset umum.
  let translated = 0;
  for (const [kode, deskripsi, kategori] of ICD10_ID_OVERRIDES) {
    const [res] = await pool.execute(
      'UPDATE ICD10 SET deskripsi = ?, kategori = ? WHERE kode = ?',
      [deskripsi.slice(0, DESKRIPSI_MAX), kategori.slice(0, KATEGORI_MAX), kode]
    );
    translated += (res as { affectedRows: number }).affectedRows;
  }
  console.log(
    `[ICD10] Deskripsi Bahasa Indonesia diterapkan: ${translated}/${ICD10_ID_OVERRIDES.length}`
  );

  const [[{ total }]] = await pool.query<any[]>('SELECT COUNT(*) AS total FROM ICD10');
  console.log(`[ICD10] Total baris di tabel ICD10 sekarang: ${total}`);
  console.log('[ICD10] Selesai.');

  await pool.end();
}

run().catch((err) => {
  console.error('[ICD10] Error:', err);
  process.exit(1);
});
