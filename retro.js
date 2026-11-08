/* Layout „Retro": die Seite, wie sie 1996 ausgesehen hätte.
   Baut eine eigene Ansicht aus den Inhalten der normalen Seite (Texte und Übersetzungen
   bleiben an einer Stelle), Tabellen-Layout, Times, blaue Links, Laufschrift und Besucherzähler. */
(function () {
  var root = document.documentElement;
  function isR() { return root.getAttribute('data-design') === 'retro'; }
  function en() { return window.LANG === 'en'; }
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function txt(s, c) { var e = $(s, c); return e ? e.textContent.replace(/\s+/g, ' ').trim() : ''; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  var T = {
    de: {
      welcome: '+++ Herzlich willkommen auf der Homepage von Tobias Maue +++ Schön, dass du da bist! +++ Diese Seite befindet sich im Aufbau +++ Trag dich doch ins Gästebuch ein +++',
      title: 'Tobias Maues Homepage', sub: 'Mitgründer, Macher und Möglichmacher', build: 'Under Construction', buildP: 'Diese Seite wird ständig erweitert. Schau bald wieder vorbei!',
      back: 'Zurück in die Gegenwart', lang: 'English version', menu: 'Menü', about: 'Über mich', facts: 'Zahlen & Fakten', drive: 'Was mich antreibt',
      ventures: 'Woran ich mitbaue', cv: 'Mein Lebenslauf', projects: 'Meine Projekte', guest: 'Gästebuch & Kontakt', links: 'Coole Links',
      when: 'Wann', where: 'Wo', what: 'Was', cvPdf: 'Lebenslauf herunterladen (PDF)', dl: 'Jetzt herunterladen!', soon: 'Bald mehr über mich',
      counter: 'Deine Besuche auf dieser Seite:', best: 'Am besten anzusehen mit Netscape Navigator 3.0 bei 800 × 600 Pixeln und 256 Farben.',
      made: 'Handgeschrieben mit Notepad', updated: 'Letzte Änderung:', top: 'Nach oben', new: 'NEU!', hot: 'HEISS!', mail: 'Schreib mir!',
      guestP: 'Du willst mir etwas sagen? Trag dich ein! Jede Nachricht landet direkt in meinem Postfach.', yourProject: 'Dein Projekt hier?',
      sign: 'Abschicken', reset: 'Löschen', name: 'Dein Name', email: 'Deine E-Mail', msg: 'Deine Nachricht', link1: 'Mein LinkedIn-Profil', link2: 'Meine digitale Visitenkarte', link3: 'CardCircle im Netz',
      frames: 'Diese Seite funktioniert auch ohne Frames.'
    },
    en: {
      welcome: '+++ Welcome to the homepage of Tobias Maue +++ Glad you stopped by! +++ This page is under construction +++ Please sign my guestbook +++',
      title: 'Tobias Maue’s Home Page', sub: 'Co-founder, builder and enabler', build: 'Under Construction', buildP: 'This page is constantly growing. Check back soon!',
      back: 'Back to the present', lang: 'Deutsche Version', menu: 'Menu', about: 'About me', facts: 'Facts & figures', drive: 'What drives me',
      ventures: 'What I am building', cv: 'My resume', projects: 'My projects', guest: 'Guestbook & contact', links: 'Cool links',
      when: 'When', where: 'Where', what: 'What', cvPdf: 'Download resume (PDF)', dl: 'Download now!', soon: 'More about me soon',
      counter: 'Your visits to this page:', best: 'Best viewed with Netscape Navigator 3.0 at 800 × 600 pixels and 256 colors.',
      made: 'Handwritten with Notepad', updated: 'Last updated:', top: 'Back to top', new: 'NEW!', hot: 'HOT!', mail: 'Write me!',
      guestP: 'Want to tell me something? Sign in! Every message lands straight in my inbox.', yourProject: 'Your project here?',
      sign: 'Send', reset: 'Clear', name: 'Your name', email: 'Your e-mail', msg: 'Your message', link1: 'My LinkedIn profile', link2: 'My digital business card', link3: 'CardCircle on the web',
      frames: 'This page also works without frames.'
    }
  };
  function t(k) { return T[en() ? 'en' : 'de'][k]; }

  /* Besucherzähler: ehrlich, er zählt nur die eigenen Besuche in diesem Browser */
  var visits = 1;
  try { visits = (parseInt(localStorage.getItem('retroVisits') || '0', 10) || 0) + 1; localStorage.setItem('retroVisits', visits); } catch (e) {}

  var box;
  function build() {
    var html = '';
    var h = function (id, label, badge) {
      return '<a name="' + id + '"></a><h2 class="r-h2"><span class="r-ball"></span>' + esc(label) + (badge ? ' <span class="r-blink">' + badge + '</span>' : '') + '</h2>';
    };

    /* Kopf */
    html += '<marquee class="r-marquee" scrollamount="5">' + esc(t('welcome')) + '</marquee>';
    html += '<table class="r-top" width="100%" cellpadding="6" cellspacing="0"><tr>' +
      '<td align="left"><button type="button" class="r-btn" data-act="back">&laquo; ' + esc(t('back')) + '</button></td>' +
      '<td align="right"><button type="button" class="r-btn" data-act="lang">' + esc(t('lang')) + '</button></td></tr></table>';
    html += '<center><h1 class="r-h1">' + esc(t('title')) + '</h1><p class="r-sub"><i>' + esc(t('sub')) + '</i></p>' +
      '<div class="r-construct"><span class="r-sign">!</span><b>' + esc(t('build')) + '</b><span class="r-sign">!</span><br><small>' + esc(t('buildP')) + '</small></div></center>';
    html += '<hr class="r-rainbow">';

    /* Zwei Spalten: Menü links, Inhalt rechts */
    html += '<table class="r-main" width="100%" cellpadding="8" cellspacing="0" border="0"><tr>';
    html += '<td class="r-nav" valign="top" width="170"><b>' + esc(t('menu')) + '</b><ul>' +
      [['about', 'about'], ['facts', 'facts'], ['drive', 'drive'], ['ventures', 'ventures'], ['cv', 'cv'], ['projects', 'projects'], ['guest', 'guest']].map(function (n) { return '<li><a href="#r-' + n[0] + '">' + esc(t(n[1])) + '</a></li>'; }).join('') +
      '</ul><hr><p class="r-small">' + esc(t('frames')) + '</p>' +
      '<p class="r-small"><a href="#r-guest">' + esc(t('mail')) + '</a> <span class="r-blink">✉</span></p></td>';

    html += '<td class="r-content" valign="top">';

    /* Über mich */
    var img = $('#about .portrait img');
    html += h('r-about', t('about'));
    html += '<table cellpadding="4" cellspacing="0" border="0"><tr><td valign="top">' +
      (img ? '<img class="r-photo" src="' + esc(img.currentSrc || img.src) + '" alt="Tobias Maue" width="150" border="3" align="left" hspace="10" vspace="4">' : '') +
      '<p><b><font size="+1">' + esc(txt('#about h2')) + '</font></b></p>' +
      $$('#about .about-text > p').map(function (p) { return '<p>' + esc(p.textContent.replace(/\s+/g, ' ').trim()) + '</p>'; }).join('') +
      '</td></tr></table>';

    /* Zahlen */
    html += h('r-facts', t('facts'));
    html += '<table class="r-table" border="2" cellpadding="6" cellspacing="2"><tr>' +
      $$('.stats .stat').map(function (s) { return '<td align="center" valign="top" width="25%"><font size="+3" class="r-num">' + esc(txt('.stat-num', s) + txt('.stat-plus', s)) + '</font><br>' + esc(txt('p', s)) + '</td>'; }).join('') +
      '</tr></table>';

    /* Was mich antreibt */
    html += h('r-drive', t('drive'));
    html += '<ul class="r-list">' + $$('#work .card').map(function (c) { return '<li><b>' + esc(txt('h3', c)) + ':</b> ' + esc(txt('p', c)) + '</li>'; }).join('') + '</ul>';
    var words = $$('.ticker .ticker-set:first-child .tw').map(function (w) { return esc(w.textContent); });
    if (words.length) html += '<marquee class="r-alt" behavior="alternate" scrollamount="4">*** ' + words.join(' *** ') + ' ***</marquee>';

    /* Unternehmen */
    html += h('r-ventures', t('ventures'), t('hot'));
    var main = $('#ventures .venture.main');
    if (main) {
      html += '<table class="r-table" border="1" cellpadding="8" cellspacing="0" width="100%"><tr><td valign="top" bgcolor="#FFFFFF" width="120" align="center">' +
        '<img src="img/cardcircle.svg?v=2" alt="CardCircle" width="100"></td><td valign="top"><b><font size="+1">' + esc(txt('h3', main)) + '</font></b> · <i>' + esc(txt('.v-role', main)) + '</i><br>' +
        esc(txt('.v-text', main)) + '<br><br>' + $$('.v-links a', main).map(function (a) { return '<a href="' + esc(a.href) + '" target="_blank" rel="noopener">' + esc(a.textContent) + '</a>'; }).join(' | ') + '</td></tr></table>';
    }
    var slot = $('#ventures .venture.slot'), soon = $('#ventures .venture.soon');
    html += '<p>' + (slot ? '<b>' + esc(txt('h3', slot)) + '</b> ' + esc(txt('p', slot)) + ' <a href="#r-guest">' + esc(t('mail')) + '</a>' : '') + '</p>';
    if (soon) html += '<p><b>' + esc(txt('h3', soon)) + '</b> ' + esc(txt('p', soon)) + (soon.href ? ' <a href="' + esc(soon.href) + '" target="_blank" rel="noopener">' + esc(txt('.mds-cta', soon) || soon.href) + '!</a>' : '') + '</p>';

    /* Lebenslauf */
    html += h('r-cv', t('cv'));
    var cv = $('#cv-link');
    html += '<table class="r-table" border="2" cellpadding="6" cellspacing="0" width="100%"><tr bgcolor="#000080"><th><font color="#FFFFFF">' + esc(t('when')) + '</font></th><th><font color="#FFFFFF">' + esc(t('where')) + '</font></th><th><font color="#FFFFFF">' + esc(t('what')) + '</font></th></tr>' +
      $$('#stations .timeline > li').map(function (li, i) {
        return '<tr bgcolor="' + (i % 2 ? '#E8E8E8' : '#FFFFFF') + '"><td valign="top" nowrap>' + esc(txt('.when', li)) + '</td><td valign="top"><b>' + esc(txt('h3', li)) + '</b><br><i>' + esc(txt('.role', li)) + '</i></td>' +
          '<td valign="top">' + esc(txt(':scope > div > p:not(.role):not(.links):not(.cities)', li)) + '</td></tr>';
      }).join('') + '</table>';
    if (cv) html += '<p><span class="r-ball"></span><a href="' + esc(cv.getAttribute('href')) + '" target="_blank">' + esc(t('cvPdf')) + '</a> <span class="r-blink">' + esc(t('new')) + '</span></p>';

    /* Projekte */
    html += h('r-projects', t('projects'), t('new'));
    $$('#more .side-card:not(.side-next)').forEach(function (c) {
      var dl = $('#app-dl', c);
      html += '<p><b><font size="+1">' + esc(txt('h4', c)) + '</font></b><br>' + esc(txt('.side-body > p', c)) + '</p>' +
        (dl ? '<p><a class="r-dl" href="' + esc(dl.getAttribute('href')) + '" download>' + esc(t('dl')) + '</a> <small>(' + esc(txt('#app-meta', c)) + ')</small></p>' : '');
    });
    var soonCards = $$('#more .soon-card');
    if (soonCards.length) html += '<p><b>' + esc(t('soon')) + ':</b> ' + soonCards.map(function (c) { return esc(txt('h4', c)); }).join(', ') + ' <span class="r-dig">' + esc(t('build')) + '</span></p>';

    /* Gästebuch und Kontakt (echtes Formular, schickt an dieselbe Adresse) */
    html += h('r-guest', t('guest'));
    var f = $('#contact-form');
    html += '<p>' + esc(t('guestP')) + '</p>';
    if (f) {
      html += '<form class="r-form" action="' + esc(f.getAttribute('action')) + '" method="POST"><table cellpadding="4" cellspacing="0" border="0">' +
        '<tr><td>' + esc(t('name')) + ':</td><td><input type="text" name="name" size="30" required></td></tr>' +
        '<tr><td>' + esc(t('email')) + ':</td><td><input type="email" name="email" size="30" required></td></tr>' +
        '<tr><td valign="top">' + esc(t('msg')) + ':</td><td><textarea name="message" rows="6" cols="40" required></textarea></td></tr>' +
        '<tr><td></td><td><input type="text" name="_gotcha" tabindex="-1" autocomplete="off" class="r-hp" aria-hidden="true"><input type="submit" class="r-btn" value="' + esc(t('sign')) + '"> <input type="reset" class="r-btn" value="' + esc(t('reset')) + '"></td></tr>' +
        '</table><p class="r-small">' + (($('.form-note', f) || {}).innerHTML || '') + '</p></form>';
    }

    /* Links */
    html += h('r-links', t('links'));
    html += '<ul class="r-list"><li><a href="https://www.linkedin.com/in/tobiasmaue" target="_blank" rel="noopener">' + esc(t('link1')) + '</a></li>' +
      '<li><a href="karte">' + esc(t('link2')) + '</a></li><li><a href="https://cardcircle.cc" target="_blank" rel="noopener">' + esc(t('link3')) + '</a></li></ul>';

    html += '</td></tr></table>';

    /* Fuß */
    var digits = ('000000' + visits).slice(-6).split('').map(function (d) { return '<span>' + d + '</span>'; }).join('');
    var upd = txt('#last-grown');
    html += '<hr class="r-rainbow"><center>' +
      '<p>' + esc(t('counter')) + '<br><span class="r-counter">' + digits + '</span></p>' +
      '<p class="r-badges"><span>HTML 3.2</span><span>800 × 600</span><span>Notepad</span><span>Web 1.0</span></p>' +
      '<p class="r-small">' + esc(t('best')) + '<br>' + esc(t('made')) + (upd ? ' · ' + esc(t('updated')) + ' ' + esc(upd) : '') + '<br>' +
      '&copy; 2026 Tobias Maue · <a href="karte">' + (en() ? 'Business card' : 'Visitenkarte') + '</a> · <a href="datenschutz.html">' + (en() ? 'Privacy' : 'Datenschutz') + '</a></p>' +
      '<p><a href="#r-top">[ ' + esc(t('top')) + ' ]</a></p></center>';

    box.innerHTML = '<a name="r-top"></a>' + html;
  }

  function ensure() {
    if (!isR()) { if (box) box.hidden = true; return; }
    if (!box) {
      box = document.createElement('div'); box.id = 'retro';
      document.body.insertBefore(box, document.body.firstChild);
      box.addEventListener('click', function (e) {
        var b = e.target.closest('[data-act]'); if (b) {
          if (b.getAttribute('data-act') === 'back' && window.mauDesign) window.mauDesign('classic', e.clientX, e.clientY);
          if (b.getAttribute('data-act') === 'lang') { var l = document.getElementById('lang-switch'); if (l) l.click(); }
          return;
        }
        var a = e.target.closest('a[href^="#r-"]');
        if (a) { e.preventDefault(); var n = box.querySelector('a[name="' + a.getAttribute('href').slice(1) + '"]'); if (n) n.scrollIntoView(); }
      });
    }
    box.hidden = false; build();
  }
  document.addEventListener('designchange', function () { ensure(); if (isR()) scrollTo(0, 0); });
  document.addEventListener('langchange', function () { if (isR()) build(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensure); else ensure();
  window.addEventListener('load', function () { if (isR()) build(); });
})();
