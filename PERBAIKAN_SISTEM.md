# Daftar Perbaikan Sistem SEHATI

> Dokumen ini berisi daftar perbaikan yang perlu diimplementasikan pada sistem SEHATI.
> Setiap item mencantumkan file yang perlu diubah, logika yang diharapkan, dan contoh kode jika diperlukan.

---

## PERBAIKAN 1 — Rate Limiter Login Tidak Sesuai SRS

**File:** `src/middleware/rateLimiter.ts`

**Masalah:**
Konfigurasi rate limiter saat ini menggunakan window 30 menit dengan maksimal 10 percobaan. SRS (FR-03) mensyaratkan maksimal 5 percobaan gagal dalam 15 menit, kemudian akun dikunci selama 30 menit.

**Yang harus dilakukan:**
Ubah konfigurasi `loginLimiter` agar:
- `windowMs` = 15 menit (bukan 30 menit)
- `max` = 5 (bukan 10)
- Window tetap 30 menit untuk masa kunci (gunakan dua limiter berbeda: satu untuk mendeteksi, satu untuk mengunci)

**Kode saat ini:**
```typescript
export const loginLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  ...
});
```

**Target konfigurasi (FR-03):**
- Maksimal 5 percobaan gagal dalam window 15 menit
- Setelah melampaui batas, akun dikunci selama 30 menit
- Pesan error: "Terlalu banyak percobaan login gagal. Coba lagi dalam 30 menit."

---

## PERBAIKAN 2 — Fitur Ubah Password Sendiri untuk Staf

**File yang perlu dibuat/diubah:**
- `src/modules/auth/auth.controller.ts` — tambah method `showUbahPassword` dan `prosesUbahPassword`
- `src/modules/auth/auth.model.ts` — tambah method `findUserById` dan `updatePassword`
- `src/modules/auth/auth.routes.ts` — tambah route GET dan POST `/auth/ubah-password`
- `src/views/auth/ubah-password.ejs` — buat halaman form baru
- Setiap layout navbar staf — tambah link menu "Ubah Password"

**Masalah:**
Tidak ada menu atau halaman bagi staf (dokter, perawat, resepsionis, admin) untuk mengubah password mereka sendiri. SRS FR-06 mewajibkan fitur ini.

**Logika yang diharapkan:**
1. Staf yang sudah login mengakses halaman `/auth/ubah-password`
2. Form menampilkan 3 field: password lama, password baru, konfirmasi password baru
3. Sistem memverifikasi password lama menggunakan `bcrypt.compare`
4. Jika cocok, hash password baru dengan bcrypt (rounds = 12) dan simpan ke database
5. Catat aktivitas ke `audit_log` dengan `aktivitas = 'UBAH_PASSWORD_SENDIRI'`
6. Tampilkan pesan sukses dan redirect ke dashboard sesuai peran

**Validasi wajib:**
- Password lama harus cocok dengan hash di database
- Password baru minimal 8 karakter
- Konfirmasi password harus sama dengan password baru
- Password baru tidak boleh sama dengan password lama

---

## PERBAIKAN 3 — Fitur Reschedule (Jadwal Ulang) Booking

**File yang perlu diubah:**
- `src/modules/booking/booking.controller.ts` — tambah method `rescheduleBooking`
- `src/modules/booking/booking.model.ts` — tambah query update slot booking
- `src/modules/booking/booking.routes.ts` — tambah route POST `/booking/:id/reschedule`
- `src/views/pasien/dashboard.ejs` — tambah tombol "Jadwalkan Ulang" di samping tombol "Batalkan"

**Masalah:**
SRS FR-21 menyebutkan pasien HARUS dapat "membatalkan atau menjadwalkan ulang booking paling lambat H-1". Saat ini hanya pembatalan yang tersedia.

**Logika yang diharapkan:**
1. Tombol "Jadwalkan Ulang" muncul di dashboard pasien untuk booking berstatus `booked`
2. Batas waktu reschedule sama dengan batal: maksimal H-1 sebelum jadwal asal
3. Alur reschedule:
   - Tampilkan form pilih tanggal/dokter/slot baru (sama seperti form booking baru)
   - Saat konfirmasi: UPDATE `Kunjungan` dengan `tanggal`, `slot_jam`, `id_jadwal` baru
   - Slot lama dibebaskan (UNIQUE KEY pada kombinasi id_dokter+tanggal+slot_jam)
   - Log ke `audit_log` dengan `aktivitas = 'RESCHEDULE_BOOKING'`
4. Validasi: slot baru tidak boleh sudah terbooked oleh pasien lain

---

## PERBAIKAN 4 — Mekanisme Koreksi/Addendum pada Catatan SOAP

**File yang perlu dibuat/diubah:**
- `database/migrate.sql` — tambah tabel baru `Koreksi_SOAP`
- `src/modules/soap/soap.controller.ts` — tambah method `showFormKoreksi` dan `simpanKoreksi`
- `src/modules/soap/soap.model.ts` — tambah query insert dan find koreksi
- `src/modules/soap/soap.routes.ts` — tambah route GET dan POST `/soap/:kunjunganId/koreksi`
- `src/views/dokter/soap.ejs` — tambah section koreksi di bawah SOAP yang sudah terkunci

**Masalah:**
SRS FR-38 menyebutkan: *"Koreksi hanya dapat dilakukan dengan menambahkan catatan koreksi yang terdokumentasi; data lama tidak dapat ditimpa."*
Saat ini SOAP terkunci total tanpa mekanisme addendum.

**Skema tabel baru yang perlu dibuat:**
```sql
CREATE TABLE Koreksi_SOAP (
  id           VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  id_soap      VARCHAR(36)  NOT NULL,
  id_dokter    VARCHAR(36)  NOT NULL,
  catatan      TEXT         NOT NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_soap)   REFERENCES Catatan_SOAP(id),
  FOREIGN KEY (id_dokter) REFERENCES Users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**Logika yang diharapkan:**
1. Di halaman SOAP yang sudah tersimpan (status = selesai), tampilkan tombol "Tambah Catatan Koreksi"
2. Hanya dokter pemilik kunjungan yang bisa menambah koreksi
3. Form koreksi: textarea untuk `catatan` (wajib isi, min 10 karakter)
4. Setelah disimpan, koreksi ditampilkan di bawah SOAP asli dengan label "Catatan Koreksi" + nama dokter + waktu
5. Log ke `audit_log` dengan `aktivitas = 'TAMBAH_KOREKSI_SOAP'`
6. Koreksi bersifat append-only (tidak bisa diedit/hapus)

---

## PERBAIKAN 5 — Auto-Cancel Booking & Notifikasi Saat Jadwal Diblokir

**File yang perlu diubah:**
- `src/modules/jadwal/jadwal.controller.ts` — method `toggleJadwal`
- `src/modules/jadwal/jadwal.model.ts` — tambah query UPDATE status booking terdampak

**Masalah:**
SRS FR-46 menyebutkan saat jadwal dinonaktifkan, booking aktif pada jadwal tersebut harus otomatis dibatalkan dan pasien mendapat notifikasi. Saat ini hanya ada `console.log` mock.

**Logika yang diharapkan:**
Di dalam `toggleJadwal()`, ketika `newStatus = 0` (nonaktif):
1. Ambil semua kunjungan dengan `status = 'booked'` dan `id_jadwal = id` yang jadwalnya belum lewat
2. UPDATE semua kunjungan tersebut menjadi `status = 'batal'`
3. Log setiap pembatalan ke `audit_log` dengan `aktivitas = 'BATAL_OTOMATIS_JADWAL_DIBLOKIR'`
4. Untuk notifikasi (sementara): tampilkan daftar pasien terdampak sebagai flash message ke admin, dengan nama dan nomor HP mereka, agar admin bisa menghubungi secara manual
5. Jika sudah ada SMS/WhatsApp gateway (dari Perbaikan 6): kirim notifikasi otomatis

---

## PERBAIKAN 6 — Integrasi SMS/WhatsApp Gateway (Notifikasi OTP & Booking)

**File yang perlu dibuat/diubah:**
- `src/utils/notifikasi.ts` — buat file baru untuk service notifikasi
- `src/utils/otp.ts` — panggil `kirimNotifikasi()` setelah OTP dibuat
- `src/modules/booking/booking.controller.ts` — panggil notifikasi setelah booking berhasil
- `.env.example` — tambah variabel baru untuk konfigurasi gateway
- `src/config/env.ts` — tambah variabel baru

**Masalah:**
OTP hanya disimpan ke database dan ditampilkan di layar (mock). Tidak ada pengiriman SMS/WhatsApp nyata. SRS FR-01, FR-19, FR-46 semua bergantung pada notifikasi ini.

**Variabel environment baru yang diperlukan:**
```env
# Pilih salah satu provider
NOTIF_PROVIDER=fonnte          # fonnte | wablas | twilio | mock
NOTIF_API_KEY=your_api_key_here
NOTIF_SENDER=628xxxx            # Nomor pengirim WhatsApp

# Atau untuk SMS
SMS_PROVIDER=zenziva            # zenziva | twilio | mock
SMS_API_KEY=your_api_key_here
SMS_API_SECRET=your_secret_here
```

**Struktur `src/utils/notifikasi.ts` yang perlu dibuat:**
```typescript
export async function kirimOTP(nomorHp: string, kode: string): Promise<void>
export async function kirimKonfirmasiBooking(nomorHp: string, data: BookingData): Promise<void>
export async function kirimNotifikasiPembatalan(nomorHp: string, data: BookingData): Promise<void>
```

**Pesan konfirmasi booking (isi teks):**
```
Halo [nama_pasien], booking Anda di SEHATI berhasil!
Dokter: [nama_dokter] ([spesialisasi])
Tanggal: [tanggal] pukul [slot_jam]
Silakan isi keluhan Anda di: [link_keluhan]
Nomor RM: [nomor_rm]
```

**Pesan OTP:**
```
Kode OTP SEHATI Anda: [kode]. Berlaku 5 menit. Jangan bagikan ke siapapun.
```

---

## PERBAIKAN 7 — Super Admin Read-Only Access ke Dashboard Dokter & Resepsionis

**File yang perlu diubah:**
- `src/middleware/rbac.ts` — update checkRole untuk izinkan super_admin dengan read-only
- `src/modules/antrian/antrian.routes.ts` — izinkan super_admin akses GET
- `src/modules/kedatangan/kedatangan.routes.ts` — izinkan super_admin akses GET
- `src/views/dokter/antrian.ejs` — sembunyikan tombol aksi jika peran = super_admin
- `src/views/resepsionis/kedatangan.ejs` — sembunyikan tombol konfirmasi jika peran = super_admin

**Masalah:**
SRS FR-48: Super Admin harus memiliki "akses pengawasan read-only ke seluruh dashboard sistem". Saat ini Super Admin hanya bisa akses audit log dan overview.

**Logika yang diharapkan:**
1. Super Admin dapat mengakses `/antrian` (dashboard antrian dokter) — hanya view, tanpa bisa panggil/skip
2. Super Admin dapat mengakses `/kedatangan` (dashboard resepsionis) — hanya view, tanpa bisa konfirmasi
3. Di views, gunakan kondisi `<% if (user.peran !== 'super_admin') { %>` untuk menyembunyikan tombol aksi
4. Tambah banner/badge "Mode Pengawasan" di halaman yang diakses Super Admin

---

## CATATAN IMPLEMENTASI

### Urutan Pengerjaan yang Disarankan

Kerjakan dalam urutan berikut agar lebih efisien:

1. **Perbaikan 1** (Rate Limiter) — Perubahan 1 file, 5 menit
2. **Perbaikan 2** (Ubah Password Staf) — Perubahan 4 file + 1 file baru
3. **Perbaikan 5** (Auto-Cancel Booking) — Perubahan 2 file
4. **Perbaikan 7** (Super Admin Read-Only) — Perubahan 5 file
5. **Perbaikan 3** (Reschedule Booking) — Perubahan 4 file
6. **Perbaikan 4** (Koreksi SOAP) — Perubahan 5 file + 1 tabel baru
7. **Perbaikan 6** (SMS/WhatsApp) — Perubahan 5 file + 1 file baru (butuh akun provider)

### Hal yang TIDAK perlu diubah (sudah benar)

- Skema database (kecuali tabel `Koreksi_SOAP` untuk Perbaikan 4)
- Seluruh alur SOAP yang sudah ada
- Sistem OTP (kode generasi dan verifikasi sudah benar, hanya perlu ditambah pengiriman)
- Sistem audit log dan TRIGGER database
- Seluruh modul spesialisasi, riwayat, dan akun
- WebSocket / Socket.io untuk antrian real-time
- PDF generation untuk resep
- Struktur RBAC yang sudah ada
