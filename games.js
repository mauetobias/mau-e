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
    setTimeout(function () { el.classList.remove('show'); setTimeout(function () { el.remove(); }, 500); }, 5200);
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
    logo:   { de: ['mau-e entschlüsselt', 'Ganz einfach: mein Nachname Maue, mit einem Bindestrich für die Optik.'], en: ['mau-e decoded', 'Simple: my last name Maue, with a hyphen for looks.'] },
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
    counter.hidden = n === 0;
    counter.querySelector('.egg-n').textContent = n + '/' + TOTAL;
    counter.querySelector('.egg-l').textContent = lang() === 'en' ? 'secrets found' : 'Geheimnisse gefunden';
    counter.classList.toggle('all', n === TOTAL);
  }
  function discover(id) {
    var e = EGGS[id]; if (!e) return;
    var fresh = !found[id];
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
  document.addEventListener('langchange', updateCounter);
  updateCounter();

  /* 1) Den Punkt hinter dem Namen 5x anklicken */
  var dot = document.querySelector('h1 .dot');
  if (dot) {
    var dc = 0, dTimer;
    dot.style.cursor = 'pointer';
    dot.addEventListener('click', function () {
      dc++; clearTimeout(dTimer); dTimer = setTimeout(function () { dc = 0; }, 2500);
      dot.style.transform = 'scale(' + (1 + dc * .25) + ')';
      if (dc >= 5) {
        dc = 0; dot.classList.add('sprouted');
        dot.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22V12" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M12 13c0-5 3.5-8 8.5-8 0 5-3.5 8-8.5 8z" fill="currentColor"/><path d="M12 16c0-4-3-6.5-7-6.5 0 4 3 6.5 7 6.5z" fill="currentColor" opacity=".7"/></svg>';
        dot.style.transform = '';
        discover('dot');
      }
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
    { q: { de: 'Um welches Spiel dreht sich bei CardCircle alles?', en: 'Which game is CardCircle all about?' },
      a: [{ de: 'Pokémon', en: 'Pokémon' }, { de: 'Yu-Gi-Oh!', en: 'Yu-Gi-Oh!' }, { de: 'Magic: The Gathering', en: 'Magic: The Gathering' }, { de: 'Skat', en: 'Skat' }], c: 2 },
    { q: { de: 'In welcher Region ist CardCircle zu Hause?', en: 'Where is CardCircle based?' },
      a: [{ de: 'Rhein-Neckar', en: 'Rhine-Neckar' }, { de: 'Ruhrgebiet', en: 'Ruhr area' }, { de: 'Bodensee', en: 'Lake Constance' }, { de: 'Berlin', en: 'Berlin' }], c: 0 },
    { q: { de: 'In welcher Stadt ging es bei TIER los?', en: 'In which city did it all start at TIER?' },
      a: [{ de: 'Frankfurt', en: 'Frankfurt' }, { de: 'Mainz', en: 'Mainz' }, { de: 'Darmstadt', en: 'Darmstadt' }, { de: 'Kaiserslautern', en: 'Kaiserslautern' }], c: 3 },
    { q: { de: 'In welcher Branche war VARM unterwegs?', en: 'Which industry was VARM in?' },
      a: [{ de: 'FinTech', en: 'FinTech' }, { de: 'Climate Tech', en: 'Climate tech' }, { de: 'Food Delivery', en: 'Food delivery' }, { de: 'Gaming', en: 'Gaming' }], c: 1 },
    { q: { de: 'Welcher Standort kam bei VARM neu dazu?', en: 'Which new location did VARM launch?' },
      a: [{ de: 'München', en: 'Munich' }, { de: 'Köln', en: 'Cologne' }, { de: 'Hamburg', en: 'Hamburg' }, { de: 'Wien', en: 'Vienna' }], c: 2 },
    { q: { de: 'In wie vielen Bundesländern hat Tobias schon gewirkt?', en: 'In how many German states has Tobias worked?' },
      a: [{ de: '2', en: '2' }, { de: '3', en: '3' }, { de: '5', en: '5' }, { de: '8', en: '8' }], c: 2 },
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
