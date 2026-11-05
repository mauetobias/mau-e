/* =========================================================
   Spielereien auf mau-e.com
   Quiz "Wie gut kennst du mich?" + versteckte Geheimnisse
   ========================================================= */
(function () {
  'use strict';

  function lang() { return window.LANG === 'en' ? 'en' : 'de'; }
  function t(obj) { return obj[lang()]; }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  /* ---------------- Hinweis-Toasts ---------------- */
  var toastBox = document.createElement('div');
  toastBox.className = 'toasts';
  toastBox.setAttribute('aria-live', 'polite');
  document.body.appendChild(toastBox);
  function toast(title, text) {
    var el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = '<span class="toast-icon" aria-hidden="true">🌱</span><div><strong></strong><p></p></div>';
    el.querySelector('strong').textContent = title;
    el.querySelector('p').textContent = text;
    toastBox.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('show'); });
    setTimeout(function () { el.classList.remove('show'); setTimeout(function () { el.remove(); }, 500); }, Math.max(5200, text.length * 55));
  }

  /* ---------------- Blätterregen ---------------- */
  function leafRain(count) {
    var cv = document.createElement('canvas');
    cv.className = 'leaf-rain';
    document.body.appendChild(cv);
    var ctx = cv.getContext('2d'), W = cv.width = innerWidth, H = cv.height = innerHeight;
    var cols = ['#D4913F', '#8E9B8C', '#B7C0B1', '#5F6F63', '#E2A65A'];
    var leaves = [];
    for (var i = 0; i < (count || 70); i++) leaves.push({
      x: Math.random() * W, y: -20 - Math.random() * H * .6, s: 6 + Math.random() * 9,
      vy: 1.2 + Math.random() * 2.2, vx: -1 + Math.random() * 2, r: Math.random() * 6.3, vr: -.06 + Math.random() * .12,
      sw: Math.random() * 6.3, c: cols[i % cols.length]
    });
    var start = performance.now();
    (function frame(now) {
      ctx.clearRect(0, 0, W, H);
      var alive = false;
      leaves.forEach(function (l) {
        l.y += l.vy; l.sw += .04; l.x += l.vx + Math.sin(l.sw) * .8; l.r += l.vr;
        if (l.y < H + 30) alive = true;
        ctx.save(); ctx.translate(l.x, l.y); ctx.rotate(l.r); ctx.fillStyle = l.c;
        ctx.beginPath(); ctx.moveTo(0, -l.s); ctx.quadraticCurveTo(l.s * .8, 0, 0, l.s); ctx.quadraticCurveTo(-l.s * .8, 0, 0, -l.s); ctx.fill();
        ctx.restore();
      });
      if (alive && now - start < 9000) requestAnimationFrame(frame); else cv.remove();
    })(start);
  }

  /* ---------------- Geheimnisse ---------------- */
  var EGGS = {
    dot:    { de: ['Aus einem Punkt wird etwas', 'So fängt alles an: klein, unscheinbar und dann wächst es.'], en: ['A dot becomes something', 'That is how it starts: small, easy to miss, and then it grows.'] },
    photo:  { de: ['Ertappt', 'Ja, das bin wirklich ich. Und ja, ich lache meistens so.'], en: ['Caught', 'Yes, that is really me. And yes, I usually laugh like that.'] },
    logo:   { de: ['mau-e entschlüsselt', 'Der Bindestrich hat einen Grund: So klappt die richtige Aussprache. Mau-e, mit Betonung auf dem e.'], en: ['mau-e decoded', 'The hyphen is there for a reason: it gets the pronunciation right. Mau-e, with the stress on the e.'] },
    theme:  { de: ['Hell, dunkel, hell …', 'Entscheidungsfreude ist eine Stärke. Meistens.'], en: ['Light, dark, light …', 'Decisiveness is a strength. Most of the time.'] },
    konami: { de: ['Old School!', 'Wer den Konami Code kennt, hat Geschichte. Respekt.'], en: ['Old school!', 'If you know the Konami Code, you have history. Respect.'] },
    console:{ de: ['Hallo zurück', 'Du hast die Konsole gefunden. Ich mag Leute, die unter die Haube schauen.'], en: ['Hello back', 'You found the console. I like people who look under the hood.'] },
    quiz:   { de: ['Quiz bestanden', 'Du kennst mich besser als die meisten. Die Fast Lane ist frei.'], en: ['Quiz passed', 'You know me better than most. The fast lane is open.'] }
  };
  var TOTAL = Object.keys(EGGS).length;
  var found = {};
  try { found = JSON.parse(store('eggs') || '{}') || {}; } catch (e) { found = {}; }

  var counter = document.getElementById('egg-counter');
  function updateCounter() {
    var n = Object.keys(found).length;
    if (!counter) return;
    counter.hidden = false;
    counter.querySelector('.egg-n').textContent = n + '/' + TOTAL;
    counter.querySelector('.egg-l').textContent = lang() === 'en' ? 'secrets found' : 'Geheimnisse gefunden';
    counter.classList.toggle('all', n === TOTAL);
  }
  function discover(id) {
    var e = EGGS[id]; if (!e) return;
    var fresh = !found[id];
    if (!found[id] && window.mauTrack) window.mauTrack('Geheimnis gefunden', { geheimnis: id });
    found[id] = 1; store('eggs', JSON.stringify(found));
    var txt = t(e);
    toast(txt[0], txt[1] + (fresh ? (lang() === 'en' ? '  (' : '  (') + Object.keys(found).length + '/' + TOTAL + ')' : ''));
    updateCounter();
    if (fresh && Object.keys(found).length === TOTAL) {
      setTimeout(function () {
        leafRain(120);
        toast(lang() === 'en' ? 'All secrets found!' : 'Alle Geheimnisse gefunden!',
              lang() === 'en' ? 'Seriously impressive. Now you really have to get in touch.' : 'Ernsthaft beeindruckend. Jetzt musst du dich wirklich melden.');
      }, 1200);
    }
  }
  window.mauDiscover = discover;

  /* Übersicht der gefundenen Geheimnisse (Klick auf den Zähler unten) */
  var ORDER = ['dot', 'photo', 'logo', 'theme', 'konami', 'console', 'quiz'];
  var panel = document.createElement('dialog');
  panel.className = 'egg-panel';
  panel.setAttribute('aria-labelledby', 'egg-panel-title');
  document.body.appendChild(panel);
  /* Tipps, wenn man nicht weiterkommt: erst ein Hinweis, dann die Lösung */
  var HINTS = {
    dot:     { de: ['Schau dir den Punkt hinter meinem Namen ganz oben genauer an. Einmal klicken reicht nicht.', 'Klick fünfmal schnell hintereinander auf den Punkt hinter "Tobias Maue".'], en: ['Take a closer look at the dot after my name at the very top. One click is not enough.', 'Click the dot after "Tobias Maue" five times in quick succession.'] },
    photo:   { de: ['Mein Foto freut sich über Aufmerksamkeit.', 'Klick oder tipp dreimal schnell auf mein Foto bei "Über mich".'], en: ['My photo likes some attention.', 'Click or tap my photo in "About me" three times quickly.'] },
    logo:    { de: ['Oben links steht mehr als nur ein Name.', 'Klick dreimal schnell auf "mau-e" oben links.'], en: ['Top left is more than just a name.', 'Click "mau-e" in the top left three times quickly.'] },
    theme:   { de: ['Kannst du dich zwischen hell und dunkel entscheiden?', 'Schalte sechsmal hintereinander zwischen hell und dunkel um (Sonne/Mond oben rechts).'], en: ['Can you decide between light and dark?', 'Switch between light and dark six times in a row (sun/moon at the top right).'] },
    konami:  { de: ['Ein Klassiker aus Videospielen der 80er, eingegeben auf der Tastatur.', 'Tippe auf der Tastatur: ↑ ↑ ↓ ↓ ← → ← → B A'], en: ['A classic from 80s video games, typed on the keyboard.', 'Type on your keyboard: ↑ ↑ ↓ ↓ ← → ← → B A'] },
    console: { de: ['Entwickler schauen dahin, wo andere nicht hinschauen.', 'Öffne die Entwicklerkonsole deines Browsers (meist F12), dort wartet eine Nachricht. Tipp dann hallo() ein und drück Enter.'], en: ['Developers look where others do not.', 'Open your browser\'s developer console (usually F12), a message is waiting there. Then type hallo() and hit enter.'] },
    quiz:    { de: ['Wie gut kennst du mich wirklich?', 'Mach das Quiz weiter unten und bestehe es.'], en: ['How well do you really know me?', 'Take the quiz further down the page and pass it.'] }
  };
  var hintLv = {};
  try { hintLv = JSON.parse(store('eggHints') || '{}') || {}; } catch (e) { hintLv = {}; }
  function openPanel() { openPanelInner(); if (panel.showModal) { if (!panel.open) panel.showModal(); } else panel.setAttribute('open', ''); }
  function openPanelInner() {
    var n = Object.keys(found).length, en = lang() === 'en';
    var html = '<button type="button" class="egg-close" aria-label="' + (en ? 'Close' : 'Schließen') + '">×</button>' +
      '<p class="egg-kicker">🌱 ' + n + '/' + TOTAL + '</p>' +
      '<h3 id="egg-panel-title">' + (en ? 'Your discoveries' : 'Deine Entdeckungen') + '</h3><ul class="egg-list">';
    ORDER.forEach(function (id) {
      if (found[id]) {
        var tx = t(EGGS[id]);
        html += '<li class="got"><span class="egg-mark" aria-hidden="true">✓</span><div><b></b><p></p></div></li>'.replace('<b></b>', '<b>' + tx[0] + '</b>').replace('<p></p>', '<p>' + tx[1] + '</p>');
      } else {
        var lv = hintLv[id] || 0, hs = HINTS[id][en ? 'en' : 'de'];
        html += '<li class="locked"><span class="egg-mark" aria-hidden="true">?</span><div><b>' + (en ? 'Not discovered yet' : 'Noch nicht entdeckt') + '</b><p>' +
          (lv ? '💡 ' + hs[lv - 1] : (en ? 'Keep looking. It is somewhere on this page.' : 'Such weiter. Es ist irgendwo auf dieser Seite.')) + '</p>' +
          (lv < hs.length ? '<button type="button" class="egg-hint" data-id="' + id + '">' + (lv ? (en ? 'Show solution' : 'Lösung zeigen') : (en ? 'Get a hint' : 'Tipp anzeigen')) + '</button>' : '') + '</div></li>';
      }
    });
    html += '</ul>' + (n === TOTAL ? '<p class="egg-done">' + (en ? 'All found. Respect!' : 'Alles gefunden. Respekt!') + '</p>' : '');
    panel.innerHTML = html;
    panel.querySelector('.egg-close').addEventListener('click', function () { panel.close(); });
    Array.prototype.forEach.call(panel.querySelectorAll('.egg-hint'), function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-id'); hintLv[id] = (hintLv[id] || 0) + 1; store('eggHints', JSON.stringify(hintLv));
        if (window.mauTrack) window.mauTrack('Geheimnis-Tipp', { geheimnis: id, stufe: hintLv[id] });
        openPanelInner();
      });
    });
  }
  panel.addEventListener('click', function (e) { if (e.target === panel) panel.close(); });
  if (counter) {
    counter.setAttribute('role', 'button'); counter.setAttribute('tabindex', '0');
    counter.addEventListener('click', openPanel);
    counter.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPanel(); } });
  }
  document.addEventListener('langchange', updateCounter);
  updateCounter();

  /* 1) Den Punkt hinter dem Namen anklicken: je 5 Klicks pro Stufe.
     Kern -> Trieb -> Bäumchen -> Baum -> Samen fällt -> Kern */
  var dot = document.querySelector('h1 .dot');
  if (dot) {
    var dc = 0, dTimer, stage = 0, busy = false;
    var C = 'currentColor';
    var STAGES = [
      null,
      /* 1: Trieb */
      '<path d="M12 22V12" stroke="' + C + '" stroke-width="2.6" stroke-linecap="round"/><path d="M12 13c0-5 3.5-8 8.5-8 0 5-3.5 8-8.5 8z" fill="' + C + '"/><path d="M12 16c0-4-3-6.5-7-6.5 0 4 3 6.5 7 6.5z" fill="' + C + '" opacity=".7"/>',
      /* 2: Bäumchen */
      '<path d="M12 23.5V6" stroke="' + C + '" stroke-width="2" stroke-linecap="round"/><path d="M12 15l-4.5-4M12 11.5l4.5-4M12 18l3.5-2.5" stroke="' + C + '" stroke-width="1.3" stroke-linecap="round"/>' +
        '<ellipse cx="12" cy="4.5" rx="2.2" ry="3" fill="' + C + '"/><ellipse cx="6.5" cy="9.5" rx="2.6" ry="1.8" transform="rotate(-35 6.5 9.5)" fill="' + C + '" opacity=".8"/><ellipse cx="17.5" cy="6" rx="2.6" ry="1.8" transform="rotate(35 17.5 6)" fill="' + C + '" opacity=".8"/><ellipse cx="16.5" cy="15" rx="2.2" ry="1.5" transform="rotate(25 16.5 15)" fill="' + C + '" opacity=".65"/>',
      /* 3: Baum */
      '<path d="M12 23.6v-10" stroke="' + C + '" stroke-width="2.8" stroke-linecap="round"/><path d="M12 18l-3.5-3.5M12 16l3.5-3" stroke="' + C + '" stroke-width="1.6" stroke-linecap="round"/>' +
        '<circle cx="12" cy="7.5" r="6.5" fill="' + C + '" opacity=".9"/><circle cx="6.5" cy="11" r="4.4" fill="' + C + '" opacity=".75"/><circle cx="17.5" cy="11" r="4.4" fill="' + C + '" opacity=".75"/><circle cx="12" cy="12.5" r="3.6" fill="' + C + '" opacity=".6"/>'
    ];
    function show(n, extra) {
      dot.className = 'dot sprouted stage-' + n;
      dot.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + STAGES[n] + (extra || '') + '</svg>';
    }
    function pump() {
      /* bei jedem Klick ein Stück anwachsen */
      var el = stage === 0 ? dot : dot.querySelector('svg');
      if (el) el.style.transform = 'scale(' + (1 + dc * (stage === 0 ? .25 : .07)) + ')';
    }
    dot.style.cursor = 'pointer';
    dot.addEventListener('click', function () {
      if (busy) return;
      dc++; clearTimeout(dTimer);
      dTimer = setTimeout(function () { dc = 0; pump(); }, 2500);
      if (dc < 5) { pump(); return; }
      dc = 0; dot.style.transform = '';
      if (stage < 3) {
        stage++; show(stage);
        if (stage === 1) discover('dot');
        return;
      }
      /* Baum wirft einen Samen ab: er fällt genau an den Platz des Punkts,
         danach wird der Baum gefällt und der Kern bleibt liegen */
      busy = true;
      var svg = dot.querySelector('svg');
      svg.style.transform = '';
      var seed = document.createElement('span');
      seed.className = 'seedfall'; seed.textContent = '.';
      dot.classList.add('dropping');
      dot.insertBefore(seed, svg);
      /* Zielbreite = Breite des normalen Punkts */
      var probe = document.createElement('span');
      probe.textContent = '.'; probe.style.cssText = 'position:absolute;visibility:hidden';
      dot.parentNode.appendChild(probe);
      var w = probe.getBoundingClientRect().width; probe.remove();
      setTimeout(function () {
        dot.classList.add('felled');
        setTimeout(function () {
          dot.style.width = dot.getBoundingClientRect().width + 'px';
          void dot.offsetWidth;
          dot.style.transition = 'width .45s ease';
          dot.style.width = w + 'px';
          setTimeout(function () {
            dot.className = 'dot'; dot.style.width = ''; dot.style.transition = '';
            dot.textContent = '.';
            stage = 0; busy = false;
          }, 480);
        }, 1200);
      }, 1850);
    });
  }

  /* 2) Das Foto 3x anklicken */
  var photo = document.querySelector('.portrait');
  if (photo) {
    var pc = 0, pTimer;
    photo.addEventListener('click', function () {
      pc++; clearTimeout(pTimer); pTimer = setTimeout(function () { pc = 0; }, 1500);
      photo.classList.remove('wiggle'); void photo.offsetWidth; photo.classList.add('wiggle');
      if (pc >= 3) { pc = 0; discover('photo'); }
    });
  }

  /* 3) Das Logo oben 3x anklicken */
  var logo = document.querySelector('nav .logo');
  if (logo) {
    var lc = 0, lTimer;
    logo.addEventListener('click', function () {
      lc++; clearTimeout(lTimer); lTimer = setTimeout(function () { lc = 0; }, 1500);
      if (lc >= 3) { lc = 0; discover('logo'); }
    });
  }

  /* 4) Hell/Dunkel 6x hintereinander umschalten */
  var tc = 0, tTimer;
  document.addEventListener('themechange', function () {
    tc++; clearTimeout(tTimer); tTimer = setTimeout(function () { tc = 0; }, 4000);
    if (tc >= 6) { tc = 0; discover('theme'); }
  });

  /* 5) Konami Code: ↑ ↑ ↓ ↓ ← → ← → B A */
  var KONAMI = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'], kp = 0;
  document.addEventListener('keydown', function (e) {
    var k = (e.key || '').toLowerCase();
    kp = k === KONAMI[kp] ? kp + 1 : (k === KONAMI[0] ? 1 : 0);
    if (kp === KONAMI.length) { kp = 0; leafRain(90); discover('konami'); }
  });

  /* 6) Konsole: hallo() eintippen */
  var cs = 'color:#D4913F;font:600 15px Georgia,serif';
  var cs2 = 'color:#8E9B8C;font:13px sans-serif';
  console.log('%c🌱 Na, neugierig?', cs);
  console.log('%cDu schaust also gern unter die Haube. Tipp mal  hallo()  ein und drück Enter.\nCurious? Type  hallo()  and hit enter.', cs2);
  window.hallo = window.hello = function () {
    discover('console');
    console.log('%cHallo zurück! Schreib mir über das Kontaktformular, ich freue mich.', cs);
    return '🌱';
  };

  /* ---------------- Quiz ---------------- */
  var Q = [
    { q: { de: 'Was hat Tobias studiert?', en: 'What did Tobias study?' },
      a: [{ de: 'Maschinenbau', en: 'Mechanical Engineering' }, { de: 'BWL', en: 'Business Administration' }, { de: 'Informatik', en: 'Computer Science' }, { de: 'Architektur', en: 'Architecture' }], c: 0 },
    { q: { de: 'An welcher Hochschule?', en: 'At which university?' },
      a: [{ de: 'TU München', en: 'TU Munich' }, { de: 'DHBW Mannheim', en: 'DHBW Mannheim' }, { de: 'Uni Heidelberg', en: 'Heidelberg University' }, { de: 'KIT Karlsruhe', en: 'KIT Karlsruhe' }], c: 1 },
    { q: { de: 'Welches Spiel steht bei CardCircle aktuell im Fokus?', en: 'Which game is CardCircle currently focused on?' },
      a: [{ de: 'Schach', en: 'Chess' }, { de: 'Yu-Gi-Oh!', en: 'Yu-Gi-Oh!' }, { de: 'Magic: The Gathering', en: 'Magic: The Gathering' }, { de: 'Skat', en: 'Skat' }], c: 2 },
    { q: { de: 'In welcher Region ist CardCircle zu Hause?', en: 'Where is CardCircle based?' },
      a: [{ de: 'Rhein-Neckar', en: 'Rhine-Neckar' }, { de: 'Ruhrgebiet', en: 'Ruhr area' }, { de: 'Bodensee', en: 'Lake Constance' }, { de: 'Berlin', en: 'Berlin' }], c: 0 },
    { q: { de: 'In welcher Stadt ging es bei TIER los?', en: 'In which city did it all start at TIER?' },
      a: [{ de: 'Frankfurt', en: 'Frankfurt' }, { de: 'Mainz', en: 'Mainz' }, { de: 'Darmstadt', en: 'Darmstadt' }, { de: 'Kaiserslautern', en: 'Kaiserslautern' }], c: 3 },
    { q: { de: 'In welcher Branche war VARM unterwegs?', en: 'Which industry was VARM in?' },
      a: [{ de: 'FinTech', en: 'FinTech' }, { de: 'Climate Tech', en: 'Climate tech' }, { de: 'Food Delivery', en: 'Food delivery' }, { de: 'Gaming', en: 'Gaming' }], c: 1 },
    { q: { de: 'Welcher Standort kam bei VARM neu dazu?', en: 'Which new location did VARM launch?' },
      a: [{ de: 'München', en: 'Munich' }, { de: 'Köln', en: 'Cologne' }, { de: 'Hamburg', en: 'Hamburg' }, { de: 'Wien', en: 'Vienna' }], c: 2 },
    { q: { de: 'In wie vielen Bundesländern war Tobias beruflich schon unterwegs?', en: 'In how many German states has Tobias worked?' },
      a: [{ de: '3', en: '3' }, { de: '5', en: '5' }, { de: '9', en: '9' }, { de: '12', en: '12' }], c: 2 },
    { q: { de: 'Was reizt Tobias mehr?', en: 'What excites Tobias more?' },
      a: [{ de: 'Der große, eingefahrene Konzern', en: 'The big, established corporation' }, { de: 'Etwas Neues aufbauen', en: 'Building something new' }, { de: 'Möglichst viel gleichzeitig', en: 'Doing as much as possible at once' }, { de: 'Verwalten, was schon läuft', en: 'Managing what already runs' }], c: 1 },
    { q: { de: 'Welches Symbol zeigt diese Seite im Browser-Tab?', en: 'Which icon does this site show in the browser tab?' },
      a: [{ de: 'Einen Stern', en: 'A star' }, { de: 'Ein Herz', en: 'A heart' }, { de: 'Einen Trieb', en: 'A sprout' }, { de: 'Ein M', en: 'An M' }], c: 2 }
  ];
  var PASS = 8;

  var box = document.getElementById('quiz-box');
  if (!box) return;
  var idx = 0, score = 0, locked = false, order = [];

  function shuffle(n) { var a = []; for (var i = 0; i < n; i++) a.push(i); for (i = n - 1; i > 0; i--) { var j = Math.random() * (i + 1) | 0, x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function L(de, en) { return lang() === 'en' ? en : de; }

  function startScreen() {
    var passed = store('fastlane') === '1';
    box.innerHTML =
      '<div class="quiz-start">' +
        '<p class="quiz-kicker">' + L('10 Fragen · ca. 2 Minuten', '10 questions · about 2 minutes') + '</p>' +
        '<h3>' + L('Wie gut kennst du mich?', 'How well do you know me?') + '</h3>' +
        '<p>' + L('Alle Antworten stehen irgendwo auf dieser Seite. Ab ' + PASS + ' richtigen Antworten schaltest du die <b>Fast Lane</b> frei: Deine Nachricht landet bei mir ganz oben.',
                  'Every answer is somewhere on this page. Get ' + PASS + ' or more right to unlock the <b>fast lane</b>: your message lands at the top of my inbox.') + '</p>' +
        (passed ? '<p class="quiz-passed">⚡ ' + L('Du hast die Fast Lane schon freigeschaltet.', 'You already unlocked the fast lane.') + '</p>' : '') +
        '<button type="button" class="btn quiz-go">' + (passed ? L('Nochmal spielen', 'Play again') : L('Quiz starten', 'Start quiz')) + '</button>' +
      '</div>';
    box.querySelector('.quiz-go').addEventListener('click', function () { idx = 0; score = 0; order = shuffle(Q.length); question(); });
  }

  function question() {
    var item = Q[order[idx]], opts = shuffle(item.a.length);
    locked = false;
    var html = '<div class="quiz-top"><span>' + L('Frage', 'Question') + ' ' + (idx + 1) + '/' + Q.length + '</span><span>' + score + ' ✓</span></div>' +
      '<div class="quiz-bar"><i style="width:' + (idx / Q.length * 100) + '%"></i></div>' +
      '<h3 class="quiz-q">' + t(item.q) + '</h3><div class="quiz-opts">';
    opts.forEach(function (o) { html += '<button type="button" class="quiz-opt" data-i="' + o + '">' + t(item.a[o]) + '</button>'; });
    box.innerHTML = html + '</div>';
    box.querySelectorAll('.quiz-opt').forEach(function (b) {
      b.addEventListener('click', function () {
        if (locked) return; locked = true;
        var ok = +b.dataset.i === item.c;
        if (ok) score++;
        b.classList.add(ok ? 'right' : 'wrong');
        if (!ok) box.querySelector('.quiz-opt[data-i="' + item.c + '"]').classList.add('right');
        setTimeout(function () { idx++; if (idx < Q.length) question(); else result(); }, ok ? 650 : 1300);
      });
    });
  }

  function result() {
    var pct = Math.round(score / Q.length * 100), pass = score >= PASS;
    var msg = pass ? L('Stark! Du kennst mich wirklich.', 'Great! You really know me.')
      : score >= 5 ? L('Nicht schlecht. Noch ein Blick auf die Seite und du schaffst es.', 'Not bad. One more look at the page and you will make it.')
      : L('Da geht noch was. Die Antworten stehen alle auf dieser Seite.', 'Room to grow. All answers are on this page.');
    box.innerHTML = '<div class="quiz-result">' +
      '<div class="quiz-score"><b>' + score + '</b><span>/' + Q.length + '</span></div>' +
      '<p class="quiz-pct">' + pct + ' %</p><h3>' + msg + '</h3>' +
      (pass ? '<div class="fastlane-card">⚡ <b>Fast Lane</b> ' + L('freigeschaltet. Schreib mir jetzt über das Kontaktformular, deine Nachricht kommt bei mir als Fast Lane an.', 'unlocked. Send me a message through the contact form and it reaches me marked as fast lane.') + '</div>' +
              '<a href="#contact" class="btn quiz-go">' + L('Zum Kontaktformular', 'Go to contact form') + '</a>'
            : '<button type="button" class="btn quiz-go quiz-retry">' + L('Nochmal versuchen', 'Try again') + '</button>') +
      '</div>';
    var r = box.querySelector('.quiz-retry');
    if (r) r.addEventListener('click', function () { idx = 0; score = 0; order = shuffle(Q.length); question(); });
    if (window.mauTrack) window.mauTrack('Quiz beendet', { punkte: score, bestanden: pass });
    if (pass) {
      store('fastlane', '1'); store('fastlane-score', String(score));
      leafRain(110); discover('quiz'); enableFastLane();
    }
  }

  /* Fast Lane im Kontaktformular */
  function enableFastLane() {
    var form = document.getElementById('contact-form'); if (!form) return;
    var subj = form.querySelector('input[name="_subject"]');
    if (!subj) { subj = document.createElement('input'); subj.type = 'hidden'; subj.name = '_subject'; form.appendChild(subj); }
    subj.value = '⚡ Fast Lane: Nachricht über mau-e.com';
    var fl = form.querySelector('input[name="fast_lane"]');
    if (!fl) { fl = document.createElement('input'); fl.type = 'hidden'; fl.name = 'fast_lane'; form.appendChild(fl); }
    fl.value = 'Ja, Quiz mit ' + (store('fastlane-score') || PASS) + '/10 bestanden';
    var badge = form.querySelector('.fastlane-badge');
    if (!badge) { badge = document.createElement('div'); badge.className = 'fastlane-badge'; form.insertBefore(badge, form.firstChild); }
    badge.textContent = L('⚡ Fast Lane aktiv: Deine Nachricht wird bei mir hervorgehoben.', '⚡ Fast lane active: your message gets priority.');
  }
  if (store('fastlane') === '1') enableFastLane();

  document.addEventListener('langchange', function () {
    if (!box.querySelector('.quiz-opt') && !box.querySelector('.quiz-result')) startScreen();
    if (store('fastlane') === '1') enableFastLane();
  });
  startScreen();
})();
