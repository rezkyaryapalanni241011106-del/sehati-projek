-- ============================================================
-- SEHATI — Migration Script: data_sehati → db_sehati
-- Upgrade dari schema PHP lama ke schema Node.js v2.0
-- Jalankan hanya jika ingin mempertahankan data lama
-- ============================================================

-- LANGKAH 1: Buat database baru
CREATE DATABASE IF NOT EXISTS db_sehati
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE db_sehati;

-- LANGKAH 2: Jalankan schema.sql terlebih dahulu untuk tabel baru
-- SOURCE /path/to/schema.sql;

-- LANGKAH 3: Migrasi Spesialisasi
INSERT IGNORE INTO db_sehati.Spesialisasi (id, nama, status_aktif, created_at)
SELECT id, nama, status_aktif, created_at
FROM data_sehati.spesialisasi;

-- LANGKAH 4: Migrasi Users (tambah kolom totp_secret dengan NULL)
INSERT IGNORE INTO db_sehati.Users
  (id, username, password_hash, peran, nama_lengkap, email, nomor_hp,
   spesialisasi, nomor_str, totp_secret, status_aktif, dibuat_oleh, created_at)
SELECT
  id, username, password_hash, peran, nama_lengkap, email, nomor_hp,
  spesialisasi, nomor_str, NULL, status_aktif, dibuat_oleh, created_at
FROM data_sehati.users;

-- LANGKAH 5: Migrasi Pasien (tambah kolom baru dengan NULL)
INSERT IGNORE INTO db_sehati.Pasien
  (id, nomor_rm, nik, nama_lengkap, tanggal_lahir, jenis_kelamin, nomor_hp,
   alamat, pekerjaan, pendidikan, status_perkawinan, agama, golongan_darah,
   alergi, riwayat_kronis, nomor_paspor, nik_wali, created_at, updated_at)
SELECT
  id, nomor_rm, nik, nama_lengkap, tanggal_lahir, jenis_kelamin, nomor_hp,
  alamat, pekerjaan, pendidikan, status_perkawinan, agama, golongan_darah,
  alergi, riwayat_kronis, NULL, NULL, created_at, updated_at
FROM data_sehati.pasien;

-- LANGKAH 6: Migrasi ICD10
INSERT IGNORE INTO db_sehati.ICD10 (kode, deskripsi, kategori)
SELECT kode, deskripsi, kategori FROM data_sehati.icd10;

-- LANGKAH 7: Migrasi Jadwal_Praktek
INSERT IGNORE INTO db_sehati.Jadwal_Praktek
  (id, id_dokter, hari, jam_mulai, jam_selesai, durasi_menit, kuota, status_aktif, created_at)
SELECT
  id, id_dokter, hari, jam_mulai, jam_selesai, durasi_menit, kuota, status_aktif, created_at
FROM data_sehati.jadwal_praktek;

-- LANGKAH 8: Migrasi Kunjungan (tambah kolom alasan_skip dengan NULL)
INSERT IGNORE INTO db_sehati.Kunjungan
  (id, id_pasien, id_dokter, id_jadwal, tanggal, slot_jam, status,
   keluhan_awal, dikonfirmasi_oleh, waktu_konfirmasi, alasan_skip, created_at, updated_at)
SELECT
  id, id_pasien, id_dokter, id_jadwal, tanggal, slot_jam, status,
  keluhan_awal, dikonfirmasi_oleh, waktu_konfirmasi, NULL, created_at, updated_at
FROM data_sehati.kunjungan;

-- LANGKAH 9: Migrasi Catatan_SOAP (field baru = NULL)
INSERT IGNORE INTO db_sehati.Catatan_SOAP
  (id, id_kunjungan, subjektif, riwayat_penyakit_sekarang,
   td_sistolik, td_diastolik, nadi, suhu, frekuensi_napas, spo2,
   berat_badan, tinggi_badan, imt,
   pemeriksaan_fisik, hasil_penunjang, file_penunjang_url,
   kode_dx, kode_dx_banding,
   tindakan, anjuran, pemeriksaan_lanjutan, jadwal_kontrol, alasan_kontrol,
   created_at)
SELECT
  id, id_kunjungan, subjektif, NULL,
  td_sistolik, td_diastolik, nadi, suhu, NULL, NULL,
  berat_badan, tinggi_badan, NULL,
  pemeriksaan_fisik, NULL, NULL,
  kode_dx, NULL,
  tindakan, NULL, NULL, NULL, NULL,
  created_at
FROM data_sehati.catatan_soap;

-- LANGKAH 10: Migrasi Resep
INSERT IGNORE INTO db_sehati.Resep
  (id, id_soap, urutan, nama_obat, dosis, frekuensi, durasi, jumlah, cara_pakai, catatan, created_at)
SELECT
  id, id_soap, urutan, nama_obat, dosis, frekuensi, durasi, jumlah, cara_pakai, catatan, created_at
FROM data_sehati.resep;

-- LANGKAH 11: Migrasi Audit_Log
INSERT IGNORE INTO db_sehati.Audit_Log
  (id, waktu, id_user, peran_user, aktivitas, tabel_target, id_target, ip_address, status, keterangan)
SELECT
  id, waktu, id_user, peran_user, aktivitas, tabel_target, id_target, ip_address, status, keterangan
FROM data_sehati.audit_log;

-- LANGKAH 12: Verifikasi
SELECT 'Spesialisasi' AS tabel, COUNT(*) AS total FROM db_sehati.Spesialisasi
UNION ALL SELECT 'Users', COUNT(*) FROM db_sehati.Users
UNION ALL SELECT 'Pasien', COUNT(*) FROM db_sehati.Pasien
UNION ALL SELECT 'Jadwal_Praktek', COUNT(*) FROM db_sehati.Jadwal_Praktek
UNION ALL SELECT 'Kunjungan', COUNT(*) FROM db_sehati.Kunjungan
UNION ALL SELECT 'Catatan_SOAP', COUNT(*) FROM db_sehati.Catatan_SOAP
UNION ALL SELECT 'Resep', COUNT(*) FROM db_sehati.Resep
UNION ALL SELECT 'Audit_Log', COUNT(*) FROM db_sehati.Audit_Log;
