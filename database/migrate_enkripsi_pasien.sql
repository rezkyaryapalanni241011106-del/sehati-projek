-- ============================================================
-- Migrasi: Enkripsi data sensitif pasien
-- Jalankan SEKALI pada database yang sudah ada (sebelum ada data baru)
-- Setelah ini, jalankan: npx ts-node database/migrate_enkripsi_data.ts
-- ============================================================

-- PENTING: Hapus index lama dulu sebelum mengubah tipe kolom ke TEXT
-- (MySQL tidak mengizinkan UNIQUE index pada kolom TEXT tanpa key length)

-- 1. Hapus index lama pada kolom yang akan dienkripsi
ALTER TABLE Pasien
  DROP INDEX IF EXISTS idx_pasien_nik,
  DROP INDEX IF EXISTS uq_pasien_nomor_hp;

-- 2. Tambah kolom hash untuk pencarian (menggantikan UNIQUE constraint lama)
ALTER TABLE Pasien
  ADD COLUMN IF NOT EXISTS nik_hash      VARCHAR(64) NULL AFTER nik,
  ADD COLUMN IF NOT EXISTS nomor_hp_hash VARCHAR(64) NULL AFTER nomor_hp;

-- 3. Ubah tipe kolom yang akan dienkripsi menjadi TEXT
--    (ciphertext lebih panjang dari panjang plaintext asli)
ALTER TABLE Pasien
  MODIFY COLUMN nik          TEXT NULL,
  MODIFY COLUMN nik_wali     TEXT NULL,
  MODIFY COLUMN nomor_paspor TEXT NULL,
  MODIFY COLUMN nomor_hp     TEXT NOT NULL,
  MODIFY COLUMN alamat       TEXT NOT NULL;

-- 4. Tambah UNIQUE constraint pada kolom hash
ALTER TABLE Pasien
  ADD UNIQUE KEY IF NOT EXISTS uq_nik_hash      (nik_hash),
  ADD UNIQUE KEY IF NOT EXISTS uq_nomor_hp_hash (nomor_hp_hash);

-- ============================================================
-- SETELAH INI: Jalankan script enkripsi data lama
--   npx ts-node database/migrate_enkripsi_data.ts
--
-- Script tersebut akan mengenkripsi nomor_hp, nik, nik_wali,
-- nomor_paspor, dan alamat semua pasien yang sudah ada,
-- serta mengisi kolom nik_hash dan nomor_hp_hash.
-- ============================================================
