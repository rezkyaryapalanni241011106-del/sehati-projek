export declare class AuthModel {
    findPasienByNomorHp(nomorHp: string): Promise<any | null>;
    findUserByUsername(username: string): Promise<any | null>;
    findUserById(id: string): Promise<any | null>;
    updatePassword(id: string, passwordHash: string): Promise<void>;
    saveTotpSecret(userId: string, secret: string): Promise<void>;
}
//# sourceMappingURL=auth.model.d.ts.map