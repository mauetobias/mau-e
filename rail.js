/* „Die Stange": Im Layout „Future" hängen die Stationen als Karten an Bügeln auf einer Leine.
   Beim Scrollen fährt die Leine seitlich durch, die Karten schwingen mit und drehen sich zur Mitte.
   Die Inhalte werden aus der normalen Zeitleiste übernommen (inkl. Übersetzung). */
(function () {
  var root = document.documentElement, sec = document.getElementById('stations');
  if (!sec) return;
  var wrap = sec.querySelector('.wrap'), tl = sec.querySelector('.timeline');
  if (!wrap || !tl) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var T = {
    de: { flip: 'Umdrehen', back: 'Zurück', slotT: 'Dein Startup?', slotP: 'Dieser Bügel ist noch frei. Du baust etwas Neues? Dann lass uns reden.', slotB: 'Lass uns bauen', hint: 'Scrollen, um die Stange entlangzufahren · Karte antippen zum Umdrehen', now: 'Jetzt' },
    en: { flip: 'Flip', back: 'Back', slotT: 'Your startup?', slotP: 'This hanger is still free. Building something new? Let’s talk.', slotB: 'Let’s build', hint: 'Scroll to move along the rail · tap a card to flip it', now: 'Now' }
  };
  function t(k) { return T[window.LANG === 'en' ? 'en' : 'de'][k]; }
  function isF() { return root.getAttribute('data-design') === 'future'; }

  var HANGER = '<svg class="hanger-svg" viewBox="0 0 200 112" aria-hidden="true"><path d="M100 40 C100 30 93 25 93 16 C93 8 99 3 106 3 C113 3 117 9 116 15" fill="none" stroke-width="4" stroke-linecap="round"/><path d="M100 40 L14 96 C6 101 9 106 17 106 L183 106 C191 106 194 101 186 96 Z" fill="none" stroke-width="4" stroke-linejoin="round"/></svg>';

  var built = false, rail, track, hangers = [], stageW = 0, trackW = 0, vh = 0;

  function build() {
    if (built) return; built = true;
    rail = document.createElement('div'); rail.className = 'rail';
    rail.innerHTML = '<div class="rail-bar" aria-hidden="true"></div><div class="rail-track"></div><p class="rail-hint" aria-hidden="true"></p>';
    track = rail.querySelector('.rail-track');
    var items = tl.querySelectorAll(':scope > li');
    items.forEach(function (li, i) {
      var h = mk(i === 0);
      var front = h.querySelector('.tag-front'), back = h.querySelector('.tag-back');
      var num = document.createElement('span'); num.className = 'tag-num'; num.textContent = (i + 1 < 10 ? '0' : '') + (i + 1);
      front.appendChild(num);
      var when = li.querySelector('.when'); if (when) front.appendChild(when.cloneNode(true));
      var box = li.querySelector(':scope > div');
      var ch = box && box.querySelector('.chip'); if (ch) front.appendChild(ch.cloneNode(true));
      var yr = ((when && when.textContent.match(/\d{4}/g)) || []).pop() || '';
      var bc = document.createElement('span'); bc.className = 'tag-code'; bc.setAttribute('aria-hidden', 'true');
      bc.innerHTML = '<i></i><b>TM-' + num.textContent + (yr ? ' · ' + yr : '') + '</b>'; front.appendChild(bc);
      ['h3', '.role'].forEach(function (s) { var el = box && box.querySelector(s); if (el) front.appendChild(el.cloneNode(true)); });
      var f = document.createElement('span'); f.className = 'tag-flip'; f.setAttribute('aria-hidden', 'true'); front.appendChild(f);
      var bh = box && box.querySelector('h3'); if (bh) { var c = bh.cloneNode(true); c.className = 'tag-back-h'; back.appendChild(c); }
      if (box) box.querySelectorAll(':scope > p:not(.role):not(.cities):not(.links)').forEach(function (p) { back.appendChild(p.cloneNode(true)); });
      var facts = box && box.querySelector('.facts'); if (facts) back.appendChild(facts.cloneNode(true));
      ['.cities', '.links'].forEach(function (s) { var el = box && box.querySelector(s); if (el) back.appendChild(el.cloneNode(true)); });
      var b2 = document.createElement('span'); b2.className = 'tag-flip tag-flip-b'; b2.setAttribute('aria-hidden', 'true'); back.appendChild(b2);
      track.appendChild(h);
    });
    /* Leerer Bügel am Ende */
    var s = mk(false); s.classList.add('slot');
    s.querySelector('.tag-front').innerHTML = '<span class="tag-num">+</span><span class="slot-plus" aria-hidden="true">+</span><h3 class="slot-t"></h3><p class="slot-p"></p><a class="btn btn-primary slot-b" href="#contact"></a>';
    s.querySelector('.tag').removeAttribute('role'); s.querySelector('.tag').removeAttribute('tabindex');
    track.appendChild(s);
    tl.after(rail);
    hangers = Array.prototype.slice.call(track.children).map(function (el, i) {
      return { el: el, sw: el.querySelector('.swing'), tag: el.querySelector('.tag'), a: (i % 2 ? 1 : -1) * 6, av: 0, flip: false, fv: 0 };
    });
    hangers.forEach(function (h) {
      if (h.el.classList.contains('slot')) return;
      function toggle() { h.flip = !h.flip; h.tag.setAttribute('aria-pressed', h.flip ? 'true' : 'false'); h.av += (h.flip ? 1 : -1) * 60; if (window.mauTrack && h.flip) window.mauTrack('Bügel umgedreht', { station: (h.tag.querySelector('h3') || {}).textContent }); }
      h.tag.addEventListener('click', function (e) { if (e.target.closest('a')) return; toggle(); });
      h.tag.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
      h.el.addEventListener('pointerenter', function (e) { h.av += (e.movementX || 1) * 9; });
    });
    texts(); measure();
  }
  function mk(first) {
    var h = document.createElement('div'); h.className = 'hanger' + (first ? ' now' : '');
    h.innerHTML = '<div class="swing">' + HANGER + '<i class="clip c1"></i><i class="clip c2"></i><div class="tag" role="button" tabindex="0" aria-pressed="false"><div class="tag-face tag-front"></div><div class="tag-face tag-back"></div></div></div>';
    return h;
  }
  function texts() {
    if (!built) return;
    rail.querySelector('.rail-hint').textContent = t('hint');
    rail.querySelectorAll('.tag-flip:not(.tag-flip-b)').forEach(function (e) { e.textContent = '↻ ' + t('flip'); });
    rail.querySelectorAll('.tag-flip-b').forEach(function (e) { e.textContent = '↺ ' + t('back'); });
    var s = rail.querySelector('.slot');
    s.querySelector('.slot-t').textContent = t('slotT'); s.querySelector('.slot-p').textContent = t('slotP'); s.querySelector('.slot-b').textContent = t('slotB');
    var n = rail.querySelector('.hanger.now .tag'); if (n) n.setAttribute('data-now', t('now'));
  }
  function measure() {
    if (!built || !isF()) { sec.style.removeProperty('--rail-h'); return; }
    vh = window.innerHeight; stageW = rail.clientWidth;
    trackW = track.scrollWidth;
    var travel = Math.max(0, trackW - stageW);
    sec.style.setProperty('--rail-h', Math.round(vh + travel * 1.15) + 'px');
  }

  /* Bewegung */
  var x = 0, lastX = 0, last = 0, running = false;
  function frame(now) {
    if (!isF() || !built) { running = false; return; }
    var dt = last ? Math.min((now - last) / 1000, .05) : .016; last = now;
    var r = sec.getBoundingClientRect(), span = r.height - vh;
    var p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
    var travel = Math.max(0, trackW - stageW);
    /* Magnet: jede Karte bleibt kurz mittig stehen */
    var n1 = hangers.length - 1, step = n1 > 0 ? travel / n1 : 0, f = p * n1, fi = Math.round(f), fr = f - fi;
    var eased = reduce ? f : fi + (fr < 0 ? -1 : 1) * Math.pow(Math.abs(fr) * 2, 2.2) / 2;
    var target = -eased * step;
    x += (target - x) * Math.min(1, dt * 9);
    var v = (x - lastX) / dt; lastX = x;
    track.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
    var mid = stageW / 2;
    for (var i = 0; i < hangers.length; i++) {
      var h = hangers[i];
      var cx = h.el.offsetLeft + h.el.offsetWidth / 2 + x;
      var d = Math.max(-1, Math.min(1, (cx - mid) / (stageW * .6)));
      if (!reduce) {
        var acc = -70 * h.a - 4.2 * h.av - v * .35;
        h.av += acc * dt; h.a += h.av * dt;
        h.a = Math.max(-28, Math.min(28, h.a));
      } else h.a = 0;
      h.fv += ((h.flip ? 180 : 0) - h.fv) * Math.min(1, dt * (reduce ? 60 : 7));
      var ry = (reduce ? 0 : d * -58) + h.fv;
      var sc = 1 - Math.abs(d) * .14;
      h.sw.style.transform = 'rotate(' + h.a.toFixed(2) + 'deg) scale(' + sc.toFixed(3) + ')';
      h.tag.style.transform = 'rotateY(' + ry.toFixed(1) + 'deg)';
      h.el.style.setProperty('--lit', (1 - Math.abs(d)).toFixed(3));
    }
    requestAnimationFrame(frame);
  }
  function start() { if (running || !isF()) return; build(); measure(); running = true; last = 0; requestAnimationFrame(frame); }

  window.addEventListener('resize', function () { measure(); });
  document.addEventListener('designchange', function () { if (isF()) start(); else measure(); });
  document.addEventListener('langchange', function () { texts(); measure(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  if (isF()) start();
})();
