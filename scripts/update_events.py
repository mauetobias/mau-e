"""Liest die kommenden Events von cardcircle.eu und schreibt sie nach data/events.json.

Läuft täglich als GitHub Action. Nur Python-Standardbibliothek.
Strategie: alle Eventfrog-Links der Startseite einsammeln, für jeden Link die
Eventfrog-Seite laden und die strukturierten Event-Daten (JSON-LD) auslesen.
Klappt das nicht, wird der Text rund um den Link auf cardcircle.eu ausgewertet.
Wenn gar nichts gefunden wird, bleibt die bestehende Datei unverändert.
"""
import datetime as dt
import html
import json
import re
import sys
import urllib.request

SITE = "https://cardcircle.eu/"
OUT = "data/events.json"
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
      "Accept-Language": "de-DE,de;q=0.9", "Accept": "text/html,application/xhtml+xml"}
MONTHS = {m: i + 1 for i, m in enumerate(
    ["januar", "februar", "märz", "april", "mai", "juni", "juli", "august",
     "september", "oktober", "november", "dezember"])}


def get(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", "replace")


def text_of(fragment):
    t = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", fragment, flags=re.S | re.I)
    t = re.sub(r"<[^>]+>", "\n", t)
    t = html.unescape(t)
    return [ln.strip() for ln in t.splitlines() if ln.strip()]


def parse_date(s):
    m = re.search(r"(\d{1,2})\.(\d{1,2})\.(\d{4})", s)
    if m:
        return dt.date(int(m.group(3)), int(m.group(2)), int(m.group(1)))
    m = re.search(r"(\d{1,2})\.\s*([A-Za-zäÄ]+)\s+(\d{4})", s)
    if m and m.group(2).lower() in MONTHS:
        return dt.date(int(m.group(3)), MONTHS[m.group(2).lower()], int(m.group(1)))
    return None


def from_jsonld(page):
    for block in re.findall(r'<script[^>]+application/ld\+json[^>]*>(.*?)</script>', page, flags=re.S | re.I):
        try:
            data = json.loads(block.strip())
        except ValueError:
            continue
        items = data if isinstance(data, list) else data.get("@graph", [data])
        for it in items:
            if not isinstance(it, dict) or "Event" not in str(it.get("@type", "")):
                continue
            start = str(it.get("startDate", ""))
            if not re.match(r"\d{4}-\d{2}-\d{2}", start):
                continue
            loc = it.get("location") or {}
            if isinstance(loc, list):
                loc = loc[0] if loc else {}
            name = loc.get("name", "") if isinstance(loc, dict) else str(loc)
            time = start[11:16] + " Uhr" if len(start) >= 16 else ""
            end = str(it.get("endDate", ""))
            if time and len(end) >= 16:
                time = start[11:16] + " bis " + end[11:16] + " Uhr"
            return {"title": html.unescape(str(it.get("name", "")).strip()),
                    "date": start[:10], "time": time, "location": html.unescape(name).strip()}
    return None


def from_meta(page):
    """Titel aus og:title bzw. <title> der Eventfrog-Seite."""
    for pat in (r'<meta[^>]+property="og:title"[^>]+content="([^"]+)"', r'<meta[^>]+content="([^"]+)"[^>]+property="og:title"', r"<title>(.*?)</title>"):
        m = re.search(pat, page, flags=re.S | re.I)
        if m:
            t = html.unescape(m.group(1)).strip()
            t = re.split(r"\s+[|·-]\s+(Eventfrog|Tickets).*$", t)[0].strip()
            if t:
                return t
    return ""


BAD_TITLE = re.compile(r"€|Uhr|Tickets?|Plätze|ab 18|•|·|\d{5}|Straße|Booster|Promokarte|pro Spieler|Einlass", re.I)


def heading_before(fragment):
    """Letzte Überschrift (h1 bis h4) vor dem Ticket-Link."""
    hs = re.findall(r"<h[1-4][^>]*>(.*?)</h[1-4]>", fragment, flags=re.S | re.I)
    for h in reversed(hs):
        t = " ".join(text_of(h)).strip()
        if t and not BAD_TITLE.search(t) and len(t) > 5:
            return t
    return ""


def from_site_text(page, link):
    pos = page.find(link.split("#")[0])
    if pos < 0:
        return None
    cut = page.rfind("<", 0, pos)
    start = max(0, cut - 3000)
    prev = page.rfind("eventfrog.", start, cut - 1)       # nicht in das vorherige Event hineinlesen
    if prev > 0:
        start = page.find(">", prev) + 1
    lines = text_of(page[start:cut])[-14:]
    date = None
    title = ""
    for ln in reversed(lines):
        if date is None:
            date = parse_date(ln)
    title = heading_before(page[start:cut])
    if not title:
        for ln in lines:
            if len(ln) > 8 and not parse_date(ln) and not BAD_TITLE.search(ln):
                title = ln
    if not date:
        return None
    time = ""
    for ln in lines:
        m = re.search(r"(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})", ln)
        if m:
            time = m.group(1) + " bis " + m.group(2) + " Uhr"
    location = ""
    for ln in lines:
        m = re.search(r"(Kombinat[^•·,]*|Jugendhaus [A-ZÄÖÜa-zäöüß]+)", ln)
        if m:
            location = m.group(1).strip()
            if location == "Kombinat":
                location = "Kombinat Mannheim"
    return {"title": title or link.rsplit("/", 1)[-1].split("-7")[0].replace("-", " ").title(),
            "date": date.isoformat(), "time": time, "location": location}


def main():
    try:
        page = get(SITE)
    except Exception as e:  # Seite nicht erreichbar: alte Daten behalten
        print("cardcircle.eu nicht erreichbar:", e)
        return 0
    links = []
    for href in re.findall(r'href="(https://eventfrog\.[a-z]+/[^"]+)"', page):
        href = html.unescape(href)
        if href.split("#")[0] not in [l.split("#")[0] for l in links]:
            links.append(href)
    events = []
    for link in links:
        ev, meta_title = None, ""
        try:
            ef = get(link)
            ev = from_jsonld(ef)
            meta_title = from_meta(ef)
        except Exception as e:
            print("Eventfrog nicht lesbar:", link, e)
        site = from_site_text(page, link)
        if not ev:
            ev = site
        if ev:
            if not ev.get("title") or BAD_TITLE.search(ev["title"]):
                ev["title"] = meta_title or (site or {}).get("title", "")
            for k in ("time", "location"):
                if not ev.get(k) and site:
                    ev[k] = site.get(k, "")
        if ev and (not ev.get("title") or BAD_TITLE.search(ev["title"])):
            print("Titel unklar, Event wird übersprungen:", link)
            ev = None
        if ev:
            ev["url"] = link
            events.append(ev)
    today = dt.date.today().isoformat()
    events = sorted([e for e in events if e["date"] >= today], key=lambda e: e["date"])
    if not events:
        print("Keine kommenden Events gefunden, Datei bleibt unverändert.")
        return 0
    try:
        old = {e["url"].split("#")[0]: e for e in json.load(open(OUT, encoding="utf-8")).get("events", [])}
    except Exception:
        old = {}
    for e in events:
        o = old.get(e["url"].split("#")[0])
        if o:
            for k in ("title", "time", "location"):
                if not e.get(k):
                    e[k] = o.get(k, "")
    data = {"source": SITE, "updated": today, "events": events[:5]}
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(json.dumps(data, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
