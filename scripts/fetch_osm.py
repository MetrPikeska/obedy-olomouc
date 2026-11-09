"""Download food places and the municipal boundary of Olomouc from OSM.

Outputs:
  data/restaurants_osm.json   named places (restaurant, cafe, fast_food, pub)
  data/olomouc_boundary.geojson  admin_level=8 boundary (RÚIAN obec 500496)

Usage: .venv/bin/python scripts/fetch_osm.py [--from-file data/osm_raw.json]
"""

from __future__ import annotations

import argparse
import json

from shapely.geometry import LineString, mapping
from shapely.ops import polygonize, unary_union

from common import DATA, overpass

AREA = 'area["boundary"="administrative"]["admin_level"="8"]["name"="Olomouc"]->.a;'

PLACES_Q = f"""[out:json][timeout:90];
{AREA}
nwr["amenity"~"^(restaurant|cafe|fast_food|pub)$"](area.a);
out center tags;"""

BOUNDARY_Q = """[out:json][timeout:90];
rel["boundary"="administrative"]["admin_level"="8"]["name"="Olomouc"];
out geom;"""


def address(tags: dict) -> str | None:
    street = tags.get("addr:street") or tags.get("addr:place")
    num = tags.get("addr:housenumber") or tags.get("addr:conscriptionnumber")
    if not street:
        return None
    return f"{street} {num}".strip() if num else street


def parse_places(raw: dict) -> list[dict]:
    out = []
    for e in raw["elements"]:
        t = e.get("tags", {})
        if not t.get("name"):
            continue
        lat = e.get("lat") or e["center"]["lat"]
        lon = e.get("lon") or e["center"]["lon"]
        out.append(
            {
                "osm_id": f"{e['type'][0]}{e['id']}",
                "name": t["name"].strip(),
                "amenity": t["amenity"],
                "lat": round(lat, 7),
                "lon": round(lon, 7),
                "address": address(t),
                "cuisine": t.get("cuisine"),
                "opening_hours": t.get("opening_hours"),
                "website": t.get("website") or t.get("contact:website"),
                "phone": t.get("phone") or t.get("contact:phone"),
                "vegetarian": t.get("diet:vegetarian"),
            }
        )
    out.sort(key=lambda r: r["osm_id"])
    return out


def parse_boundary(raw: dict) -> dict:
    rel = raw["elements"][0]
    lines = [
        LineString([(p["lon"], p["lat"]) for p in m["geometry"]])
        for m in rel["members"]
        if m["type"] == "way" and m.get("role") == "outer"
    ]
    polys = list(polygonize(unary_union(lines)))
    geom = unary_union(polys)
    return {
        "type": "Feature",
        "properties": {"name": "Olomouc", "ref": "500496"},
        "geometry": mapping(geom),
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--from-file", help="reuse a saved Overpass JSON for places")
    args = ap.parse_args()

    raw = json.load(open(args.from_file)) if args.from_file else overpass(PLACES_Q)
    places = parse_places(raw)
    (DATA / "restaurants_osm.json").write_text(json.dumps(places, ensure_ascii=False, indent=1))
    print(f"places: {len(raw['elements'])} raw, {len(places)} named")

    boundary = parse_boundary(overpass(BOUNDARY_Q))
    (DATA / "olomouc_boundary.geojson").write_text(json.dumps(boundary))
    print("boundary:", boundary["geometry"]["type"])


if __name__ == "__main__":
    main()
