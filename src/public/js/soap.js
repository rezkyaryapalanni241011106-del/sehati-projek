// SOAP Form helper — IMT auto-hitung, resep dinamis
// Sesuai FR-35: IMT = BB / (TB/100)²

(function () {
  // ---- IMT Auto-Hitung ----
  const bbInput = document.getElementById('bb');
  const tbInput = document.getElementById('tb');
  const imtInput = document.getElementById('imt');

  function hitungIMT() {
    if (!bbInput || !tbInput || !imtInput) return;
    const bb = parseFloat(bbInput.value);
    const tb = parseFloat(tbInput.value);
    if (bb > 0 && tb > 0) {
      const tbM = tb / 100;
      imtInput.value = (bb / (tbM * tbM)).toFixed(2);
    } else {
      imtInput.value = '';
    }
  }

  if (bbInput) bbInput.addEventListener('input', hitungIMT);
  if (tbInput) tbInput.addEventListener('input', hitungIMT);

  // ---- Resep Dinamis ----
  const resepContainer = document.getElementById('resepContainer');
  const btnTambah = document.getElementById('btnTambahObat');
  let resepCount = 0;

  function buatResepRow(urutan) {
    const row = document.createElement('div');
    row.className = 'resep-row';
    row.innerHTML = `
      <div class="form-group">
        <label>Nama Obat${urutan === 1 ? ' *' : ''}</label>
        <input type="text" name="nama_obat" class="form-control" placeholder="Nama obat" list="obat-history">
      </div>
      <div class="form-group">
        <label>Dosis</label>
        <input type="text" name="dosis" class="form-control" placeholder="500mg">
      </div>
      <div class="form-group">
        <label>Frekuensi</label>
        <input type="text" name="frekuensi" class="form-control" placeholder="3x sehari">
      </div>
      <div class="form-group">
        <label>Durasi</label>
        <input type="text" name="durasi" class="form-control" placeholder="7 hari">
      </div>
      <div class="form-group">
        <label>Jumlah</label>
        <input type="number" name="jumlah" class="form-control" placeholder="21" min="1">
      </div>
      <div class="form-group">
        <label>Cara Pakai</label>
        <select name="cara_pakai" class="form-control">
          <option value="oral">Oral</option>
          <option value="topikal">Topikal</option>
          <option value="injeksi">Injeksi</option>
          <option value="inhalasi">Inhalasi</option>
          <option value="lainnya">Lainnya</option>
        </select>
      </div>
      <div class="form-group">
        <label>Catatan</label>
        <input type="text" name="catatan_obat" class="form-control" placeholder="Setelah makan...">
      </div>
      <div class="form-group" style="align-self:flex-end">
        <button type="button" class="btn btn-sm btn-danger btn-hapus-obat">×</button>
      </div>`;

    row.querySelector('.btn-hapus-obat').addEventListener('click', function () {
      row.remove();
    });

    return row;
  }

  if (btnTambah && resepContainer) {
    btnTambah.addEventListener('click', function () {
      resepCount++;
      resepContainer.appendChild(buatResepRow(resepCount));
    });

    // Satu baris obat otomatis saat load
    resepCount++;
    resepContainer.appendChild(buatResepRow(resepCount));
  }

  // ---- Konfirmasi Submit ----
  const formSOAP = document.getElementById('formSOAP');
  if (formSOAP) {
    formSOAP.addEventListener('submit', function (e) {
      const kode = document.getElementById('kode_dx');
      if (!kode || !kode.value) {
        e.preventDefault();
        alert('Diagnosis utama ICD-10 wajib diisi!');
        return;
      }
      if (!confirm('Setelah disimpan, catatan SOAP tidak dapat diubah. Lanjutkan?')) {
        e.preventDefault();
      }
    });
  }
})();
