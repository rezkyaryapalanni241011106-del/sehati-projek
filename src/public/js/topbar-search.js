(function () {
  var input = document.getElementById('topbarSearch');
  if (!input) return;

  function doSearch(query) {
    var q = query.toLowerCase().trim();

    // Filter standard .data-table rows
    document.querySelectorAll('.data-table tbody tr').forEach(function (row) {
      if (row.querySelector('td[colspan]')) return; // keep empty-state rows visible
      var show = !q || row.textContent.toLowerCase().indexOf(q) !== -1;
      row.style.display = show ? '' : 'none';
    });

    // Filter card-based items (monitoring, antrian cards, etc.)
    document.querySelectorAll('[data-search-item]').forEach(function (item) {
      var show = !q || item.textContent.toLowerCase().indexOf(q) !== -1;
      item.style.display = show ? '' : 'none';
    });
  }

  input.addEventListener('input', function () { doSearch(this.value); });

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { this.value = ''; doSearch(''); }
  });
})();
