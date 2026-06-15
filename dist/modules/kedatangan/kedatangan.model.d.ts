export declare class KedatanganModel {
    findKunjunganHarian(tanggal: string): Promise<any[]>;
    findKunjunganUntukKonfirmasi(kunjunganId: string): Promise<any | null>;
    konfirmasiHadir(kunjunganId: string, userId: string): Promise<void>;
    getTanggalHariIni(): Promise<string>;
}
//# sourceMappingURL=kedatangan.model.d.ts.map