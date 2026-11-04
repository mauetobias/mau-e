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
        var R = pl.r * 500 * scale, x = Math.cos(pl.a) * R, y = Math.sin(pl.a) * R * pl.k, z = Math.sin(pl.a);
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
      body.addEventListener('click', function () { open(li, n); });
      body.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(li, n); } });
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
        m.body.style.transform = 'rotateY(' + (reduce ? 0 : d * -32).toFixed(1) + 'deg)';
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

  /* ---------- Landeanflug: je tiefer, desto näher die Erde ---------- */
  (function () {
    var d = document.createElement('div'); d.className = 'descent'; d.setAttribute('aria-hidden', 'true');
    d.innerHTML = '<div class="ds-space"></div><div class="ds-stars"></div><div class="ds-atmo"></div>' +
      '<div class="ds-earth"><i class="ds-glow"></i></div>' +
      '<div class="ds-clouds"><i class="c1"></i><i class="c2"></i><i class="c3"></i><i class="c4"></i><i class="c5"></i></div>';
    document.body.insertBefore(d, document.body.firstChild);
    var alt = document.createElement('div'); alt.className = 'alt'; alt.setAttribute('aria-hidden', 'true');
    alt.innerHTML = '<span class="alt-l"></span><b class="alt-v"></b><i class="alt-bar"><i></i></i>';
    document.body.appendChild(alt);
    var earth = d.querySelector('.ds-earth'), clouds = d.querySelector('.ds-clouds');
    function sm(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
    function lerp(a, b, t) { return a + (b - a) * t; }
    var ticking = false, lastP = -1;
    function upd() {
      ticking = false;
      if (!isF()) return;
      var max = document.documentElement.scrollHeight - innerHeight, p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
      if (Math.abs(p - lastP) < .0005) return; lastP = p;
      d.style.setProperty('--space', (1 - sm(.18, .62, p)).toFixed(3));
      d.style.setProperty('--stars', (1 - sm(.3, .72, p)).toFixed(3));
      d.style.setProperty('--atmo', sm(.32, .8, p).toFixed(3));
      /* Planet: wird größer, füllt den unteren Bildschirm, wird am Ende zum flachen Horizont */
      var w, v;
      if (p < .6) { var a = p / .6; w = lerp(170, 520, a * a); v = lerp(24, 52, sm(0, 1, a)); }
      else { var b = (p - .6) / .4; w = lerp(520, 900, b); v = lerp(52, 16, sm(0, 1, b)); }
      earth.style.width = w.toFixed(1) + 'vw';
      earth.style.top = 'calc(' + (100 - v).toFixed(2) + 'vh)';
      earth.style.setProperty('--rim', (1 - sm(.55, .9, p) * .65).toFixed(3));
      earth.style.setProperty('--land', sm(.45, .95, p).toFixed(3));
      /* Wolken: man fällt hindurch */
      clouds.style.opacity = (sm(.5, .66, p) * (1 - sm(.88, .98, p))).toFixed(3);
      clouds.style.transform = 'translate3d(0,' + ((.78 - p) * 260).toFixed(1) + 'vh,0)';
      /* Höhenmesser */
      var km = 420 * Math.pow(1 - p, 2.6), txt;
      if (p >= .995) txt = '0 m'; else if (km < 1) txt = Math.round(km * 1000) + ' m'; else txt = (km < 10 ? km.toFixed(1) : Math.round(km)).toString().replace('.', en() ? '.' : ',') + ' km';
      alt.querySelector('.alt-v').textContent = txt;
      alt.querySelector('.alt-bar i').style.height = ((1 - p) * 100).toFixed(1) + '%';
      alt.classList.toggle('landed', p >= .995);
    }
    function req() { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }
    painters.push(function () { alt.querySelector('.alt-l').textContent = en() ? 'Altitude' : 'Höhe'; lastP = -1; req(); });
    window.addEventListener('scroll', req, { passive: true });
    window.addEventListener('resize', function () { lastP = -1; req(); });
    document.addEventListener('designchange', function () { lastP = -1; req(); });
    req();
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
