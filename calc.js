/* Istid-kalkulatoren på forsiden: klasse + antall utespillere -> istid per barn.
   Tallene er de samme som i appen (Rulebook.swift). Uten JavaScript står standardsvaret
   i HTML-en, og valgene er skjult. */
(function () {
  var box = document.querySelector('[data-calc]');
  if (!box) return;

  // on = utespillere på isen samtidig (målvakt ikke med), min = kamptid i minutter, shift = sekunder mellom bytter (null = flyvende).
  // open: reglene sier ikke hvor lang kampen er, så min er bare et forslag (Canada og IIHF).
  var RULES = {
    nihf: [
      { t: 'U6', min: 15, on: 3, goalie: false, shift: 90, len: '15 min' },
      { t: 'U7–U9', min: 15, on: 3, goalie: true, shift: 90, len: '15 min' },
      { t: 'U10–U11', min: 15, on: 3, goalie: true, shift: 60, len: '15 min' },
      { t: 'U12', min: 15, on: 3, goalie: true, shift: null, len: '15 min' },
      { t: 'U13', min: 40, on: 5, goalie: true, shift: null, len: '2 × 20 min' }
    ],
    sweden: [
      { t: 'TKH–U9', min: 15, on: 3, goalie: true, shift: 60, len: '15 min' },
      { t: 'U10', min: 15, on: 3, goalie: true, shift: 60, len: '15 min' },
      { t: 'U11', min: 15, on: 3, goalie: true, shift: null, len: '15 min' },
      { t: 'U12', min: 16, on: 3, goalie: true, shift: null, len: '2 × 8 min' }
    ],
    canada: [
      { t: 'U7', min: 40, on: 4, goalie: true, shift: 120, open: true },
      { t: 'U9', min: 40, on: 4, goalie: true, shift: 120, open: true },
      { t: 'U11–U13', min: 45, on: 5, goalie: true, shift: null, open: true }
    ],
    iihf: [
      { t: 'U10', min: 30, on: 4, goalie: true, shift: 90, open: true },
      { t: 'U12–U14', min: 30, on: 4, goalie: true, shift: null, open: true }
    ]
  };
  var DEFAULT_CLASS = { nihf: 1, sweden: 0, canada: 1, iihf: 0 };

  var lang = (document.documentElement.lang || 'no').slice(0, 2);
  var T = {
    no: {
      line: function (len, c, n) { return 'Kampen er ' + len + ', med ' + c.on + ' utespillere på isen og ' + Math.max(0, n - c.on) + ' på benken.'; },
      shift: function (c, times) { return 'Bytte hvert ' + (c.shift % 60 === 0 && c.shift > 60 ? c.shift / 60 + '. minutt' : c.shift + '. sekund') + '. Hver spiller er på isen omtrent ' + times + ' ' + (times === 1 ? 'gang' : 'ganger') + '.'; },
      open: 'Reglene sier ikke hvor lang kampen er, så velg kamplengden selv.',
      flying: 'Flyvende bytter: appen holder styr på tiden, så den blir lik.',
      noGoalie: 'Ingen fast målvakt. En av utespillerne kan stå i mål.'
    },
    en: {
      line: function (len, c, n) { return 'The game is ' + len + ', with ' + c.on + ' skaters on the ice and ' + Math.max(0, n - c.on) + ' on the bench.'; },
      shift: function (c, times) { return 'A change every ' + (c.shift % 60 === 0 && c.shift > 60 ? c.shift / 60 + ' minutes' : c.shift + ' seconds') + '. Each player goes on about ' + times + ' ' + (times === 1 ? 'time' : 'times') + '.'; },
      open: 'The rules don’t set a game length, so pick your own.',
      flying: 'Changes on the fly: the app keeps track of the time so it stays equal.',
      noGoalie: 'No fixed goalie. One of the skaters can play in goal.'
    },
    sv: {
      line: function (len, c, n) { return 'Matchen är ' + len + ', med ' + c.on + ' utespelare på isen och ' + Math.max(0, n - c.on) + ' på bänken.'; },
      shift: function (c, times) { return 'Byte ' + (c.shift % 60 === 0 && c.shift > 60 ? 'var ' + c.shift / 60 + ':e minut' : 'var ' + c.shift + ':e sekund') + '. Varje spelare är på isen ungefär ' + times + ' ' + (times === 1 ? 'gång' : 'gånger') + '.'; },
      open: 'Reglerna säger inte hur lång matchen är, så välj matchlängd själv.',
      flying: 'Flygande byten: appen håller koll på tiden så att den blir lika.',
      noGoalie: 'Ingen fast målvakt. En av utespelarna kan stå i mål.'
    }
  }[lang] || null;
  if (!T) return;

  var rulesBtns = box.querySelectorAll('[data-rules]');
  var classBox = box.querySelector('[data-classes]');
  var out = box.querySelector('[data-players]');
  var lenOut = box.querySelector('[data-length]');
  var time = box.querySelector('[data-time]');
  var line = box.querySelector('[data-line]');
  var shiftEl = box.querySelector('[data-shift]');
  var rink = box.querySelector('[data-rink]');
  var goalieEl = box.querySelector('[data-goalie]');
  var goalieText = goalieEl.textContent;
  var openEl = box.querySelector('[data-open]');

  var state = { rules: box.getAttribute('data-default') || 'nihf', cls: 0, players: 10, min: null };
  state.cls = DEFAULT_CLASS[state.rules];
  if (!RULES[state.rules]) { state.rules = 'nihf'; state.cls = 1; }

  function fmt(sec) {
    sec = Math.round(sec);
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + ' min ' + (s < 10 ? '0' : '') + s + ' s';
  }

  function drawClasses() {
    classBox.innerHTML = '';
    RULES[state.rules].forEach(function (c, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'radio');
      b.textContent = c.t;
      b.addEventListener('click', function () { state.cls = i; state.min = null; render(); });
      classBox.appendChild(b);
    });
  }

  function render() {
    var c = RULES[state.rules][state.cls];
    if (state.players < c.on) state.players = c.on;
    var n = state.players;
    if (state.min === null) state.min = c.min;
    var min = state.min;
    // Står kamplengden i reglene og er uendret, vises den som i reglene (f.eks. «2 × 20 min»)
    var len = (min === c.min && c.len) ? c.len : min + ' min';
    var sec = min * 60 * c.on / n;

    rulesBtns.forEach(function (b) { b.setAttribute('aria-checked', String(b.getAttribute('data-rules') === state.rules)); });
    Array.prototype.forEach.call(classBox.children, function (b, i) { b.setAttribute('aria-checked', String(i === state.cls)); });
    out.textContent = n;
    box.querySelector('[data-step="-1"]').disabled = n <= c.on;
    box.querySelector('[data-step="1"]').disabled = n >= 20;
    lenOut.textContent = len;
    box.querySelector('[data-lenstep="-5"]').disabled = min <= 5;
    box.querySelector('[data-lenstep="5"]').disabled = min >= 90;

    time.textContent = fmt(sec);
    line.textContent = T.line(len, c, n);
    shiftEl.textContent = c.shift ? T.shift(c, Math.max(1, Math.round(sec / c.shift))) : T.flying;
    goalieEl.textContent = c.goalie ? goalieText : T.noGoalie;
    openEl.textContent = T.open;
    openEl.hidden = !c.open;

    rink.innerHTML = '';
    for (var i = 0; i < n; i++) {
      var d = document.createElement('span');
      d.className = 'dot' + (i < c.on ? ' on' : '');
      rink.appendChild(d);
    }
    box.classList.remove('bump');
    void box.offsetWidth; // start pulsen på nytt
    box.classList.add('bump');
  }

  rulesBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      state.rules = b.getAttribute('data-rules');
      state.cls = DEFAULT_CLASS[state.rules];
      state.min = null;
      drawClasses();
      render();
    });
  });
  box.querySelectorAll('[data-step]').forEach(function (b) {
    b.addEventListener('click', function () {
      state.players = Math.min(20, state.players + Number(b.getAttribute('data-step')));
      render();
    });
  });

  box.querySelectorAll('[data-lenstep]').forEach(function (b) {
    b.addEventListener('click', function () {
      // Hopp til nærmeste hele 5 min, så 16 min (2 × 8) blir 15 eller 20
      var step = Number(b.getAttribute('data-lenstep'));
      var m = state.min;
      m = step > 0 ? Math.floor(m / 5) * 5 + 5 : Math.ceil(m / 5) * 5 - 5;
      state.min = Math.max(5, Math.min(90, m));
      render();
    });
  });

  // Piltaster i radiogruppene, som vanlige radioknapper
  function arrows(group, onMove) {
    group.addEventListener('keydown', function (e) {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].indexOf(e.key) < 0) return;
      var items = Array.prototype.slice.call(group.querySelectorAll('[role="radio"]'));
      var i = items.indexOf(document.activeElement);
      if (i < 0) return;
      e.preventDefault();
      var next = (i + (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1) + items.length) % items.length;
      items[next].click();
      group.querySelectorAll('[role="radio"]')[next].focus();
    });
  }
  arrows(box.querySelector('.seg'));
  arrows(classBox);

  drawClasses();
  render();
  box.querySelector('.calc-controls').hidden = false;
  box.classList.remove('bump');
})();
