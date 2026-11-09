# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

Installable PWA (manifest, service worker, offline page). Used mostly on phones.

## Users

Students of Palacký University and people working in Olomouc. Around 11:30 they open the app on a phone, often outside on the street or at a desk, and decide within about a minute where to go for lunch today and whether a specific dish there is worth it. After eating, some of them rate the dish they had, optionally with a photo.

## Product Purpose

Obědy Olomouc shows today's lunch menus of Olomouc restaurants on a map and collects ratings and photos of specific dishes. Success: a user picks lunch faster and better than by reading menus one restaurant at a time, and ratings accumulate per dish so the next person knows what is good.

## Positioning

The unit of rating is the dish, not the restaurant. "Svíčková v Hostinci X" gets its own score and history across days. Menus come daily from menicka.cz, matched to OpenStreetMap places, and later from photos of menu boards read by OCR. It is local to Olomouc and has no delivery, orders or payments.

## Operating Context

- Lunch break, phone in one hand, often outdoors in daylight or sun.
- Main path: map or list, then restaurant detail with today's menu, then dish detail or the rating form.
- Rating happens after the meal: stars 1 to 5, price paid, portion size, comment, photo taken with the phone camera.
- Planned features shown as concept: OCR of menu boards, food tags from photos, recommendations, walking isochrone "kam stihnu za pauzu".

## Capabilities and Constraints

- Next.js 16 (cacheComponents), Tailwind 4, Supabase (Postgres + PostGIS, anonymous auth, Storage), deployed on Vercel.
- Map: MapLibre GL with OpenFreeMap vector tiles, no API key.
- Auth: anonymous Supabase sign-in only during the semester, no Google or e-mail login.
- Limits: one review of a dish per user per day, 30 reviews and 20 photos per 24 h.
- Attribution required: OpenStreetMap contributors (ODbL), menicka.cz.
- Content language Czech; fonts must cover Czech diacritics (latin-ext).
- SEO pages for restaurants and dishes (JSON-LD, sitemap) must keep working.

## Brand Commitments

- Name: Obědy Olomouc.
- Identity is local to Olomouc, not a generic food app.
- Must not look like corporate food delivery (Wolt, Foodora, Bolt Food).
- Semester project of KGI/ACART, Palacký University Olomouc, 2026 (team Hrbáček, Koutník, Tobola, Lípová, Mikeska). Possible public launch after the semester.

## Evidence on Hand

- 393 places in Olomouc (384 from OSM, 9 from menicka.cz), `data/restaurants.json`.
- About 30 restaurants with a daily menu and about 300 menu items per day, `data/menus/*.json`.
- No real reviews or dish photos yet. Do not fabricate ratings, reviews, photos, user counts or testimonials.

## Product Principles

- Fast decision: today's menu and the score of a dish are readable at a glance.
- Dish before restaurant.
- Honest data with a visible source and date.
- Local: Olomouc streets, distances and habits, not a generic city.
