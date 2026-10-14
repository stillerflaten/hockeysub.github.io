/* Velkomstanimasjon på forsiden: bytteklokka teller ned til «Bytt!».
   Kjører bare når <html> har .hero-anim (satt i <head>, én gang per besøk). */
(function () {
  var root = document.documentElement;
  if (!root.classList.contains('hero-anim')) return;
  var hero = document.querySelector('.hero');
  var clock = document.querySelector('.hero-clock');
  if (!hero || !clock) return;
  var arc = clock.querySelector('.arc');
  var num = clock.querySelector('.num b');
  var label = clock.querySelector('.num small');
  var swapSrc = clock.getAttribute('data-swap-src');
  var total = 5;

  // Skjermbildet med «Tid for bytte!» lastes først nå, så vanlige besøk ikke betaler for det.
  if (swapSrc) {
    var img = new Image();
    img.className = 'hero-swap-img';
    img.alt = '';
    img.src = swapSrc;
    hero.querySelector('.screen').appendChild(img);
  }

  function show(s) {
    num.textContent = '0:0' + s;
    arc.style.strokeDashoffset = String(264 * (1 - s / total));
  }
  show(total);

  // Teller først ned når klokka faktisk synes (på mobil ligger telefonen under bretten).
  function run(start) {
    for (var i = 1; i <= total; i++) {
      (function (i) { setTimeout(function () { show(total - i); }, start + i * 1000); })(i);
  }
  setTimeout(function () {
    clock.classList.add('due');
    num.textContent = clock.getAttribute('data-due');
    label.textContent = '+0:00';
    arc.style.strokeDashoffset = '0';
    hero.classList.add('swapping');
  }, start + total * 1000);
  setTimeout(function () {
    clock.classList.remove('due');
    hero.classList.remove('swapping');
    label.textContent = clock.getAttribute('data-until');
    num.textContent = '0:45';
    arc.style.strokeDashoffset = '0';
  }, start + total * 1000 + 2600);
  }

  if (!('IntersectionObserver' in window)) { run(1400); return; }
  var t0 = Date.now();
  var io = new IntersectionObserver(function (entries) {
    if (!entries[0].isIntersecting) return;
    io.disconnect();
    // Vent til klokka har poppet inn (ca. 1,4 s etter sidelast), ellers start med en gang.
    run(Math.max(400, 1400 - (Date.now() - t0)));
  }, { threshold: 0.6 });
  io.observe(clock);
})();
