-- ============================================================
-- SEHATI — Schema Database v2.0
-- Sesuai SRS ERD Section 4.3
-- Jalankan dalam urutan ini untuk menghindari FK constraint error
-- ============================================================

CREATE DATABASE IF NOT EXISTS db_sehati
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE db_sehati;

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. SPESIALISASI
-- ============================================================
CREATE TABLE IF NOT EXISTS Spesialisasi (
  id           VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  nama         VARCHAR(100) NOT NULL UNIQUE,
  status_aktif TINYINT(1)   NOT NULL DEFAULT 1,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 2. USERS (Staf: super_admin, admin, dokter, perawat, resepsionis)
-- ============================================================
CREATE TABLE IF NOT EXISTS Users (
  id            VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  username      VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  peran         ENUM('super_admin','admin','dokter','perawat','resepsionis') NOT NULL,
  nama_lengkap  VARCHAR(200) NOT NULL,
  email         VARCHAR(150) UNIQUE,
  nomor_hp      VARCHAR(20),
  spesialisasi  VARCHAR(36),
  nomor_str     VARCHAR(100),
  totp_secret   VARCHAR(100),
  status_aktif  TINYINT(1)   NOT NULL DEFAULT 1,
  dibuat_oleh   VARCHAR(36),
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (spesialisasi) REFERENCES Spesialisasi(id) ON UPDATE CASCADE,
  FOREIGN KEY (dibuat_oleh)  REFERENCES Users(id) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 3. PASIEN
-- ============================================================
CREATE TABLE IF NOT EXISTS Pasien (
  id                VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  nomor_rm          VARCHAR(20)  NOT NULL UNIQUE,
  nik               TEXT         NULL,
  nik_hash          VARCHAR(64)  NULL UNIQUE,
  nama_lengkap      VARCHAR(200) NOT NULL,
  tanggal_lahir     DATE         NOT NULL,
  jenis_kelamin     ENUM('L','P') NOT NULL,
  nomor_hp          TEXT         NOT NULL,
  nomor_hp_hash     VARCHAR(64)  NOT NULL UNIQUE,
  alamat            TEXT         NOT NULL,
  pekerjaan         VARCHAR(100),
  pendidikan        VARCHAR(100),
  status_perkawinan VARCHAR(50),
  agama             VARCHAR(50),
  golongan_darah    ENUM('A','B','AB','O','A+','A-','B+','B-','AB+','AB-','O+','O-'),
  alergi            TEXT,
  riwayat_kronis    TEXT,
  nomor_paspor      TEXT         NULL,
  nik_wali          TEXT         NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 4. OTP (untuk pasien login)
-- ============================================================
CREATE TABLE IF NOT EXISTS OTP (
  id         VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  nomor_hp   VARCHAR(20)  NOT NULL,
  kode       VARCHAR(6)   NOT NULL,
  expired_at DATETIME     NOT NULL,
  digunakan  TINYINT(1)   NOT NULL DEFAULT 0,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_otp_hp (nomor_hp),
  INDEX idx_otp_expired (expired_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 4b. OTP_Attempt (rate limiting per-nomor HP)
-- ============================================================
CREATE TABLE IF NOT EXISTS OTP_Attempt (
  id         VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  nomor_hp   VARCHAR(20)  NOT NULL,
  jenis      ENUM('request','verify') NOT NULL,
  sukses     TINYINT(1)   NOT NULL DEFAULT 0,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_attempt_hp_waktu (nomor_hp, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 5. ICD10
-- ============================================================
CREATE TABLE IF NOT EXISTS ICD10 (
  kode       VARCHAR(10)  PRIMARY KEY,
  deskripsi  VARCHAR(500) NOT NULL,
  kategori   VARCHAR(200),
  FULLTEXT KEY ft_icd10_deskripsi (deskripsi)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 6. JADWAL_PRAKTEK
-- ============================================================
CREATE TABLE IF NOT EXISTS Jadwal_Praktek (
  id           VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  id_dokter    VARCHAR(36) NOT NULL,
  hari         ENUM('Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu') NOT NULL,
  jam_mulai    TIME        NOT NULL,
  jam_selesai  TIME        NOT NULL,
  durasi_menit INT         NOT NULL DEFAULT 15,
  kuota        INT         NOT NULL DEFAULT 20,
  status_aktif TINYINT(1)  NOT NULL DEFAULT 1,
  created_at   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_dokter) REFERENCES Users(id) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 7. KUNJUNGAN
-- ============================================================
CREATE TABLE IF NOT EXISTS Kunjungan (
  id                VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  id_pasien         VARCHAR(36) NOT NULL,
  id_dokter         VARCHAR(36) NOT NULL,
  id_jadwal         VARCHAR(36) NOT NULL,
  tanggal           DATE        NOT NULL,
  slot_jam          TIME        NOT NULL,
  status            ENUM('booked','hadir','selesai','batal','skip') NOT NULL DEFAULT 'booked',
  keluhan_awal      VARCHAR(500),
  dikonfirmasi_oleh VARCHAR(36),
  waktu_konfirmasi  DATETIME,
  alasan_skip       TEXT,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_slot (id_dokter, tanggal, slot_jam),
  FOREIGN KEY (id_pasien)         REFERENCES Pasien(id),
  FOREIGN KEY (id_dokter)         REFERENCES Users(id),
  FOREIGN KEY (id_jadwal)         REFERENCES Jadwal_Praktek(id),
  FOREIGN KEY (dikonfirmasi_oleh) REFERENCES Users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 8. CATATAN_SOAP
-- ============================================================
CREATE TABLE IF NOT EXISTS Catatan_SOAP (
  id                         VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  id_kunjungan               VARCHAR(36)  NOT NULL UNIQUE,
  -- S: Subjektif
  subjektif                  TEXT,
  riwayat_penyakit_sekarang  TEXT,
  -- O: Objektif
  td_sistolik                INT,
  td_diastolik               INT,
  nadi                       INT,
  suhu                       DECIMAL(4,1),
  frekuensi_napas            INT,
  spo2                       DECIMAL(4,1),
  berat_badan                DECIMAL(5,2),
  tinggi_badan               DECIMAL(5,2),
  imt                        DECIMAL(5,2),
  pemeriksaan_fisik          TEXT,
  hasil_penunjang            TEXT,
  file_penunjang_url         VARCHAR(500),
  -- A: Assessment
  kode_dx                    VARCHAR(10) NOT NULL,
  kode_dx_banding            TEXT,
  -- P: Plan
  tindakan                   TEXT,
  anjuran                    TEXT,
  pemeriksaan_lanjutan       TEXT,
  jadwal_kontrol             DATE,
  alasan_kontrol             TEXT,
  created_at                 DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_kunjungan) REFERENCES Kunjungan(id),
  FOREIGN KEY (kode_dx)      REFERENCES ICD10(kode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 9. RESEP
-- ============================================================
CREATE TABLE IF NOT EXISTS Resep (
  id         VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  id_soap    VARCHAR(36)  NOT NULL,
  urutan     INT          NOT NULL DEFAULT 1,
  nama_obat  VARCHAR(200) NOT NULL,
  dosis      VARCHAR(100),
  frekuensi  VARCHAR(100),
  durasi     VARCHAR(100),
  jumlah     INT,
  cara_pakai ENUM('oral','topikal','injeksi','inhalasi','lainnya') NOT NULL DEFAULT 'oral',
  catatan    TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_soap) REFERENCES Catatan_SOAP(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 10. AUDIT_LOG (immutable — hanya INSERT)
-- ============================================================
CREATE TABLE IF NOT EXISTS Audit_Log (
  id           BIGINT       AUTO_INCREMENT PRIMARY KEY,
  waktu        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  id_user      VARCHAR(36),
  peran_user   VARCHAR(50),
  aktivitas    VARCHAR(100) NOT NULL,
  tabel_target VARCHAR(100),
  id_target    VARCHAR(36),
  ip_address   VARCHAR(45),
  status       ENUM('sukses','gagal') NOT NULL,
  keterangan   TEXT,
  INDEX idx_audit_user (id_user),
  INDEX idx_audit_waktu (waktu)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 11. KOREKSI_SOAP (addendum rekam medis — FR-38)
-- ============================================================
CREATE TABLE IF NOT EXISTS Koreksi_SOAP (
  id           VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  id_soap      VARCHAR(36)  NOT NULL,
  id_dokter    VARCHAR(36)  NOT NULL,
  catatan      TEXT         NOT NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (id_soap)   REFERENCES Catatan_SOAP(id) ON DELETE CASCADE,
  FOREIGN KEY (id_dokter) REFERENCES Users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- TRIGGERS: Proteksi Audit_Log dari modifikasi
-- ============================================================
DROP TRIGGER IF EXISTS trg_audit_no_update;
DROP TRIGGER IF EXISTS trg_audit_no_delete;

DELIMITER //

CREATE TRIGGER trg_audit_no_update
BEFORE UPDATE ON Audit_Log FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Audit_Log bersifat immutable — UPDATE tidak diizinkan.';
END//

CREATE TRIGGER trg_audit_no_delete
BEFORE DELETE ON Audit_Log FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Audit_Log bersifat immutable — DELETE tidak diizinkan.';
END//

DELIMITER ;
