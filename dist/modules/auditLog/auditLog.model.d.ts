export declare class AuditLogModel {
    getOverviewData(): Promise<{
        pasienStats: any;
        stafStats: any[];
        kunjunganHariIni: any;
        kunjunganBulanIni: any;
        auditHariIni: any;
        aktivitasTerbaru: any[];
    }>;
    getAuditLog(filter: {
        peran: string;
        aktivitas: string;
        status: string;
        tanggal: string;
    }, page: number, limit: number): Promise<{
        rows: any[];
        total: number;
        stats: any;
    }>;
}
//# sourceMappingURL=auditLog.model.d.ts.map