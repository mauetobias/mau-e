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

  /* Zeit je Bereich (8.11.): Bereich in der Bildschirmmitte, nur bei sichtbarem Tab und Aktivität in den letzten 60 s */
  var lastAct = Date.now(), secT = {};
  ['scroll', 'pointermove', 'pointerdown', 'keydown', 'touchstart', 'wheel'].forEach(function (t) { addEventListener(t, function () { lastAct = Date.now(); }, { passive: true, capture: true }); });
  function centerSec() {
    var y = innerHeight / 2, ids = Object.keys(NAMES);
    for (var i = 0; i < ids.length; i++) { var el = document.getElementById(ids[i]); if (!el) continue; var r = el.getBoundingClientRect(); if (r.top <= y && r.bottom >= y) return NAMES[ids[i]]; }
    var f = document.querySelector('footer'); if (f) { var rf = f.getBoundingClientRect(); if (rf.top <= y && rf.bottom >= y) return 'Fußzeile'; }
    return y < (document.getElementById('about') || document.body).getBoundingClientRect().top ? 'Start' : '';
  }
  setInterval(function () { if (document.hidden || Date.now() - lastAct > 60000) return; var s = centerSec(); if (s) secT[s] = (secT[s] || 0) + 1; }, 1000);
  function dauer(s) { return s < 10 ? 'unter 10 s' : s < 30 ? '10 bis 30 s' : s < 60 ? '30 bis 60 s' : s < 180 ? '1 bis 3 min' : s < 600 ? '3 bis 10 min' : 'über 10 min'; }

  /* Klicks auf alle Knöpfe und Links (8.11.): Aufschrift immer auf Deutsch (i18n.js merkt das Original in data-de) */
  function deText(el) {
    var c = el.cloneNode(true);
    if (c.dataset && c.dataset.de !== undefined) c.innerHTML = c.dataset.de;
    c.querySelectorAll('[data-de]').forEach(function (n) { n.innerHTML = n.dataset.de; });
    return c.textContent || '';
  }
  function secOf(el) {
    var ids = Object.keys(NAMES);
    for (var i = 0; i < ids.length; i++) { var s = document.getElementById(ids[i]); if (s && s.contains(el)) return NAMES[ids[i]]; }
    return el.closest('footer') ? 'Fußzeile' : el.closest('header,nav') ? 'Kopfleiste' : 'Start';
  }
  document.addEventListener('click', function (e) {
    var el = e.target.closest('a[href],button,summary,[role=button],input[type=submit]'); if (!el) return;
    var l = (el.getAttribute('data-track') || deText(el) || el.getAttribute('aria-label') || el.getAttribute('title') || '').replace(/\s+/g, ' ').replace(/^[^0-9A-Za-zÄÖÜäöüß€]+/, '').trim();
    if (!l && el.href) { try { var u = new URL(el.href, location.href); l = u.hostname === location.hostname ? u.pathname + u.hash : u.hostname.replace(/^www\./, ''); } catch (x) {} }
    l = l.replace(/\S+@\S+/g, '…').slice(0, 50);
    if (l) T('Knopf geklickt', { knopf: l, bereich: secOf(el), knopf_im_bereich: secOf(el) + ' › ' + l });
  }, true);

  /* Zusammenfassung beim Verlassen */
  var sent = false;
  function sendSummary() {
    if (sent) return; sent = true;
    Object.keys(secT).forEach(function (k) {
      if (secT[k] >= 2) T('Zeit im Bereich', { bereich: k, sekunden: secT[k], dauer: dauer(secT[k]), bereich_dauer: k + ' › ' + dauer(secT[k]) });
    });
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
