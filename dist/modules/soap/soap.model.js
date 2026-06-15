"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SoapModel = void 0;
const database_1 = require("../../config/database");
class SoapModel {
    async findKunjunganDokter(kunjunganId, dokterId) {
        const [rows] = await database_1.pool.execute(`SELECT k.id, k.status, k.keluhan_awal, k.tanggal,
              p.id AS pasien_id, p.nama_lengkap AS nama_pasien,
              p.nomor_rm, p.tanggal_lahir, p.alergi, p.riwayat_kronis,
              TIMESTAMPDIFF(YEAR, p.tanggal_lahir, CURDATE()) AS usia,
              p.jenis_kelamin,
              u.nama_lengkap AS nama_dokter, u.nomor_str,
              s.nama AS spesialisasi
       FROM Kunjungan k
       JOIN Pasien p ON k.id_pasien = p.id
       JOIN Users u ON k.id_dokter = u.id
       LEFT JOIN Spesialisasi s ON u.spesialisasi = s.id
       WHERE k.id = ? AND k.id_dokter = ? LIMIT 1`, [kunjunganId, dokterId]);
        return rows[0] ?? null;
    }
    async findSoap(kunjunganId) {
        const [rows] = await database_1.pool.execute(`SELECT cs.*, i.deskripsi AS dx_desc
       FROM Catatan_SOAP cs
       LEFT JOIN ICD10 i ON i.kode = cs.kode_dx
       WHERE cs.id_kunjungan = ? LIMIT 1`, [kunjunganId]);
        return rows[0] ?? null;
    }
    async findResepBySoapId(soapId) {
        const [rows] = await database_1.pool.execute('SELECT * FROM Resep WHERE id_soap = ? ORDER BY urutan', [soapId]);
        return rows;
    }
    async findRiwayatPasien(pasienId, excludeKunjunganId) {
        const [rows] = await database_1.pool.execute(`SELECT k.tanggal, cs.kode_dx, i.deskripsi AS dx_label,
              cs.tindakan, cs.anjuran
       FROM Kunjungan k
       JOIN Catatan_SOAP cs ON cs.id_kunjungan = k.id
       LEFT JOIN ICD10 i ON i.kode = cs.kode_dx
       WHERE k.id_pasien = ? AND k.id != ?
       ORDER BY k.tanggal DESC LIMIT 5`, [pasienId, excludeKunjunganId]);
        return rows;
    }
    async findObatHistory(dokterId) {
        const [rows] = await database_1.pool.execute(`SELECT DISTINCT nama_obat FROM Resep
       JOIN Catatan_SOAP cs ON cs.id = Resep.id_soap
       JOIN Kunjungan k ON k.id = cs.id_kunjungan
       WHERE k.id_dokter = ?
       ORDER BY nama_obat LIMIT 100`, [dokterId]);
        return rows.map((r) => r.nama_obat);
    }
    async findKunjunganStatus(kunjunganId, dokterId) {
        const [rows] = await database_1.pool.execute('SELECT id, status FROM Kunjungan WHERE id = ? AND id_dokter = ? LIMIT 1', [kunjunganId, dokterId]);
        return rows[0] ?? null;
    }
    async soapSudahAda(kunjunganId) {
        const [rows] = await database_1.pool.execute('SELECT id FROM Catatan_SOAP WHERE id_kunjungan = ? LIMIT 1', [kunjunganId]);
        return rows.length > 0;
    }
    async createSoap(soapId, kunjunganId, body, bb, tb, imt, fileUrl, kodeBanding) {
        await database_1.pool.execute(`INSERT INTO Catatan_SOAP
         (id, id_kunjungan,
          subjektif, riwayat_penyakit_sekarang,
          td_sistolik, td_diastolik, nadi, suhu, frekuensi_napas, spo2,
          berat_badan, tinggi_badan, imt,
          pemeriksaan_fisik, hasil_penunjang, file_penunjang_url,
          kode_dx, kode_dx_banding,
          tindakan, anjuran, pemeriksaan_lanjutan,
          jadwal_kontrol, alasan_kontrol)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
            soapId, kunjunganId,
            body.subjektif || null, body.riwayat_penyakit_sekarang || null,
            body.td_sistolik || null, body.td_diastolik || null,
            body.nadi || null, body.suhu || null,
            body.frekuensi_napas || null, body.spo2 || null,
            bb, tb, imt,
            body.pemeriksaan_fisik || null, body.hasil_penunjang || null, fileUrl,
            body.kode_dx, kodeBanding,
            body.tindakan || null, body.anjuran || null,
            body.pemeriksaan_lanjutan || null,
            body.jadwal_kontrol || null, body.alasan_kontrol || null,
        ]);
    }
    async createResep(soapId, urutan, item) {
        await database_1.pool.execute(`INSERT INTO Resep (id, id_soap, urutan, nama_obat, dosis, frekuensi, durasi, jumlah, cara_pakai, catatan)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [soapId, urutan, item.nama_obat, item.dosis, item.frekuensi, item.durasi, item.jumlah, item.cara_pakai, item.catatan]);
    }
    async setKunjunganSelesai(kunjunganId) {
        await database_1.pool.execute(`UPDATE Kunjungan SET status = 'selesai' WHERE id = ?`, [kunjunganId]);
    }
    async findKoreksiByKunjungan(kunjunganId) {
        const [rows] = await database_1.pool.execute(`SELECT ks.catatan, ks.created_at, u.nama_lengkap AS nama_dokter
       FROM Koreksi_SOAP ks
       JOIN Catatan_SOAP cs ON cs.id = ks.id_soap
       JOIN Users u ON u.id = ks.id_dokter
       WHERE cs.id_kunjungan = ?
       ORDER BY ks.created_at ASC`, [kunjunganId]);
        return rows;
    }
    async simpanKoreksi(soapId, dokterId, catatan) {
        await database_1.pool.execute(`INSERT INTO Koreksi_SOAP (id_soap, id_dokter, catatan) VALUES (?, ?, ?)`, [soapId, dokterId, catatan]);
    }
}
exports.SoapModel = SoapModel;
//# sourceMappingURL=soap.model.js.map