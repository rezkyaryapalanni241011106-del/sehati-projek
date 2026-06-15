import { Response } from 'express';
interface DataResepPDF {
    pasien: {
        nama_lengkap: string;
        nomor_rm: string;
        tanggal_lahir: Date;
        jenis_kelamin: string;
    };
    dokter: {
        nama_lengkap: string;
        nomor_str: string | null;
        spesialisasi_nama: string | null;
    };
    tanggal_kunjungan: Date;
    obat: Array<{
        urutan: number;
        nama_obat: string;
        dosis: string | null;
        frekuensi: string | null;
        durasi: string | null;
        jumlah: number | null;
        cara_pakai: string;
        catatan: string | null;
    }>;
    tindakan: string | null;
    anjuran: string | null;
    kode_dx: string | null;
    dx_label: string | null;
}
export declare function generateResepPDF(res: Response, data: DataResepPDF): void;
export {};
//# sourceMappingURL=pdf.d.ts.map