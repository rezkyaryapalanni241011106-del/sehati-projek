(function () {
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      document.documentElement.style.visibility = 'hidden';
      window.location.replace(window.location.href);
    }
  });
})();
