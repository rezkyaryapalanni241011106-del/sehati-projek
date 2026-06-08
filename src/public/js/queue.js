// Socket.io client untuk antrian dokter real-time
// Sesuai FR-30–34

(function () {
  if (typeof DOCTOR_ID === 'undefined') return;

  const socket = io();

  socket.emit('join:doctor', DOCTOR_ID);

  socket.on('queue:update', function ({ action, kunjungan_id, patient }) {
    if (action === 'add') addRowToQueue(patient);
    if (action === 'remove') removeRowFromQueue(kunjungan_id);
    if (action === 'skip') moveToStandby(kunjungan_id);
    if (action === 'standby_back') moveBackToActive(kunjungan_id);
  });

  function addRowToQueue(patient) {
    const grid = document.getElementById('antrianGrid');
    const emptyMsg = document.getElementById('emptyMsg');
    if (emptyMsg) emptyMsg.remove();

    const card = document.createElement('div');
    card.className = 'antrian-card';
    card.id = 'antrian-' + patient.kunjungan_id;
    const waktu = new Date(patient.waktu_konfirmasi).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const keluhan = patient.keluhan_awal
      ? patient.keluhan_awal.substring(0, 50) + (patient.keluhan_awal.length > 50 ? '...' : '')
      : '<em>Tidak ada keluhan</em>';

    card.innerHTML = `
      <div class="antrian-header">
        <span class="antrian-rm">${patient.nomor_rm}</span>
        <span class="antrian-waktu">${waktu}</span>
      </div>
      <div class="antrian-nama">${patient.nama_pasien}</div>
      <div class="antrian-usia">${patient.usia} tahun</div>
      <div class="antrian-keluhan">${keluhan}</div>
      <div class="antrian-actions">
        <a href="/soap/${patient.kunjungan_id}" class="btn btn-primary btn-sm">📋 Buka SOAP</a>
        <button class="btn btn-warning btn-sm btn-skip" data-id="${patient.kunjungan_id}">⏭ Skip</button>
      </div>`;

    grid.appendChild(card);
    updateBadgeCount();
    attachSkipHandler(card.querySelector('.btn-skip'));
  }

  function removeRowFromQueue(kunjunganId) {
    const card = document.getElementById('antrian-' + kunjunganId);
    if (card) card.remove();
    updateBadgeCount();
  }

  function moveToStandby(kunjunganId) {
    removeRowFromQueue(kunjunganId);
  }

  function moveBackToActive(kunjunganId) {
    // Reload halaman untuk refresh data standby
    window.location.reload();
  }

  function updateBadgeCount() {
    const badge = document.getElementById('badgeCount');
    if (badge) badge.textContent = document.querySelectorAll('.antrian-card').length;
  }

  function attachSkipHandler(btn) {
    if (!btn) return;
    btn.addEventListener('click', function () {
      window._skipTargetId = this.dataset.id;
      document.getElementById('alasanSkip').value = '';
      document.getElementById('skipModal').style.display = 'flex';
    });
  }
})();
