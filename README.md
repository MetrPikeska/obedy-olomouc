# Obědy Olomouc

Semestrální projekt KGI/ACART (UP Olomouc, ZS 2026/27). Tým: Hrbáček, Koutník, Tobola, Lípová, Mikeska.

Webová aplikace (PWA) s poledními menu olomouckých podniků na mapě. Uživatelé hodnotí konkrétní jídla
a přidávají jejich fotky, bez registrace přes anonymní účet.

## Stack

- Next.js 16 (App Router, Cache Components), Tailwind 4, MapLibre GL + OpenFreeMap
- Supabase: Postgres + PostGIS, anonymní Auth, Storage `photos`
- Python ETL v `scripts/`: OpenStreetMap (Overpass), menicka.cz, párování
- Vercel (web), GitHub Actions (denní stažení menu)

## Data

| Soubor | Obsah |
| --- | --- |
| `data/restaurants_osm.json` | 384 pojmenovaných podniků z OSM (`amenity=restaurant/cafe/fast_food/pub`) v hranici obce |
| `data/olomouc_boundary.geojson` | hranice obce Olomouc (admin_level 8) |
| `data/menus/YYYY-MM-DD.json` | denní menu z menicka.cz (1 request denně, bez fotek) |
| `data/menicka_osm_map.csv` | párování menicka.cz na OSM (vzdálenost do 150 m + podobnost jména) |
| `data/menicka_osm_map_manual.csv` | ruční opravy párování |
| `data/restaurants.json` | sloučený seznam pro databázi a pro záložní režim bez databáze |

ETL ručně:

```sh
python3 -m venv .venv && .venv/bin/pip install -r scripts/requirements.txt
.venv/bin/python scripts/fetch_osm.py            # OSM + hranice
.venv/bin/python scripts/scrape_menicka.py       # dnešní menu
.venv/bin/python scripts/match_menicka.py data/menus/*.json
.venv/bin/python scripts/push_supabase.py restaurants
.venv/bin/python scripts/push_supabase.py menus data/menus/$(date +%F).json
```

## Zprovoznění

1. **Supabase**: nový projekt (region Frankfurt), v SQL editoru spustit `supabase/migrations/0001_init.sql`.
   V Authentication > Sign In / Providers zapnout *Allow anonymous sign-ins*.
2. **Turnstile** (doporučeno proti spamu): v Cloudflare vytvořit widget, *site key* do
   `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, *secret* do Supabase Authentication > Attack Protection > CAPTCHA (Turnstile).
3. `.env.local` podle `.env.example`, pak naplnit databázi příkazy `push_supabase.py` výše.
4. `npm install && npm run dev`.
5. **Vercel**: importovat repo z GitHubu, nastavit `NEXT_PUBLIC_*` proměnné.
6. **GitHub Actions**: secrets `SUPABASE_URL` a `SUPABASE_SERVICE_ROLE_KEY`; workflow `Denní meníčka`
   běží v pracovní dny v 10:15 SEČ a commituje snapshot menu do `data/menus/`.

Bez proměnných Supabase aplikace běží jen pro čtení nad `data/*.json` (mapa, menu, SEO stránky, bez hodnocení).

## Struktura

- `src/app/page.tsx`: mapa a seznam podniků s dnešním menu
- `src/app/restaurace/[slug]`: detail podniku, menu, hodnocení, JSON-LD `Restaurant` + `Menu`
- `src/app/jidlo/[slug]`: detail jídla, historie cen, hodnocení a fotky
- `src/app/hodnotit/[dishId]`: formulář hodnocení s fotkou (zmenšení na 1600 px WebP v prohlížeči)
- `src/lib/data.ts`: čtení dat (Supabase nebo záložní JSON), cache po hodinách s tagy
- `public/sw.js`: service worker (offline stránky, cache dlaždic a fotek)
- `supabase/migrations/0001_init.sql`: schéma, RLS, limity (30 hodnocení a 20 fotek za 24 h, 1 hodnocení jídla denně)

## Plán po prezentaci

- OCR fotky tabule s menu (Gemini Flash) a štítky jídla z fotky
- Izochrona „kam stihnu za pauzu“ (OpenRouteService, 5/10/15 min pěšky)
- Doporučování podle hodnocení, vzdálenosti a štítků

## Licence dat

Podniky © přispěvatelé OpenStreetMap, ODbL. Menu z veřejného výpisu menicka.cz; před veřejným spuštěním
je potřeba svolení provozovatele.
