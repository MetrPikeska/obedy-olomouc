"""Scrape today's lunch menus for Olomouc from menicka.cz.

One request per run (the listing page holds today's menus of all restaurants),
well within robots.txt (Crawl-Delay 5 s). Restaurant photos are NOT copied.

Output: data/menus/YYYY-MM-DD.json
  [{menicka_id, name, url, lat, lon, soups: [str], mains: [{name, price}]}]

Usage: .venv/bin/python scripts/scrape_menicka.py [--html saved.html] [--date 2026-11-09]
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import re

from bs4 import BeautifulSoup, Tag

from common import DATA, http_get

LISTING = "https://www.menicka.cz/olomouc.html"
MARKER_RE = re.compile(
    r'\[\s*(\d+),\s*"((?:[^"\\]|\\.)*)",\s*"([^"]+\.html)",\s*([\d.]+),\s*([\d.]+)'
)
PRICE_RE = re.compile(r"(\d+)\s*Kč")
PORTION_RE = re.compile(r"^\s*(\d+\s*[,.]\s*)?\d+\s*(gp|g|ks|ml|l|cl)\b\.?\s*", re.I)
ALLERGEN_RES = [
    re.compile(r"\s*/\s*\d[\d,\s]*/?\s*$"),            # /1, 9, 12/
    re.compile(r"\s*\(?\b[Aa]\s?:?\s?\d[\d/,\s]*\)?"),      # A 1/1, 3, 7 or A1,3
    re.compile(r"\s*\(\s*\d[\d,\s]*\)\s*$"),          # (1,3,7)
]
NOT_A_DISH = re.compile(
    r"^(pol[eé]vk[ay]( k menu)?|hlavn[ií] j[ií]dl[ao]|menu|dle denn[ií] nab[ií]dky|"
    r"denn[ií] menu|j[ií]dlo dne|z[aá]kusek|dezert|extra|vege)$",
    re.I,
)
PROMO_RE = re.compile(r"(https?:|www\.|^k menu\b|ke ka[zž]d[eé]mu menu|akce dne|lepek|rozvoz|nab[ií]z[ií]me|objedn[aá]v|tel\.|www\.|otev[ií]r|zav[rř]eno|dovolen)", re.I)
SOUP_RE = re.compile(r"(pol[eé]vk|v[yý]var|kr[eé]m z|kr[eé]m |[čc]esne[čc]k|dr[šs][tť]kov|gul[aá][šs]ov[aá] pol)", re.I)


def clean_dish(text: str) -> str:
    # "Polévka k menu zdarma! ---- Boršč", "Polévka - 0, 33 Česnečka"
    text = re.sub(r"^pol[eé]vka\b[^a-zá-ž]*(k menu[^-]*-+\s*)?(\d+\s*,\s*\d+\s*l?\s*)?", "", text, flags=re.I)
    text = re.sub(r"^\d\s*/\s*\d\s+", "", text)  # 1/2, 1/4 portion prefix
    text = re.sub(r"^\d{1,2}\s*[.)]?\s+(?=\D)", "", text)  # "1. ", "2 " numbering
    text = re.sub(r"\s+\d+\s*g\.?$", "", text)  # trailing "170 g"
    # "… k menu zdarma", "… k menu 0,- / samostatně 59", "… - k menu polévka v ceně"
    text = re.sub(r"\s*-?\s*k menu\b.*$", "", text, flags=re.I)
    text = PORTION_RE.sub("", text)
    for r in ALLERGEN_RES:
        text = r.sub("", text)
    text = re.sub(r"\s*-\s*K MENU ZDARMA.*$", "", text, flags=re.I)
    text = re.sub(r"(\w)\(", r"\1 (", text)
    text = " ".join(text.split()).strip(" ,;-")
    if text.isupper() and len(text) > 3:
        text = text.capitalize()
    return text


def clean(el: Tag) -> str:
    for em in el.find_all(["em", "a"]):  # allergens, photo links
        em.decompose()
    text = " ".join(el.get_text(" ").split())
    return text.strip(" ,;-")


def parse_markers(html: str) -> dict[int, dict]:
    out = {}
    for mid, name, url, lat, lon in MARKER_RE.findall(html):
        out[int(mid)] = {"lat": round(float(lat), 7), "lon": round(float(lon), 7)}
    return out


def parse_block(block: Tag) -> dict | None:
    link = block.select_one(".nazev a")
    if not link:
        return None
    url = link["href"]
    m = re.search(r"/(\d+)-[^/]+\.html", url)
    if not m:
        return None
    soups, mains = [], []
    slide = block.select_one(".menicka .swiper-slide") or block.select_one(".menicka")
    if slide is None:
        return None
    pending_main = False
    current: dict | None = None
    for div in slide.find_all("div", recursive=False):
        cls = " ".join(div.get("class", []))
        if cls.startswith("poradi"):
            pending_main = True
        elif cls.startswith("nabidka"):
            italic = div.find("i", recursive=False)
            text = clean_dish(clean(italic if italic and not pending_main else div))
            if not text or "nebylo zadáno" in text.lower() or NOT_A_DISH.match(text) or PROMO_RE.search(text) or len(text) < 3:
                current = None
                pending_main = False
                continue
            if pending_main:
                current = {"name": text, "price": None}
                mains.append(current)
            else:
                current = None
                soups.append(text)
            pending_main = False
        elif cls == "cena" and current is not None:
            pm = PRICE_RE.search(div.get_text())
            current["price"] = int(pm.group(1)) if pm else None
            current = None
    # numbered items without a price that look like soups (e.g. "1. Krém z ...")
    for item in [m for m in mains if m["price"] is None and SOUP_RE.search(m["name"])]:
        mains.remove(item)
        soups.append(item["name"])
    if not soups and not mains:
        return None
    return {
        "menicka_id": int(m.group(1)),
        "name": " ".join(link.get_text().split()),
        "url": url,
        "soups": soups,
        "mains": mains,
    }


def parse(html: str) -> list[dict]:
    soup = BeautifulSoup(html, "html.parser")
    markers = parse_markers(html)
    out = []
    for block in soup.select("div.menicka_detail"):
        r = parse_block(block)
        if r:
            r.update(markers.get(r["menicka_id"], {"lat": None, "lon": None}))
            out.append(r)
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--html", help="parse a saved listing instead of downloading")
    ap.add_argument("--date", default=dt.date.today().isoformat())
    args = ap.parse_args()

    html = open(args.html, encoding="utf-8").read() if args.html else http_get(LISTING).text
    menus = parse(html)
    out_dir = DATA / "menus"
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / f"{args.date}.json"
    path.write_text(json.dumps(menus, ensure_ascii=False, indent=1))
    n_dishes = sum(len(r["soups"]) + len(r["mains"]) for r in menus)
    print(f"{path.name}: {len(menus)} restaurants, {n_dishes} dishes")


if __name__ == "__main__":
    main()
