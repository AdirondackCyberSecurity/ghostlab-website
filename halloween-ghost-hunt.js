/* Halloween ghost hunt page: Print buttons. External file because the site CSP blocks inline script. */
(function () {
  document.querySelectorAll("[data-print]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      window.print();
    });
  });
})();
