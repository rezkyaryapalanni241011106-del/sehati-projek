export declare class SoapModel {
    findKunjunganDokter(kunjunganId: string, dokterId: string): Promise<any | null>;
    findSoap(kunjunganId: string): Promise<any | null>;
    findResepBySoapId(soapId: string): Promise<any[]>;
    findRiwayatPasien(pasienId: string, excludeKunjunganId: string): Promise<any[]>;
    findObatHistory(dokterId: string): Promise<string[]>;
    findKunjunganStatus(kunjunganId: string, dokterId: string): Promise<any | null>;
    soapSudahAda(kunjunganId: string): Promise<boolean>;
    createSoap(soapId: string, kunjunganId: string, body: any, bb: number | null, tb: number | null, imt: number | null, fileUrl: string | null, kodeBanding: string | null): Promise<void>;
    createResep(soapId: string, urutan: number, item: any): Promise<void>;
    setKunjunganSelesai(kunjunganId: string): Promise<void>;
    findKoreksiByKunjungan(kunjunganId: string): Promise<any[]>;
    simpanKoreksi(soapId: string, dokterId: string, catatan: string): Promise<void>;
}
//# sourceMappingURL=soap.model.d.ts.map