export declare class JadwalModel {
    findAllDokter(): Promise<any[]>;
    findAllJadwal(): Promise<any[]>;
    findById(id: string): Promise<any | null>;
    create(id: string, idDokter: string, hari: string, jamMulai: string, jamSelesai: string, durasiMenit: number, kuota: number): Promise<void>;
    update(id: string, hari: string, jamMulai: string, jamSelesai: string, durasiMenit: number, kuota: number): Promise<void>;
    setStatus(id: string, status: number): Promise<void>;
    findBookingAktifByJadwal(jadwalId: string): Promise<any[]>;
    hasKunjunganAktif(jadwalId: string): Promise<boolean>;
    batalkanBookingByJadwal(jadwalId: string): Promise<void>;
    delete(id: string): Promise<void>;
}
//# sourceMappingURL=jadwal.model.d.ts.map