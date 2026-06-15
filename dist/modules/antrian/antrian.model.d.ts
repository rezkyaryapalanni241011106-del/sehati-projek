export declare class AntrianModel {
    findAntrianAktif(dokterId: string, tanggal: string): Promise<any[]>;
    findStandby(dokterId: string, tanggal: string): Promise<any[]>;
    countKunjunganByStatus(dokterId: string, tanggal: string, status: string): Promise<number>;
    findDokterInfo(dokterId: string): Promise<any | null>;
    findKunjunganHadir(kunjunganId: string, dokterId: string): Promise<any | null>;
    setSkip(kunjunganId: string, alasanSkip: string): Promise<void>;
    setKembaliHadir(kunjunganId: string, dokterId: string): Promise<void>;
    searchICD10(q: string): Promise<any[]>;
    findSelesaiHariIni(dokterId: string, tanggal: string): Promise<any[]>;
    getTanggalHariIni(): Promise<string>;
    findMonitoringSemuaDokter(tanggal: string): Promise<any[]>;
    findAntrianDokterById(dokterId: string, tanggal: string): Promise<any[]>;
}
//# sourceMappingURL=antrian.model.d.ts.map