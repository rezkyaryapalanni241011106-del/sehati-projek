// ICD-10 Live Search — digunakan di form SOAP
// Mendukung: diagnosis utama + diagnosis banding (multi)

(function () {
  let debounceTimer;
  const bandingSelected = [];

  // ---- Diagnosis Utama ----
  const icdSearch = document.getElementById('icdSearch');
  const icdDx = document.getElementById('kode_dx');
  const icdDropdown = document.getElementById('icdDropdown');
  const icdSelectedDiv = document.getElementById('icdSelected');

  if (icdSearch) {
    icdSearch.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      const q = this.value.trim();
      if (q.length < 2) { icdDropdown.style.display = 'none'; return; }
      debounceTimer = setTimeout(() => fetchICD(q, icdDropdown, selectMain), 300);
    });

    document.addEventListener('click', function (e) {
      if (!icdSearch.contains(e.target)) icdDropdown.style.display = 'none';
    });
  }

  function selectMain(kode, deskripsi) {
    icdDx.value = kode;
    icdSearch.value = kode + ' — ' + deskripsi;
    icdSelectedDiv.textContent = kode + ' — ' + deskripsi;
    icdSelectedDiv.style.display = 'block';
    icdDropdown.style.display = 'none';
  }

  // ---- Diagnosis Banding ----
  const icdBandingSearch = document.getElementById('icdBandingSearch');
  const icdBandingDropdown = document.getElementById('icdBandingDropdown');
  const icdBandingList = document.getElementById('icdBandingList');

  if (icdBandingSearch) {
    let debounce2;
    icdBandingSearch.addEventListener('input', function () {
      clearTimeout(debounce2);
      const q = this.value.trim();
      if (q.length < 2) { icdBandingDropdown.style.display = 'none'; return; }
      debounce2 = setTimeout(() => fetchICD(q, icdBandingDropdown, selectBanding), 300);
    });

    document.addEventListener('click', function (e) {
      if (!icdBandingSearch.contains(e.target)) icdBandingDropdown.style.display = 'none';
    });
  }

  function selectBanding(kode, deskripsi) {
    if (bandingSelected.find(b => b.kode === kode)) return;
    bandingSelected.push({ kode, deskripsi });
    renderBanding();
    if (icdBandingSearch) { icdBandingSearch.value = ''; }
    if (icdBandingDropdown) icdBandingDropdown.style.display = 'none';
  }

  function renderBanding() {
    if (!icdBandingList) return;
    icdBandingList.innerHTML = bandingSelected.map((b, i) => `
      <span class="icd-banding-tag">
        <strong>${b.kode}</strong> ${b.deskripsi.substring(0, 30)}
        <button type="button" onclick="removeBanding(${i})" aria-label="Hapus">×</button>
        <input type="hidden" name="kode_dx_banding" value="${b.kode}">
      </span>`).join('');
  }

  window.removeBanding = function (i) {
    bandingSelected.splice(i, 1);
    renderBanding();
  };

  // ---- Fetch Helper ----
  async function fetchICD(q, dropdown, onSelect) {
    try {
      const r = await fetch('/antrian/api/icd10?q=' + encodeURIComponent(q));
      const data = await r.json();
      if (data.results.length === 0) { dropdown.style.display = 'none'; return; }
      dropdown.innerHTML = data.results.map(item =>
        `<div class="icd-item" data-kode="${item.kode}" data-desc="${item.deskripsi}">
          <span class="icd-kode">${item.kode}</span>
          <span class="icd-desc"> — ${item.deskripsi}</span>
        </div>`
      ).join('');
      dropdown.style.display = 'block';
      dropdown.querySelectorAll('.icd-item').forEach(el => {
        el.addEventListener('click', function () {
          onSelect(this.dataset.kode, this.dataset.desc);
        });
      });
    } catch {
      dropdown.style.display = 'none';
    }
  }
})();
