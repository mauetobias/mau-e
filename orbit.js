/* =====================================================================
   mau-e · Layout „Future" · Sinkflug
   Eine Kamera, eine Spirale, ein Himmel.

   Die Seite bleibt ein ganz normales, scrollbares Dokument (Lesen, Links,
   Formulare, Anker: alles funktioniert wie immer). Darüber liegt eine
   einzige Kamera-Idee:
     · Alle Abschnitte sitzen auf einer großen Spirale um eine senkrechte
       Achse hinter dem Bildschirm (Radius größer als der Bildschirm).
     · Beim Lesen steht der aktuelle Abschnitt gerade vor der Kamera.
     · Zwischen zwei Abschnitten dreht sich die Welt um die Achse: der alte
       Abschnitt schwenkt links hinaus, der neue kommt von rechts herein.
     · Dahinter rechnet ein Shader den Himmel: oben Weltall, darunter die
       Atmosphäre, der Horizont, zuletzt Hügel und Wald.
   ===================================================================== */
(function () {
  'use strict';
  var root = document.documentElement, doc = document;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && matchMedia('(pointer: fine)').matches;
  function isF() { return root.getAttribute('data-design') === 'future'; }
  function en() { return window.LANG === 'en'; }
  function isLight() { return root.getAttribute('data-theme') === 'light'; }
  function q(s, c) { return (c || doc).querySelector(s); }
  function qa(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }
  function el(tag, cls, html) { var e = doc.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function sm(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }

  var built = false, raf = 0, slots = [], vw = 0, vh = 0, R = 2000, P = 1600, docH = 0, mobile = false;
  var yaw = 0, swx = 0, swy = 0, tsx = 0, tsy = 0, last = 0, lastKey = '', force = true;
  var BIG = 38, SAT = 22;

  /* ------------------------------------------------------------------
     1) Himmel: ein Shader, gesteuert von Sinkflug (0..1) und Blickwinkel
     ------------------------------------------------------------------ */
  var sky = { ok: false };
  var FRAG = [
    'precision highp float;',
    'uniform vec2 uR; uniform float uT, uP, uYaw, uTh; uniform vec2 uSw;',
    'float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }',
    'float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }',
    'float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * vn(p); p = p * 2.03 + vec2(17.3, 9.1); a *= 0.5; } return s; }',
    'float fb1(float x){ return fbm(vec2(x, 3.7)); }',
    'float stars(vec2 g, float dens){ vec2 id = floor(g), f = fract(g) - 0.5; float r = h21(id);',
    '  vec2 o = (vec2(h21(id + 3.1), h21(id + 7.7)) - 0.5) * 0.7; float d = length(f - o);',
    '  float tw = 0.7 + 0.3 * sin(uT * (0.6 + r * 2.4) + r * 40.0);',
    '  return step(1.0 - dens, r) * smoothstep(0.055 * (0.35 + r * 0.9), 0.0, d) * tw; }',
    'void main(){',
    '  vec2 uv = (gl_FragCoord.xy - 0.5 * uR) / uR.y;',
    '  uv += uSw * 0.012;',
    '  float p = uP, th = uTh;',
    '  float ang = uYaw + uv.x * 0.9;',
    /* Farben: dunkel (Nachtflug) und hell (Tagflug) */
    '  vec3 cSpace = mix(vec3(0.004, 0.010, 0.008), vec3(0.47, 0.54, 0.51), th);',
    '  vec3 cHigh  = mix(vec3(0.010, 0.032, 0.027), vec3(0.60, 0.66, 0.62), th);',
    '  vec3 cMid   = mix(vec3(0.030, 0.090, 0.072), vec3(0.74, 0.78, 0.72), th);',
    '  vec3 cLow   = mix(vec3(0.085, 0.185, 0.140), vec3(0.87, 0.87, 0.80), th);',
    '  vec3 cHaze  = mix(vec3(0.300, 0.420, 0.330), vec3(0.95, 0.92, 0.84), th);',
    '  vec3 cRim   = mix(vec3(0.360, 0.640, 0.500), vec3(0.98, 0.97, 0.92), th);',
    '  vec3 cAmber = vec3(0.886, 0.651, 0.353);',
    /* Himmel: wird mit sinkender Höhe heller, zum Horizont hin dichter */
    '  float s = smoothstep(0.08, 1.0, p);',
    '  vec3 col = mix(cSpace, cHigh, smoothstep(0.0, 0.35, p));',
    '  col = mix(col, cMid, smoothstep(0.30, 0.68, p));',
    '  col = mix(col, cLow, smoothstep(0.62, 1.0, p));',
    '  float yh = -0.62 + 0.50 * s;',
    '  float kc = mix(0.55, 0.0, smoothstep(0.25, 0.92, p));',
    '  float ys = yh - kc * uv.x * uv.x;',
    '  float up = max(uv.y - ys, 0.0);',
    '  col = mix(col, cHaze, exp(-up * mix(9.0, 3.2, s)) * smoothstep(0.25, 1.0, p) * 0.85);',
    /* zarter Nebel im All, damit es nicht leer wirkt */
    '  float neb = fbm(vec2(ang * 1.3, uv.y * 1.6 + p * 0.8) + 4.0);',
    '  col += mix(vec3(0.020, 0.050, 0.040), vec3(0.03), th) * smoothstep(0.45, 0.85, neb) * (1.0 - smoothstep(0.0, 0.55, p));',
    /* Sterne: drehen sich mit dem Blickwinkel, verblassen in der Atmosphäre */
    '  float sv = 1.0 - smoothstep(0.10, 0.62, p);',
    '  if (sv > 0.001) {',
    '    vec2 sk = vec2(ang, uv.y + p * 0.35);',
    '    float st = stars(sk * 30.0, 0.20) * 1.0 + stars(sk * 62.0 + 11.0, 0.16) * 0.6 + stars(sk * 13.0 + 5.0, 0.05) * 1.7;',
    '    float warm = step(0.7, h21(floor(sk * 26.0)));',
    '    col += mix(vec3(0.95, 0.97, 0.93), cAmber, warm * 0.6) * st * sv * mix(1.0, 0.35, th);',
    '  }',
    /* Lichtsaum der Atmosphäre über dem Horizont */
    '  float rimV = smoothstep(0.16, 0.36, p);',
    '  col += cRim * exp(-up * mix(34.0, 10.0, s)) * 0.42 * rimV * (1.0 - 0.6 * smoothstep(0.8, 1.0, p)) * mix(1.0, 0.5, th);',
    '  col += mix(cAmber, vec3(1.0), 0.35) * exp(-up * 260.0) * 0.55 * rimV * (1.0 - smoothstep(0.7, 0.95, p)) * mix(1.0, 0.4, th);',
    /* Oberfläche: aus großer Höhe Landmassen und Lichter, unten Hügelketten und Wald */
    '  float q1 = smoothstep(0.70, 1.0, p), q2 = smoothstep(0.84, 1.0, p);',
    '  float r1 = -9.0, r2 = -9.0, r3 = -9.0;',
    '  if (q1 > 0.001) {',
    '  r1 = ys + q1 * (0.050 + 0.110 * (fb1(ang * 2.2 + 3.0) - 0.5));',
    '  r2 = ys - 0.02 + q1 * (0.020 + 0.150 * (fb1(ang * 3.6 + 40.0) - 0.5));',
    '  float tx = ang * 5.2 + 80.0;',
    '  r3 = ys - 0.07 + q1 * (0.030 + 0.120 * (fb1(tx * 0.8) - 0.5));',
    '  float c2 = tx * 34.0; float t2 = max(0.0, 1.0 - abs(fract(c2) - 0.5) * 2.7) * (0.5 + h21(vec2(floor(c2), 1.0))) * 0.050 * q2;',
    '  float c1 = ang * 3.6 * 22.0; float t1 = max(0.0, 1.0 - abs(fract(c1) - 0.5) * 2.6) * (0.5 + h21(vec2(floor(c1), 5.0))) * 0.022 * q2;',
    '  r2 += t1; r3 += t2;',
    '  }',
    '  if (uv.y < ys) {',
    '    float d = ys - uv.y;',
    '    vec2 g = vec2(uv.x / (d + 0.22) * 0.9 + uYaw * 1.6, 1.4 / (d + 0.22) + p * 2.0);',
    '    float n = fbm(g * 1.2);',
    '    float land = smoothstep(0.46, 0.60, n);',
    '    vec3 sea = mix(vec3(0.012, 0.040, 0.036), vec3(0.62, 0.69, 0.65), th);',
    '    vec3 lnd = mix(vec3(0.045, 0.110, 0.075), vec3(0.50, 0.60, 0.50), th);',
    '    vec3 sc = mix(sea, lnd, land);',
    '    float cl = smoothstep(0.52, 0.80, fbm(g * 2.3 + vec2(uT * 0.01, 0.0)));',
    '    sc = mix(sc, mix(vec3(0.20, 0.30, 0.26), vec3(0.96), th), cl * 0.35);',
    '    float li = step(0.90, h21(floor(g * 46.0))) * land * (1.0 - smoothstep(0.35, 0.8, p)) * smoothstep(0.02, 0.10, d);',
    '    sc += cAmber * li * 0.55 * (1.0 - th);',
    '    sc *= mix(0.55, 1.0, smoothstep(0.0, 0.16, d) * 0.5 + 0.5 * s);',
    '    sc = mix(sc, mix(vec3(0.10, 0.19, 0.14), vec3(0.74, 0.79, 0.71), th), q1);',
    '    col = mix(sc, col, exp(-d * mix(60.0, 14.0, s)) * 0.55);',
    '  }',
    '  vec3 g1 = mix(vec3(0.105, 0.205, 0.150), vec3(0.66, 0.73, 0.65), th);',
    '  vec3 g2 = mix(vec3(0.060, 0.125, 0.090), vec3(0.50, 0.59, 0.51), th);',
    '  vec3 g3 = mix(vec3(0.028, 0.062, 0.045), vec3(0.34, 0.43, 0.37), th);',
    '  col = mix(col, g1, smoothstep(0.0, 0.004, r1 - uv.y) * q1);',
    '  col = mix(col, g2, smoothstep(0.0, 0.003, r2 - uv.y) * q1);',
    '  col = mix(col, g3, smoothstep(0.0, 0.003, r3 - uv.y) * q1);',
    /* Wolkendecke, durch die man sinkt */
    '  float cw = smoothstep(0.50, 0.64, p) * (1.0 - smoothstep(0.74, 0.88, p));',
    '  if (cw > 0.001) {',
    '    float c = fbm(vec2(ang * 1.7, uv.y * 3.0 - p * 26.0));',
    '    col = mix(col, mix(vec3(0.42, 0.56, 0.48), vec3(1.0, 0.99, 0.96), th), smoothstep(0.48, 0.82, c) * cw * 0.5);',
    '  }',
    '  col *= 1.0 - 0.28 * dot(uv, uv) * (1.0 - th * 0.7);',
    '  col += (h21(gl_FragCoord.xy + fract(uT) * 60.0) - 0.5) * 0.014;',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  function skyInit() {
    var cv = el('canvas', 'f-sky'); cv.setAttribute('aria-hidden', 'true');
    doc.body.insertBefore(cv, doc.body.firstChild);
    sky.cv = cv;
    var gl = null;
    try { gl = cv.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' }) || cv.getContext('experimental-webgl'); } catch (e) {}
    if (!gl) { root.classList.add('f-nogl'); return; }
    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
    try {
      var pr = gl.createProgram();
      gl.attachShader(pr, sh(gl.VERTEX_SHADER, 'attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }'));
      gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(pr);
      if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
      gl.useProgram(pr);
      var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      var loc = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      sky.gl = gl; sky.u = {};
      ['uR', 'uT', 'uP', 'uYaw', 'uTh', 'uSw'].forEach(function (n) { sky.u[n] = gl.getUniformLocation(pr, n); });
      sky.ok = true; sky.th = isLight() ? 1 : 0; sky.t0 = performance.now(); sky.lastDraw = 0;
      cv.addEventListener('webglcontextlost', function (e) { e.preventDefault(); sky.ok = false; root.classList.add('f-nogl'); });
    } catch (e) { root.classList.add('f-nogl'); if (window.console) console.warn('[mau-e] Himmel ohne WebGL:', e.message); }
  }
  function skySize() {
    if (!sky.cv) return;
    var s = Math.min(1.25, window.devicePixelRatio || 1) * (mobile ? 0.8 : 1), w = Math.round(innerWidth * s), h = Math.round(innerHeight * s);
    if (w > 1800) { h = Math.round(h * 1800 / w); w = 1800; }
    if (sky.cv.width !== w || sky.cv.height !== h) { sky.cv.width = w; sky.cv.height = h; if (sky.ok) sky.gl.viewport(0, 0, w, h); }
  }
  function skyDraw(now, p, dirty) {
    if (!sky.ok) return;
    var tt = isLight() ? 1 : 0;
    if (Math.abs(sky.th - tt) > 0.002) { sky.th += (tt - sky.th) * 0.08; dirty = true; }
    /* in Ruhe nur ab und zu neu zeichnen (Sterne funkeln), bei Bewegung jedes Bild */
    if (!dirty && (reduce || now - sky.lastDraw < 90)) return;
    sky.lastDraw = now;
    var gl = sky.gl, u = sky.u;
    gl.uniform2f(u.uR, sky.cv.width, sky.cv.height);
    gl.uniform1f(u.uT, (now - sky.t0) / 1000);
    gl.uniform1f(u.uP, p);
    gl.uniform1f(u.uYaw, yaw * Math.PI / 180);
    gl.uniform1f(u.uTh, sky.th);
    gl.uniform2f(u.uSw, swx, -swy);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /* ------------------------------------------------------------------
     2) Die Spirale: welche Elemente gehören zu welchem Platz
     ------------------------------------------------------------------ */
  function defineSlots() {
    slots = [];
    function add(els, step, label) {
      els = els.filter(Boolean); if (!els.length) return;
      slots.push({ items: els.map(function (e) { e.classList.add('f-b'); return { el: e }; }), step: step, label: label || null });
    }
    add([q('.hero > .wrap')], 0);
    add([q('#about > .wrap'), q('main > .stats > .wrap')], BIG, q('#about .section-label'));
    add([q('#work > .wrap')], BIG, q('#work .section-label'));
    add(qa('#ventures > .wrap'), BIG, q('#ventures .section-label'));
    /* Stationen: Kopf und danach jede Station als eigener Satellit auf der Spirale */
    add(qa('#stations > .wrap > :not(.timeline)').filter(function (e) { return e.offsetHeight > 0; }), BIG, q('#stations .section-label'));
    qa('#stations .timeline > li').forEach(function (li) { add([li], SAT); });
    add([q('#more > .wrap')], BIG, q('#more .section-label'));
    add([q('#quiz > .wrap')], BIG, q('#quiz .section-label'));
    add([q('#contact > .wrap')], BIG, q('#contact .section-label'));
    var a = 0;
    slots.forEach(function (s, i) { a += i ? s.step : 0; s.a = a; });
  }

  var ring = { el: null, y: 0, n: 0 };
  function measure() {
    vw = innerWidth; vh = innerHeight; mobile = vw < 760;
    R = Math.max(mobile ? 700 : 1000, vw * 1.5); P = Math.max(900, vw * 1.25);
    root.style.setProperty('--f-R', R.toFixed(0) + 'px');
    var all = [];
    slots.forEach(function (s) { s.items.forEach(function (it) { all.push(it); }); });
    all.forEach(function (it) { it.el.style.transform = 'none'; });
    var sy = window.scrollY;
    all.forEach(function (it) { var r = it.el.getBoundingClientRect(); it.L = r.left; it.T = r.top + sy; it.H = r.height; it.key = ''; });
    slots.forEach(function (s) {
      var top = Infinity, bot = -Infinity;
      s.items.forEach(function (it) { top = Math.min(top, it.T); bot = Math.max(bot, it.T + it.H); });
      var k = Math.min((bot - top) / 2, vh * 0.4);
      s.top = top; s.bot = bot; s.hs = top + k; s.he = bot - k;
    });
    if (ring.el) { var rr = ring.el.parentNode.getBoundingClientRect(); ring.y = rr.top + sy + rr.height / 2; buildRing(); }
    docH = root.scrollHeight;
    skySize();
    force = true;
  }

  /* Blickwinkel zur Höhe c (Dokumentposition der Bildschirmmitte) */
  function yawAt(c) {
    var n = slots.length; if (!n) return 0;
    if (c <= slots[0].he) return slots[0].a;
    for (var i = 0; i < n - 1; i++) {
      var A = slots[i], B = slots[i + 1];
      if (c <= A.he) return A.a;
      if (c < B.hs) {
        var t = (c - A.he) / Math.max(1, B.hs - A.he), e = t * t * t * (t * (t * 6 - 15) + 10);
        t = B.step === SAT ? t * 0.45 + e * 0.55 : e;
        return A.a + (B.a - A.a) * t;
      }
    }
    return slots[n - 1].a;
  }

  function place(sy) {
    var cy = sy + vh / 2, pitch = (swy * 1.4).toFixed(3), sway = swx * -1.8;
    for (var i = 0; i < slots.length; i++) {
      var s = slots[i];
      if (s.bot < sy - vh * 1.4 || s.top > sy + vh * 2.4) continue;
      var phi = s.a - yaw + sway, hide = Math.abs(phi) > 84;
      var tf = 'perspective(' + P.toFixed(0) + 'px) rotateX(' + pitch + 'deg) translateZ(' + (-R).toFixed(0) + 'px) rotateY(' + phi.toFixed(3) + 'deg) translateZ(' + R.toFixed(0) + 'px)';
      for (var j = 0; j < s.items.length; j++) {
        var it = s.items[j], st = it.el.style;
        if (hide) { if (it.vis !== false) { st.visibility = 'hidden'; it.vis = false; } continue; }
        if (it.vis === false) { st.visibility = ''; it.vis = true; }
        st.transformOrigin = (vw / 2 - it.L).toFixed(1) + 'px ' + (cy - it.T).toFixed(1) + 'px';
        st.transform = tf;
      }
    }
    if (ring.el) {
      var ry = ring.y - cy;
      if (Math.abs(ry) < vh * 1.3) {
        ring.el.style.transformOrigin = '0px ' + (-ry).toFixed(1) + 'px';
        ring.el.style.transform = 'perspective(' + P.toFixed(0) + 'px) rotateX(' + pitch + 'deg) translateZ(' + (-R).toFixed(0) + 'px) rotateY(' + (-yaw + sway).toFixed(3) + 'deg)';
      }
    }
  }
  function clearPlace() {
    slots.forEach(function (s) { s.items.forEach(function (it) { it.el.style.transform = ''; it.el.style.transformOrigin = ''; it.el.style.visibility = ''; it.vis = true; }); });
    if (ring.el) ring.el.style.transform = '';
  }

  /* ------------------------------------------------------------------
     3) Ring aus den Schlagworten: gleiche Achse, gleicher Radius
     ------------------------------------------------------------------ */
  function buildRing() {
    var tk = q('main > .ticker'); if (!tk) return;
    if (!ring.el) { ring.el = el('div', 'f-ring', '<div class="f-ring-spin"></div>'); tk.appendChild(ring.el); }
    var words = qa('.ticker-set:first-child .tw', tk).map(function (w) { return w.textContent; });
    if (!words.length) return;
    var n = Math.max(words.length, Math.round(2 * Math.PI * R / (mobile ? 250 : 340))), key = n + '|' + words.join('|');
    if (ring.key === key) return; ring.key = key;
    var html = '';
    /* Verbindungslinie zwischen den Worten: Sehnen des Rings, damit man die Bahn um die Achse sieht */
    var chord = 2 * R * Math.sin(Math.PI / n), rin = R * Math.cos(Math.PI / n);
    for (var i = 0; i < n; i++) html += '<i class="f-rl" style="--a:' + ((i + 0.5) * 360 / n).toFixed(3) + 'deg;--w:' + chord.toFixed(1) + 'px;--z:' + rin.toFixed(1) + 'px"></i>' +
      '<span class="f-rw" style="--a:' + (i * 360 / n).toFixed(3) + 'deg">' + words[i % words.length].replace(/</g, '&lt;') + '</span>';
    ring.el.firstChild.innerHTML = html;
  }

  /* ------------------------------------------------------------------
     4) Sonnensystem der Unternehmen: echte Bahnen in einer geneigten Ebene
     ------------------------------------------------------------------ */
  var sysEl = null;
  function buildSys() {
    var host = q('#ventures > .wrap'); if (!host) return;
    var vs = qa('#ventures .venture');
    if (!vs.length) return;
    if (!sysEl) { sysEl = el('div', 'f-sys'); host.appendChild(sysEl); }
    var types = ['p-main', 'p-slot', 'p-soon'], html = '<div class="f-sys-plane">';
    vs.slice(0, 3).forEach(function (v, i) { html += '<i class="f-orbit" style="--r:var(--r' + (i + 1) + ')"></i>'; });
    html += '<div class="f-sun"><span class="f-ball">TM</span></div>';
    vs.slice(0, 3).forEach(function (v, i) {
      var name = (q('h3', v) || {}).textContent || '', t = v.classList.contains('main') ? types[0] : v.classList.contains('slot') ? types[1] : types[2];
      html += '<div class="f-arm" style="--r:var(--r' + (i + 1) + ');--d:' + [46, 78, 112][i] + 's;--dl:-' + [9, 52, 31][i] + 's"><div class="f-planet">' +
        '<button type="button" class="f-ball ' + t + '" data-i="' + i + '" aria-label="' + name.replace(/"/g, '&quot;') + '">' + (t === 'p-slot' ? '?' : '') + '</button>' +
        '<span class="f-pl">' + name.replace(/</g, '&lt;') + '</span></div></div>';
    });
    sysEl.innerHTML = html + '</div>';
    if (!sysEl._bound) {
      sysEl._bound = true;
      sysEl.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-i]'); if (!b) return;
        var v = qa('#ventures .venture')[+b.getAttribute('data-i')]; if (!v) return;
        v.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
        v.classList.remove('f-ping'); void v.offsetWidth; v.classList.add('f-ping');
        if (window.mauTrack) window.mauTrack('Planet angetippt', { planet: b.getAttribute('aria-label') });
      });
    }
  }

  /* ------------------------------------------------------------------
     5) Tiefe: Schattenplatten, Satelliten-Flügel, große Ziffern im Raum
     ------------------------------------------------------------------ */
  var PLATES = '.card, .venture.main, .venture.slot, .venture.soon, .side-card, .soon-card, .quiz-box, .contact-card, .timeline > li';
  var TILT = '.card, .venture.slot, .venture.soon, .soon-card, .side-card';
  function buildDepth() {
    qa(PLATES).forEach(function (c) {
      if (c.querySelector(':scope > .f-plate')) return;
      c.insertBefore(el('i', 'f-plate'), c.firstChild);
      if (c.matches('.timeline > li')) { c.appendChild(el('i', 'f-wing f-wl')); c.appendChild(el('i', 'f-wing f-wr')); }
    });
    var n = 0;
    slots.forEach(function (s) {
      if (!s.label) return; n++;
      var host = s.items[0].el.matches('.wrap') ? s.items[0].el : (s.items.filter(function (it) { return it.el.tagName === 'H2'; })[0] || s.items[0]).el;
      if (!q(':scope > .f-ghost', host)) { var g = el('span', 'f-ghost'); g.setAttribute('aria-hidden', 'true'); g.textContent = (n < 10 ? '0' : '') + n; host.insertBefore(g, host.firstChild); }
    });
    var hero = q('.hero-content');
    if (hero && !q('.f-cue', hero)) hero.appendChild(el('p', 'f-cue', '<i></i><span></span>'));
    /* Der Kern: aus ihm wächst alles. Drei Ringe kreisen um einen leuchtenden Punkt. */
    var hw = q('.hero > .wrap');
    if (hw && !reduce && !q('.f-gyro', hw)) { var gy = el('div', 'f-gyro', '<i class="g1"></i><i class="g2"></i><i class="g3"></i><b></b>'); gy.setAttribute('aria-hidden', 'true'); hw.appendChild(gy); }
  }
  function tiltInit() {
    if (!fine || reduce) return;
    doc.addEventListener('pointermove', function (e) {
      tsx = e.clientX / innerWidth - 0.5; tsy = e.clientY / innerHeight - 0.5;
      if (!isF()) return;
      var c = e.target.closest && e.target.closest(TILT); if (!c) return;
      var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      c.style.transform = 'translateZ(26px) rotateX(' + (-y * 9).toFixed(2) + 'deg) rotateY(' + (x * 11).toFixed(2) + 'deg)';
    }, { passive: true });
    doc.addEventListener('pointerout', function (e) {
      var c = e.target.closest && e.target.closest(TILT);
      if (c && !c.contains(e.relatedTarget)) c.style.transform = '';
    });
    doc.addEventListener('pointerleave', function () { tsx = 0; tsy = 0; });
  }

  /* ------------------------------------------------------------------
     6) Höhenmesser
     ------------------------------------------------------------------ */
  var alt = null;
  var LAYERS = [[1000, 'Orbit', 'Orbit'], [600, 'Exosphäre', 'Exosphere'], [85, 'Thermosphäre', 'Thermosphere'], [50, 'Mesosphäre', 'Mesosphere'], [12, 'Stratosphäre', 'Stratosphere'], [0.02, 'Troposphäre', 'Troposphere'], [-1, 'Gelandet', 'Touchdown']];
  function buildHud() {
    if (alt) return;
    alt = el('div', 'f-alt', '<span class="f-alt-l"></span><b class="f-alt-v"></b><i class="f-alt-bar"><i></i></i>');
    alt.setAttribute('aria-hidden', 'true'); doc.body.appendChild(alt);
  }
  var lastAlt = '';
  function hud(p) {
    if (!alt) return;
    var km = p >= 0.997 ? 0 : 1200 * Math.pow(1 - p, 2.4), txt;
    if (km <= 0) txt = '0 m'; else if (km < 1) txt = Math.round(km * 1000 / 10) * 10 + ' m';
    else if (km < 10) txt = km.toFixed(1).replace('.', en() ? '.' : ',') + ' km'; else txt = Math.round(km).toLocaleString(en() ? 'en' : 'de') + ' km';
    var L = LAYERS[LAYERS.length - 1];
    for (var i = 0; i < LAYERS.length; i++) if (km >= LAYERS[i][0]) { L = LAYERS[i]; break; }
    var key = txt + L[1] + (en() ? 1 : 0);
    if (key !== lastAlt) { lastAlt = key; alt.children[0].textContent = en() ? L[2] : L[1]; alt.children[1].textContent = txt; alt.classList.toggle('landed', km <= 0); }
    alt.children[2].firstChild.style.transform = 'scaleY(' + (1 - p).toFixed(3) + ')';
  }
  function texts() {
    var cue = q('.f-cue span'); if (cue) cue.textContent = en() ? 'Scroll to descend' : 'Scrollen zum Sinkflug';
    lastAlt = ''; force = true;
    if (sysEl) buildSys();
    if (ring.el) { ring.key = ''; buildRing(); }
  }

  /* ------------------------------------------------------------------
     7) Ablauf
     ------------------------------------------------------------------ */
  function frame(now) {
    raf = requestAnimationFrame(frame);
    var dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    var sy = window.scrollY, max = Math.max(1, docH - vh), p = Math.min(1, Math.max(0, sy / max));
    if (!reduce) {
      var tgt = yawAt(sy + vh / 2);
      yaw += (tgt - yaw) * (1 - Math.exp(-dt * 7.5));
      if (Math.abs(tgt - yaw) < 0.004) yaw = tgt;
      swx += (tsx - swx) * (1 - Math.exp(-dt * 4)); swy += (tsy - swy) * (1 - Math.exp(-dt * 4));
      if (Math.abs(tsx - swx) < 0.0004) swx = tsx; if (Math.abs(tsy - swy) < 0.0004) swy = tsy;
    }
    var key = sy + '|' + yaw.toFixed(3) + '|' + swx.toFixed(4) + '|' + swy.toFixed(4), dirty = force || key !== lastKey;
    if (dirty) { lastKey = key; force = false; if (!reduce) place(sy); hud(p); }
    skyDraw(now, p, dirty);
  }
  function start() {
    if (!built) {
      built = true;
      skyInit(); defineSlots(); buildHud(); buildDepth(); tiltInit();
      if (!reduce) { buildRing(); buildSys(); }
      texts();
      if ('ResizeObserver' in window) {
        var t; var ro = new ResizeObserver(function () { clearTimeout(t); t = setTimeout(function () { if (isF()) measure(); }, 120); });
        var m = q('main'); if (m) ro.observe(m);
      }
      window.addEventListener('resize', function () { if (isF()) measure(); });
      doc.addEventListener('langchange', function () { if (isF()) { texts(); setTimeout(measure, 60); } });
      doc.addEventListener('themechange', function () { force = true; });
      if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { if (isF()) measure(); });
      window.addEventListener('load', function () { if (isF()) measure(); });
    }
    root.classList.add('f-on');
    measure(); yaw = yawAt(window.scrollY + vh / 2);
    cancelAnimationFrame(raf); last = performance.now(); raf = requestAnimationFrame(frame);
  }
  function stop() {
    cancelAnimationFrame(raf); raf = 0;
    root.classList.remove('f-on');
    if (built) clearPlace();
  }
  doc.addEventListener('designchange', function () { if (isF()) start(); else stop(); });
  doc.addEventListener('visibilitychange', function () {
    if (!isF()) return;
    if (doc.hidden) { cancelAnimationFrame(raf); raf = 0; } else if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
  });
  if (isF()) { if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start); else start(); }
})();
