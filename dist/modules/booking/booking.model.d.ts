export declare class BookingModel {
    findSpesialisasiAktif(): Promise<any[]>;
    findDokterByHari(hariTerpilih: string, spesialisasi?: string): Promise<any[]>;
    findJadwalDokter(idDokter: string, hariTerpilih: string): Promise<any | null>;
    findBookedSlots(idDokter: string, tanggal: string): Promise<string[]>;
    findExistingBooking(pasienId: string, idDokter: string, tanggal: string): Promise<any | null>;
    create(id: string, pasienId: string, idDokter: string, idJadwal: string, tanggal: string, slotJam: string): Promise<void>;
    findKunjunganMilikPasien(kunjunganId: string, pasienId: string): Promise<any | null>;
    batalkan(kunjunganId: string): Promise<void>;
    findKunjunganDetail(kunjunganId: string, pasienId: string): Promise<any | null>;
    reschedule(kunjunganId: string, idJadwal: string, tanggal: string, slotJam: string): Promise<void>;
}
//# sourceMappingURL=booking.model.d.ts.map