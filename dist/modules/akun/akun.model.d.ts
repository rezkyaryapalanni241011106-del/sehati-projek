export declare class AkunModel {
    findAllStaf(): Promise<any[]>;
    findSpesialisasiAktif(): Promise<any[]>;
    findStafById(id: string): Promise<any | null>;
    createStaf(data: {
        id: string;
        username: string;
        hash: string;
        peran: string;
        nama_lengkap: string;
        email: string | null;
        nomor_hp: string | null;
        spesialisasi: string | null;
        nomor_str: string | null;
        dibuat_oleh: string;
    }): Promise<void>;
    updateStaf(id: string, username: string, nama_lengkap: string, email: string | null, nomor_hp: string | null, spesialisasi: string | null, nomor_str: string | null): Promise<void>;
    findStatusById(id: string): Promise<any | null>;
    setStatus(id: string, status: number): Promise<void>;
    setPassword(id: string, hash: string): Promise<void>;
    findAllAdmin(): Promise<any[]>;
    findAdminById(id: string): Promise<any | null>;
    createAdmin(id: string, username: string, hash: string, nama_lengkap: string, email: string | null, dibuat_oleh: string): Promise<void>;
    updateAdmin(id: string, nama_lengkap: string, email: string | null): Promise<void>;
}
//# sourceMappingURL=akun.model.d.ts.map