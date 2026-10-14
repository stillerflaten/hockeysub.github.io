/* Istid-kalkulatoren på forsiden: klasse + antall utespillere -> istid per barn.
   Tallene er de samme som i appen (Rulebook.swift). Uten JavaScript står standardsvaret
   i HTML-en, og valgene er skjult. */
(function () {
  var box = document.querySelector('[data-calc]');
  if (!box) return;

  // on = utespillere på isen samtidig (målvakt ikke med), min = kamptid i minutter, shift = sekunder mellom bytter (null = flyvende)
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
    ]
  };
  var DEFAULT_CLASS = { nihf: 1, sweden: 0 };

  var lang = (document.documentElement.lang || 'no').slice(0, 2);
  var T = {
    no: {
      line: function (c, n) { return 'Kampen er ' + c.len + ', med ' + c.on + ' utespillere på isen og ' + Math.max(0, n - c.on) + ' på benken.'; },
      shift: function (c, times) { return 'Bytte hvert ' + c.shift + '. sekund. Hver spiller er på isen omtrent ' + times + ' ' + (times === 1 ? 'gang' : 'ganger') + '.'; },
      flying: 'Flyvende bytter: appen holder styr på tiden, så den blir lik.',
      noGoalie: 'Ingen fast målvakt. En av utespillerne kan stå i mål.'
    },
    en: {
      line: function (c, n) { return 'The game is ' + c.len + ', with ' + c.on + ' skaters on the ice and ' + Math.max(0, n - c.on) + ' on the bench.'; },
      shift: function (c, times) { return 'A change every ' + c.shift + ' seconds. Each player goes on about ' + times + ' ' + (times === 1 ? 'time' : 'times') + '.'; },
      flying: 'Changes on the fly: the app keeps track of the time so it stays equal.',
      noGoalie: 'No fixed goalie. One of the skaters can play in goal.'
    },
    sv: {
      line: function (c, n) { return 'Matchen är ' + c.len + ', med ' + c.on + ' utespelare på isen och ' + Math.max(0, n - c.on) + ' på bänken.'; },
      shift: function (c, times) { return 'Byte var ' + c.shift + ':e sekund. Varje spelare är på isen ungefär ' + times + ' ' + (times === 1 ? 'gång' : 'gånger') + '.'; },
      flying: 'Flygande byten: appen håller koll på tiden så att den blir lika.',
      noGoalie: 'Ingen fast målvakt. En av utespelarna kan stå i mål.'
    }
  }[lang] || null;
  if (!T) return;

  var rulesBtns = box.querySelectorAll('[data-rules]');
  var classBox = box.querySelector('[data-classes]');
  var out = box.querySelector('[data-players]');
  var time = box.querySelector('[data-time]');
  var line = box.querySelector('[data-line]');
  var shiftEl = box.querySelector('[data-shift]');
  var rink = box.querySelector('[data-rink]');
  var goalieEl = box.querySelector('[data-goalie]');
  var goalieText = goalieEl.textContent;

  var state = { rules: box.getAttribute('data-default') || 'nihf', cls: 0, players: 10 };
  state.cls = DEFAULT_CLASS[state.rules];

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
      b.addEventListener('click', function () { state.cls = i; render(); });
      classBox.appendChild(b);
    });
  }

  function render() {
    var c = RULES[state.rules][state.cls];
    if (state.players < c.on) state.players = c.on;
    var n = state.players;
    var sec = c.min * 60 * c.on / n;

    rulesBtns.forEach(function (b) { b.setAttribute('aria-checked', String(b.getAttribute('data-rules') === state.rules)); });
    Array.prototype.forEach.call(classBox.children, function (b, i) { b.setAttribute('aria-checked', String(i === state.cls)); });
    out.textContent = n;
    box.querySelector('[data-step="-1"]').disabled = n <= c.on;
    box.querySelector('[data-step="1"]').disabled = n >= 20;

    time.textContent = fmt(sec);
    line.textContent = T.line(c, n);
    shiftEl.textContent = c.shift ? T.shift(c, Math.max(1, Math.round(sec / c.shift))) : T.flying;
    goalieEl.textContent = c.goalie ? goalieText : T.noGoalie;

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
