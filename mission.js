/* Layout „Future" · Konzept „Mission im grünen All"
   Baut die Zusatz-Elemente für das zweite Layout. Alles bleibt im klassischen Layout unsichtbar.
   Inhalte (Stationen, Unternehmen) werden aus dem normalen HTML übernommen, damit Texte und
   Übersetzungen nur an einer Stelle gepflegt werden. */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && matchMedia('(pointer: fine)').matches;
  function isF() { return root.getAttribute('data-design') === 'future'; }
  function en() { return window.LANG === 'en'; }
  var T = {
    de: {
      crew: 'Crew', role: 'Rolle', roleV: 'Co-Founder & CEO · CardCircle', status: 'Status', statusV: 'Offen für Neues', missions: 'Missionen', missionsV: '4 Unternehmen mit aufgebaut',
      next: 'Nächstes Kapitel', slot: 'Dein Projekt?', sysHint: 'Planet antippen für die Missionsdaten',
      dock: 'Andocken', station: 'Station', now: 'Aktuell', close: 'Schließen',
      freeT: 'Freier Andockplatz', freeP: 'Hier ist noch Platz für die nächste Mission. Du baust etwas Neues? Lass uns reden.', freeB: 'Mission starten',
      routeHint: 'Scrollen, um die Route abzufliegen · Station antippen zum Andocken',
      fuel: 'Treibstoff', ready: 'Startklar', liftoff: 'Abheben!', fuelHint: 'Jede richtige Antwort tankt nach.',
      hhTl: 'Mission Control', hhBr: 'Kurs: Neues'
    },
    en: {
      crew: 'Crew', role: 'Role', roleV: 'Co-founder & CEO · CardCircle', status: 'Status', statusV: 'Open to new things', missions: 'Missions', missionsV: 'Helped build 4 companies',
      next: 'Next chapter', slot: 'Your project?', sysHint: 'Tap a planet for the mission data',
      dock: 'Dock', station: 'Station', now: 'Current', close: 'Close',
      freeT: 'Free docking bay', freeP: 'There is room for the next mission. Building something new? Let’s talk.', freeB: 'Start a mission',
      routeHint: 'Scroll to fly the route · tap a station to dock',
      fuel: 'Fuel', ready: 'Ready', liftoff: 'Liftoff!', fuelHint: 'Every right answer adds fuel.',
      hhTl: 'Mission Control', hhBr: 'Heading: new'
    }
  };
  function t(k) { return T[en() ? 'en' : 'de'][k]; }
  var painters = [];
  function texts() { painters.forEach(function (f) { f(); }); }

  /* ---------- Hero-HUD ---------- */
  painters.push(function () {
    var a = document.querySelector('.hero-hud .hh-tl'), b = document.querySelector('.hero-hud .hh-br');
    if (a) a.textContent = t('hhTl'); if (b) b.textContent = t('hhBr');
  });

  /* ---------- Über mich: Crew-Akte mit Orbit ---------- */
  (function () {
    var p = document.querySelector('.about .portrait'); if (!p) return;
    var crew = document.createElement('div'); crew.className = 'crew';
    p.parentNode.insertBefore(crew, p); crew.appendChild(p);
    var orb = document.createElement('div'); orb.className = 'crew-orbit'; orb.setAttribute('aria-hidden', 'true');
    orb.innerHTML = '<i class="sat"></i>'; crew.appendChild(orb);
    var id = document.createElement('dl'); id.className = 'crew-id'; crew.appendChild(id);
    painters.push(function () {
      id.innerHTML = '<div><dt>' + t('crew') + '</dt><dd>Tobias Maue</dd></div>' +
        '<div><dt>' + t('role') + '</dt><dd>' + t('roleV').replace('&', '&amp;') + '</dd></div>' +
        '<div><dt>' + t('missions') + '</dt><dd>' + t('missionsV') + '</dd></div>' +
        '<div><dt>' + t('status') + '</dt><dd class="live">' + t('statusV') + '</dd></div>';
    });
  })();

  /* ---------- Unternehmen: Planetensystem ---------- */
  (function () {
    var sec = document.getElementById('ventures'); if (!sec) return;
    var grid = sec.querySelector('.venture-grid'); if (!grid) return;
    var main = grid.querySelector('.venture.main'), slot = grid.querySelector('.venture.slot'), soon = grid.querySelector('.venture.soon');
    var sys = document.createElement('div'); sys.className = 'sys';
    sys.innerHTML =
      '<svg class="sys-orbits" viewBox="-500 -200 1000 400" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' +
      '<ellipse rx="230" ry="80"/><ellipse rx="350" ry="122"/><ellipse rx="470" ry="164"/></svg>' +
      '<div class="sys-sun" aria-hidden="true"><span>TM</span></div>' +
      '<button type="button" class="planet p-cc"><i class="ball"><i class="moon m1"></i><i class="moon m2"></i></i><span class="pl">CardCircle</span></button>' +
      '<button type="button" class="planet p-next"><i class="ball"></i><span class="pl"></span></button>' +
      '<button type="button" class="planet p-slot"><i class="ball">?</i><span class="pl"></span></button>' +
      '<p class="sys-hint" aria-hidden="true"></p>';
    grid.parentNode.insertBefore(sys, grid);
    var P = [
      { el: sys.querySelector('.p-cc'), r: 230 / 500, k: 80 / 230, a: 0.6, s: 0.10, card: main },
      { el: sys.querySelector('.p-next'), r: 350 / 500, k: 122 / 350, a: 2.6, s: 0.065, card: soon },
      { el: sys.querySelector('.p-slot'), r: 470 / 500, k: 164 / 470, a: 4.4, s: 0.045, card: slot }
    ];
    painters.push(function () {
      sys.querySelector('.p-next .pl').textContent = t('next');
      sys.querySelector('.p-slot .pl').textContent = t('slot');
      sys.querySelector('.sys-hint').textContent = t('sysHint');
    });
    P.forEach(function (pl) {
      pl.el.addEventListener('click', function () {
        if (!pl.card) return;
        var y = pl.card.getBoundingClientRect().top + scrollY - innerHeight * .25;
        window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
        pl.card.classList.remove('ping'); void pl.card.offsetWidth; pl.card.classList.add('ping');
      });
    });
    var hover = false; sys.addEventListener('pointerenter', function () { hover = true; }); sys.addEventListener('pointerleave', function () { hover = false; });
    var last = 0, vis = false;
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { vis = e[0].isIntersecting; if (vis) requestAnimationFrame(loop); }).observe(sys);
    function place() {
      var w = sys.clientWidth, h = sys.clientHeight, scale = Math.min(w / 1000, h / 400);
      P.forEach(function (pl) {
        /* Kamera kreist mit: der Blickwinkel auf die Umlaufbahnen dreht sich beim Scrollen */
        var A = pl.a + (isF() && !reduce ? (window.__mauCamAz || 0) * Math.PI / 180 * 1.6 : 0);
        var R = pl.r * 500 * scale, x = Math.cos(A) * R, y = Math.sin(A) * R * pl.k, z = Math.sin(A);
        pl.el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) scale(' + (0.82 + (z + 1) * 0.14).toFixed(3) + ')';
        pl.el.style.zIndex = z > 0 ? 3 : 1;
      });
    }
    function loop(now) {
      if (!vis) return;
      var dt = last ? Math.min((now - last) / 1000, .05) : 0; last = now;
      if (isF() && !reduce) P.forEach(function (pl) { pl.a += pl.s * dt * (hover ? .25 : 1); });
      place(); requestAnimationFrame(loop);
    }
    window.addEventListener('resize', place); place();
  })();

  /* ---------- Stationen: Flugroute mit Raumstationen ---------- */
  (function () {
    var sec = document.getElementById('stations'); if (!sec) return;
    var wrap = sec.querySelector('.wrap'), tl = sec.querySelector('.timeline'); if (!wrap || !tl) return;
    var built = false, route, track, svg, ship, mods = [], stageW = 0, trackW = 0, vh = 0, HW = 340, AMP = 34, pad = 0;
    var dlg;

    function build() {
      if (built) return; built = true;
      route = document.createElement('div'); route.className = 'route';
      route.innerHTML = '<div class="route-track"><svg class="route-path" aria-hidden="true"><path class="rp-glow"/><path class="rp-line"/></svg></div>' +
        '<div class="ship" aria-hidden="true"><div class="ship-in"><svg viewBox="0 0 40 40"><path d="M20 3c6 6 8 13 7 21l-7 4-7-4c-1-8 1-15 7-21Z"/><circle cx="20" cy="15" r="3.2"/><path class="fin" d="M13 22l-6 7 7-2M27 22l6 7-7-2"/></svg><i class="flame"></i></div></div>' +
        '<p class="route-hint" aria-hidden="true"></p>';
      track = route.querySelector('.route-track'); svg = route.querySelector('.route-path'); ship = route.querySelector('.ship');
      var items = tl.querySelectorAll(':scope > li');
      items.forEach(function (li, i) { track.appendChild(module(li, i)); });
      var free = document.createElement('div'); free.className = 'mod free';
      free.innerHTML = '<div class="bob"><div class="mod-body"><span class="mod-n">+</span><span class="slot-plus" aria-hidden="true">+</span><h3 class="free-t"></h3><p class="free-p"></p><a class="btn btn-primary free-b" href="#contact"></a></div></div>';
      track.appendChild(free);
      tl.after(route);
      mods = Array.prototype.slice.call(track.querySelectorAll('.mod')).map(function (el, i) {
        return { el: el, bob: el.querySelector('.bob'), body: el.querySelector('.mod-body'), a: 0, av: 0, i: i, ph: i * 1.7 };
      });
      dlg = document.createElement('dialog'); dlg.className = 'dock';
      dlg.innerHTML = '<button type="button" class="dock-x"></button><p class="dock-k"></p><div class="dock-c"></div>';
      document.body.appendChild(dlg);
      dlg.querySelector('.dock-x').addEventListener('click', function () { dlg.close(); });
      dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
      painters.push(paint); paint(); measure();
    }
    function module(li, i) {
      var el = document.createElement('div'); el.className = 'mod' + (i === 0 ? ' now' : '');
      var n = (i + 1 < 10 ? '0' : '') + (i + 1);
      el.innerHTML = '<div class="bob"><i class="wing wl" aria-hidden="true"></i><i class="wing wr" aria-hidden="true"></i>' +
        '<div class="mod-body" role="button" tabindex="0"><span class="mod-n">' + n + '</span><span class="mod-lights" aria-hidden="true"><i></i><i></i><i></i></span></div></div>';
      var body = el.querySelector('.mod-body'), box = li.querySelector(':scope > div');
      var when = li.querySelector('.when'); if (when) body.appendChild(when.cloneNode(true));
      ['.chip', '.co-logo', 'h3', '.role'].forEach(function (s) { var c = box && box.querySelector(s); if (c) { c = c.cloneNode(true); var im = c.querySelector && c.querySelector('img'); if (im) im.removeAttribute('loading'); body.appendChild(c); } });
      var d = document.createElement('span'); d.className = 'mod-dock'; body.appendChild(d);
      body.addEventListener('click', function (e) { if (e.target.closest('a')) return; open(li, n); });
      body.addEventListener('keydown', function (e) { if (e.target !== body) return; if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(li, n); } });
      return el;
    }
    function open(li, n) {
      var c = dlg.querySelector('.dock-c'); c.innerHTML = '';
      var when = li.querySelector('.when'), box = li.querySelector(':scope > div');
      dlg.querySelector('.dock-k').textContent = t('station') + ' ' + n + (when ? ' · ' + when.textContent : '');
      if (box) Array.prototype.forEach.call(box.children, function (ch) { var k = ch.cloneNode(true); if (k.tagName === 'DETAILS') k.open = true; c.appendChild(k); });
      dlg.showModal(); dlg.querySelector('.dock-x').focus();
      if (window.mauTrack) window.mauTrack('Station angedockt', { station: (box && box.querySelector('h3') || {}).textContent });
    }
    function paint() {
      route.querySelector('.route-hint').textContent = t('routeHint');
      route.querySelectorAll('.mod-dock').forEach(function (e) { e.textContent = t('dock') + ' →'; });
      var f = route.querySelector('.free');
      f.querySelector('.free-t').textContent = t('freeT'); f.querySelector('.free-p').textContent = t('freeP'); f.querySelector('.free-b').textContent = t('freeB');
      var nw = route.querySelector('.mod.now .bob'); if (nw) nw.setAttribute('data-now', t('now'));
      dlg.querySelector('.dock-x').setAttribute('aria-label', t('close')); dlg.querySelector('.dock-x').textContent = '×';
    }
    function yAt(u) { return Math.sin(u * 1.15) * AMP; }
    function measure() {
      if (!built || !isF()) { sec.style.removeProperty('--route-h'); return; }
      vh = innerHeight; stageW = route.clientWidth;
      HW = mods.length ? mods[0].el.offsetWidth : 340; AMP = stageW < 700 ? 18 : 34;
      pad = parseFloat(getComputedStyle(track).paddingLeft) || 0;
      trackW = track.scrollWidth;
      sec.style.setProperty('--route-h', Math.round(vh + Math.max(0, trackW - stageW) * 1.15) + 'px');
      /* Flugbahn als Kurve durch alle Stationen */
      var h = route.clientHeight, top = Math.round(h * .5), d = '';
      svg.setAttribute('width', trackW); svg.setAttribute('height', h); svg.setAttribute('viewBox', '0 0 ' + trackW + ' ' + h);
      for (var x = 0; x <= trackW; x += 16) { var u = (x - pad - HW / 2) / HW; d += (x ? 'L' : 'M') + x + ' ' + (top + yAt(u)).toFixed(1); }
      svg.querySelector('.rp-line').setAttribute('d', d); svg.querySelector('.rp-glow').setAttribute('d', d);
      route.style.setProperty('--mid', top + 'px');
      ship.style.left = Math.round(stageW / 2 - HW / 2) + 'px';
      mods.forEach(function (m) { m.el.style.setProperty('--dy', yAt(m.i).toFixed(1) + 'px'); });
    }
    var x = 0, lastX = 0, last = 0, running = false, T0 = 0;
    function frame(now) {
      if (!isF() || !built) { running = false; return; }
      var dt = last ? Math.min((now - last) / 1000, .05) : .016; last = now; T0 += dt;
      var r = sec.getBoundingClientRect(), span = r.height - vh;
      var p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
      var travel = Math.max(0, trackW - stageW), n1 = mods.length - 1, step = n1 > 0 ? travel / n1 : 0;
      var f = p * n1, fi = Math.round(f), fr = f - fi;
      var eased = reduce ? f : fi + (fr < 0 ? -1 : 1) * Math.pow(Math.abs(fr) * 2, 2.2) / 2;
      x += (-eased * step - x) * Math.min(1, dt * 9);
      var v = (x - lastX) / dt; lastX = x;
      track.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
      var mid = stageW / 2;
      /* Rakete fliegt in der Mitte auf der Bahn mit */
      var u = (mid - HW / 2 - x - pad - HW / 2) / HW, slope = Math.cos(u * 1.15) * 1.15 * AMP / HW;
      var dir = v > 4 ? 1 : v < -4 ? -1 : 0;
      ship.style.transform = 'translate(-50%,-50%) translateY(' + yAt(u).toFixed(1) + 'px) rotate(' + (90 + Math.atan(slope) * 57.3).toFixed(1) + 'deg)';
      ship.classList.toggle('burn', Math.abs(v) > 40);
      ship.classList.toggle('rev', dir < 0);
      for (var i = 0; i < mods.length; i++) {
        var m = mods[i];
        var cx = m.el.offsetLeft + m.el.offsetWidth / 2 + x;
        var d = Math.max(-1, Math.min(1, (cx - mid) / (stageW * .6)));
        if (!reduce) { var acc = -55 * m.a - 3.6 * m.av - v * .22; m.av += acc * dt; m.a += m.av * dt; m.a = Math.max(-18, Math.min(18, m.a)); } else m.a = 0;
        var bob = reduce ? 0 : Math.sin(T0 * 1.3 + m.ph) * 6;
        m.bob.style.transform = 'translateY(' + bob.toFixed(1) + 'px) rotate(' + m.a.toFixed(2) + 'deg) scale(' + (1 - Math.abs(d) * .14).toFixed(3) + ')';
        /* Stationen laufen um eine Achse: außen weiter hinten und weggedreht */
        var RR = Math.max(520, stageW * .55), th = reduce ? 0 : Math.max(-1.5, Math.min(1.5, (cx - mid) / RR));
        m.el.style.transform = reduce ? '' : 'translate3d(' + (RR * Math.sin(th) - (cx - mid)).toFixed(1) + 'px,0,' + (RR * (Math.cos(th) - 1)).toFixed(1) + 'px) rotateY(' + (th * 57.3).toFixed(2) + 'deg)';
        m.body.style.transform = '';
        m.el.style.setProperty('--lit', (1 - Math.abs(d)).toFixed(3));
      }
      requestAnimationFrame(frame);
    }
    function start() { if (running || !isF()) return; build(); measure(); running = true; last = 0; requestAnimationFrame(frame); }
    window.addEventListener('resize', measure);
    document.addEventListener('designchange', function () { if (isF()) start(); else measure(); });
    document.addEventListener('langchange', function () { setTimeout(measure, 0); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    if (isF()) start();
  })();

  /* ---------- Quiz: Rakete mit Treibstofftank ---------- */
  (function () {
    var wrap = document.querySelector('.quiz-intro'), box = document.getElementById('quiz-box'); if (!wrap || !box) return;
    var r = document.createElement('div'); r.className = 'launchpad'; r.setAttribute('aria-hidden', 'true');
    r.innerHTML = '<div class="lp-rocket"><svg viewBox="0 0 40 64"><path d="M20 2c8 8 11 19 10 34l-10 6-10-6C9 21 12 10 20 2Z"/><circle cx="20" cy="22" r="4.5"/><path class="fin" d="M10 34l-7 12 9-3M30 34l7 12-9-3"/></svg><i class="flame"></i></div>' +
      '<div class="lp-tank"><i class="lp-fuel"></i></div><div class="lp-meta"><b class="lp-l"></b><span class="lp-v">0 %</span><small class="lp-h"></small></div>';
    wrap.appendChild(r);
    var fuel = r.querySelector('.lp-fuel'), val = r.querySelector('.lp-v'), launched = false;
    function lab(txt) { r.querySelector('.lp-l').textContent = txt; }
    function upd() {
      var res = box.querySelector('.quiz-result'), top = box.querySelector('.quiz-top'), q = 0, ok = 0, n = 10;
      if (res) { ok = +(res.querySelector('.quiz-score b') || {}).textContent || 0; n = +((res.querySelector('.quiz-score span') || {}).textContent || '/10').replace('/', '') || 10; q = n; }
      else if (top && top.children.length > 1) { var s = top.children[0].textContent.match(/(\d+)\s*\/\s*(\d+)/); if (s) { n = +s[2]; q = +s[1] - 1; } ok = parseInt(top.children[1].textContent, 10) || 0; }
      var pct = Math.round(ok / n * 100);
      fuel.style.height = pct + '%'; val.textContent = pct + ' %';
      r.classList.toggle('active', !!(res || top));
      if (res && !launched && isF()) {
        launched = true; lab(t('liftoff'));
        if (!reduce) { r.classList.add('launch'); setTimeout(function () { r.classList.remove('launch'); r.classList.add('return'); setTimeout(function () { r.classList.remove('return'); }, 1200); }, 2600); }
      } else if (!res) { launched = false; lab(pct >= 80 ? t('ready') : t('fuel')); }
    }
    painters.push(function () { r.querySelector('.lp-h').textContent = t('fuelHint'); upd(); });
    new MutationObserver(upd).observe(box, { childList: true, subtree: true });
  })();

  /* ---------- Buttons: weich schwebend, leicht magnetisch ---------- */
  if (fine && !reduce) {
    var BTN = '.btn, .li-btn, .cv-btn, .ne-btn';
    document.addEventListener('pointermove', function (e) {
      if (!isF()) return;
      var b = e.target.closest && e.target.closest(BTN); if (!b) return;
      var r = b.getBoundingClientRect();
      var dx = (e.clientX - (r.left + r.width / 2)) / r.width, dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      b.style.setProperty('--bx', (dx * 10).toFixed(1) + 'px'); b.style.setProperty('--by', (dy * 6).toFixed(1) + 'px');
    }, { passive: true });
    document.addEventListener('pointerout', function (e) {
      var b = e.target.closest && e.target.closest(BTN);
      if (b && !b.contains(e.relatedTarget)) { b.style.removeProperty('--bx'); b.style.removeProperty('--by'); }
    });
  }

  /* ---------- Landeanflug in der Spirale: Schichten der Atmosphäre vom All bis zum Boden ---------- */
  (function () {
    var rs = 11; function rnd() { rs = (rs * 16807) % 2147483647; return (rs - 1) / 2147483646; }
    function hills(W, H, top, n, amp) {
      var pts = [], i; for (i = 0; i <= n; i++) pts.push([i * W / n, top + (rnd() - .5) * amp]);
      var d = 'M0 ' + H + 'L0 ' + pts[0][1].toFixed(1);
      for (i = 0; i < n; i++) { var a = pts[i], b = pts[i + 1], mx = (a[0] + b[0]) / 2; d += 'C' + mx.toFixed(1) + ' ' + a[1].toFixed(1) + ' ' + mx.toFixed(1) + ' ' + b[1].toFixed(1) + ' ' + b[0].toFixed(1) + ' ' + b[1].toFixed(1); }
      return d + 'L' + W + ' ' + H + 'Z';
    }
    function treeline(W, H, top, gap, minH, maxH) {
      var d = 'M0 ' + H + 'L0 ' + top, x = 0;
      while (x < W) {
        var h = minH + rnd() * (maxH - minH), w = h * .5, base = top + Math.sin(x / W * 18.8) * 10;
        d += 'L' + x.toFixed(1) + ' ' + base.toFixed(1) + 'L' + (x + w / 2).toFixed(1) + ' ' + (base - h).toFixed(1) + 'L' + (x + w).toFixed(1) + ' ' + base.toFixed(1);
        x += w + rnd() * gap;
      }
      return d + 'L' + W + ' ' + top + 'L' + W + ' ' + H + 'Z';
    }
    /* Landschaft dreimal so breit, damit sie sich beim Drehen seitlich vorbeischieben kann */
    var W = 4800, H = 400;
    function svg(path) { return '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none"><path d="' + path + '"/></svg>'; }
    var d = document.createElement('div'); d.className = 'descent'; d.setAttribute('aria-hidden', 'true');
    d.innerHTML = '<div class="ds-sky"></div><div class="ds-stars s2"></div><div class="ds-stars"></div><div class="ds-glow"></div>' +
      '<div class="ds-clouds"><i class="c1"></i><i class="c2"></i><i class="c3"></i><i class="c4"></i><i class="c5"></i></div>' +
      '<div class="ds-land l1">' + svg(hills(W, H, 120, 21, 120)) + '</div>' +
      '<div class="ds-land l2">' + svg(hills(W, H, 170, 15, 110)) + '</div>' +
      '<div class="ds-haze"></div>' +
      '<div class="ds-land l3">' + svg(treeline(W, H, 230, 26, 50, 120)) + '</div><canvas class="ds-coil"></canvas>';
    document.body.insertBefore(d, document.body.firstChild);
    var alt = document.createElement('div'); alt.className = 'alt'; alt.setAttribute('aria-hidden', 'true');
    alt.innerHTML = '<span class="alt-n"></span><span class="alt-l"></span><b class="alt-v"></b><i class="alt-bar"><i></i></i>';
    document.body.appendChild(alt);
    var sky = d.querySelector('.ds-sky'), coil = d.querySelector('.ds-coil'), cx2 = coil.getContext('2d'), stars = d.querySelector('.ds-stars:not(.s2)'), stars2 = d.querySelector('.ds-stars.s2'), clouds = d.querySelector('.ds-clouds'), land = d.querySelectorAll('.ds-land');
    function sm(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
    var SKY = {
      dark: [[0, [2, 4, 3]], [.18, [5, 11, 8]], [.36, [9, 19, 14]], [.5, [6, 12, 9]], [.64, [16, 32, 23]], [.82, [30, 52, 37]], [1, [48, 74, 53]]],
      light: [[0, [120, 136, 128]], [.18, [156, 169, 160]], [.36, [190, 198, 186]], [.5, [170, 182, 171]], [.64, [206, 213, 200]], [.82, [228, 224, 210]], [1, [226, 222, 205]]]
    };
    function mix(st, p) {
      for (var i = 1; i < st.length; i++) if (p <= st[i][0]) { var a = st[i - 1], b = st[i], f = (p - a[0]) / (b[0] - a[0]); f = f * f * (3 - 2 * f); return a[1].map(function (v, k) { return Math.round(v + (b[1][k] - v) * f); }); }
      return st[st.length - 1][1];
    }
    function skyAt(p) {
      var st = SKY[root.getAttribute('data-theme') === 'light' ? 'light' : 'dark'];
      var top = mix(st, Math.max(0, p - .04)), bot = mix(st, Math.min(1, p + .06));
      return 'linear-gradient(180deg, rgb(' + top + ') 0%, rgb(' + bot + ') 100%)';
    }

    /* Schichten: Name, Höhe an der Oberkante (km), Abschnitt, an dessen Oberkante sie beginnt */
    var LAYERS = [
      { k: 'space', de: 'Weltall', en: 'Space', km: 1600, at: null },
      { k: 'exo', de: 'Exosphäre', en: 'Exosphere', km: 1000, at: '#about' },
      { k: 'thermo', de: 'Thermosphäre', en: 'Thermosphere', km: 600, at: '#work' },
      { k: 'meso', de: 'Mesosphäre', en: 'Mesosphere', km: 85, at: '.ticker', mid: true },
      { k: 'strato', de: 'Stratosphäre', en: 'Stratosphere', km: 50, at: '#stations' },
      { k: 'tropo', de: 'Troposphäre', en: 'Troposphere', km: 12, at: '#more' },
      { k: 'ground', de: 'Boden', en: 'Ground', km: 0, at: '#contact' }
    ];
    var tops = [], docH = 0;
    function fmtKm(km) {
      if (km <= 0) return '0 m';
      if (km < 1) return Math.round(km * 1000) + ' m';
      var v = km < 10 ? km.toFixed(1) : Math.round(km).toString();
      if (!en()) v = v.replace('.', ','); if (km >= 1000) v = Math.round(km).toLocaleString(en() ? 'en' : 'de');
      return v + ' km';
    }
    function layout() {
      docH = document.documentElement.scrollHeight;
      tops = LAYERS.map(function (L) {
        if (!L.at) return 0;
        var el = document.querySelector(L.at); if (!el) return null;
        var r = el.getBoundingClientRect(), y = r.top + scrollY;
        return L.mid ? y + r.height / 2 : y;
      });
      var dpr = Math.min(2, window.devicePixelRatio || 1); coil.width = innerWidth * dpr; coil.height = innerHeight * dpr; cx2.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    /* Die Seite als 3D-Raum: alle Inhalte sitzen auf einer langgezogenen Feder um eine senkrechte Achse
       hinter der Bildschirmmitte. Die Kamera fährt an der Feder entlang nach unten und schaut immer auf die Achse.
       Jeder Block wird um genau diese Achse gedreht, Fluchtpunkt ist für alle die Bildschirmmitte.
       Der Drehwinkel wächst gleichmäßig mit der Höhe (echte Spirale) und folgt dem Scrollen mit sanfter Trägheit. */
    var items = [];
    function clearItems() { items.forEach(function (h) { h.el.style.transform = ''; h.el.style.transformOrigin = ''; h.el.style.opacity = ''; h.el.style.visibility = ''; h.el.classList.remove('in3d', 'slab'); h.el.style.removeProperty('--ex'); h.ex = null; }); }
    function collect() {
      clearItems(); items = [];
      if (reduce) return;
      var GRID = /(^|\s)(about-grid|stats-grid|cards|venture-grid|side-grid|soon-grid|quiz-wrap)(\s|$)/;
      function add(el) { if (el.offsetHeight && !el.classList.contains('sys')) items.push({ el: el, end: !!el.closest('#contact') }); }
      function walk(w) {
        Array.prototype.forEach.call(GRID.test(w.className) ? w.children : w.children, function (c) {
          if (GRID.test(c.className)) Array.prototype.forEach.call(c.children, add); else add(c);
        });
        if (GRID.test(w.className) && !w.children.length) add(w);
      }
      var hero = document.querySelector('.hero .wrap'); if (hero) walk(hero);
      document.querySelectorAll('main > section:not(#stations) > .wrap').forEach(walk);
      document.querySelectorAll('#stations > .wrap > :is(.section-label, h2, .cv-btn)').forEach(add);
      measure();
    }
    function measure() {
      var y = scrollY;
      items.forEach(function (h) { h.el.style.transform = 'none'; });
      items.forEach(function (h) { var r = h.el.getBoundingClientRect(); h.l = r.left; h.w = r.width; h.t = r.top + y; h.h = r.height; h.c = h.t + r.height / 2; });
      items.forEach(function (h) { h.el.style.transform = ''; h.el.classList.add('in3d'); var bg = getComputedStyle(h.el); if ((bg.backgroundImage !== 'none' || bg.backgroundColor !== 'rgba(0, 0, 0, 0)') && h.h > 60) h.el.classList.add('slab'); });
    }

    var cam = -1, running = false, lastDraw = -1;
    function frame() {
      running = false;
      if (!isF()) return;
      var target = scrollY;
      if (cam < 0) cam = target;
      cam += (target - cam) * .12;
      if (Math.abs(target - cam) < .15) cam = target;
      if (cam !== target) { running = true; requestAnimationFrame(frame); }
      if (Math.abs(cam - lastDraw) < .05 && lastDraw >= 0 && cam === target && !force) return;
      force = false; lastDraw = cam;
      draw(target, cam);
    }
    var force = false;
    function req() { if (!running) { running = true; requestAnimationFrame(frame); } }

    function draw(y, cy) {
      var vh = innerHeight, vw = innerWidth, max = docH - vh, p = max > 0 ? Math.min(1, Math.max(0, cy / max)) : 0;
      /* Ein durchgehender Himmel: von fast schwarzem Weltall bis zum hellen Grün über dem Boden */
      sky.style.background = skyAt(p);
      /* Grad pro Pixel Höhe: eine halbe Bildschirmhöhe entspricht gut 30 Grad Windung */
      var K = 18 / (vh / 2), turn = (cy + vh / 2) * K;
      window.__mauCamAz = turn;
      /* Hintergrund liegt hinter der Achse und zieht gegenläufig vorbei */
      var so = (1 - sm(.06, .55, p)).toFixed(3);
      stars.style.opacity = so; stars2.style.opacity = (so * .6).toFixed(3);
      stars.style.transform = 'translate3d(' + ((turn * 7) % 340 - 340).toFixed(1) + 'px,0,0)';
      stars2.style.transform = 'translate3d(' + ((turn * 3) % 200 - 200).toFixed(1) + 'px,0,0)';
      clouds.style.opacity = (sm(.36, .48, p) * (1 - sm(.66, .78, p))).toFixed(3);
      clouds.style.transform = 'translate3d(' + ((turn * .06) % 120 - 60).toFixed(1) + 'vw,' + ((.57 - p) * 320).toFixed(1) + 'vh,0)';
      [[.5, 1, .035], [.6, 1, .06], [.7, 1, .1]].forEach(function (r, i) {
        var k = sm(r[0], r[1], p), pan = (turn * r[2]) % 190;
        land[i].style.transform = 'translate3d(' + pan.toFixed(2) + 'vw,' + ((1 - k) * 105).toFixed(2) + '%,0)';
      });
      /* Inhalte im Raum */
      /* Große Feder um die senkrechte Achse hinter dem Bildschirm, weit über den Rand hinaus.
         Die Inhalte bleiben immer gerade zur Kamera ausgerichtet (keine schrägen Ebenen) und wandern nur auf
         der Bahn der Feder: unten kommen sie von rechts über den Rand herein, in der Mitte stehen sie vorne,
         oben gleiten sie links hinaus. Hinten auf der Feder sind sie kleiner und blasser. */
      var R = Math.max(700, vw * .95), P = Math.max(1100, vw * 1.05), T = vh * .07, mid = vh / 2;
      var endK = 1 - sm(max - vh * .9, max - 4, cy), ae = document.activeElement, typing = ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName);
      function thetaAt(tt) { var a2 = Math.min(1.5, Math.abs(tt)); return (tt < 0 ? -1 : 1) * a2 * a2 * Math.PI / 2; }
      for (var i = 0; i < items.length; i++) {
        var h = items[i];
        if (h.t + h.h < y - vh * .8 || h.t > y + vh * 1.8) { if (h.vis !== false) { h.el.style.visibility = 'hidden'; h.vis = false; } continue; }
        var rest = Math.min(max, Math.max(0, h.c - mid)) + mid, dyc = rest - (cy + mid) + (h.c - rest) * .15;
        var ek = h.end ? endK : 1; if (typing && h.el.contains(ae)) ek = 0;
        var th = thetaAt(dyc / mid) * ek;
        if (Math.abs(th) > 2.3) { if (h.vis !== false) { h.el.style.visibility = 'hidden'; h.vis = false; } continue; }
        if (h.vis === false) { h.el.style.visibility = ''; h.vis = true; }
        var dx = h.l + h.w / 2 - vw / 2, z = R * (Math.cos(th) - 1), sc = P / (P - z);
        var ysr = h.c - y - mid, tilt = -T * (1 - Math.cos(th));
        var mx = (R * Math.sin(th) + dx) * sc - dx, my = (ysr + tilt) * sc - ysr;
        h.el.style.transformOrigin = '50% 50%';
        h.el.style.transform = 'translate3d(' + mx.toFixed(1) + 'px,' + my.toFixed(1) + 'px,0) scale(' + sc.toFixed(4) + ')';
        h.el.style.opacity = Math.max(.15, Math.min(1, (sc - .45) / .55)).toFixed(3);
        h.el.style.zIndex = Math.round(sc * 100);
        var ex = Math.max(-1.6, Math.min(1.6, -Math.sin(th) * 2.2)), exr = Math.round(ex * 20) / 20;
        if (exr !== h.ex) { h.ex = exr; h.el.style.setProperty('--ex', exr); }
      }
      /* Die Feder selbst als Linie: vorne kräftig, hinten zart */
      cx2.clearRect(0, 0, vw, vh);
      var light = root.getAttribute('data-theme') === 'light', col = light ? '62,74,67' : '226,166,90', prev = null;
      cx2.lineCap = 'round';
      for (var ys = -vh * .4; ys <= vh * 1.4; ys += 6) {
        var tt2 = (ys + (y - cy) - mid) / mid, th2 = thetaAt(tt2), z2 = R * (Math.cos(th2) - 1), s2 = P / (P - z2);
        var px = vw / 2 + R * Math.sin(th2) * s2, py = mid + (ys - mid - T * (1 - Math.cos(th2))) * s2;
        if (prev) {
          var front = Math.cos(th2);
          cx2.strokeStyle = 'rgba(' + col + ',' + (Math.max(.05, front) * (light ? .35 : .42) * (1 - endK * 0 )).toFixed(3) + ')';
          cx2.lineWidth = 1 + Math.max(0, front) * 1.6;
          cx2.beginPath(); cx2.moveTo(prev[0], prev[1]); cx2.lineTo(px, py); cx2.stroke();
        }
        prev = [px, py];
      }
      /* Höhenmesser */
      var c = y + vh / 2, km = LAYERS[0].km, j;
      for (j = 0; j < LAYERS.length; j++) {
        if (tops[j] == null) continue;
        var nj = j + 1; while (nj < LAYERS.length && tops[nj] == null) nj++;
        var t0 = tops[j], t1 = nj < LAYERS.length ? tops[nj] : docH, k1 = nj < LAYERS.length ? LAYERS[nj].km : 0;
        if (c >= t0 && c < t1) { var f = (c - t0) / (t1 - t0); km = LAYERS[j].km + (k1 - LAYERS[j].km) * f; break; }
      }
      var py = max > 0 ? y / max : 0;
      if (py >= .995) km = 0;
      alt.querySelector('.alt-v').textContent = fmtKm(km);
      var Lc = LAYERS[0]; for (var q = 0; q < LAYERS.length; q++) if (tops[q] != null && c >= tops[q]) Lc = LAYERS[q];
      alt.querySelector('.alt-n').textContent = en() ? Lc.en : Lc.de;
      alt.querySelector('.alt-bar i').style.height = ((1 - py) * 100).toFixed(1) + '%';
      alt.classList.toggle('landed', py >= .995);
    }
    var lastY = -1;
    function relayout() { if (!isF()) return; collect(); layout(); force = true; req(); }
    painters.push(function () { alt.querySelector('.alt-l').textContent = en() ? 'Altitude' : 'Höhe'; if (isF()) { layout(); force = true; req(); } });
    window.addEventListener('scroll', req, { passive: true });
    document.addEventListener('focusin', function () { force = true; req(); }); document.addEventListener('focusout', function () { setTimeout(function () { force = true; req(); }, 0); });
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(relayout, 120); });
    window.addEventListener('load', relayout);
    document.addEventListener('designchange', function () { if (isF()) { cam = -1; relayout(); } else clearItems(); });
    if ('ResizeObserver' in window) { var rq, ro3 = new ResizeObserver(function () { clearTimeout(rq); rq = setTimeout(function () { if (isF()) { layout(); measure(); force = true; req(); } }, 150); }); [document.body, document.querySelector('main')].forEach(function (e) { if (e) ro3.observe(e); }); }
    relayout();
  })();

  /* ---------- Laufband: läuft gebogen um die Achse statt als flacher Balken ---------- */
  (function () {
    var tk = document.querySelector('.ticker'), tr = tk && tk.querySelector('.ticker-track'); if (!tr) return;
    var parts = Array.prototype.slice.call(tk.querySelectorAll('.tw, .sep')), vis = false, run = false;
    function loop() {
      if (!vis || !isF() || reduce) { run = false; parts.forEach(function (e) { e.style.transform = ''; }); return; }
      var vw = innerWidth, R = Math.max(420, vw * .5), tb = tk.getBoundingClientRect(), m = new DOMMatrixReadOnly(getComputedStyle(tr).transform), base = tb.left + m.m41;
      var xs = parts.map(function (e) { return base + e.offsetLeft + e.parentNode.offsetLeft + e.offsetWidth / 2; });
      for (var i = 0; i < parts.length; i++) {
        var dx = xs[i] - vw / 2, th = Math.max(-1.55, Math.min(1.55, dx / R));
        parts[i].style.transform = (parts[i].classList.contains('sep') ? 'rotate(45deg) ' : '') === '' ?
          'translate3d(' + (R * Math.sin(th) - dx).toFixed(1) + 'px,0,' + (R * (Math.cos(th) - 1)).toFixed(1) + 'px) rotateY(' + (th * 57.3).toFixed(2) + 'deg)' :
          'translate3d(' + (R * Math.sin(th) - dx).toFixed(1) + 'px,0,' + (R * (Math.cos(th) - 1)).toFixed(1) + 'px) rotateY(' + (th * 57.3).toFixed(2) + 'deg) rotate(45deg)';
      }
      requestAnimationFrame(loop);
    }
    function go() { if (!run && vis && isF()) { run = true; requestAnimationFrame(loop); } }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { vis = e[0].isIntersecting; go(); }).observe(tk);
    document.addEventListener('designchange', go);
  })();

  /* ---------- Ganz unten: Landung im Wald ---------- */
  (function () {
    var c = document.getElementById('contact'); if (!c) return;
    var seed = 7; function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
    function pines(W, base, minH, maxH, minGap, maxGap, wf) {
      var d = '', x = -20;
      while (x < W + 40) {
        var h = minH + rnd() * (maxH - minH), w = h * (wf || .42) * (.85 + rnd() * .3);
        d += 'M' + (x - w * .5).toFixed(1) + ' ' + base +
          'L' + (x - w * .2).toFixed(1) + ' ' + (base - h * .3).toFixed(1) + 'L' + (x - w * .36).toFixed(1) + ' ' + (base - h * .29).toFixed(1) +
          'L' + (x - w * .13).toFixed(1) + ' ' + (base - h * .57).toFixed(1) + 'L' + (x - w * .25).toFixed(1) + ' ' + (base - h * .56).toFixed(1) +
          'L' + x.toFixed(1) + ' ' + (base - h).toFixed(1) +
          'L' + (x + w * .25).toFixed(1) + ' ' + (base - h * .56).toFixed(1) + 'L' + (x + w * .13).toFixed(1) + ' ' + (base - h * .57).toFixed(1) +
          'L' + (x + w * .36).toFixed(1) + ' ' + (base - h * .29).toFixed(1) + 'L' + (x + w * .2).toFixed(1) + ' ' + (base - h * .3).toFixed(1) +
          'L' + (x + w * .5).toFixed(1) + ' ' + base + 'Z';
        x += minGap + rnd() * (maxGap - minGap);
      }
      return d;
    }
    function ridge(W, base, top, n) {
      var d = 'M0 ' + base, step = W / n;
      for (var i = 0; i <= n; i++) d += 'L' + (i * step).toFixed(1) + ' ' + (top + rnd() * (base - top) * .55).toFixed(1);
      return d + 'L' + W + ' ' + base + 'Z';
    }
    var W = 1600, H = 420;
    var f = document.createElement('div'); f.className = 'forest'; f.setAttribute('aria-hidden', 'true');
    var flies = ''; for (var i = 0; i < 18; i++) flies += '<i style="left:' + (rnd() * 96 + 2).toFixed(1) + '%;bottom:' + (rnd() * 46 + 6).toFixed(1) + '%;animation-delay:-' + (rnd() * 8).toFixed(2) + 's,-' + (rnd() * 3).toFixed(2) + 's;animation-duration:' + (6 + rnd() * 6).toFixed(1) + 's,' + (2 + rnd() * 2.5).toFixed(1) + 's"></i>';
    f.innerHTML =
      '<div class="fo-sun"></div>' +
      '<svg class="fo-l fo-m" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMax slice"><path d="' + ridge(W, H, 150, 26) + '"/></svg>' +
      '<svg class="fo-l fo-1" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMax slice"><path d="' + pines(W, H, 70, 130, 14, 30, .38) + '"/><rect y="' + (H - 6) + '" width="' + W + '" height="6"/></svg>' +
      '<div class="fo-mist"></div>' +
      '<svg class="fo-l fo-2" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMax slice"><path d="' + pines(W, H, 120, 220, 26, 60, .4) + '"/><rect y="' + (H - 10) + '" width="' + W + '" height="10"/></svg>' +
      '<div class="fo-flies">' + flies + '</div>' +
      '<svg class="fo-l fo-3" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMax slice"><path d="' + pines(W, H, 200, 360, 120, 260, .42) + '"/><path d="M0 ' + H + 'L0 ' + (H - 36) + 'Q400 ' + (H - 60) + ' 800 ' + (H - 40) + 'T1600 ' + (H - 44) + 'L1600 ' + H + 'Z"/></svg>';
    c.appendChild(f);
  })();

  document.addEventListener('langchange', texts);
  texts();
})();
