/* Innglidning når seksjonene kommer inn på skjermen: overskrift, tekst og bilde etter hverandre.
   Kjører bare når <html> har .reveal (satt i <head>, aldri ved «Reduser bevegelse»). */
(function () {
  var root = document.documentElement;
  if (!root.classList.contains('reveal')) return;
  root.classList.add('reveal-js');
  var items = document.querySelectorAll('[data-reveal]');
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      el.classList.add('in');
      // Når innglidningen er ferdig, får knapper og kort tilbake sine vanlige, raske overganger
      setTimeout(function () { el.classList.add('settled'); }, 1000);
      io.unobserve(el);
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  items.forEach(function (el) { io.observe(el); });
})();
