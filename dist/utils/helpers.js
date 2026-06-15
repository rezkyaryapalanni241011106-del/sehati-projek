"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tanggalIndonesia = tanggalIndonesia;
exports.hariIndonesia = hariIndonesia;
exports.hitungUsia = hitungUsia;
exports.inisialNama = inisialNama;
exports.statusLabel = statusLabel;
exports.statusClass = statusClass;
exports.generateSlots = generateSlots;
exports.formatJam = formatJam;
exports.maskNomorHp = maskNomorHp;
const HARI_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN_ID = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
function tanggalIndonesia(date) {
    const d = new Date(date);
    return `${d.getDate()} ${BULAN_ID[d.getMonth()]} ${d.getFullYear()}`;
}
function hariIndonesia(date) {
    const d = new Date(date);
    return HARI_ID[d.getDay()];
}
function hitungUsia(tanggalLahir) {
    const lahir = new Date(tanggalLahir);
    const sekarang = new Date();
    let usia = sekarang.getFullYear() - lahir.getFullYear();
    const bulanSelisih = sekarang.getMonth() - lahir.getMonth();
    if (bulanSelisih < 0 || (bulanSelisih === 0 && sekarang.getDate() < lahir.getDate())) {
        usia--;
    }
    return usia;
}
function inisialNama(nama) {
    return nama
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('');
}
function statusLabel(status) {
    const map = {
        booked: 'Terjadwal',
        hadir: 'Hadir',
        selesai: 'Selesai',
        batal: 'Dibatalkan',
        skip: 'Dilewati',
    };
    return map[status] ?? status;
}
function statusClass(status) {
    const map = {
        booked: 'badge-booked',
        hadir: 'badge-hadir',
        selesai: 'badge-selesai',
        batal: 'badge-batal',
        skip: 'badge-skip',
    };
    return map[status] ?? '';
}
function generateSlots(jamMulai, jamSelesai, durasiMenit) {
    const slots = [];
    const [hM, mM] = jamMulai.split(':').map(Number);
    const [hS, mS] = jamSelesai.split(':').map(Number);
    let current = hM * 60 + mM;
    const end = hS * 60 + mS;
    while (current + durasiMenit <= end) {
        const jam = Math.floor(current / 60);
        const menit = current % 60;
        slots.push(`${String(jam).padStart(2, '0')}:${String(menit).padStart(2, '0')}:00`);
        current += durasiMenit;
    }
    return slots;
}
function formatJam(timeStr) {
    return timeStr.substring(0, 5);
}
function maskNomorHp(hp) {
    if (hp.length <= 4)
        return hp;
    return hp.substring(0, 4) + '*'.repeat(hp.length - 7) + hp.substring(hp.length - 3);
}
//# sourceMappingURL=helpers.js.map