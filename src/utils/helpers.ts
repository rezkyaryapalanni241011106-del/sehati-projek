const HARI_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export function tanggalIndonesia(date: Date | string): string {
  const d = new Date(date);
  return `${d.getDate()} ${BULAN_ID[d.getMonth()]} ${d.getFullYear()}`;
}

export function hariIndonesia(date: Date | string): string {
  const d = new Date(date);
  return HARI_ID[d.getDay()];
}

export function hitungUsia(tanggalLahir: Date | string): number {
  const lahir = new Date(tanggalLahir);
  const sekarang = new Date();
  let usia = sekarang.getFullYear() - lahir.getFullYear();
  const bulanSelisih = sekarang.getMonth() - lahir.getMonth();
  if (bulanSelisih < 0 || (bulanSelisih === 0 && sekarang.getDate() < lahir.getDate())) {
    usia--;
  }
  return usia;
}

export function inisialNama(nama: string): string {
  return nama
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    booked: 'Terjadwal',
    hadir: 'Hadir',
    selesai: 'Selesai',
    batal: 'Dibatalkan',
    skip: 'Dilewati',
  };
  return map[status] ?? status;
}

export function statusClass(status: string): string {
  const map: Record<string, string> = {
    booked: 'badge-booked',
    hadir: 'badge-hadir',
    selesai: 'badge-selesai',
    batal: 'badge-batal',
    skip: 'badge-skip',
  };
  return map[status] ?? '';
}

export function generateSlots(
  jamMulai: string,
  jamSelesai: string,
  durasiMenit: number
): string[] {
  const slots: string[] = [];
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

export function formatJam(timeStr: string): string {
  return timeStr.substring(0, 5);
}

export function maskNomorHp(hp: string): string {
  if (hp.length <= 4) return hp;
  return hp.substring(0, 4) + '*'.repeat(hp.length - 7) + hp.substring(hp.length - 3);
}
