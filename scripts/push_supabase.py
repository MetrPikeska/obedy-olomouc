"""Push restaurants and menus to Supabase via RPC (service role key).

Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (from .env.local or the environment)

Usage:
  .venv/bin/python scripts/push_supabase.py restaurants
  .venv/bin/python scripts/push_supabase.py menus data/menus/2026-11-09.json
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import requests

from common import DATA, ROOT


def load_env() -> None:
    env = ROOT / ".env.local"
    if env.exists():
        for line in env.read_text().splitlines():
            if "=" in line and not line.lstrip().startswith("#"):
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"'))


def rpc(name: str, payload: dict):
    url = os.environ.get("SUPABASE_URL") or os.environ["NEXT_PUBLIC_SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    r = requests.post(
        f"{url}/rest/v1/rpc/{name}",
        json=payload,
        # new sb_secret_ keys go only in `apikey`; legacy JWT service_role keys also as Bearer
        headers={"apikey": key} if key.startswith("sb_") else {"apikey": key, "Authorization": f"Bearer {key}"},
        timeout=120,
    )
    if not r.ok:
        sys.exit(f"{name}: HTTP {r.status_code} {r.text[:500]}")
    return r.json()


def main() -> None:
    load_env()
    what = sys.argv[1]
    if what == "restaurants":
        rows = json.load(open(DATA / "restaurants.json"))
        print("upserted restaurants:", rpc("upsert_restaurants", {"p": rows}))
    elif what == "menus":
        for f in sys.argv[2:]:
            day = Path(f).stem
            n = rpc("ingest_menus", {"p_date": day, "p_source": "menicka", "p": json.load(open(f))})
            print(f"{day}: {n} menu items")
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main()
