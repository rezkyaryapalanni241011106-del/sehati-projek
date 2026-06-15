export declare class SpesialisasiModel {
    findAll(): Promise<any[]>;
    findById(id: string): Promise<any | null>;
    isUsedByDokter(id: string): Promise<boolean>;
    create(id: string, nama: string): Promise<void>;
    setStatus(id: string, status: number): Promise<void>;
    delete(id: string): Promise<void>;
}
//# sourceMappingURL=spesialisasi.model.d.ts.map