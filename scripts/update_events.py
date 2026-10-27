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
UA = {"User-Agent": "Mozilla/5.0 (mau-e.com event sync)"}
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


def from_site_text(page, link):
    pos = page.find(link.split("#")[0])
    if pos < 0:
        return None
    cut = page.rfind("<", 0, pos)
    lines = text_of(page[max(0, cut - 3000):cut])[-14:]
    date = None
    title = ""
    for ln in reversed(lines):
        if date is None:
            date = parse_date(ln)
    for ln in lines:
        if len(ln) > 8 and not parse_date(ln) and not re.search(r"€|Uhr|Tickets?|Plätze|ab 18", ln):
            title = ln
    if not date:
        return None
    time = ""
    for ln in lines:
        m = re.search(r"(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})", ln)
        if m:
            time = m.group(1) + " bis " + m.group(2) + " Uhr"
    return {"title": title or link.rsplit("/", 1)[-1].split("-7")[0].replace("-", " ").title(),
            "date": date.isoformat(), "time": time, "location": ""}


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
        ev = None
        try:
            ev = from_jsonld(get(link))
        except Exception as e:
            print("Eventfrog nicht lesbar:", link, e)
        if not ev or not ev.get("title"):
            ev = from_site_text(page, link) or ev
        if ev:
            ev["url"] = link
            events.append(ev)
    today = dt.date.today().isoformat()
    events = sorted([e for e in events if e["date"] >= today], key=lambda e: e["date"])
    if not events:
        print("Keine kommenden Events gefunden, Datei bleibt unverändert.")
        return 0
    data = {"source": SITE, "updated": today, "events": events[:5]}
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(json.dumps(data, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
