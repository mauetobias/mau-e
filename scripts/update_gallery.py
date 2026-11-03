"""Holt die Fotos der CardCircle-Galerie von cardcircle.eu/about und legt sie unter media/cardcircle/ ab.

Läuft als GitHub Action (täglich und bei Änderungen an diesem Skript oder an data/gallery-exclude.txt). Nur Python-Standardbibliothek.
Ergebnis: data/gallery.json mit Bildpfad und Beschreibung, wird von der Webseite als Slider angezeigt.

Qualitätsprüfung (braucht Pillow; ohne Pillow werden einfach alle Bilder bis SHOW übernommen):
  - zu kleine, zu dunkle/helle, flaue oder unscharfe Bilder fliegen raus
  - (fast) doppelte Bilder werden erkannt, das bessere bleibt
  - von den übrigen kommen die SHOW besten auf die Webseite
  - data/gallery-exclude.txt: Dateinamen, die nie gezeigt werden sollen (eine pro Zeile)
Werden keine Bilder gefunden, bleibt alles unverändert.
"""
import html
import io
import json
import math
import os
import re
import sys
import urllib.parse
import urllib.request

PAGE = "https://cardcircle.eu/about"
OUT_DIR = "media/cardcircle"
OUT_JSON = "data/gallery.json"
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"}
SKIP = re.compile(r"logo|favicon|badge|icon|\.svg$", re.I)
SHOW = 16          # so viele der besten Bilder zeigt die Webseite
EXCLUDE = "data/gallery-exclude.txt"
MIN_SIDE = 500     # kürzere Bildseite in Pixeln
MIN_SHARP = 300    # Kantenstärke bei 800 px Breite; darunter ist das Bild verwackelt/unscharf
DUP_BITS = 40      # Bild-Fingerabdrücke mit weniger Unterschied gelten als dasselbe Foto (von 256)
MAX = 80   # großzügig, damit neu hinzugekommene Bilder nicht abgeschnitten werden


def get(url, binary=False):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        data = r.read()
    return data if binary else data.decode("utf-8", "replace")


def attr(tag, name):
    m = re.search(r'\s' + name + r'\s*=\s*["\']([^"\']+)["\']', tag, flags=re.I)
    return html.unescape(m.group(1)).strip() if m else ""


def pick_src(tag):
    """Bestes Bild eines <img>: größte srcset-Variante, sonst Lazy-Load-Attribute, sonst src."""
    for name in ("srcset", "data-srcset"):
        cands = []
        for part in attr(tag, name).split(","):
            bits = part.strip().split()
            if bits:
                w = re.match(r"(\d+)", bits[1]) if len(bits) > 1 else None
                cands.append((int(w.group(1)) if w else 0, bits[0]))
        if cands:
            return max(cands)[1]
    for name in ("data-src", "data-lazy-src", "data-original", "src"):
        v = attr(tag, name)
        if v and not v.startswith("data:"):
            return v
    return ""


def real_url(src):
    """Bild-Proxys wie /_next/image?url=... auf die eigentliche Bilddatei zurückführen."""
    u = urllib.parse.urlparse(src)
    inner = urllib.parse.parse_qs(u.query).get("url")
    if inner and (u.path.endswith("/image") or "_next" in u.path or "_vercel" in u.path):
        return urllib.parse.urljoin(src, inner[0])
    return src


def file_name(src, taken):
    """Eindeutiger Dateiname; gleichnamige Bilder aus verschiedenen Ordnern überschreiben sich nicht."""
    path = urllib.parse.urlparse(src).path
    name = re.sub(r"[^A-Za-z0-9._-]", "-", os.path.basename(path)) or "bild"
    if name in taken:
        folder = re.sub(r"[^A-Za-z0-9_-]", "-", os.path.basename(os.path.dirname(path))) or "x"
        name = folder + "-" + name
        n = 2
        while name in taken:
            base, ext = os.path.splitext(name)
            name, n = f"{base.rsplit('~', 1)[0]}~{n}{ext}", n + 1
    taken.add(name)
    return name


def rate(data):
    """Bewertet ein Bild. Gibt (Punkte, Fingerabdruck, Grund) zurück; Punkte None = aussortieren."""
    try:
        from PIL import Image, ImageFilter, ImageStat
    except ImportError:
        return 1.0, None, ""
    try:
        im = Image.open(io.BytesIO(data))
        im.load()
    except Exception:
        return None, None, "kein lesbares Bild"
    g = im.convert("L")
    w, h = g.size
    if min(w, h) < MIN_SIDE:
        return None, None, f"zu klein ({w}x{h})"
    st = ImageStat.Stat(g)
    bright, contrast = st.mean[0], st.stddev[0]
    if not 35 <= bright <= 225:
        return None, None, f"zu {'dunkel' if bright < 35 else 'hell'}"
    if contrast < 28:
        return None, None, "zu flau"
    f = 800 / max(w, h)
    small = g.resize((max(1, round(w * f)), max(1, round(h * f))))
    sharp = ImageStat.Stat(small.filter(ImageFilter.FIND_EDGES)).var[0]
    if sharp < MIN_SHARP:
        return None, None, f"unscharf ({sharp:.0f})"
    d = g.resize((17, 16), Image.LANCZOS)
    px = [d.getpixel((x, y)) for y in range(16) for x in range(17)]
    fp = sum(1 << i for i, (r, c) in enumerate((r, c) for r in range(16) for c in range(16)) if px[r * 17 + c] > px[r * 17 + c + 1])
    score = (0.40 * min(1, math.log(sharp / MIN_SHARP) / math.log(12))      # Schärfe
             + 0.30 * min(1, w * h / 1_900_000)                              # Auflösung
             + 0.20 * min(1, contrast / 70)                                  # Kontrast
             + 0.10 * (1 - abs(bright - 115) / 115))                         # Belichtung
    return round(score, 3), fp, ""


def excluded():
    try:
        with open(EXCLUDE, encoding="utf-8") as f:
            return {l.split("#")[0].strip() for l in f if l.split("#")[0].strip()}
    except FileNotFoundError:
        return set()


def main():
    try:
        page = get(PAGE)
    except Exception as e:
        print("Über-uns-Seite nicht erreichbar:", e)
        return 0
    found = []
    for tag in re.findall(r"<img\b[^>]*>", page, flags=re.I):
        src = pick_src(tag)
        if not src:
            continue
        src = real_url(urllib.parse.urljoin(PAGE, src))
        if SKIP.search(urllib.parse.urlparse(src).path) or "cardcircle" not in urllib.parse.urlparse(src).netloc:
            continue
        alt = re.search(r'\salt="([^"]*)"', tag)
        alt = html.unescape(alt.group(1)).strip() if alt else ""
        if src not in [f[0] for f in found]:
            found.append((src, alt))
    found = found[:MAX]
    if not found:
        print("Keine Galerie-Bilder gefunden, nichts geändert.")
        return 0
    os.makedirs(OUT_DIR, exist_ok=True)
    skip_names = excluded()
    cands, names = [], set()
    for pos, (src, alt) in enumerate(found):
        name = file_name(src, names)
        if name in skip_names:
            print("Ausgeschlossen (gallery-exclude.txt):", name)
            continue
        try:
            data = get(src, binary=True)
        except Exception as e:
            print("Bild nicht ladbar:", src, e)
            continue
        if len(data) < 2000 or len(data) > 4_000_000:
            print("Übersprungen (Dateigröße):", name, len(data))
            continue
        score, fp, why = rate(data)
        if score is None:
            print("Aussortiert:", name, "-", why)
            continue
        cands.append({"pos": pos, "name": name, "alt": alt, "data": data, "score": score, "fp": fp})
    # Doppelte: beste Version zuerst behalten, ähnliche danach verwerfen
    best = []
    for c in sorted(cands, key=lambda c: -c["score"]):
        twin = next((b for b in best if c["fp"] is not None and b["fp"] is not None
                     and bin(c["fp"] ^ b["fp"]).count("1") < DUP_BITS), None)
        if twin:
            print("Doppelt:", c["name"], "wie", twin["name"])
            continue
        best.append(c)
    for c in best[SHOW:]:
        print("Nicht unter den besten", SHOW, ":", c["name"], c["score"])
    best = sorted(best[:SHOW], key=lambda c: c["pos"])
    if not best:
        return 0
    items, keep = [], set()
    for c in best:
        path = os.path.join(OUT_DIR, c["name"])
        with open(path, "wb") as f:
            f.write(c["data"])
        keep.add(c["name"])
        items.append({"src": path, "alt": c["alt"]})
        print("ok", path, c["score"])
    for old in os.listdir(OUT_DIR):        # nicht (mehr) gezeigte Bilder entfernen
        if old not in keep:
            os.remove(os.path.join(OUT_DIR, old))
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump({"source": PAGE, "images": items}, f, ensure_ascii=False, indent=2)
        f.write("\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
