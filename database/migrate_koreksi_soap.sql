-- Migrasi: Tambah tabel Koreksi_SOAP untuk fitur addendum catatan SOAP (FR-38)
-- Jalankan sekali di database: mysql -u root -p sehati < database/migrate_koreksi_soap.sql

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
