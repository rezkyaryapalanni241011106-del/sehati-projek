export declare class OtpService {
    generateKode(): string;
    cekBatasRequest(nomorHp: string): Promise<boolean>;
    cekBatasVerify(nomorHp: string): Promise<boolean>;
    catatAttempt(nomorHp: string, jenis: 'request' | 'verify', sukses: boolean): Promise<void>;
    buat(nomorHp: string): Promise<string>;
    verifikasi(nomorHp: string, kode: string): Promise<boolean>;
}
export declare const generateKodeOTP: () => string;
export declare const buatOTP: (nomorHp: string) => Promise<string>;
export declare const verifikasiOTP: (nomorHp: string, kode: string) => Promise<boolean>;
export declare const cekBatasRequestOTP: (nomorHp: string) => Promise<boolean>;
export declare const cekBatasVerifyOTP: (nomorHp: string) => Promise<boolean>;
export declare const catatAttemptOTP: (nomorHp: string, jenis: "request" | "verify", sukses: boolean) => Promise<void>;
//# sourceMappingURL=otp.d.ts.map