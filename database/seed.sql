-- ============================================================
-- SEHATI — Seed Data v2.0
-- Jalankan SETELAH schema.sql
-- Password semua akun staf: "password123" (bcrypt cost 12)
-- TOTP secret dicetak ke console saat seed via seeder.ts
-- ============================================================

USE db_sehati;

SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM Resep;
DELETE FROM Catatan_SOAP;
DELETE FROM Kunjungan;
DELETE FROM OTP;
DELETE FROM Jadwal_Praktek;
DELETE FROM Pasien;
DELETE FROM Users;
DELETE FROM Spesialisasi;
DELETE FROM ICD10;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- SPESIALISASI
-- ============================================================
INSERT INTO Spesialisasi (id, nama) VALUES
  ('sp-umum-0001-0000-000000000001', 'Umum'),
  ('sp-anak-0001-0000-000000000002', 'Anak'),
  ('sp-gigi-0001-0000-000000000003', 'Gigi'),
  ('sp-dala-0001-0000-000000000004', 'Penyakit Dalam'),
  ('sp-kand-0001-0000-000000000005', 'Kandungan');

-- ============================================================
-- USERS (password_hash = bcrypt('password123', 12))
-- Hash di-generate via seeder.ts dan dimasukkan di sini sebagai placeholder
-- Jalankan: npm run seed  untuk mendapat hash yang benar
-- ============================================================
-- Super Admin
INSERT INTO Users (id, username, password_hash, peran, nama_lengkap, email, status_aktif) VALUES
  ('usr-sa01-0000-0000-000000000001', 'superadmin', '$2b$12$PLACEHOLDER_SUPER_ADMIN___________', 'super_admin', 'Syahrul Hidayat', 'superadmin@sehati.id', 1);

-- Admin
INSERT INTO Users (id, username, password_hash, peran, nama_lengkap, email, dibuat_oleh, status_aktif) VALUES
  ('usr-adm1-0000-0000-000000000002', 'admin', '$2b$12$PLACEHOLDER_ADMIN_________________', 'admin', 'Putri Andini', 'admin@sehati.id', 'usr-sa01-0000-0000-000000000001', 1);

-- Dokter Umum
INSERT INTO Users (id, username, password_hash, peran, nama_lengkap, email, spesialisasi, nomor_str, dibuat_oleh, status_aktif) VALUES
  ('usr-dr01-0000-0000-000000000003', 'dr.budi', '$2b$12$PLACEHOLDER_DOKTER_BUDI___________', 'dokter', 'Dr. Budi Santoso', 'budi@sehati.id', 'sp-umum-0001-0000-000000000001', 'STR-001-2024', 'usr-adm1-0000-0000-000000000002', 1);

-- Dokter Anak
INSERT INTO Users (id, username, password_hash, peran, nama_lengkap, email, spesialisasi, nomor_str, dibuat_oleh, status_aktif) VALUES
  ('usr-dr02-0000-0000-000000000004', 'dr.sari', '$2b$12$PLACEHOLDER_DOKTER_SARI___________', 'dokter', 'Dr. Sari Dewi, Sp.A', 'sari@sehati.id', 'sp-anak-0001-0000-000000000002', 'STR-002-2024', 'usr-adm1-0000-0000-000000000002', 1);

-- Perawat
INSERT INTO Users (id, username, password_hash, peran, nama_lengkap, email, dibuat_oleh, status_aktif) VALUES
  ('usr-per1-0000-0000-000000000005', 'ns.rina', '$2b$12$PLACEHOLDER_PERAWAT_______________', 'perawat', 'Ns. Rina Pratiwi', 'rina@sehati.id', 'usr-adm1-0000-0000-000000000002', 1);

-- Resepsionis
INSERT INTO Users (id, username, password_hash, peran, nama_lengkap, email, dibuat_oleh, status_aktif) VALUES
  ('usr-res1-0000-0000-000000000006', 'resepsionis', '$2b$12$PLACEHOLDER_RESEPSIONIS___________', 'resepsionis', 'Dewi Lestari', 'dewi@sehati.id', 'usr-adm1-0000-0000-000000000002', 1);

-- ============================================================
-- JADWAL PRAKTEK
-- ============================================================
INSERT INTO Jadwal_Praktek (id, id_dokter, hari, jam_mulai, jam_selesai, durasi_menit, kuota) VALUES
  (UUID(), 'usr-dr01-0000-0000-000000000003', 'Senin',  '08:00:00', '12:00:00', 15, 16),
  (UUID(), 'usr-dr01-0000-0000-000000000003', 'Rabu',   '08:00:00', '12:00:00', 15, 16),
  (UUID(), 'usr-dr01-0000-0000-000000000003', 'Jumat',  '08:00:00', '12:00:00', 15, 16),
  (UUID(), 'usr-dr02-0000-0000-000000000004', 'Selasa', '09:00:00', '13:00:00', 20, 12),
  (UUID(), 'usr-dr02-0000-0000-000000000004', 'Kamis',  '09:00:00', '13:00:00', 20, 12),
  (UUID(), 'usr-dr02-0000-0000-000000000004', 'Sabtu',  '08:00:00', '11:00:00', 20,  9);

-- ============================================================
-- ICD-10 — 50 Penyakit Umum Indonesia
-- ============================================================
INSERT INTO ICD10 (kode, deskripsi, kategori) VALUES
  ('A09',   'Diare dan gastroenteritis akibat penyebab menular dan tidak jelas', 'Penyakit Infeksi'),
  ('A15',   'Tuberkulosis paru', 'Penyakit Infeksi'),
  ('A36',   'Difteri', 'Penyakit Infeksi'),
  ('A90',   'Demam dengue (dengue fever)', 'Penyakit Infeksi'),
  ('A91',   'Demam berdarah dengue (dengue hemorrhagic fever)', 'Penyakit Infeksi'),
  ('B05',   'Campak', 'Penyakit Infeksi'),
  ('B15',   'Hepatitis A akut', 'Penyakit Infeksi'),
  ('B34.9', 'Infeksi virus tanpa spesifikasi', 'Penyakit Infeksi'),
  ('B50',   'Malaria akibat Plasmodium falciparum', 'Penyakit Infeksi'),
  ('B99',   'Penyakit menular lainnya dan tidak terspesifikasi', 'Penyakit Infeksi'),
  ('E10',   'Diabetes mellitus tipe 1', 'Penyakit Metabolik'),
  ('E11',   'Diabetes mellitus tipe 2', 'Penyakit Metabolik'),
  ('E14',   'Diabetes mellitus tanpa spesifikasi', 'Penyakit Metabolik'),
  ('E66',   'Obesitas', 'Penyakit Metabolik'),
  ('E78',   'Gangguan metabolisme lipoprotein dan lipidemia lain', 'Penyakit Metabolik'),
  ('F32',   'Episode depresif', 'Gangguan Mental'),
  ('F41',   'Gangguan ansietas lainnya', 'Gangguan Mental'),
  ('G43',   'Migrain', 'Penyakit Saraf'),
  ('G44',   'Sindrom sakit kepala lainnya', 'Penyakit Saraf'),
  ('H10',   'Konjungtivitis', 'Penyakit Mata'),
  ('H66',   'Otitis media supuratif dan tanpa spesifikasi', 'Penyakit Telinga'),
  ('I10',   'Hipertensi esensial (primer)', 'Penyakit Kardiovaskular'),
  ('I20',   'Angina pektoris', 'Penyakit Kardiovaskular'),
  ('I25',   'Penyakit jantung iskemik kronis', 'Penyakit Kardiovaskular'),
  ('I50',   'Gagal jantung', 'Penyakit Kardiovaskular'),
  ('J00',   'Nasofaringitis akut (common cold)', 'Penyakit Saluran Napas'),
  ('J02',   'Faringitis akut', 'Penyakit Saluran Napas'),
  ('J03',   'Tonsilitis akut', 'Penyakit Saluran Napas'),
  ('J06',   'Infeksi saluran napas atas akut tidak spesifik', 'Penyakit Saluran Napas'),
  ('J11',   'Influenza akibat virus tidak teridentifikasi', 'Penyakit Saluran Napas'),
  ('J18',   'Pneumonia tanpa spesifikasi organisme', 'Penyakit Saluran Napas'),
  ('J20',   'Bronkitis akut', 'Penyakit Saluran Napas'),
  ('J45',   'Asma', 'Penyakit Saluran Napas'),
  ('K04',   'Penyakit pulpa dan periapikal', 'Penyakit Gigi'),
  ('K05',   'Gingivitis dan penyakit periodontal', 'Penyakit Gigi'),
  ('K21',   'Penyakit refluks gastroesofageal', 'Penyakit Pencernaan'),
  ('K25',   'Ulkus gaster', 'Penyakit Pencernaan'),
  ('K29',   'Gastritis dan duodenitis', 'Penyakit Pencernaan'),
  ('K35',   'Apendisitis akut', 'Penyakit Pencernaan'),
  ('K40',   'Hernia inguinal', 'Penyakit Pencernaan'),
  ('L20',   'Dermatitis atopik', 'Penyakit Kulit'),
  ('L50',   'Urtikaria', 'Penyakit Kulit'),
  ('M54',   'Nyeri punggung', 'Penyakit Muskuloskeletal'),
  ('M79',   'Gangguan jaringan lunak lainnya', 'Penyakit Muskuloskeletal'),
  ('N39',   'Gangguan saluran kemih lainnya', 'Penyakit Urologi'),
  ('O20',   'Perdarahan pada awal kehamilan', 'Kehamilan & Persalinan'),
  ('R05',   'Batuk', 'Gejala Umum'),
  ('R50',   'Demam tanpa penyebab yang diketahui', 'Gejala Umum'),
  ('R51',   'Sakit kepala', 'Gejala Umum'),
  ('Z00',   'Pemeriksaan umum dan pengkajian pada orang sehat', 'Kunjungan Preventif');
