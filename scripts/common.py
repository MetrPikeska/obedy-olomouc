"""Shared helpers for ETL scripts."""

from __future__ import annotations

import re
import time
import unicodedata
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
USER_AGENT = "obedy-olomouc/0.1 (student project, UP Olomouc KGI)"


def strip_accents(text: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFKD", text) if not unicodedata.combining(c)
    )


def slugify(text: str) -> str:
    text = strip_accents(text).lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-") or "x"


def normalize_name(text: str) -> str:
    """Normalized dish/restaurant name for matching and dedup."""
    text = strip_accents(text).lower()
    text = re.sub(r"\(.*?\)", " ", text)
    text = re.sub(r"\d+\s*(g|ks|ml|l)\b", " ", text)
    text = re.sub(r"[^a-z0-9 ]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def http_get(url: str, **kw) -> requests.Response:
    r = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=60, **kw)
    r.raise_for_status()
    return r


def overpass(query: str, retries: int = 5) -> dict:
    endpoints = [
        "https://overpass-api.de/api/interpreter",
        "https://overpass.private.coffee/api/interpreter",
    ]
    wait = 10
    for attempt in range(retries):
        url = endpoints[attempt % len(endpoints)]
        try:
            r = requests.post(
                url, data={"data": query}, headers={"User-Agent": USER_AGENT}, timeout=120
            )
            if r.ok and r.text.lstrip().startswith("{"):
                return r.json()
            print(f"overpass {url}: HTTP {r.status_code}, retry in {wait}s")
        except requests.RequestException as e:
            print(f"overpass {url}: {e}, retry in {wait}s")
        time.sleep(wait)
        wait *= 2
    raise RuntimeError("Overpass unavailable")
