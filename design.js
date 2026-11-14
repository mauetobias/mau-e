/* Zweites Layout „Future" umschalten, HUD und Lichtkanten steuern */
(function () {
  var root = document.documentElement, btn = document.getElementById('design-switch');
  var KEY = 'design', reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function isF() { return root.getAttribute('data-design') === 'future'; }
  function en() { return window.LANG === 'en'; }

  /* Keine Schriften von Google laden (DSGVO, LG München I 3 O 17493/20).
     Das Future-Layout nutzt die Systemschriften aus --f-mono / --f-display.
     Eigene Schrift-Dateien gehören nach /fonts/ und werden per @font-face eingebunden. */
  function fonts() {}

  /* Reihenfolge: Klassisch -> Future -> Retro -> Klassisch */
  function curD() { return root.getAttribute('data-design') || 'classic'; }
  function nextOf(d) { return d === 'future' ? 'retro' : d === 'retro' ? 'classic' : 'future'; }
  function label() {
    if (!btn) return;
    var f = isF(), n = nextOf(curD());
    btn.setAttribute('aria-pressed', f ? 'true' : 'false');
    btn.querySelector('.ds-l').textContent = n === 'retro' ? 'Retro' : n === 'future' ? 'Future' : (en() ? 'Classic' : 'Klassisch');
    btn.setAttribute('aria-label', n === 'retro' ? (en() ? 'Switch to the 1996 retro layout' : 'Zum Retro-Layout von 1996 wechseln') : n === 'future' ? (en() ? 'Switch to the futuristic layout' : 'Zum futuristischen Layout wechseln') : (en() ? 'Switch to the classic layout' : 'Zum klassischen Layout wechseln'));
    btn.title = btn.getAttribute('aria-label');
    var m = document.querySelector('meta[name=theme-color]');
    if (m && curD() === 'retro') m.content = '#C0C0C0';
    else if (m && f) m.content = root.getAttribute('data-theme') === 'light' ? '#E9E5DC' : '#121815';
    else if (m) m.content = root.getAttribute('data-theme') === 'dark' ? '#1F2321' : '#5F6F63';
    var hh = document.querySelector('.hero-hud .hh-tr');
    if (hh) hh.textContent = en() ? 'Open to new things' : 'Offen für Neues';
    hud();
  }

  function set(next, x, y) {
    function apply() {
      if (next === 'future') { root.setAttribute('data-design', 'future'); fonts(); }
      else if (next === 'retro') root.setAttribute('data-design', 'retro');
      else root.removeAttribute('data-design');
      try { localStorage.setItem(KEY, next); } catch (e) {}
      label();
      document.dispatchEvent(new CustomEvent('designchange', { detail: next }));
    }
    if (reduce || !document.startViewTransition) { apply(); return; }
    var vt = document.startViewTransition(apply);
    vt.ready.then(function () {
      var r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      root.animate({ clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + r + 'px at ' + x + 'px ' + y + 'px)'] },
        { duration: 700, easing: 'cubic-bezier(.7,0,.2,1)', pseudoElement: '::view-transition-new(root)' });
    }).catch(function () {});
  }

  if (btn) btn.addEventListener('click', function () {
    var r = btn.getBoundingClientRect(), next = nextOf(curD());
    set(next, r.left + r.width / 2, r.top + r.height / 2);
    if (window.mauTrack) window.mauTrack('Layout gewechselt', { layout: next });
  });
  window.mauDesign = function (next, x, y) { set(next, x == null ? innerWidth / 2 : x, y == null ? 60 : y); if (window.mauTrack) window.mauTrack('Layout gewechselt', { layout: next }); };
  if (isF()) fonts();

  /* HUD: Fortschritt beim Scrollen und aktueller Abschnitt */
  var secs = Array.prototype.slice.call(document.querySelectorAll('main section[id]')).filter(function (s) { return s.querySelector('.section-label'); });
  var read = document.querySelector('.hud-read'), cur = -1;
  function hud() {
    if (!read) return;
    var n = cur < 0 ? 0 : cur + 1, name = cur < 0 ? 'Start' : secs[cur].querySelector('.section-label').textContent.trim();
    read.querySelector('.hud-n').textContent = (n < 10 ? '0' : '') + n;
    read.querySelector('.hud-t').textContent = '/ ' + (secs.length < 10 ? '0' : '') + secs.length;
    read.querySelector('.hud-s').textContent = name;
  }
  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var max = document.documentElement.scrollHeight - innerHeight;
      root.style.setProperty('--sp', max > 0 ? Math.min(1, Math.max(0, scrollY / max)).toFixed(4) : 0);
      var mid = innerHeight * .5, c = -1;
      for (var i = 0; i < secs.length; i++) if (secs[i].getBoundingClientRect().top < mid) c = i;
      if (c !== cur) { cur = c; hud(); }
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* Lichtkante folgt dem Mauszeiger auf den Panels */
  var SEL = '.card, .venture.main, .side-card, .quiz-box, .contact-card, .soon-card, .venture.soon';
  if (window.matchMedia && matchMedia('(pointer: fine)').matches) {
    document.addEventListener('pointermove', function (e) {
      if (!isF()) return;
      var el = e.target.closest && e.target.closest(SEL); if (!el) return;
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px');
    }, { passive: true });
    document.addEventListener('pointerout', function (e) {
      var el = e.target.closest && e.target.closest(SEL);
      if (el && !el.contains(e.relatedTarget)) { el.style.removeProperty('--mx'); el.style.removeProperty('--my'); }
    });
  }

  /* Rotierende Zeile im Hero: „Ich baue Startups / Teams / …" */
  var rot = document.querySelector('.fx-rot');
  if (rot) {
    var W = {
      de: { p: 'Ich baue ', w: ['Startups.', 'Teams.', 'Standorte.', 'Communities.', 'das nächste große Ding.'] },
      en: { p: 'I build ', w: ['startups.', 'teams.', 'locations.', 'communities.', 'the next big thing.'] }
    };
    var wi = 0, wEl = rot.querySelector('.fx-w'), pEl = rot.querySelector('.fx-p');
    var words = function () { return W[en() ? 'en' : 'de']; };
    var paint = function () { pEl.textContent = words().p; wEl.textContent = words().w[wi]; };
    paint();
    document.addEventListener('langchange', paint);
    if (!reduce) setInterval(function () {
      if (!isF() || document.hidden) return;
      wEl.classList.add('out');
      setTimeout(function () {
        wi = (wi + 1) % words().w.length; paint();
        wEl.classList.remove('out'); wEl.classList.add('in');
        void wEl.offsetWidth; wEl.classList.remove('in');
      }, 350);
    }, 2400);
  }

  document.addEventListener('langchange', label);
  document.addEventListener('themechange', label);
  label();
})();
