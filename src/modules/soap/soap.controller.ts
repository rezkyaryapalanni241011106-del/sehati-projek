import { Request, Response } from 'express';
import { logAudit } from '../../utils/auditLogger';
import { hitungIMT } from '../../utils/imt';
import { emitQueueUpdate } from '../../socket/queueSocket';
import { v4 as uuidv4 } from 'uuid';
import { SoapModel } from './soap.model';

export class SoapController {
  private model: SoapModel;

  constructor() {
    this.model = new SoapModel();
  }

  showSoap = async (req: Request, res: Response): Promise<void> => {
    const kunjunganId = req.params.kunjunganId;
    const dokterId = req.user!.sub;

    const kunjungan = await this.model.findKunjunganDokter(kunjunganId, dokterId);

    if (!kunjungan) {
      res.status(404).render('error', { title: 'Tidak Ditemukan', message: '', statusCode: 404 });
      return;
    }

    // FR-35: SOAP hanya bisa dibuka setelah status = hadir
    if (kunjungan.status !== 'hadir' && kunjungan.status !== 'selesai') {
      req.flash('error', 'Form rekam medis hanya tersedia setelah pasien dikonfirmasi hadir.');
      res.redirect('/antrian');
      return;
    }

    const soap = await this.model.findSoap(kunjunganId);
    const resepList = soap ? await this.model.findResepBySoapId(soap.id) : [];
    const riwayat = await this.model.findRiwayatPasien(kunjungan.pasien_id, kunjunganId);
    const obatHistory = await this.model.findObatHistory(dokterId);

    const locked = kunjungan.status === 'selesai';
    const koreksiList = locked ? await this.model.findKoreksiByKunjungan(kunjunganId) : [];
    res.render('dokter/soap', {
      title: 'Form SOAP',
      kunjungan,
      soap,
      resepList,
      riwayat,
      obatHistory,
      readonly: locked,
      locked,
      koreksiList,
    });
  };

  simpanSoap = async (req: Request, res: Response): Promise<void> => {
    const kunjunganId = req.params.kunjunganId;
    const dokterId = req.user!.sub;

    const kunjungan = await this.model.findKunjunganStatus(kunjunganId, dokterId);

    if (!kunjungan || kunjungan.status !== 'hadir') {
      req.flash('error', 'Tidak bisa menyimpan SOAP. Periksa status kunjungan.');
      res.redirect(`/soap/${kunjunganId}`);
      return;
    }

    // FR-38: SOAP immutable setelah disimpan
    const sudahAda = await this.model.soapSudahAda(kunjunganId);
    if (sudahAda) {
      req.flash('error', 'Catatan SOAP sudah ada dan bersifat final. Tidak bisa diubah.');
      res.redirect(`/soap/${kunjunganId}`);
      return;
    }

    const body = req.body;

    // FR-36: Validasi wajib — kode_dx + (resep ≥1 ATAU tindakan ATAU anjuran)
    if (!body.kode_dx) {
      req.flash('error', 'Diagnosis utama (ICD-10) wajib diisi.');
      res.redirect(`/soap/${kunjunganId}`);
      return;
    }

    const resepItems: any[] = [];
    if (Array.isArray(body.nama_obat)) {
      for (let i = 0; i < body.nama_obat.length; i++) {
        if (body.nama_obat[i]?.trim()) {
          resepItems.push({
            nama_obat: body.nama_obat[i].trim(),
            dosis: body.dosis?.[i] || null,
            frekuensi: body.frekuensi?.[i] || null,
            durasi: body.durasi?.[i] || null,
            jumlah: body.jumlah?.[i] ? parseInt(body.jumlah[i]) : null,
            cara_pakai: body.cara_pakai?.[i] || 'oral',
            catatan: body.catatan_obat?.[i] || null,
          });
        }
      }
    }

    if (resepItems.length === 0 && !body.tindakan?.trim() && !body.anjuran?.trim()) {
      req.flash('error', 'Wajib mengisi minimal 1 obat, atau tindakan, atau anjuran.');
      res.redirect(`/soap/${kunjunganId}`);
      return;
    }

    // Validasi rentang vital signs
    const tdSis = body.td_sistolik ? parseInt(body.td_sistolik) : null;
    const tdDia = body.td_diastolik ? parseInt(body.td_diastolik) : null;
    const nadi  = body.nadi  ? parseInt(body.nadi)  : null;
    const suhu  = body.suhu  ? parseFloat(body.suhu) : null;
    const spo2  = body.spo2  ? parseInt(body.spo2)  : null;

    if (tdSis !== null && (tdSis < 50 || tdSis > 300)) {
      req.flash('error', 'Tekanan darah sistolik harus antara 50–300 mmHg.');
      res.redirect(`/soap/${kunjunganId}`); return;
    }
    if (tdDia !== null && (tdDia < 30 || tdDia > 200)) {
      req.flash('error', 'Tekanan darah diastolik harus antara 30–200 mmHg.');
      res.redirect(`/soap/${kunjunganId}`); return;
    }
    if (nadi !== null && (nadi < 20 || nadi > 300)) {
      req.flash('error', 'Nadi harus antara 20–300 bpm.');
      res.redirect(`/soap/${kunjunganId}`); return;
    }
    if (suhu !== null && (suhu < 30 || suhu > 45)) {
      req.flash('error', 'Suhu tubuh harus antara 30–45 °C.');
      res.redirect(`/soap/${kunjunganId}`); return;
    }
    if (spo2 !== null && (spo2 < 0 || spo2 > 100)) {
      req.flash('error', 'SPO2 harus antara 0–100%.');
      res.redirect(`/soap/${kunjunganId}`); return;
    }

    const bb = body.berat_badan ? parseFloat(body.berat_badan) : null;
    const tb = body.tinggi_badan ? parseFloat(body.tinggi_badan) : null;
    const imt = bb && tb && tb > 0 ? hitungIMT(bb, tb) : null;

    const fileUrl = req.file ? `/public/uploads/${req.file.filename}` : null;

    let kodeBanding: string | null = null;
    if (body.kode_dx_banding) {
      const arr = Array.isArray(body.kode_dx_banding) ? body.kode_dx_banding : [body.kode_dx_banding];
      kodeBanding = JSON.stringify(arr.filter(Boolean));
    }

    const soapId = uuidv4();

    await this.model.createSoap(soapId, kunjunganId, body, bb, tb, imt, fileUrl, kodeBanding);

    for (let i = 0; i < resepItems.length; i++) {
      await this.model.createResep(soapId, i + 1, resepItems[i]);
    }

    await this.model.setKunjunganSelesai(kunjunganId);

    await logAudit({
      req, user: req.user,
      aktivitas: 'SIMPAN_SOAP',
      tabel_target: 'Catatan_SOAP', id_target: soapId,
      status: 'sukses',
    });

    const io = req.app.get('io');
    if (io) emitQueueUpdate(io, dokterId, 'remove', { kunjungan_id: kunjunganId });

    req.flash('success', 'Catatan SOAP berhasil disimpan. Status kunjungan: Selesai.');
    res.redirect('/antrian');
  };

  simpanKoreksi = async (req: Request, res: Response): Promise<void> => {
    const kunjunganId = req.params.kunjunganId;
    const dokterId = req.user!.sub;
    const { catatan } = req.body;

    if (!catatan || catatan.trim().length < 10) {
      req.flash('error', 'Catatan koreksi minimal 10 karakter.');
      res.redirect(`/soap/${kunjunganId}`);
      return;
    }

    const kunjungan = await this.model.findKunjunganDokter(kunjunganId, dokterId);
    if (!kunjungan || kunjungan.status !== 'selesai') {
      req.flash('error', 'Koreksi hanya bisa ditambahkan pada catatan yang sudah selesai.');
      res.redirect(`/soap/${kunjunganId}`);
      return;
    }

    const soap = await this.model.findSoap(kunjunganId);
    if (!soap) {
      req.flash('error', 'Data SOAP tidak ditemukan.');
      res.redirect(`/soap/${kunjunganId}`);
      return;
    }

    await this.model.simpanKoreksi(soap.id, dokterId, catatan.trim());

    await logAudit({
      req, user: req.user,
      aktivitas: 'TAMBAH_KOREKSI_SOAP',
      tabel_target: 'Koreksi_SOAP', id_target: soap.id,
      status: 'sukses',
    });

    req.flash('success', 'Catatan koreksi berhasil disimpan.');
    res.redirect(`/soap/${kunjunganId}`);
  };
}
