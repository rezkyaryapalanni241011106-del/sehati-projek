"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateResepPDF = generateResepPDF;
const pdfkit_1 = __importDefault(require("pdfkit"));
const env_1 = require("../config/env");
const helpers_1 = require("./helpers");
// ─── Color palette ────────────────────────────────────────────────────────────
const C = {
    dark: '#1a2e35',
    accent: '#1d5064',
    muted: '#787878',
    border: '#d0d8da',
    headBg: '#eef2f3',
    white: '#ffffff',
    rowAlt: '#f7fafb',
};
function generateResepPDF(res, data) {
    const M = 45; // margin
    const doc = new pdfkit_1.default({ margin: M, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="resep-${data.pasien.nomor_rm}-${Date.now()}.pdf"`);
    doc.pipe(res);
    const pW = doc.page.width; // 595
    const pL = M; // 45
    const pR = pW - M; // 550
    const cW = pR - pL; // 505
    // Split: 55 % left / 45 % right
    const lW = Math.round(cW * 0.55); // 277
    const rX = pL + lW + 6; // right col start
    const rW = pR - rX; // right col width
    // ── HEADER ─────────────────────────────────────────────────────────────────
    const hY = doc.y;
    // Left: clinic name + address
    doc.fillColor(C.accent).fontSize(16).font('Helvetica-Bold')
        .text(env_1.env.CLINIC_NAME, pL, hY, { width: lW, lineBreak: false });
    doc.fillColor(C.muted).fontSize(8.5).font('Helvetica')
        .text('Sistem Elektronik Healthcare Anda Terintegrasi', pL, hY + 22, { width: lW });
    doc.text(`${env_1.env.CLINIC_ADDRESS}  ·  Telp ${env_1.env.CLINIC_PHONE}`, pL, doc.y, { width: lW });
    const hLeftEndY = doc.y;
    // Right: doctor info
    doc.fillColor(C.dark).fontSize(12).font('Helvetica-Bold')
        .text(data.dokter.nama_lengkap, rX, hY, { width: rW, align: 'right', lineBreak: false });
    doc.fillColor(C.dark).fontSize(9.5).font('Helvetica')
        .text(data.dokter.spesialisasi_nama ?? 'Dokter Umum', rX, hY + 19, { width: rW, align: 'right' });
    doc.fillColor(C.muted).fontSize(8.5)
        .text(`STR: ${data.dokter.nomor_str ?? '-'}`, rX, doc.y, { width: rW, align: 'right' });
    const hRightEndY = doc.y;
    doc.y = Math.max(hLeftEndY, hRightEndY) + 14;
    doc.x = pL;
    // ── DIVIDER ─────────────────────────────────────────────────────────────────
    doc.moveTo(pL, doc.y).lineTo(pR, doc.y)
        .strokeColor(C.dark).lineWidth(0.9).stroke();
    doc.y += 14;
    // ── PATIENT / DATE SECTION ──────────────────────────────────────────────────
    const pSecY = doc.y;
    // Left: pasien info
    doc.fillColor(C.muted).fontSize(7.5).font('Helvetica')
        .text('PASIEN', pL, pSecY, { width: lW, characterSpacing: 0.4 });
    const gender = data.pasien.jenis_kelamin === 'L' ? 'L' : 'P';
    const usia = (0, helpers_1.hitungUsia)(data.pasien.tanggal_lahir);
    doc.fillColor(C.dark).fontSize(11).font('Helvetica-Bold')
        .text(`${data.pasien.nama_lengkap} (${gender})`, pL, pSecY + 13, { width: lW });
    doc.fillColor(C.dark).fontSize(9.5).font('Helvetica')
        .text(`No. RM: ${data.pasien.nomor_rm}`, pL, doc.y, { width: lW });
    doc.text(`Tgl lahir: ${(0, helpers_1.tanggalIndonesia)(data.pasien.tanggal_lahir)} (${usia} th)`, pL, doc.y, { width: lW });
    const pLeftEndY = doc.y;
    // Right: tanggal + diagnosis
    doc.fillColor(C.muted).fontSize(7.5).font('Helvetica')
        .text('TANGGAL RESEP', rX, pSecY, { width: rW, align: 'right', characterSpacing: 0.4 });
    doc.fillColor(C.dark).fontSize(11).font('Helvetica')
        .text((0, helpers_1.tanggalIndonesia)(data.tanggal_kunjungan), rX, pSecY + 13, { width: rW, align: 'right' });
    if (data.kode_dx) {
        doc.fillColor(C.muted).fontSize(7.5).font('Helvetica')
            .text('DIAGNOSIS', rX, pSecY + 32, { width: rW, align: 'right', characterSpacing: 0.4 });
        const dxText = data.dx_label
            ? `${data.kode_dx} — ${data.dx_label}`
            : data.kode_dx;
        doc.fillColor(C.dark).fontSize(9).font('Helvetica')
            .text(dxText, rX, pSecY + 43, { width: rW, align: 'right' });
    }
    const pRightEndY = doc.y;
    doc.y = Math.max(pLeftEndY, pRightEndY) + 18;
    doc.x = pL;
    // ── Rx SYMBOL ───────────────────────────────────────────────────────────────
    // Tanpa lineBreak:false agar PDFKit otomatis maju ~36pt setelah font 30pt
    doc.fillColor(C.dark).fontSize(30).font('Times-BoldItalic')
        .text('Rx', pL, doc.y);
    doc.y += 4;
    doc.x = pL;
    // ── MEDICINES TABLE ─────────────────────────────────────────────────────────
    // Column widths (total = cW = 505)
    const COL = {
        nama: 155,
        dosis: 68,
        freq: 95,
        durasi: 62,
        jml: 40,
        cara: 0, // filled below
    };
    COL.cara = cW - COL.nama - COL.dosis - COL.freq - COL.durasi - COL.jml; // 85
    const HEAD_H = 21;
    const ROW_H = 22;
    const PAD = 5;
    const colX = [
        pL,
        pL + COL.nama,
        pL + COL.nama + COL.dosis,
        pL + COL.nama + COL.dosis + COL.freq,
        pL + COL.nama + COL.dosis + COL.freq + COL.durasi,
        pL + COL.nama + COL.dosis + COL.freq + COL.durasi + COL.jml,
    ];
    const colW = [COL.nama, COL.dosis, COL.freq, COL.durasi, COL.jml, COL.cara];
    let tY = doc.y;
    // Table header background
    doc.rect(pL, tY, cW, HEAD_H).fillColor(C.headBg).fill();
    // Top border of header
    doc.moveTo(pL, tY).lineTo(pR, tY).strokeColor(C.border).lineWidth(0.6).stroke();
    // Header labels
    const hLabels = ['NAMA OBAT', 'DOSIS', 'FREKUENSI', 'DURASI', 'JML', 'CARA PAKAI'];
    doc.fillColor(C.accent).fontSize(7.5).font('Helvetica-Bold');
    hLabels.forEach((label, i) => {
        doc.text(label, colX[i] + PAD, tY + 7, { width: colW[i] - PAD, lineBreak: false, characterSpacing: 0.3 });
    });
    // Bottom border of header
    tY += HEAD_H;
    doc.moveTo(pL, tY).lineTo(pR, tY).strokeColor(C.border).lineWidth(0.6).stroke();
    // Data rows
    data.obat.forEach((item, i) => {
        const rowY = tY;
        // Alternate row background
        if (i % 2 !== 0) {
            doc.rect(pL, rowY, cW, ROW_H).fillColor(C.rowAlt).fill();
        }
        else {
            doc.rect(pL, rowY, cW, ROW_H).fillColor(C.white).fill();
        }
        // Medicine name (bold)
        doc.fillColor(C.dark).fontSize(9.5).font('Helvetica-Bold')
            .text(item.nama_obat, colX[0] + PAD, rowY + 6, { width: colW[0] - PAD, lineBreak: false });
        // Other cells (normal weight)
        doc.fillColor(C.dark).fontSize(9.5).font('Helvetica');
        doc.text(item.dosis ?? '–', colX[1] + PAD, rowY + 6, { width: colW[1] - PAD, lineBreak: false });
        doc.text(item.frekuensi ?? '–', colX[2] + PAD, rowY + 6, { width: colW[2] - PAD, lineBreak: false });
        doc.text(item.durasi ?? '–', colX[3] + PAD, rowY + 6, { width: colW[3] - PAD, lineBreak: false });
        doc.text(item.jumlah != null ? String(item.jumlah) : '–', colX[4] + PAD, rowY + 6, { width: colW[4] - PAD, lineBreak: false });
        const caraText = item.cara_pakai
            ? item.cara_pakai.charAt(0).toUpperCase() + item.cara_pakai.slice(1)
            : '–';
        doc.text(caraText, colX[5] + PAD, rowY + 6, { width: colW[5] - PAD, lineBreak: false });
        tY += ROW_H;
        // Row bottom border
        doc.moveTo(pL, tY).lineTo(pR, tY).strokeColor(C.border).lineWidth(0.4).stroke();
    });
    doc.y = tY + 14;
    doc.x = pL;
    // ── TINDAKAN & ANJURAN ───────────────────────────────────────────────────────
    const taText = [data.tindakan, data.anjuran].filter(Boolean).join('\n');
    if (taText) {
        doc.fillColor(C.accent).fontSize(7.5).font('Helvetica-Bold')
            .text('TINDAKAN & ANJURAN', pL, doc.y, { characterSpacing: 0.4, lineBreak: false });
        doc.y += 14;
        doc.fillColor(C.dark).fontSize(9.5).font('Helvetica')
            .text(taText, pL, doc.y, { width: cW * 0.65 });
    }
    // ── SIGNATURE ───────────────────────────────────────────────────────────────
    const sigW = 160;
    const sigX = pR - sigW;
    const sigY = doc.y + 20;
    doc.fillColor(C.dark).fontSize(9.5).font('Helvetica')
        .text((0, helpers_1.tanggalIndonesia)(data.tanggal_kunjungan), sigX, sigY, { width: sigW, align: 'center', lineBreak: false });
    const lineY = sigY + 50;
    doc.moveTo(sigX, lineY).lineTo(pR, lineY)
        .strokeColor(C.dark).lineWidth(0.7).stroke();
    doc.fillColor(C.dark).fontSize(9.5).font('Helvetica')
        .text(data.dokter.nama_lengkap, sigX, lineY + 5, { width: sigW, align: 'center', lineBreak: false });
    doc.end();
}
//# sourceMappingURL=pdf.js.map