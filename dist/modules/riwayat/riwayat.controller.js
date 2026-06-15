"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiwayatController = void 0;
const helpers_1 = require("../../utils/helpers");
const riwayat_model_1 = require("./riwayat.model");
class RiwayatController {
    constructor() {
        this.riwayatPasien = async (req, res) => {
            const pasienId = req.user.sub;
            const kunjungans = await this.model.findKunjunganPasien(pasienId);
            res.render('pasien/riwayat', {
                title: 'Riwayat Kunjungan',
                kunjungans,
                tanggalIndonesia: helpers_1.tanggalIndonesia,
                formatJam: helpers_1.formatJam,
            });
        };
        this.detailRiwayatPasien = async (req, res) => {
            const pasienId = req.user.sub;
            const kunjunganId = req.params.kunjunganId;
            const kunjungan = await this.model.findDetailKunjunganPasien(kunjunganId, pasienId);
            if (!kunjungan) {
                res.status(404).render('error', {
                    title: 'Tidak Ditemukan',
                    message: 'Detail kunjungan tidak ditemukan atau tidak dapat diakses.',
                    statusCode: 404,
                });
                return;
            }
            const soap = await this.model.findSoap(kunjunganId);
            const resepList = soap ? await this.model.findResepBySoap(soap.id) : [];
            res.render('pasien/riwayat-detail', {
                title: 'Detail Kunjungan',
                kunjungan,
                soap,
                resep: resepList,
                tanggalIndonesia: helpers_1.tanggalIndonesia,
            });
        };
        this.riwayatDokter = async (req, res) => {
            const pasienId = req.params.pasienId;
            const dokterId = req.user.sub;
            const peran = req.user.peran;
            // Super Admin boleh akses semua — dokter hanya boleh lihat pasien yang pernah ditangani
            if (peran === 'dokter') {
                const bolehAkses = await this.model.findKunjunganDokterPasien(dokterId, pasienId);
                if (!bolehAkses) {
                    res.status(403).render('error', {
                        title: 'Akses Ditolak',
                        message: 'Anda tidak memiliki akses ke riwayat pasien ini.',
                        statusCode: 403,
                    });
                    return;
                }
            }
            const pasien = await this.model.findPasienById(pasienId);
            if (!pasien) {
                res.status(404).render('error', {
                    title: 'Pasien Tidak Ditemukan',
                    message: 'Data pasien tidak ditemukan.',
                    statusCode: 404,
                });
                return;
            }
            const kunjungans = await this.model.findKunjunganLengkap(pasienId);
            res.render('dokter/riwayat-pasien', {
                title: `Riwayat Medis — ${pasien.nama_lengkap}`,
                pasien,
                kunjungans,
                hitungUsia: helpers_1.hitungUsia,
                tanggalIndonesia: helpers_1.tanggalIndonesia,
            });
        };
        this.model = new riwayat_model_1.RiwayatModel();
    }
}
exports.RiwayatController = RiwayatController;
//# sourceMappingURL=riwayat.controller.js.map