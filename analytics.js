/* =========================================================
   Erweiterte, anonyme Statistik für mau-e.com (Umami, ohne Cookies)
   Erfasst nur Verhalten auf der Seite, nichts auf dem Gerät gespeichert,
   kein Fingerprinting, keine Wiedererkennung über Tage hinweg.
   ========================================================= */
(function () {
  'use strict';
  if (!window.UMAMI || !window.UMAMI.id || location.hostname !== 'mau-e.com') return;
  var T = function (n, d) { if (window.mauTrack) window.mauTrack(n, d); };
  var start = Date.now(), active = 0, lastTick = Date.now(), visible = !document.hidden;
  var NAMES = { about: 'Über mich', work: 'Schwerpunkte', ventures: 'Unternehmen', stations: 'Stationen', more: 'Mehr / Side Projects', quiz: 'Quiz', contact: 'Kontakt' };

  /* Sitzungsmerkmale an den Besuch hängen (in Umami unter Sessions sichtbar) */
  function identify() {
    if (!window.umami || !umami.identify) return setTimeout(identify, 500);
    try {
      umami.identify({
        sprache_angezeigt: window.LANG || 'de',
        design: document.documentElement.getAttribute('data-theme') || 'light',
        geraet: matchMedia('(pointer: coarse)').matches ? 'Touch' : 'Maus',
        ausrichtung: innerWidth > innerHeight ? 'quer' : 'hoch',
        browser_sprache: (navigator.language || '').slice(0, 5),
        zeitzone: (Intl.DateTimeFormat().resolvedOptions().timeZone || ''),
        tageszeit: (function (h) { return h < 6 ? 'nachts' : h < 11 ? 'morgens' : h < 14 ? 'mittags' : h < 18 ? 'nachmittags' : h < 22 ? 'abends' : 'nachts'; })(new Date().getHours())
      });
    } catch (e) {}
  }
  identify();

  /* Aktive Zeit messen (nur wenn der Tab sichtbar ist) */
  setInterval(function () { if (visible) active += Date.now() - lastTick; lastTick = Date.now(); }, 1000);
  document.addEventListener('visibilitychange', function () {
    if (visible) active += Date.now() - lastTick;
    lastTick = Date.now(); visible = !document.hidden;
    if (document.hidden) sendSummary();
  });

  /* Welche Bereiche wurden angesehen, in welcher Reihenfolge */
  var seen = [];
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var id = e.target.id; if (seen.indexOf(id) >= 0) return;
        seen.push(id);
        T('Bereich angesehen', { bereich: NAMES[id] || id, nach_sekunden: Math.round((Date.now() - start) / 1000), reihenfolge: seen.length });
        io.unobserve(e.target);
      });
    }, { threshold: 0.35 });
    Object.keys(NAMES).forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });
  }

  /* Scrolltiefe */
  var marks = [25, 50, 75, 100], hit = {}, maxDepth = 0;
  addEventListener('scroll', function () {
    var h = document.documentElement.scrollHeight - innerHeight; if (h <= 0) return;
    var d = Math.round(scrollY / h * 100); if (d > maxDepth) maxDepth = d;
    marks.forEach(function (m) { if (d >= m - 1 && !hit[m]) { hit[m] = 1; T('Gescrollt', { prozent: m }); } });
  }, { passive: true });

  /* Klicks auf externe Links */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]'); if (!a) return;
    var u; try { u = new URL(a.href, location.href); } catch (x) { return; }
    if (u.hostname && u.hostname !== location.hostname) {
      T('Externer Link', { ziel: u.hostname.replace(/^www\./, ''), text: (a.textContent || a.getAttribute('aria-label') || '').trim().slice(0, 40) });
    }
  }, true);

  /* Foto-Slider, Video, Quizstart, Formular angefangen, Download-Hilfe */
  document.addEventListener('click', function (e) {
    if (e.target.closest('.g-nav')) T('Fotos durchgeklickt');
    if (e.target.closest('.quiz-box .btn')) T('Quiz gestartet');
    if (e.target.closest('.dl-help summary')) T('Installationshilfe geöffnet');
    if (e.target.closest('.timeline summary')) T('Aufgaben aufgeklappt');
  }, true);
  var formStarted = false;
  document.addEventListener('focusin', function (e) {
    if (!formStarted && e.target.closest('#contact-form')) { formStarted = true; T('Kontaktformular angefangen'); }
  });
  var vid = document.querySelector('.side-video video');
  if (vid && 'IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { T('Video angesehen'); vio.disconnect(); }
    }, { threshold: .6 });
    vio.observe(vid);
  }
  document.addEventListener('copy', function () { T('Text kopiert'); });

  /* Zusammenfassung beim Verlassen */
  var sent = false;
  function sendSummary() {
    if (sent) return; sent = true;
    var s = Math.round(active / 1000);
    T('Besuch beendet', {
      aktive_sekunden: s,
      dauer: s < 10 ? 'unter 10 s' : s < 30 ? '10 bis 30 s' : s < 60 ? '30 bis 60 s' : s < 180 ? '1 bis 3 min' : s < 600 ? '3 bis 10 min' : 'über 10 min',
      max_scroll: maxDepth,
      bereiche: seen.length
    });
  }
  addEventListener('pagehide', sendSummary);
})();
