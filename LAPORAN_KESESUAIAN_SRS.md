# Laporan Kesesuaian Sistem SEHATI terhadap SRS

> Tanggal Audit: 09 Juni 2026  
> Versi Aplikasi: 2.0.0  
> Auditor: Claude Code (Anthropic)  
> Referensi: SRS Sistem SEHATI v2026 (26 halaman)

---

## Daftar Isi

1. [Overview Arsitektur Sistem](#1-overview-arsitektur-sistem)
2. [Stack Teknologi](#2-stack-teknologi)
3. [Struktur Modul Aplikasi](#3-struktur-modul-aplikasi)
4. [Skema Database](#4-skema-database)
5. [Alur Operasional Sistem](#5-alur-operasional-sistem)
6. [Tabel Kesesuaian: Kebutuhan Fungsional (FR)](#6-tabel-kesesuaian-kebutuhan-fungsional-fr)
7. [Tabel Kesesuaian: Kebutuhan Non-Fungsional (NFR)](#7-tabel-kesesuaian-kebutuhan-non-fungsional-nfr)
8. [Fitur Belum Diimplementasikan (Gap Analysis)](#8-fitur-belum-diimplementasikan-gap-analysis)

---

## 1. Overview Arsitektur Sistem

SEHATI adalah sistem Rekam Medis Elektronik (RME) berbasis web yang dibangun menggunakan arsitektur **MVC (Model-View-Controller)** dengan Node.js. Sistem ini mengelola seluruh alur pelayanan rawat jalan mulai dari registrasi pasien, penjadwalan kunjungan, antrian real-time, dokumentasi klinis SOAP, hingga penerbitan resep elektronik PDF.

```
┌─────────────────────────────────────────────────────────────────┐
│                      SEHATI Web Application                     │
│                   (Node.js + TypeScript + EJS)                  │
├────────────┬─────────────────┬──────────────────────────────────┤
│  Browser   │   Express.js    │           MySQL 8.0+             │
│  (Client)  │   REST API      │           db_sehati              │
│            │   EJS Views     │   (10 tabel + 2 trigger)         │
│            │   Socket.io WS  │                                  │
└────────────┴─────────────────┴──────────────────────────────────┘
```

**Entry Points:**
- `src/server.ts` — HTTP server + Socket.io initialization
- `src/app.ts` — Express app, route mounting, middleware configuration

---

## 2. Stack Teknologi

| Komponen | Teknologi yang Digunakan |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express.js |
| View Engine | EJS (Embedded JavaScript Templates) |
| Database | MySQL 8.0+ (via `mysql2` pool) |
| Real-time | Socket.io (WebSocket) |
| Autentikasi Pasien | JWT + OTP (mock/database-only, belum SMS/WhatsApp) |
| Autentikasi Staf | JWT + bcrypt + TOTP (speakeasy + Google Authenticator) |
| PDF Generation | PDFKit |
| File Upload | Multer (PDF, JPG, PNG) |
| Validasi Input | Zod |
| Password Hashing | bcrypt (rounds = 12, sesuai NFR-13) |
| Logging | Winston + Morgan |
| Rate Limiting | express-rate-limit |
| QR Code | qrcode (untuk setup MFA) |
| Primary Key | UUID v4 |

---

## 3. Struktur Modul Aplikasi

Aplikasi terdiri dari **14 modul** yang masing-masing memiliki tiga file: `controller.ts`, `model.ts`, `routes.ts`.

```
src/
├── modules/
│   ├── auth/           — Login pasien (OTP) & staf (TOTP/MFA), setup MFA
│   ├── pasien/         — Registrasi mandiri, dashboard, profil pasien
│   ├── booking/        — Booking jadwal kunjungan, pembatalan H-1
│   ├── keluhan/        — Input & edit keluhan pra-konsultasi (max 500 karakter)
│   ├── kedatangan/     — Konfirmasi kedatangan oleh resepsionis/perawat
│   ├── antrian/        — Dashboard antrian dokter real-time, skip/standby
│   ├── soap/           — Formulir SOAP, validasi, simpan, upload penunjang
│   ├── resep/          — Generate & download PDF resep (dokter + pasien)
│   ├── riwayat/        — Riwayat medis pasien (view pasien & view dokter)
│   ├── jadwal/         — Manajemen jadwal praktek dokter (admin)
│   ├── akun/           — Manajemen akun staf (admin) & akun admin (superadmin)
│   ├── spesialisasi/   — Master data spesialisasi dokter (admin)
│   ├── auditLog/       — Tampilan audit log & overview sistem (superadmin)
│   └── admin/          — Ringkasan statistik (admin)
├── middleware/
│   ├── auth.ts         — JWT verify, setTokenCookie, checkRole
│   ├── rbac.ts         — Role-Based Access Control helper
│   ├── idleTimeout.ts  — Idle timeout 15 menit untuk sesi non-pasien
│   ├── rateLimiter.ts  — Rate limiter login & API
│   └── errorHandler.ts — Global error handling
├── socket/
│   └── queueSocket.ts  — Socket.io: join/leave doctor room, emitQueueUpdate
└── utils/
    ├── otp.ts          — Generate & verifikasi OTP (5 menit, one-time use)
    ├── pdf.ts          — Generate PDF resep dengan PDFKit
    ├── auditLogger.ts  — logAudit() helper untuk seluruh modul
    ├── nomorRM.ts      — Auto-generate Nomor RM format RM-YYYY-XXXXXX
    ├── imt.ts          — Kalkulasi IMT otomatis (BB/TB²)
    └── helpers.ts      — Utility: tanggalIndonesia, hitungUsia, formatJam, generateSlots
```

**View Templates (32 file EJS):**

| Folder | Halaman |
|---|---|
| `views/auth/` | pasien-login, pasien-verify-otp, staf-login, staf-verify-totp, setup-mfa |
| `views/pasien/` | dashboard, booking, keluhan, register, profil, riwayat, riwayat-detail |
| `views/dokter/` | antrian, soap, riwayat-pasien |
| `views/resepsionis/` | kedatangan |
| `views/admin/` | jadwal, akun-staf, spesialisasi, ringkasan |
| `views/superadmin/` | akun-admin, audit, overview |

---

## 4. Skema Database

Database `db_sehati` memiliki **10 tabel inti** + **2 database trigger** untuk proteksi immutabilitas Audit_Log.

| Tabel | Deskripsi | Catatan |
|---|---|---|
| `Spesialisasi` | Master data spesialisasi dokter | status_aktif, UNIQUE nama |
| `Users` | Seluruh pengguna staf (super_admin, admin, dokter, perawat, resepsionis) | totp_secret, self-reference FK |
| `Pasien` | Data pasien + Nomor RM | nomor_paspor, nik_wali untuk non-NIK |
| `OTP` | Kode OTP pasien | expired_at, digunakan (one-time) |
| `ICD10` | Kode diagnosis (FULLTEXT index) | Digunakan untuk searchable dropdown |
| `Jadwal_Praktek` | Jadwal praktek dokter | hari, jam_mulai, jam_selesai, durasi_menit, kuota |
| `Kunjungan` | Record kunjungan pasien | UNIQUE (id_dokter, tanggal, slot_jam), status: booked/hadir/selesai/batal/skip |
| `Catatan_SOAP` | Dokumentasi klinis SOAP | 1:1 dengan Kunjungan, kode_dx WAJIB |
| `Resep` | Item obat per SOAP | 1:N dengan Catatan_SOAP |
| `Audit_Log` | Jejak audit immutable | BIGINT AUTO_INCREMENT, dilindungi TRIGGER |

**Database Triggers (Proteksi Immutabilitas Audit_Log):**
```sql
-- Otomatis menolak UPDATE pada Audit_Log
trg_audit_no_update → SIGNAL SQLSTATE '45000'
-- Otomatis menolak DELETE pada Audit_Log  
trg_audit_no_delete → SIGNAL SQLSTATE '45000'
```

---

## 5. Alur Operasional Sistem

Sistem mengimplementasikan **5 fase** alur konsultasi sesuai SRS:

```
FASE 1: Registrasi & Login
  Pasien → Input Nomor HP → OTP (5 menit, mock) → 
  Jika baru: Formulir Register → Auto-generate RM-YYYY-XXXXXX
  Jika lama: Login langsung → Dashboard Pasien

FASE 2: Booking & Input Keluhan  
  Pasien → Pilih Tanggal → Pilih Spesialisasi/Dokter →
  Pilih Slot (UNIQUE KEY) → Konfirmasi Booking →
  Input Keluhan Pra-Konsultasi (max 500 karakter)

FASE 3: Kedatangan & Konfirmasi
  Resepsionis/Perawat → Dashboard Kedatangan →
  Verifikasi Identitas → 1 Klik Konfirmasi 'Hadir' →
  WebSocket → Pasien masuk antrian aktif dokter (FCFS)

FASE 4: Konsultasi & SOAP
  Dokter → Dashboard Antrian (real-time WebSocket) →
  Panggil Pasien (FCFS) atau Skip + Alasan →
  Buka Formulir SOAP (pre-fill dari keluhan_awal) →
  Isi S-O(opsional)-A(wajib ICD-10)-P(wajib ≥1 item) →
  Upload file penunjang PDF/JPG/PNG (opsional) →
  Simpan → SOAP Terkunci (immutable)

FASE 5: Pasca-Konsultasi
  Sistem → Generate PDF Resep (PDFKit) →
  Audit Log (immutable, dilindungi TRIGGER) →
  Pasien dapat akses riwayat & download PDF kapan saja
```

**Peran & Akses:**

| Peran | Autentikasi | Dashboard Utama |
|---|---|---|
| Pasien | OTP passwordless | Dashboard pasien, booking, keluhan, riwayat |
| Resepsionis | Username + Password + TOTP | Konfirmasi kedatangan |
| Perawat | Username + Password + TOTP | Konfirmasi kedatangan |
| Dokter | Username + Password + TOTP | Dashboard antrian, SOAP, riwayat pasien |
| Admin | Username + Password + TOTP | Jadwal, akun staf, spesialisasi, ringkasan |
| Super Admin | Username + Password + TOTP | Audit log, overview, manajemen akun admin |

---

## 6. Tabel Kesesuaian: Kebutuhan Fungsional (FR)

**Legenda:** ✅ Terimplementasi | ⚠️ Parsial/Berbeda dari SRS | ❌ Belum Ada

### 3.1.1 Modul Autentikasi dan RBAC

| ID | Kebutuhan SRS | Status | Keterangan Implementasi |
|---|---|---|---|
| FR-01 | Dua jalur login: Pasien (HP + OTP) dan Staf (username + password + MFA) | ✅ | `auth.controller.ts`: `requestOTPPasien()`, `loginStaf()`, `verifyTOTP()` |
| FR-02 | OTP berlaku 5 menit, one-time use | ✅ | `utils/otp.ts`: `expired_at` = NOW + 5 menit, flag `digunakan = 1` setelah dipakai |
| FR-03 | Maks 5 percobaan gagal dalam 15 menit → kunci 30 menit | ⚠️ | `rateLimiter.ts`: window 30 menit, max **10** percobaan. Tidak sesuai SRS (SRS: 5 dalam 15 menit) |
| FR-04 | Idle timeout 15 menit untuk sesi staf | ✅ | `middleware/idleTimeout.ts`: `IDLE_MS = 15 * 60 * 1000`, redirect ke `/auth/login?reason=idle` |
| FR-05 | RBAC ketat per peran | ✅ | `middleware/auth.ts` + `rbac.ts`: checkRole() untuk setiap route |
| FR-06 | Staf dapat mengubah password sendiri via menu profil | ❌ | **Tidak ada.** Hanya admin yang bisa reset password. Tidak ada halaman profil staf dengan fitur ubah password |
| FR-07 | Log semua percobaan login (sukses & gagal) ke audit log | ✅ | `logAudit()` dipanggil di setiap percabangan login, berisi status sukses/gagal |

### 3.1.2 Modul Master Data Spesialisasi

| ID | Kebutuhan SRS | Status | Keterangan Implementasi |
|---|---|---|---|
| FR-08 | Modul manajemen spesialisasi oleh Admin | ✅ | `modules/spesialisasi/`: list, tambah, toggle aktif/nonaktif, hapus |
| FR-09 | Admin dapat tambah, nonaktifkan, aktifkan kembali | ✅ | `toggleSpesialisasi()`: toggle `status_aktif` |
| FR-10 | Nama spesialisasi unik | ✅ | UNIQUE KEY di tabel + tangkap `ER_DUP_ENTRY` dengan pesan error jelas |
| FR-11 | Spesialisasi aktif tersedia saat daftar dokter dan booking | ✅ | `findSpesialisasiAktif()` dipakai di booking dan akun controller |
| FR-12 | Nonaktifkan spesialisasi tidak menghapus data dokter | ✅ | `isUsedByDokter()` mencegah hapus jika masih dipakai; toggle hanya ubah flag |

### 3.1.3 Modul Pendaftaran Pasien dan Manajemen RME

| ID | Kebutuhan SRS | Status | Keterangan Implementasi |
|---|---|---|---|
| FR-13 | Formulir registrasi dengan field wajib sesuai Permenkes 24/2022 | ✅ | `pasien.controller.ts`: zod schema validasi NIK, nama, tgl_lahir, jenis_kelamin, nomor_hp, alamat + field sosial |
| FR-14 | Validasi NIK unik, auto-generate Nomor RM | ✅ | Cek `findByNik()` + `generateNomorRM()` format RM-YYYY-XXXXXX |
| FR-15 | Identitas alternatif untuk non-NIK | ✅ | Field `nomor_paspor` dan `nik_wali` di skema DB + validasi di controller |
| FR-16 | Pasien dapat update profil; NIK tidak bisa diubah | ✅ | `updateProfil()`: update alamat, nomor_hp, field opsional. NIK tidak ada di form update |

### 3.1.4 Modul Penjadwalan dan Booking Kunjungan

| ID | Kebutuhan SRS | Status | Keterangan Implementasi |
|---|---|---|---|
| FR-17 | Tampilkan ketersediaan slot berdasarkan jadwal admin | ✅ | `getSlots()`: generate slot dari `jadwal_praktek`, filter slot yang sudah terbooked |
| FR-18 | Alur booking: tanggal → spesialisasi/dokter → slot → konfirmasi | ✅ | `showBookingForm()` → `getDokterList()` → `getSlots()` → `buatBooking()` |
| FR-19 | Notifikasi konfirmasi booking via SMS/WhatsApp | ❌ | **Tidak terimplementasi.** OTP adalah mock (console.log). Tidak ada SMS Gateway atau WhatsApp Business API |
| FR-20 | Slot terkunci otomatis setelah dipesan | ✅ | UNIQUE KEY `(id_dokter, tanggal, slot_jam)` + tangkap `ER_DUP_ENTRY` |
| FR-21 | Pasien dapat membatalkan booking maks H-1 | ⚠️ | Pembatalan (batal) ✅. **Penjadwalan ulang (reschedule) tidak ada** |

### 3.1.5 Modul Input Keluhan Pra-Konsultasi

| ID | Kebutuhan SRS | Status | Keterangan Implementasi |
|---|---|---|---|
| FR-22 | Formulir keluhan maks 500 karakter, counter real-time | ⚠️ | Validasi server-side 500 karakter ✅. Character counter real-time perlu diverifikasi di client-side (EJS) |
| FR-23 | Keluhan bisa diisi/diedit selama status = booked | ✅ | `updateKeluhan()`: cek `kunjungan.status !== 'booked'` → tolak |
| FR-24 | Kolom keluhan auto read-only setelah status = hadir | ✅ | Status check di controller, form read-only ditampilkan saat status ≠ booked |
| FR-25 | Keluhan pre-fill di field Subjektif SOAP | ✅ | `findKunjunganDokter()` mengembalikan `keluhan_awal`, di-render ke form SOAP |

### 3.1.6 Modul Konfirmasi Kedatangan

| ID | Kebutuhan SRS | Status | Keterangan Implementasi |
|---|---|---|---|
| FR-26 | Dashboard tampilkan pasien terjadwal hari ini | ✅ | `findKunjunganHarian(tanggal)`: semua status booked untuk hari ini |
| FR-27 | Satu klik konfirmasi kehadiran | ✅ | `konfirmasiHadir()`: JSON endpoint, satu POST request |
| FR-28 | Real-time WebSocket update ke antrian dokter setelah konfirmasi | ✅ | `emitQueueUpdate(io, k.id_dokter, 'add', {...})` via Socket.io |
| FR-29 | Catat ID staf yang konfirmasi dan timestamp | ✅ | `dikonfirmasi_oleh = userId`, `waktu_konfirmasi = CURRENT_TIMESTAMP` |

### 3.1.7 Modul Dashboard Dokter dan Manajemen Antrian

| ID | Kebutuhan SRS | Status | Keterangan Implementasi |
|---|---|---|---|
| FR-30 | Grid antrian real-time via WebSocket, FCFS | ✅ | `queueSocket.ts`: room `doctor-{id}`, sorted by `waktu_konfirmasi` ASC |
| FR-31 | Tampilkan: nama pasien, nomor RM, usia, waktu konfirmasi, ringkasan keluhan | ✅ | `findAntrianAktif()` mengembalikan semua field ini |
| FR-32 | Tombol 'Panggil' membuka formulir rekam medis | ✅ | Redirect ke `/soap/:kunjunganId` |
| FR-33 | Skip dengan wajib isi alasan, masuk standby | ✅ | `skipPasien()`: validasi `alasan_skip`, set status = 'skip' |
| FR-34 | Pisahkan tampilan antrian aktif dan standby | ✅ | `findAntrianAktif()` (status=hadir) dan `findStandby()` (status=skip) terpisah |

### 3.1.8 Modul Dokumentasi SOAP

| ID | Kebutuhan SRS | Status | Keterangan Implementasi |
|---|---|---|---|
| FR-35 | Formulir SOAP lengkap dengan auto-fill (tgl/waktu, nama dokter, STR, nomor urut) | ✅ | `showSoap()` mengirim `kunjungan` + `soap` + `obatHistory` ke view |
| FR-36 | Validasi wajib: kode_dx + (≥1 resep ATAU tindakan ATAU anjuran) | ✅ | `simpanSoap()`: cek `body.kode_dx` + `resepItems.length === 0 && !tindakan && !anjuran` |
| FR-37 | Seluruh field Objektif bersifat opsional | ✅ | Field O tidak divalidasi; NULL di database diperbolehkan |
| FR-38 | SOAP terkunci setelah simpan; koreksi via catatan koreksi | ⚠️ | SOAP terkunci ✅. **Mekanisme catatan koreksi tidak ada**. Tidak bisa menambahkan addendum/koreksi terdokumentasi |
| FR-39 | Generate PDF resep dengan semua elemen standar | ✅ | `utils/pdf.ts`: kop klinik, identitas pasien, identitas dokter + STR, tanggal, tabel obat, area tanda tangan |

### 3.1.9 Modul Riwayat Medis Pasien

| ID | Kebutuhan SRS | Status | Keterangan Implementasi |
|---|---|---|---|
| FR-40 | Dokter akses riwayat lengkap pasien aktif, kronologis terbalik | ✅ | `riwayatDokter()`: `findKunjunganLengkap()` ORDER BY tanggal DESC |
| FR-41 | Halaman 'Riwayat Saya' pasien: read-only, dengan diagnosis, resep, anjuran | ✅ | `views/pasien/riwayat.ejs` + `riwayat-detail.ejs` |
| FR-42 | Pasien tidak bisa mengubah/menghapus rekam medis | ✅ | Tidak ada route POST/PATCH/DELETE untuk data medis dari sisi pasien |
| FR-43 | Pasien download resep PDF dari kunjungan manapun | ✅ | `downloadResepPDFPasien()`: verifikasi kepemilikan (`verifySoapMilikPasien()`) sebelum generate PDF |

### 3.1.10 Modul Manajemen Jadwal Dokter

| ID | Kebutuhan SRS | Status | Keterangan Implementasi |
|---|---|---|---|
| FR-44 | Admin tambah/edit/nonaktifkan jadwal dengan semua field | ✅ | `buatJadwal()`, `updateJadwal()`, `toggleJadwal()` dengan field lengkap |
| FR-45 | Generate slot kalender otomatis berdasarkan parameter jadwal | ✅ | `utils/helpers.ts: generateSlots(jam_mulai, jam_selesai, durasi_menit)` |
| FR-46 | Blokir tanggal → nonaktifkan semua slot; notifikasi ke pasien terdampak | ⚠️ | Jadwal bisa dinonaktifkan ✅. **Notifikasi SMS/WA ke pasien terdampak hanya console.log mock** |

### 3.1.11 Modul Manajemen Akun Pengguna

| ID | Kebutuhan SRS | Status | Keterangan Implementasi |
|---|---|---|---|
| FR-47 | Admin: tambah, nonaktifkan, aktifkan kembali, reset password akun staf | ✅ | `buatStaf()`, `toggleStaf()`, `resetPassword()` + `updateStaf()` |
| FR-48 | Super Admin: kelola akun Admin, akses read-only semua dashboard | ⚠️ | Kelola akun Admin ✅. **Akses read-only ke semua dashboard** (antrian dokter, kedatangan resepsionis) belum eksplisit dikonfigurasi untuk Super Admin |
| FR-49 | Nonaktifkan akun tidak menghapus data historis | ✅ | `toggleStaf()`: hanya set `status_aktif = 0`, tidak ada DELETE |

### 3.1.12 Modul Jejak Audit (Audit Log)

| ID | Kebutuhan SRS | Status | Keterangan Implementasi |
|---|---|---|---|
| FR-50 | Log otomatis semua aktivitas kritis | ✅ | `logAudit()` dipanggil di: login, booking, keluhan, kedatangan, SOAP, akun, jadwal, spesialisasi |
| FR-51 | TRIGGER database tolak UPDATE dan DELETE pada audit_log | ✅ | `schema.sql`: `trg_audit_no_update` + `trg_audit_no_delete` dengan SIGNAL SQLSTATE '45000' |
| FR-52 | Field minimum audit log: id, waktu, id_user, peran_user, aktivitas, tabel_target, id_target, ip_address, status, keterangan | ✅ | Semua field ada di tabel `Audit_Log` |

---

## 7. Tabel Kesesuaian: Kebutuhan Non-Fungsional (NFR)

**Legenda:** ✅ Sesuai | ⚠️ Parsial | ❌ Belum Ada | 🔵 Deployment (bergantung infrastruktur)

### 3.2.1 Kinerja dan Waktu Respons

| ID | Kebutuhan | Status | Catatan |
|---|---|---|---|
| NFR-01 | Respons CRUD < 2 detik | ⚠️ | MySQL2 connection pool digunakan. Belum ada load testing. Lokal (Laragon) tidak representatif |
| NFR-02 | Min 500 pengguna aktif serentak | ⚠️ | Socket.io dan Express terskalakan, tapi belum ada stress test |
| NFR-03 | Latensi WebSocket antrian ≤ 500 ms | ⚠️ | Socket.io digunakan. Latensi aktual bergantung pada jaringan dan server. Belum diukur |
| NFR-04 | Generate PDF < 3 detik | ⚠️ | PDFKit bersifat sinkronus. Perlu diukur dengan data nyata |
| NFR-05 | OTP terkirim < 30 detik | ❌ | OTP hanya di database (mock), tidak ada pengiriman SMS/WhatsApp aktual |

### 3.2.2 Keandalan dan Ketersediaan

| ID | Kebutuhan | Status | Catatan |
|---|---|---|---|
| NFR-06 | Uptime minimal 99,9% per tahun | 🔵 | Bergantung infrastruktur hosting (belum di-deploy ke cloud) |
| NFR-07 | Backup database otomatis harian | 🔵 | Bergantung konfigurasi server (belum di-deploy) |
| NFR-08 | Retensi backup minimum 30 hari | 🔵 | Bergantung konfigurasi server |
| NFR-09 | Failover otomatis ≤ 60 detik | 🔵 | Bergantung infrastruktur cloud hosting |
| NFR-10 | RPO maksimal 24 jam | 🔵 | Bergantung konfigurasi backup |

### 3.2.3 Keamanan dan Privasi Data

| ID | Kebutuhan | Status | Catatan |
|---|---|---|---|
| NFR-11 | Transmisi data dengan TLS 1.3 | 🔵 | Bergantung konfigurasi web server (Nginx/Apache) di produksi |
| NFR-12 | Data tersimpan dienkripsi AES-256 | 🔵 | MySQL encryption at-rest bergantung konfigurasi hosting. Tidak diimplementasikan di level aplikasi |
| NFR-13 | Password hash bcrypt cost factor ≥ 12 | ✅ | `env.ts`: `BCRYPT_ROUNDS = 12` (default). Argon2 belum dipertimbangkan sebagai alternatif |
| NFR-14 | MFA wajib untuk semua akun staf | ✅ | `verifyTOTP()`: jika `totp_secret` belum ada, redirect ke `/auth/setup-mfa` |
| NFR-15 | Idle timeout 15 menit sesi non-pasien | ✅ | `middleware/idleTimeout.ts`: `IDLE_MS = 15 * 60 * 1000` |
| NFR-16 | Mematuhi Permenkes No. 24 Tahun 2022 | ⚠️ | Field RME sudah sesuai struktur. Compliance penuh bergantung kebijakan operasional |
| NFR-17 | Mematuhi UU No. 27 Tahun 2022 (UU PDP) | ⚠️ | Tidak ada consent management, privasi notice, atau mekanisme hak subjek data eksplisit |
| NFR-18 | Audit log dilindungi TRIGGER database | ✅ | `schema.sql`: dua trigger BEFORE UPDATE dan BEFORE DELETE yang menolak operasi |

### 3.2.4 Kebergunaan dan Aksesibilitas

| ID | Kebutuhan | Status | Catatan |
|---|---|---|---|
| NFR-19 | UI pasien: minimalist cognitive load, font min 16px | ⚠️ | CSS tersedia (`patient.css`). Perlu audit UI langsung untuk memverifikasi ukuran font |
| NFR-20 | Elemen interaktif bisa dijangkau satu ibu jari (mobile) | ⚠️ | Perlu uji coba di perangkat mobile nyata |
| NFR-21 | Responsive: desktop (≥1024px), tablet (768-1023px), smartphone (360-767px) | ⚠️ | CSS framework `sehati.css` + `base.css` tersedia. Perlu audit responsivitas |
| NFR-22 | Bahasa Indonesia default, siap i18n | ⚠️ | Bahasa Indonesia sudah ✅. **Arsitektur i18n (framework/library) tidak diimplementasikan** |
| NFR-23 | Formulir tampilkan pesan error deskriptif | ✅ | Flash messages digunakan di seluruh controller, Zod error messages spesifik |

### 3.2.5 Pemeliharaan dan Skalabilitas

| ID | Kebutuhan | Status | Catatan |
|---|---|---|---|
| NFR-24 | Arsitektur modular, setiap modul bisa diperbarui independen | ✅ | 14 modul terpisah dengan controller/model/routes sendiri |
| NFR-25 | Logging error terpusat (ELK Stack, Sentry, atau setara) | ⚠️ | Winston + Morgan tersedia di dependencies. **Integrasi ELK/Sentry belum dikonfigurasi** |
| NFR-26 | Kode sumber terdokumentasi dengan komentar | ⚠️ | Komentar fungsional ada (referensi FR-xx di kode). Tidak ada JSDoc/TSDoc lengkap |
| NFR-27 | Skalabilitas horizontal tanpa perubahan arsitektur | ⚠️ | Stateless JWT + MySQL pool mendukung horizontal scaling. Session Express belum menggunakan shared store (Redis) |

---

## 8. Fitur Belum Diimplementasikan (Gap Analysis)

Berikut adalah daftar kebutuhan dari SRS yang **belum atau belum sepenuhnya diimplementasikan**, diurutkan dari prioritas tertinggi:

---

### GAP-01 — Notifikasi SMS/WhatsApp (KRITIS)
**Referensi SRS:** FR-19, FR-46, FR-02 (implisit)  
**Status:** ❌ Belum Ada

OTP untuk login pasien saat ini hanya di-generate dan disimpan ke database, kemudian ditampilkan langsung di halaman web (mock mode via `OTP_MOCK=true`). Tidak ada integrasi dengan:
- SMS Gateway (Twilio, Nexmo, Zenziva, atau penyedia lokal)
- WhatsApp Business API (Meta, atau penyedia lokal seperti Wablas, Fonnte)

Dampak:
- Pasien tidak bisa login dari perangkat sendiri jika OTP tidak dikirim
- Konfirmasi booking tidak terkirim ke pasien
- Notifikasi pembatalan jadwal tidak terkirim ke pasien terdampak

**Yang harus dilakukan:**
```
1. Integrasikan SMS/WhatsApp gateway di utils/otp.ts
2. Kirim notifikasi booking di booking.controller.ts setelah buatBooking() berhasil
3. Kirim notifikasi pembatalan di jadwal.controller.ts saat toggleJadwal() menonaktifkan jadwal
4. Set OTP_MOCK=false di environment production
```

---

### GAP-02 — Mekanisme Koreksi/Addendum SOAP (PENTING)
**Referensi SRS:** FR-38  
**Status:** ❌ Belum Ada

SRS menyebutkan: *"Koreksi hanya dapat dilakukan dengan menambahkan catatan koreksi yang terdokumentasi; data lama tidak dapat ditimpa."*

Implementasi saat ini: SOAP terkunci sepenuhnya setelah disimpan, tanpa mekanisme addendum.

**Yang harus dilakukan:**
```
1. Tambah tabel Koreksi_SOAP (id, id_soap, id_dokter, catatan_koreksi, created_at)
2. Tambah tombol "Tambah Koreksi" di halaman SOAP yang sudah tersimpan (status=selesai)
3. Tampilkan riwayat koreksi di bawah catatan SOAP asli (read-only)
4. Log setiap penambahan koreksi ke audit_log
```

---

### GAP-03 — Fitur Ubah Password Sendiri untuk Staf (PENTING)
**Referensi SRS:** FR-06  
**Status:** ❌ Belum Ada

Tidak ada halaman/menu profil untuk staf (dokter, perawat, resepsionis, admin) mengubah password mereka sendiri. Saat ini hanya admin/super admin yang bisa reset password.

**Yang harus dilakukan:**
```
1. Tambah halaman profil staf (/profil atau /akun/profil)
2. Form ubah password: password lama + password baru + konfirmasi
3. Validasi: cek password lama dengan bcrypt.compare sebelum set yang baru
4. Log ke audit_log dengan aktivitas 'UBAH_PASSWORD_SENDIRI'
```

---

### GAP-04 — Reschedule (Penjadwalan Ulang) Booking (PENTING)
**Referensi SRS:** FR-21  
**Status:** ❌ Belum Ada (hanya pembatalan yang ada)

SRS menyebutkan: *"Pasien HARUS dapat membatalkan atau menjadwalkan ulang booking paling lambat H-1."*

Saat ini hanya fitur pembatalan yang diimplementasikan.

**Yang harus dilakukan:**
```
1. Tambah route/endpoint reschedule di booking.controller.ts
2. Alur: Batal booking lama → Buat booking baru (tidak melebihi H-1 batas waktu asal)
3. Atau: Tampilkan form reschedule yang merujuk booking yang ada
```

---

### GAP-05 — Konfigurasi Rate Limiter Tidak Sesuai SRS (MEDIUM)
**Referensi SRS:** FR-03  
**Status:** ⚠️ Berbeda dari Spesifikasi

Konfigurasi di `middleware/rateLimiter.ts`:
```typescript
// AKTUAL:
windowMs: 30 * 60 * 1000,  // window 30 menit
max: 10,                    // maks 10 percobaan
```
**SRS mensyaratkan:** maksimal 5 percobaan gagal dalam **15 menit**, lalu kunci **30 menit**.

**Yang harus dilakukan:**
```typescript
// Ubah ke:
windowMs: 15 * 60 * 1000,  // window 15 menit
max: 5,                     // maks 5 percobaan
```

---

### GAP-06 — Super Admin Read-Only Access ke Semua Dashboard (MEDIUM)
**Referensi SRS:** FR-48  
**Status:** ⚠️ Parsial

Super Admin saat ini memiliki akses ke audit log dan overview. SRS menyebutkan *"akses pengawasan read-only ke seluruh dashboard sistem"* termasuk dashboard antrian dokter dan kedatangan resepsionis.

**Yang harus dilakukan:**
```
1. Tambah role check: super_admin dapat akses /antrian, /kedatangan, /admin/* dalam mode read-only
2. Sembunyikan tombol aksi (konfirmasi, skip, dll.) ketika peran = super_admin
```

---

### GAP-07 — Auto-Cancel Booking Saat Jadwal Diblokir (MEDIUM)
**Referensi SRS:** FR-46  
**Status:** ⚠️ Parsial (notifikasi hanya mock)

Saat admin menonaktifkan jadwal, kode saat ini hanya `console.log` untuk setiap booking terdampak. Booking yang ada tidak otomatis dibatalkan, dan tidak ada notifikasi ke pasien.

**Yang harus dilakukan:**
```
1. Di toggleJadwal(): jika newStatus=0, UPDATE Kunjungan SET status='batal' WHERE status='booked' AND id_jadwal=id
2. Kirim notifikasi SMS/WhatsApp ke setiap pasien yang terdampak (bergantung GAP-01)
3. Log pembatalan otomatis ke audit_log
```

---

### GAP-08 — Arsitektur i18n (RENDAH)
**Referensi SRS:** NFR-22  
**Status:** ❌ Belum Ada

SRS mensyaratkan *"arsitektur siap ekspansi multibahasa (i18n)."* Saat ini seluruh teks hard-coded dalam Bahasa Indonesia.

**Yang harus dilakukan:**
```
1. Adopsi library i18n: i18next, i18n-node, atau setara
2. Ekstrak seluruh teks UI ke file JSON locales/id.json
3. Siapkan struktur locales/en.json untuk masa depan
```

---

### GAP-09 — Centralized Error Monitoring (RENDAH)
**Referensi SRS:** NFR-25  
**Status:** ⚠️ Parsial

Winston dan Morgan sudah ada sebagai dependencies dan kemungkinan dikonfigurasi, namun tidak ada integrasi eksplisit ke ELK Stack, Sentry, atau layanan monitoring eksternal.

**Yang harus dilakukan:**
```
1. Konfigurasi Sentry (atau setara) di server.ts / errorHandler.ts
2. Atau konfigurasi transport Winston ke file log + rotasi
```

---

### GAP-10 — Shared Session Store untuk Skalabilitas Horizontal (RENDAH)
**Referensi SRS:** NFR-27  
**Status:** ⚠️ Parsial

`express-session` saat ini menggunakan in-memory store. Jika di-deploy ke beberapa instance (horizontal scaling), sesi akan hilang.

**Yang harus dilakukan:**
```
1. Tambah connect-redis atau express-mysql-session sebagai session store
2. Konfigurasi SESSION_STORE di env.ts
```

---

### GAP-11 — Infrastruktur: Enkripsi, Backup, Failover (DEPLOYMENT)
**Referensi SRS:** NFR-06 s/d NFR-12, NFR-11

Semua kebutuhan infrastruktur berikut bergantung pada konfigurasi cloud hosting yang belum dilakukan:

| Kebutuhan | Keterangan |
|---|---|
| TLS 1.3 | Konfigurasi Nginx/Apache + Let's Encrypt atau sertifikat berbayar |
| AES-256 at-rest | MySQL InnoDB encryption atau enkripsi disk level OS |
| Backup harian | Cron job mysqldump + retensi 30 hari |
| Replica standby | MySQL replication (master-slave) |
| Failover otomatis | Load balancer + health check |
| Cloud hosting ISO 27001 | Deploy ke AWS/GCP/Azure atau penyedia lokal tersertifikasi |

> Aplikasi saat ini berjalan di **Laragon (localhost)** yang merupakan lingkungan development. Belum ada konfigurasi untuk lingkungan produksi.

---

## Ringkasan Eksekutif

| Kategori | Total FR | Terimplementasi ✅ | Parsial ⚠️ | Belum ❌ |
|---|---|---|---|---|
| Autentikasi & RBAC | 7 | 5 | 1 | 1 |
| Master Spesialisasi | 5 | 5 | 0 | 0 |
| Registrasi Pasien | 4 | 4 | 0 | 0 |
| Booking & Jadwal | 5 | 3 | 1 | 1 |
| Keluhan Pra-Konsultasi | 4 | 3 | 1 | 0 |
| Konfirmasi Kedatangan | 4 | 4 | 0 | 0 |
| Dashboard Antrian | 5 | 5 | 0 | 0 |
| Dokumentasi SOAP | 5 | 4 | 1 | 0 |
| Riwayat Medis | 4 | 4 | 0 | 0 |
| Manajemen Jadwal | 3 | 2 | 1 | 0 |
| Manajemen Akun | 3 | 2 | 1 | 0 |
| Audit Log | 3 | 3 | 0 | 0 |
| **TOTAL** | **52** | **44 (85%)** | **6 (11%)** | **2 (4%)** |

| Kategori | Total NFR | Sesuai ✅ | Parsial ⚠️ | Belum ❌ | Deployment 🔵 |
|---|---|---|---|---|---|
| Kinerja | 5 | 0 | 3 | 1 | 1 |
| Keandalan | 5 | 0 | 0 | 0 | 5 |
| Keamanan & Privasi | 8 | 3 | 2 | 0 | 3 |
| Kebergunaan | 5 | 1 | 3 | 0 | 0 |
| Pemeliharaan | 4 | 1 | 3 | 0 | 0 |
| **TOTAL** | **27** | **5 (19%)** | **11 (41%)** | **1 (4%)** | **9 (33%)** |

**Kesimpulan:** Dari 52 kebutuhan fungsional SRS, **85% sudah terimplementasikan** dengan baik. Sistem sudah memiliki alur inti yang fungsional dan layak diuji. Gap utama yang paling berdampak untuk produksi adalah **integrasi SMS/WhatsApp** (GAP-01), **mekanisme koreksi SOAP** (GAP-02), dan **fitur ubah password staf** (GAP-03). Sebagian besar kebutuhan non-fungsional yang belum terpenuhi bersifat **deployment-level** dan akan terpenuhi saat sistem dimigrasi ke cloud hosting produksi.
