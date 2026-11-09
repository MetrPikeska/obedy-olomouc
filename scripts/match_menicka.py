"""Match menicka.cz restaurants to OSM places and build the merged restaurant list.

Score = name similarity (rapidfuzz token_set_ratio on normalized names) within 150 m.
Manual overrides in data/menicka_osm_map_manual.csv (menicka_id,osm_id; osm_id empty = new place).

Outputs:
  data/menicka_osm_map.csv   menicka_id,menicka_name,osm_id,osm_name,dist_m,score,method
  data/restaurants.json      merged list used for DB seed and as static fallback

Usage: .venv/bin/python scripts/match_menicka.py data/menus/*.json
"""

from __future__ import annotations

import csv
import json
import math
import sys

from rapidfuzz import fuzz
from shapely.geometry import Point, shape

from common import DATA, normalize_name, slugify

MAX_DIST = 150
MIN_SCORE = 60
GENERIC = {"restaurace", "hospoda", "bistro", "pivnice", "kavarna", "cafe", "olomouc", "u", "na", "v"}


def dist_m(a: dict, b: dict) -> float:
    dlat = math.radians(b["lat"] - a["lat"])
    dlon = math.radians(b["lon"] - a["lon"]) * math.cos(math.radians(a["lat"]))
    return 6371000 * math.hypot(dlat, dlon)


def core(name: str) -> str:
    return " ".join(w for w in normalize_name(name).split() if w not in GENERIC)


def load_manual() -> dict[int, str]:
    path = DATA / "menicka_osm_map_manual.csv"
    if not path.exists():
        return {}
    with path.open() as f:
        return {int(r["menicka_id"]): r["osm_id"] for r in csv.DictReader(f)}


def main(menu_files: list[str]) -> None:
    osm = json.load(open(DATA / "restaurants_osm.json"))
    by_osm = {r["osm_id"]: r for r in osm}
    boundary = shape(json.load(open(DATA / "olomouc_boundary.geojson"))["geometry"])
    manual = load_manual()

    menicka: dict[int, dict] = {}
    for f in menu_files:
        for r in json.load(open(f)):
            menicka[r["menicka_id"]] = r

    rows, extra = [], []
    for mid, m in sorted(menicka.items()):
        best, best_score, best_d = None, 0.0, None
        for o in osm:
            d = dist_m(m, o)
            if d > MAX_DIST:
                continue
            s = fuzz.token_set_ratio(core(m["name"]), core(o["name"])) - d / 15
            if s > best_score:
                best, best_score, best_d = o, s, d
        method = "auto"
        if mid in manual:
            best = by_osm.get(manual[mid]) if manual[mid] else None
            method = "manual"
            best_d = dist_m(m, best) if best else None
        elif best_score < MIN_SCORE:
            best = None
        if best is None:
            inside = boundary.contains(Point(m["lon"], m["lat"]))
            method = method if method == "manual" else ("new" if inside else "outside")
            if inside:
                extra.append(m)
        rows.append(
            {
                "menicka_id": mid,
                "menicka_name": m["name"],
                "osm_id": best["osm_id"] if best else "",
                "osm_name": best["name"] if best else "",
                "dist_m": round(best_d) if best_d is not None else "",
                "score": round(best_score),
                "method": method,
            }
        )
        if best:
            best["menicka_id"] = mid

    with (DATA / "menicka_osm_map.csv").open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)

    merged = list(osm)
    for m in extra:
        merged.append(
            {
                "osm_id": None,
                "name": m["name"],
                "amenity": "restaurant",
                "lat": m["lat"],
                "lon": m["lon"],
                "address": None,
                "cuisine": None,
                "opening_hours": None,
                "website": None,
                "phone": None,
                "vegetarian": None,
                "menicka_id": m["menicka_id"],
            }
        )
    seen: dict[str, int] = {}
    for r in merged:
        base = slugify(r["name"])
        seen[base] = seen.get(base, 0) + 1
        r["slug"] = base if seen[base] == 1 else f"{base}-{seen[base]}"
        r.setdefault("menicka_id", None)
    (DATA / "restaurants.json").write_text(json.dumps(merged, ensure_ascii=False, indent=1))

    counts: dict[str, int] = {}
    for r in rows:
        key = r["method"] if not (r["method"] == "auto" and r["osm_id"]) else "matched"
        counts[key] = counts.get(key, 0) + 1
    print(f"menicka: {len(rows)}  {counts}")
    print(f"restaurants.json: {len(merged)} ({len(extra)} added from menicka)")


if __name__ == "__main__":
    main(sys.argv[1:])
