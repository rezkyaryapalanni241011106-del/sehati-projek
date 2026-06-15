export declare class PasienModel {
    findByNik(nik: string): Promise<any | null>;
    create(data: {
        id: string;
        nomor_rm: string;
        nik: string | null;
        nama_lengkap: string;
        tanggal_lahir: string;
        jenis_kelamin: string;
        nomor_hp: string;
        alamat: string;
        pekerjaan: string | null;
        pendidikan: string | null;
        status_perkawinan: string | null;
        agama: string | null;
        golongan_darah: string | null;
        alergi: string | null;
        riwayat_kronis: string | null;
        nomor_paspor: string | null;
        nik_wali: string | null;
    }): Promise<void>;
    findByNomorHp(nomorHp: string): Promise<any | null>;
    findById(id: string): Promise<any | null>;
    updateNomorHp(id: string, nomor_hp: string): Promise<void>;
    findDashboardData(pasienId: string): Promise<{
        pasien: any;
        mendatang: any[];
        riwayat: any[];
    }>;
    update(pasienId: string, data: {
        alamat: string;
        nomor_hp: string;
        pekerjaan: string | null;
        pendidikan: string | null;
        status_perkawinan: string | null;
        agama: string | null;
        golongan_darah: string | null;
        alergi: string | null;
        riwayat_kronis: string | null;
    }): Promise<void>;
}
//# sourceMappingURL=pasien.model.d.ts.map