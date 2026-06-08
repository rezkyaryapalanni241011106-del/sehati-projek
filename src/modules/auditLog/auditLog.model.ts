import { pool } from '../../config/database';

export class AuditLogModel {
  async getOverviewData(): Promise<{
    pasienStats: any;
    stafStats: any[];
    kunjunganHariIni: any;
    kunjunganBulanIni: any;
    auditHariIni: any;
    aktivitasTerbaru: any[];
  }> {
    const [
      [[pasienStats]],
      [stafStats],
      [[kunjunganHariIni]],
      [[kunjunganBulanIni]],
      [[auditHariIni]],
      [aktivitasTerbaru],
    ] = await Promise.all([
      pool.execute<any[]>('SELECT COUNT(*) AS total FROM Pasien'),
      pool.execute<any[]>(
        'SELECT peran, COUNT(*) AS total, SUM(status_aktif) AS aktif FROM Users GROUP BY peran ORDER BY peran'
      ),
      pool.execute<any[]>(
        `SELECT COUNT(*) AS total,
           SUM(status = 'booked')   AS booked,
           SUM(status = 'hadir')    AS hadir,
           SUM(status = 'selesai')  AS selesai,
           SUM(status = 'batal')    AS batal
         FROM Kunjungan WHERE tanggal = CURDATE()`
      ),
      pool.execute<any[]>(
        'SELECT COUNT(*) AS total FROM Kunjungan WHERE YEAR(tanggal) = YEAR(CURDATE()) AND MONTH(tanggal) = MONTH(CURDATE())'
      ),
      pool.execute<any[]>(
        "SELECT COUNT(*) AS total, SUM(status = 'gagal') AS gagal FROM Audit_Log WHERE DATE(waktu) = CURDATE()"
      ),
      pool.execute<any[]>(
        `SELECT al.waktu, al.aktivitas, al.status, al.peran_user, u.username
         FROM Audit_Log al
         LEFT JOIN Users u ON al.id_user = u.id
         ORDER BY al.waktu DESC LIMIT 10`
      ),
    ]);

    return { pasienStats, stafStats, kunjunganHariIni, kunjunganBulanIni, auditHariIni, aktivitasTerbaru };
  }

  async getAuditLog(filter: { peran: string; aktivitas: string; status: string; tanggal: string }, page: number, limit: number): Promise<{ rows: any[]; total: number; stats: any }> {
    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (filter.peran)     { where += ' AND u.peran = ?';          params.push(filter.peran); }
    if (filter.aktivitas) { where += ' AND al.aktivitas LIKE ?';  params.push(`%${filter.aktivitas}%`); }
    if (filter.status)    { where += ' AND al.status = ?';        params.push(filter.status); }
    if (filter.tanggal)   { where += ' AND DATE(al.waktu) = ?';   params.push(filter.tanggal); }

    const offset = (page - 1) * limit;

    const [rows] = await pool.execute<any[]>(
      `SELECT al.*, u.username, u.peran FROM Audit_Log al
       LEFT JOIN Users u ON al.id_user = u.id
       ${where}
       ORDER BY al.waktu DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    const [[{ total }]] = await pool.execute<any[]>(
      `SELECT COUNT(*) AS total FROM Audit_Log al
       LEFT JOIN Users u ON al.id_user = u.id
       ${where}`,
      params
    );

    const [[stats]] = await pool.execute<any[]>(
      `SELECT COUNT(*) AS total_hari_ini, SUM(status = 'gagal') AS gagal_hari_ini
       FROM Audit_Log WHERE DATE(waktu) = CURDATE()`
    );

    return { rows, total, stats };
  }
}
