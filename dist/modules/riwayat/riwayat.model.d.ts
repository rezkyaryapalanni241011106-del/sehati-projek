export declare class RiwayatModel {
    findKunjunganPasien(pasienId: string): Promise<any[]>;
    findDetailKunjunganPasien(kunjunganId: string, pasienId: string): Promise<any | null>;
    findSoap(kunjunganId: string): Promise<any | null>;
    findResepBySoap(soapId: string): Promise<any[]>;
    findPasienById(pasienId: string): Promise<any | null>;
    findKunjunganDokterPasien(dokterId: string, pasienId: string): Promise<boolean>;
    findKunjunganLengkap(pasienId: string): Promise<any[]>;
}
//# sourceMappingURL=riwayat.model.d.ts.map