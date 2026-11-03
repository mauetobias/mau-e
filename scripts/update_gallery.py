"""Holt die Fotos der CardCircle-Galerie von cardcircle.eu/about und legt sie unter media/cardcircle/ ab.

Läuft als GitHub Action (täglich und bei Änderungen an diesem Skript). Nur Python-Standardbibliothek.
Ergebnis: data/gallery.json mit Bildpfad und Beschreibung, wird von der Webseite als Slider angezeigt.
Werden keine Bilder gefunden, bleibt alles unverändert.
"""
import html
import json
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
    items, keep, names = [], set(), set()
    for src, alt in found:
        name = file_name(src, names)
        path = os.path.join(OUT_DIR, name)
        try:
            data = get(src, binary=True)
        except Exception as e:
            print("Bild nicht ladbar:", src, e)
            continue
        if len(data) < 2000 or len(data) > 4_000_000:
            print("Übersprungen (Größe):", src, len(data))
            continue
        with open(path, "wb") as f:
            f.write(data)
        keep.add(name)
        items.append({"src": path, "alt": alt})
        print("ok", path, len(data))
    if not items:
        return 0
    for old in os.listdir(OUT_DIR):        # Bilder, die es auf cardcircle.eu nicht mehr gibt, entfernen
        if old not in keep:
            os.remove(os.path.join(OUT_DIR, old))
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump({"source": PAGE, "images": items}, f, ensure_ascii=False, indent=2)
        f.write("\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
