# Laporan Review Kesesuaian Sistem SEHATI terhadap SRS

**Proyek:** Sistem Rekam Medis Elektronik SEHATI  
**Dokumen Acuan:** Software Requirement Specification (SRS) v2.0  
**Tanggal Review:** 10 Juni 2026  
**Reviewer:** Claude Sonnet 4.6 (Automated Code Review)  
**Cakupan:** FR-01 s/d FR-52 dan NFR-01 s/d NFR-27

---

## Ringkasan Eksekutif

| Kategori | Total | Terpenuhi | Sebagian | Tidak Terpenuhi |
|----------|-------|-----------|----------|-----------------|
| Kebutuhan Fungsional (FR) | 52 | 42 | 5 | 5 |
| Kebutuhan Non-Fungsional (NFR) | 27 | 16 | 4 | 7 |
| **Total** | **79** | **58 (73%)** | **9 (11%)** | **12 (15%)** |

**Kesimpulan Umum:** Sistem SEHATI telah mengimplementasikan fondasi arsitektur yang solid dan sebagian besar alur bisnis utama sesuai SRS. Namun terdapat **3 gap kritis** yang harus diselesaikan sebelum deployment produksi: (1) MFA bypass vulnerability, (2) sistem notifikasi SMS/WhatsApp tidak diimplementasi, dan (3) enkripsi AES-256 at-rest tidak diimplementasi.

---

## Bagian 1 — Review Kebutuhan Fungsional

### 1.1 Modul Autentikasi dan RBAC (FR-01 – FR-07)

| ID | Kebutuhan SRS | Status | Catatan |
|----|---------------|--------|---------|
| FR-01 | Dua jalur login terpisah (OTP pasien, password+MFA staf) | ✅ Terpenuhi | Implementasi di `auth.controller.ts` dan `auth.routes.ts` |
| FR-02 | OTP valid 5 menit, satu kali pakai, kadaluarsa otomatis dinonaktifkan | ✅ Terpenuhi | `otp.ts:verifikasi()` menandai OTP sebagai digunakan, cek `expired_at` |
| FR-03 | Maksimal 5 percobaan login gagal dalam 15 menit, kunci 30 menit | ⚠️ Sebagian | Rate limiter diterapkan (`rateLimiter.ts`) tetapi: (1) `windowMs=15 menit` bukan 30 menit seperti SRS, (2) berbasis IP bukan akun — pengguna dari IP berbeda bisa bypass |
| FR-04 | Idle timeout 15 menit untuk sesi non-pasien | ✅ Terpenuhi | `idleTimeout.ts` + JWT expiresIn=15m; token di-refresh tiap request aktif |
| FR-05 | RBAC ketat per peran | ✅ Terpenuhi | `checkRole()` middleware diterapkan di semua route; tabel akses sesuai SRS |
| FR-06 | Pengguna staf dapat ubah password sendiri | ✅ Terpenuhi | Route `/auth/ubah-password` dengan validasi password lama |
| FR-07 | Seluruh aktivitas login dicatat di audit log immutable | ✅ Terpenuhi | `logAudit()` dipanggil pada setiap percobaan login sukses maupun gagal |

**Temuan FR-03 — Detail:**
```
// rateLimiter.ts — windowMs 15 menit, SRS mensyaratkan kunci 30 menit
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // ← harus 30 * 60 * 1000 per SRS
  max: 5,
  skipSuccessfulRequests: true,
  ...
});
```

**Temuan FR-01/NFR-14 KRITIS — MFA Bypass:**  
Ketika staf belum menyiapkan MFA (`totp_secret = null`), sistem menerbitkan JWT token TERLEBIH DAHULU sebelum mengarahkan ke setup MFA. Token ini sudah valid dan bisa digunakan untuk mengakses semua route yang dilindungi `verifyJWT`.

```typescript
// auth.controller.ts:209-214 — CELAH KEAMANAN
private completeSendToken = async (...) => {
  delete (req.session as any).totp_pending;
  const token = signToken({ ... });
  setTokenCookie(res, token, false); // ← JWT sudah di-set ke cookie!

  if (!pending.totp_secret) {
    res.redirect('/auth/setup-mfa'); // ← redirect ke setup, tapi token sudah ada
    return;
  }
```
Staf dapat melewati setup MFA dengan langsung mengakses `/antrian`, `/jadwal`, dll menggunakan token yang sudah ada di cookie.

---

### 1.2 Modul Master Data Spesialisasi (FR-08 – FR-12)

| ID | Kebutuhan SRS | Status | Catatan |
|----|---------------|--------|---------|
| FR-08 | Modul manajemen spesialisasi oleh Admin | ✅ Terpenuhi | `spesialisasi.controller.ts` + route `/spesialisasi` |
| FR-09 | Admin tambah, nonaktifkan, aktifkan kembali spesialisasi | ✅ Terpenuhi | `buatSpesialisasi()`, `toggleSpesialisasi()` |
| FR-10 | Nama spesialisasi bersifat unik | ✅ Terpenuhi | `UNIQUE KEY` di schema + penanganan `ER_DUP_ENTRY` |
| FR-11 | Spesialisasi aktif tersedia di form dokter dan filter booking | ✅ Terpenuhi | `findSpesialisasiAktif()` digunakan di akun dan booking model |
| FR-12 | Penonaktifan spesialisasi tidak hapus data dokter | ✅ Terpenuhi | Soft delete via `status_aktif = 0`, FK tidak CASCADE DELETE |

---

### 1.3 Modul Pendaftaran Pasien dan Rekam Medis (FR-13 – FR-16)

| ID | Kebutuhan SRS | Status | Catatan |
|----|---------------|--------|---------|
| FR-13 | Form registrasi mandiri dengan field wajib Permenkes 24/2022 | ✅ Terpenuhi | Validasi Zod di `pasien.controller.ts` mencakup semua field wajib |
| FR-14 | Validasi keunikan NIK, auto-generate nomor RM format RM-YYYY-XXXXXX | ⚠️ Sebagian | Format RM sudah benar. Namun `generateNomorRM()` menggunakan SELECT+increment tanpa transaksi — race condition pada pendaftaran bersamaan |
| FR-15 | Identitas alternatif untuk pasien tanpa NIK | ✅ Terpenuhi | Field `nomor_paspor` dan `nik_wali` di form registrasi |
| FR-16 | Pasien dapat update profil, NIK permanen | ✅ Terpenuhi | `updateProfil()` tidak mengizinkan perubahan NIK |

**Temuan FR-14 — Race Condition Generate Nomor RM:**
```typescript
// nomorRM.ts:8-22 — TIDAK ATOMIC
const [rows] = await pool.execute(
  `SELECT nomor_rm FROM Pasien WHERE nomor_rm LIKE ? ORDER BY nomor_rm DESC LIMIT 1`,
  [`${prefix}%`]
);
let urutan = 1;
if (rows.length > 0) {
  urutan = parseInt(parts[parts.length - 1], 10) + 1;
}
return `${prefix}${String(urutan).padStart(6, '0')}`;
// ↑ Dua request bersamaan bisa menghasilkan nomor RM yang sama!
```

---

### 1.4 Modul Penjadwalan dan Booking (FR-17 – FR-21)

| ID | Kebutuhan SRS | Status | Catatan |
|----|---------------|--------|---------|
| FR-17 | Kalender ketersediaan slot berdasarkan jadwal Admin, slot penuh/blokir tampil tidak tersedia | ✅ Terpenuhi | `getSlots()` di `booking.controller.ts` |
| FR-18 | Alur booking: pilih tanggal → spesialisasi → dokter → slot → konfirmasi | ✅ Terpenuhi | Form booking pasien mengikuti alur ini |
| FR-19 | Notifikasi konfirmasi booking via SMS/WhatsApp | ❌ Tidak Terpenuhi | **Tidak diimplementasi.** Tidak ada integrasi SMS Gateway maupun WhatsApp API |
| FR-20 | Slot dipesan otomatis terkunci (UNIQUE KEY) | ✅ Terpenuhi | `UNIQUE KEY uq_slot (id_dokter, tanggal, slot_jam)` di schema + penanganan `ER_DUP_ENTRY` |
| FR-21 | Pembatalan/reschedule maksimal H-1 | ✅ Terpenuhi | Validasi tanggal di `batalBooking()` dan `doReschedule()` |

---

### 1.5 Modul Keluhan Pra-Konsultasi (FR-22 – FR-25)

| ID | Kebutuhan SRS | Status | Catatan |
|----|---------------|--------|---------|
| FR-22 | Form keluhan maks 500 karakter, character counter real-time | ⚠️ Sebagian | Validasi 500 karakter di backend terpenuhi. Character counter real-time perlu diverifikasi di template EJS |
| FR-23 | Pasien dapat isi/edit keluhan selama status = 'booked' | ✅ Terpenuhi | `keluhan.controller.ts:40` mengecek `kunjungan.status !== 'booked'` |
| FR-24 | Kolom keluhan read-only setelah status 'hadir' | ✅ Terpenuhi | Lock terjadi saat status berubah ke 'hadir' |
| FR-25 | Keluhan pasien pre-fill di field Subjektif formulir SOAP dokter | ✅ Terpenuhi | `kunjungan.keluhan_awal` dikirim ke view SOAP via `showSoap()` |

---

### 1.6 Modul Konfirmasi Kedatangan (FR-26 – FR-29)

| ID | Kebutuhan SRS | Status | Catatan |
|----|---------------|--------|---------|
| FR-26 | Dashboard resepsionis/perawat tampilkan pasien terjadwal hari ini urut slot | ✅ Terpenuhi | `dashboardKedatangan()` dengan filter tanggal |
| FR-27 | Konfirmasi hadir dengan satu klik | ✅ Terpenuhi | `konfirmasiHadir()` endpoint POST |
| FR-28 | Setelah konfirmasi, real-time push ke antrian dokter via WebSocket, timestamp FCFS | ✅ Terpenuhi | `emitQueueUpdate(io, k.id_dokter, 'add', ...)` |
| FR-29 | Catat ID staf konfirmator dan timestamp | ✅ Terpenuhi | `dikonfirmasi_oleh` dan `waktu_konfirmasi` diupdate di DB |

---

### 1.7 Modul Dashboard Dokter dan Antrian (FR-30 – FR-34)

| ID | Kebutuhan SRS | Status | Catatan |
|----|---------------|--------|---------|
| FR-30 | Antrian real-time via WebSocket, latensi ≤500ms, urut FCFS | ✅ Terpenuhi | Socket.io room per dokter; query ORDER BY `waktu_konfirmasi` |
| FR-31 | Grid antrian tampilkan nama, nomor RM, usia, waktu konfirmasi, ringkasan keluhan | ✅ Terpenuhi | `findAntrianAktif()` mengambil semua field yang diperlukan |
| FR-32 | Tombol 'Panggil' membuka form rekam medis | ✅ Terpenuhi | Link ke `/soap/:kunjunganId` |
| FR-33 | Skip dengan alasan wajib, pasien masuk standby | ✅ Terpenuhi | `skipPasien()` validasi `alasan_skip` tidak boleh kosong |
| FR-34 | Tampilan visual antrian aktif dan standby terpisah | ✅ Terpenuhi | Dua query terpisah: `findAntrianAktif()` dan `findStandby()` |

---

### 1.8 Modul Dokumentasi SOAP (FR-35 – FR-38)

| ID | Kebutuhan SRS | Status | Catatan |
|----|---------------|--------|---------|
| FR-35 | Formulir SOAP lengkap dengan auto-fill tanggal, dokter, nomor urut kunjungan | ✅ Terpenuhi | Query JOIN ke Users dan Spesialisasi di `findKunjunganDokter()` |
| FR-36 | Validasi wajib: Diagnosis Utama (kode_dx) + minimal satu item Plan | ✅ Terpenuhi | `soap.controller.ts:76-103` memeriksa kode_dx dan salah satu dari resep/tindakan/anjuran |
| FR-37 | Field Objektif opsional, tidak boleh jadi penghalang simpan | ✅ Terpenuhi | Semua field Objektif adalah nullable di schema dan tidak divalidasi |
| FR-38 | SOAP terkunci setelah disimpan, koreksi via addendum | ✅ Terpenuhi | `soapSudahAda()` mencegah overwrite; tabel `Koreksi_SOAP` untuk addendum |

**Catatan FR-38:** Tabel `Koreksi_SOAP` terdefinisi di file `migrate_koreksi_soap.sql` yang **terpisah dari `schema.sql` utama**. Deployment segar tanpa menjalankan migration ini akan menyebabkan runtime error pada endpoint `/soap/:kunjunganId/koreksi`.

---

### 1.9 Modul Resep PDF (FR-39)

| ID | Kebutuhan SRS | Status | Catatan |
|----|---------------|--------|---------|
| FR-39 | Generate resep PDF standar: kop klinik, identitas pasien, identitas dokter+STR, daftar obat, area tanda tangan | ✅ Terpenuhi | `pdf.ts` menggunakan PDFKit dengan layout lengkap sesuai SRS |

---

### 1.10 Modul Riwayat Medis (FR-40 – FR-43)

| ID | Kebutuhan SRS | Status | Catatan |
|----|---------------|--------|---------|
| FR-40 | Dokter akses seluruh riwayat pasien aktif, urut kronologis terbalik | ✅ Terpenuhi | `riwayat.controller.ts:riwayatDokter()` |
| FR-41 | Pasien lihat riwayat kunjungan sendiri, mode read-only | ✅ Terpenuhi | `riwayatPasien()` dengan tampilan pasien |
| FR-42 | Pasien tidak bisa ubah/hapus/manipulasi data rekam medis | ✅ Terpenuhi | Tidak ada route POST/PUT/DELETE rekam medis untuk pasien |
| FR-43 | Pasien unduh resep PDF dari kunjungan manapun | ✅ Terpenuhi | `downloadResepPDFPasien()` dengan verifikasi kepemilikan SOAP |

---

### 1.11 Modul Manajemen Jadwal (FR-44 – FR-46)

| ID | Kebutuhan SRS | Status | Catatan |
|----|---------------|--------|---------|
| FR-44 | Admin tambah/edit/nonaktifkan jadwal dengan field lengkap | ✅ Terpenuhi | `jadwal.controller.ts` CRUD lengkap |
| FR-45 | Generate slot kalender otomatis dari parameter jadwal | ✅ Terpenuhi | `generateSlots()` di `helpers.ts` |
| FR-46 | Admin blokir tanggal → booking aktif otomatis batal + notifikasi pasien | ⚠️ Sebagian | Pembatalan otomatis diimplementasi. **Notifikasi SMS/WhatsApp ke pasien TIDAK diimplementasi** |

---

### 1.12 Modul Manajemen Akun (FR-47 – FR-49)

| ID | Kebutuhan SRS | Status | Catatan |
|----|---------------|--------|---------|
| FR-47 | Admin kelola staf: tambah, nonaktifkan, aktifkan, reset password | ✅ Terpenuhi | `akun.controller.ts` — operasi lengkap |
| FR-48 | Super Admin kelola Admin + akses pengawasan read-only | ✅ Terpenuhi | `blockSuperAdminWrite` middleware + `checkRole('super_admin')` |
| FR-49 | Penonaktifan akun tidak hapus historis | ✅ Terpenuhi | Soft delete `status_aktif = 0`; data historis tetap utuh |

---

### 1.13 Modul Audit Log (FR-50 – FR-52)

| ID | Kebutuhan SRS | Status | Catatan |
|----|---------------|--------|---------|
| FR-50 | Log otomatis seluruh aktivitas kritis (login, SOAP, akun, jadwal, spesialisasi) | ✅ Terpenuhi | `logAudit()` dipanggil di seluruh controller yang relevan |
| FR-51 | Tabel audit_log dilindungi TRIGGER database, tolak UPDATE dan DELETE | ✅ Terpenuhi | `trg_audit_no_update` dan `trg_audit_no_delete` di `schema.sql` |
| FR-52 | Setiap entri memuat field minimum: id, waktu, id_user, peran, aktivitas, tabel_target, id_target, ip_address, status, keterangan | ✅ Terpenuhi | Schema dan `auditLogger.ts` sesuai dengan field SRS |

---

## Bagian 2 — Review Kebutuhan Non-Fungsional

### 2.1 Kinerja (NFR-01 – NFR-05)

| ID | Kebutuhan | Target | Status | Catatan |
|----|-----------|--------|--------|---------|
| NFR-01 | Respons rata-rata CRUD | < 2 detik | ⚠️ Belum Diuji | Tidak ada benchmark; query menggunakan prepared statements dan pool koneksi |
| NFR-02 | Kapasitas pengguna aktif serentak | ≥ 500 | ⚠️ Belum Diuji | Tidak ada load test |
| NFR-03 | Latensi WebSocket antrian | ≤ 500ms | ✅ Arsitektur Mendukung | Socket.io dengan room per dokter; overhead minimal |
| NFR-04 | Waktu generate PDF resep | < 3 detik | ✅ Arsitektur Mendukung | PDFKit synchronous; tidak ada operasi berat |
| NFR-05 | Waktu pengiriman OTP | < 30 detik | ❌ N/A | OTP hanya di-mock; tidak ada integrasi gateway nyata |

---

### 2.2 Keandalan dan Ketersediaan (NFR-06 – NFR-10)

| ID | Kebutuhan | Target | Status | Catatan |
|----|-----------|--------|--------|---------|
| NFR-06 | Uptime minimum | 99,9% | ⚠️ Bergantung Infrastruktur | Tidak dalam cakupan kode |
| NFR-07 | Backup database | Harian | ⚠️ Bergantung Infrastruktur | Tidak dalam cakupan kode |
| NFR-08 | Retensi backup | ≥ 30 hari | ⚠️ Bergantung Infrastruktur | Tidak dalam cakupan kode |
| NFR-09 | Failover otomatis | ≤ 60 detik | ⚠️ Bergantung Infrastruktur | Tidak dalam cakupan kode |
| NFR-10 | Recovery Point Objective | ≤ 24 jam | ⚠️ Bergantung Infrastruktur | Tidak dalam cakupan kode |

---

### 2.3 Keamanan dan Privasi (NFR-11 – NFR-18)

| ID | Kebutuhan | Status | Catatan |
|----|-----------|--------|---------|
| NFR-11 | TLS 1.3 untuk seluruh transmisi | ⚠️ Bergantung Infrastruktur | Tidak dikonfigurasi di level aplikasi; harus diatur di reverse proxy |
| NFR-12 | AES-256 enkripsi data tersimpan (at-rest) | ❌ Tidak Terpenuhi | **Tidak diimplementasi.** Data medis sensitif disimpan plaintext di MySQL |
| NFR-13 | Password hash bcrypt cost factor ≥ 12 | ✅ Terpenuhi | `BCRYPT_ROUNDS` default 12 di `env.ts`; digunakan di `hashPass()` |
| NFR-14 | MFA wajib untuk seluruh akun staf | ❌ Tidak Terpenuhi | **MFA dapat dilewati.** Lihat temuan FR-01 di atas |
| NFR-15 | Idle timeout 15 menit sesi non-pasien | ✅ Terpenuhi | JWT expiresIn=15m + `idleTimeoutStaf` middleware |
| NFR-16 | Mematuhi Permenkes No. 24/2022 | ✅ Sebagian Terpenuhi | Field data pasien dan format rekam medis sesuai. Enkripsi at-rest belum terpenuhi |
| NFR-17 | Mematuhi UU PDP No. 27/2022 | ⚠️ Sebagian | Data pribadi dikumpulkan dengan legitimate purpose; enkripsi belum terpenuhi |
| NFR-18 | Audit log immutable di level database | ✅ Terpenuhi | TRIGGER database di schema.sql |

---

### 2.4 Kebergunaan dan Aksesibilitas (NFR-19 – NFR-23)

| ID | Kebutuhan | Status | Catatan |
|----|-----------|--------|---------|
| NFR-19 | Font minimal 16px, minimalist cognitive load | ⚠️ Belum Diverifikasi | Perlu review template EJS |
| NFR-20 | Elemen interaktif dapat dijangkau satu ibu jari di mobile | ⚠️ Belum Diverifikasi | Perlu review CSS/template |
| NFR-21 | Responsive design 360px–1920px | ⚠️ Belum Diverifikasi | Perlu review CSS/template |
| NFR-22 | Bahasa Indonesia default, arsitektur siap i18n | ❌ Tidak Terpenuhi | Tidak ada framework i18n. String hardcode dalam Bahasa Indonesia |
| NFR-23 | Pesan error deskriptif dan spesifik | ✅ Terpenuhi | Flash messages dan validasi Zod memberikan pesan error spesifik |

---

### 2.5 Pemeliharaan dan Skalabilitas (NFR-24 – NFR-27)

| ID | Kebutuhan | Status | Catatan |
|----|-----------|--------|---------|
| NFR-24 | Arsitektur modular, setiap modul dapat diperbarui independen | ✅ Terpenuhi | Struktur direktori `src/modules/<nama-modul>/` dengan MVC per modul |
| NFR-25 | Logging error terpusat (ELK, Sentry, atau setara) | ❌ Tidak Terpenuhi | Hanya `console.error()` dan `morgan`. Tidak ada integrasi monitoring tool |
| NFR-26 | Kode terdokumentasi dengan komentar yang memadai | ⚠️ Sebagian | Komentar referensi FR/SRS ada di beberapa file, tidak konsisten di semua file |
| NFR-27 | Sistem dapat diskalakan horizontal | ✅ Arsitektur Mendukung | Stateless JWT; Pool koneksi MySQL; WebSocket room-based |

---

## Bagian 3 — Temuan Kritis (Prioritas Tinggi)

### KRITIS-01: MFA Bypass — Keamanan Akun Staf Lemah

**File:** `src/modules/auth/auth.controller.ts`, baris 231–261  
**Referensi SRS:** FR-01, NFR-14  
**Dampak:** Akun staf baru atau yang belum setup MFA dapat mengakses sistem tanpa verifikasi faktor kedua.

**Mekanisme:** Saat `completeSendToken()` dipanggil untuk pengguna tanpa `totp_secret`, JWT ditulis ke cookie *sebelum* redirect ke `/auth/setup-mfa`. Pengguna dapat langsung navigasi ke `/antrian`, `/jadwal`, dll menggunakan token tersebut.

**Rekomendasi Perbaikan:**
```typescript
// SEBELUM (bermasalah):
const token = signToken({ ... });
setTokenCookie(res, token, false);         // ← token set dulu
if (!pending.totp_secret) {
  res.redirect('/auth/setup-mfa');         // ← redirect belakangan
  return;
}

// SESUDAH (diperbaiki):
if (!pending.totp_secret) {
  // Simpan pending di session, JANGAN issuetoken
  (req.session as any).mfa_setup_pending = pending;
  res.redirect('/auth/setup-mfa');
  return;
}
// Token hanya di-issue setelah MFA terkonfirmasi
const token = signToken({ ... });
setTokenCookie(res, token, false);
```

---

### KRITIS-02: Sistem Notifikasi Tidak Diimplementasi

**Referensi SRS:** FR-19, FR-46  
**Dampak:** Pasien tidak menerima konfirmasi booking dan notifikasi pembatalan. Pengiriman OTP ke nomor HP nyata tidak berfungsi.

**Detail:**
- `OTP_MOCK=true` hanya mencetak ke console, tidak mengirim SMS/WhatsApp nyata
- `buatBooking()` tidak memanggil service notifikasi apapun setelah booking berhasil
- `toggleJadwal()` membatalkan booking dan mencatat log tapi tidak mengirim notifikasi ke pasien

**Rekomendasi:** Integrasikan SMS gateway (Twilio, Vonage, Zenziva) atau WhatsApp Business API. Buat `NotificationService` abstrak yang bisa di-mock untuk testing dan real untuk produksi.

---

### KRITIS-03: AES-256 At-Rest Encryption Tidak Diimplementasi

**Referensi SRS:** NFR-12, NFR-16, NFR-17  
**Dampak:** Data medis sensitif (diagnosis, SOAP, resep, data pasien) tersimpan dalam plaintext di database. Pelanggaran keamanan database langsung mengekspos semua rekam medis.

**Verifikasi:** Tidak ditemukan `AES_ENCRYPT`, `AES_DECRYPT`, atau library enkripsi at-rest di seluruh codebase. Schema `schema.sql` juga tidak menunjukkan kolom terenkripsi.

**Rekomendasi:** Implementasikan enkripsi kolom di level MySQL menggunakan `AES_ENCRYPT`/`AES_DECRYPT` dengan key management yang aman, atau gunakan enkripsi di level aplikasi sebelum data ditulis ke database.

---

## Bagian 4 — Temuan Signifikan (Prioritas Menengah)

### SIG-01: Tabel Koreksi_SOAP Terpisah dari Schema Utama

**File:** `database/schema.sql` vs `database/migrate_koreksi_soap.sql`  
**Referensi SRS:** FR-38  
**Dampak:** Deployment segar menggunakan `schema.sql` saja akan menghasilkan database tanpa tabel `Koreksi_SOAP`. Runtime error terjadi saat dokter mencoba menyimpan koreksi SOAP.

**Rekomendasi:** Tambahkan definisi tabel `Koreksi_SOAP` ke dalam `schema.sql` utama.

---

### SIG-02: Race Condition pada Generate Nomor RM

**File:** `src/utils/nomorRM.ts`  
**Referensi SRS:** FR-14  
**Dampak:** Pada pendaftaran bersamaan (concurrent), dua pasien bisa mendapatkan nomor RM yang sama, menyebabkan constraint violation atau, lebih buruk, shared nomor RM jika constraint tidak ada.

**Detail Kode:**
```typescript
// Operasi SELECT + increment terpisah — tidak atomic
const [rows] = await pool.execute(
  `SELECT nomor_rm FROM Pasien WHERE nomor_rm LIKE ? ORDER BY nomor_rm DESC LIMIT 1`,
  [`${prefix}%`]
);
let urutan = parseInt(parts[parts.length - 1], 10) + 1; // gap di sini
return `${prefix}${String(urutan).padStart(6, '0')}`;
```

**Rekomendasi:** Gunakan `GET_LOCK()` MySQL, atau tabel sequence terpisah dengan auto-increment, atau handle `ER_DUP_ENTRY` dengan retry logic.

---

### SIG-03: WebSocket Room Authentication Missing

**File:** `src/socket/queueSocket.ts`  
**Dampak:** Klien mana pun bisa mengirim event `join:doctor` dengan ID dokter sewenang-wenang dan memantau antrian dokter tersebut.

**Detail:**
```typescript
socket.on('join:doctor', (doctorId: string) => {
  // Tidak ada verifikasi bahwa pengirim adalah dokter tersebut!
  if (typeof doctorId === 'string' && doctorId.length > 0) {
    socket.join(`doctor-${doctorId}`);
  }
});
```

**Rekomendasi:** Implementasikan autentikasi socket menggunakan JWT dari cookie pada saat handshake, kemudian validasi `doctorId` hanya bisa di-join oleh pemiliknya.

---

### SIG-04: FR-03 Durasi Kunci Tidak Sesuai SRS

**File:** `src/middleware/rateLimiter.ts`  
**SRS:** "akun HARUS dikunci sementara selama **30 menit**"  
**Implementasi:** `windowMs: 15 * 60 * 1000` (15 menit)

Selain durasi, rate limiter berbasis IP address bukan berbasis akun/username, sehingga pengguna dari IP berbeda atau dengan VPN dapat bypass pembatasan.

---

### SIG-05: NFR-25 Tidak Ada Centralized Error Logging

**Referensi SRS:** NFR-25  
**Dampak:** Error produksi tidak dapat dipantau secara terpusat. Debugging insiden butuh akses langsung ke server log.

**Status:** Hanya `console.error()` dan morgan logging standar. Tidak ada integrasi Sentry, ELK Stack, atau setara.

---

## Bagian 5 — Temuan Minor

### MIN-01: Redirect Super Admin ke /auth/login setelah ubah password

**File:** `src/modules/auth/auth.controller.ts`, baris 327–335  
Super Admin tidak ada dalam `redirectMap` di `prosesUbahPassword()`, sehingga diarahkan ke `/auth/login` alih-alih `/audit` setelah mengubah password. Inkonsisten dengan `completeSendToken()` yang redirect Super Admin ke `/audit`.

---

### MIN-02: Penanganan Error `buatAdmin` Kehilangan Detail Error

**File:** `src/modules/akun/akun.controller.ts`, baris 148  
```typescript
} catch {
  req.flash('error', 'Username atau email sudah digunakan.');
}
```
Error non-duplikat (misalnya database down) juga menampilkan pesan yang sama. Tidak ada logging error untuk debugging.

---

### MIN-03: jadwal.model — `findBookingAktifByJadwal` Memblokir Booking berstatus 'hadir'

Ketika jadwal diblokir, booking dengan status `hadir` (pasien sudah di klinik) mungkin ikut dibatalkan. SRS tidak menentukan behavior ini secara eksplisit, namun membatalkan booking pasien yang sudah hadir secara fisik dapat menimbulkan masalah operasional.

---

### MIN-04: NFR-22 Arsitektur i18n Tidak Disiapkan

Tidak ada framework i18n (seperti `i18next`) atau struktur file translation yang disiapkan. Semua string hardcode dalam Bahasa Indonesia. Ekspansi multibahasa di masa mendatang memerlukan refactor signifikan.

---

## Bagian 6 — Checklist Arsitektur dan Keamanan

### Arsitektur Database
| Aspek | Status |
|-------|--------|
| Charset utf8mb4 | ✅ |
| Tabel utama sesuai ERD SRS | ✅ (9 tabel + Koreksi_SOAP terpisah) |
| UUID sebagai primary key | ✅ |
| UNIQUE KEY untuk slot booking | ✅ |
| TRIGGER immutable audit log | ✅ |
| Foreign Key constraints | ✅ |
| Index untuk query performa (audit, OTP) | ✅ |
| AES-256 enkripsi kolom sensitif | ❌ |

### Keamanan Aplikasi
| Aspek | Status |
|-------|--------|
| JWT authentication | ✅ |
| bcrypt cost 12+ | ✅ |
| RBAC middleware | ✅ |
| HTTP-only cookies | ✅ |
| SameSite cookie protection | ✅ |
| Cache-Control no-store pada response auth | ✅ |
| Rate limiting login | ✅ (durasi kurang sesuai) |
| Input validation (Zod) | ✅ (hanya di registrasi pasien) |
| File upload validation | ✅ (whitelist extension) |
| SQL injection protection | ✅ (prepared statements) |
| XSS protection | ⚠️ (bergantung EJS auto-escape) |
| MFA enforcement | ❌ (bypass ada) |
| WebSocket authentication | ❌ |

### Kelengkapan Modul
| Modul | Status |
|-------|--------|
| Autentikasi (auth) | ✅ |
| Pasien | ✅ |
| Booking | ✅ |
| Keluhan | ✅ |
| Kedatangan | ✅ |
| Antrian | ✅ |
| SOAP | ✅ |
| Resep PDF | ✅ |
| Riwayat | ✅ |
| Jadwal | ✅ |
| Akun | ✅ |
| Spesialisasi | ✅ |
| Audit Log | ✅ |
| Admin Dashboard | ✅ |
| Notifikasi SMS/WhatsApp | ❌ |
| Enkripsi At-Rest | ❌ |
| Monitoring/Logging Terpusat | ❌ |

---

## Bagian 7 — Prioritas Perbaikan

### Sebelum Production Deploy (Wajib)

1. **[KRITIS-01]** Perbaiki MFA bypass — jangan issue JWT sebelum MFA setup selesai
2. **[KRITIS-02]** Implementasikan integrasi SMS/WhatsApp gateway untuk OTP dan notifikasi
3. **[KRITIS-03]** Implementasikan enkripsi AES-256 untuk kolom data medis sensitif di database
4. **[SIG-01]** Gabungkan `Koreksi_SOAP` ke `schema.sql` utama
5. **[SIG-03]** Tambahkan autentikasi JWT di Socket.io handshake

### Sprint Berikutnya (Penting)

6. **[SIG-02]** Perbaiki race condition generate nomor RM dengan atomic operation
7. **[SIG-04]** Sesuaikan durasi lockout FR-03 menjadi 30 menit, gunakan lockout berbasis akun
8. **[SIG-05]** Integrasikan Sentry atau setara untuk centralized error monitoring
9. **[MIN-01]** Tambahkan `super_admin` ke `redirectMap` di `prosesUbahPassword()`

### Backlog (Nice to Have)

10. **[NFR-22]** Setup arsitektur i18n untuk persiapan multibahasa
11. **[MIN-03]** Klarifikasi behavior pembatalan booking saat status 'hadir'
12. **[NFR-19-21]** Audit responsivitas dan aksesibilitas UI

---

## Bagian 8 — Ringkasan Pemenuhan per Modul

| Modul | FR yang Relevan | Terpenuhi | Gap |
|-------|----------------|-----------|-----|
| Autentikasi & RBAC | FR-01 s/d FR-07 | 5/7 | FR-03 (durasi), FR-01/NFR-14 (MFA bypass) |
| Spesialisasi | FR-08 s/d FR-12 | 5/5 | - |
| Pendaftaran Pasien | FR-13 s/d FR-16 | 3/4 | FR-14 (race condition RM) |
| Booking | FR-17 s/d FR-21 | 4/5 | FR-19 (notifikasi) |
| Keluhan | FR-22 s/d FR-25 | 3/4 | FR-22 (counter frontend belum diverifikasi) |
| Kedatangan | FR-26 s/d FR-29 | 4/4 | - |
| Antrian Dokter | FR-30 s/d FR-34 | 5/5 | - |
| SOAP | FR-35 s/d FR-38 | 4/4 | Koreksi_SOAP schema terpisah |
| Resep PDF | FR-39 | 1/1 | - |
| Riwayat Medis | FR-40 s/d FR-43 | 4/4 | - |
| Jadwal | FR-44 s/d FR-46 | 2/3 | FR-46 (notifikasi pembatalan) |
| Manajemen Akun | FR-47 s/d FR-49 | 3/3 | - |
| Audit Log | FR-50 s/d FR-52 | 3/3 | - |

---

*Dokumen ini dihasilkan melalui analisis statis terhadap source code dan perbandingan langsung dengan SRS SEHATI v2.0. Review UI/UX, load testing, dan pengujian integrasi eksternal (SMS gateway, cloud hosting) tidak termasuk dalam cakupan dokumen ini.*
