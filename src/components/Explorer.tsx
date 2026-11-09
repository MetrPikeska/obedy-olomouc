"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";

import { AMENITY_LABEL, OLOMOUC_CENTER } from "@/lib/config";
import { slugify } from "@/lib/slug";
import type { RestaurantPin } from "@/lib/types";

import { ArrowBox, Icon, Score, walkMinutes } from "./sign";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className="board h-full w-full" />,
});

const BOARD_ROWS = 6;

/** Prague wall clock for the board, updated every 20 s, empty on the server. */
function subscribeClock(cb: () => void) {
  const t = setInterval(cb, 20_000);
  return () => clearInterval(t);
}
const clockNow = () =>
  new Intl.DateTimeFormat("cs-CZ", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Prague" }).format(new Date());
function useClock() {
  return useSyncExternalStore(subscribeClock, clockNow, () => "");
}

type Origin = { at: [number, number]; label: string };
const CENTER: Origin = { at: OLOMOUC_CENTER, label: "od Horního náměstí" };

export function Explorer({ pins }: { pins: RestaurantPin[] }) {
  const [onlyMenu, setOnlyMenu] = useState(true);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [origin, setOrigin] = useState<Origin>(CENTER);
  const [locating, setLocating] = useState<"idle" | "busy" | "denied">("idle");
  const clock = useClock();

  const withWalk = useMemo(
    () => pins.map((p) => ({ ...p, min: walkMinutes(origin.at, [p.lon, p.lat]) })),
    [pins, origin],
  );

  const board = useMemo(
    () => withWalk.filter((p) => p.has_menu_today).sort((a, b) => a.min - b.min).slice(0, BOARD_ROWS),
    [withWalk],
  );

  const visible = useMemo(() => {
    const needle = slugify(q);
    return withWalk
      .filter((p) => (!onlyMenu || p.has_menu_today) && (!q || slugify(p.name).includes(needle)))
      .sort(
        (a, b) =>
          Number(b.has_menu_today) - Number(a.has_menu_today) ||
          a.min - b.min ||
          a.name.localeCompare(b.name, "cs"),
      );
  }, [withWalk, onlyMenu, q]);

  const nMenu = pins.filter((p) => p.has_menu_today).length;
  const sel = selected ? withWalk.find((x) => x.slug === selected) : undefined;

  function locate() {
    if (!("geolocation" in navigator)) return setLocating("denied");
    setLocating("busy");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin({ at: [pos.coords.longitude, pos.coords.latitude], label: "od tebe" });
        setLocating("idle");
      },
      () => setLocating("denied"),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }

  return (
    <div className="mx-auto grid max-w-[1600px] md:grid-cols-[440px_1fr] [grid-template-areas:'board'_'map'_'list'] md:[grid-template-areas:'board_map'_'list_map'] md:grid-rows-[auto_1fr]">
      {/* LED departure board: nearest places serving lunch today */}
      <section aria-labelledby="board-title" className="board text-led-text [grid-area:board]">
        <div className="flex items-baseline justify-between gap-3 px-4 pt-4">
          <h1 id="board-title" className="led text-[1.6rem] font-bold uppercase leading-none tracking-wide">
            Dnes v poledne
          </h1>
          <span className="led text-[1.6rem] font-bold leading-none" aria-label={clock ? `Je ${clock}` : undefined}>
            {clock}
          </span>
        </div>
        <p className="mt-2 px-4 text-[0.85rem] text-[#c9cdd3]">
          {nMenu} podniků zveřejnilo polední menu. Minuty pěšky {origin.label}, přibližně.
        </p>
        <ol className="mt-3 border-t border-[#2c2f33]">
          {board.map((p, i) => (
            <li key={p.id} className="board-row border-b border-[#2c2f33]" style={{ "--i": i } as React.CSSProperties}>
              <Link
                href={`/restaurace/${p.slug}`}
                onMouseEnter={() => setSelected(p.slug)}
                onFocus={() => setSelected(p.slug)}
                className="grid grid-cols-[1fr_auto_4.2rem] items-baseline gap-3 px-4 py-2.5 hover:bg-[#1f2124]"
              >
                <span className="led truncate text-[1.15rem] font-bold">{p.name}</span>
                <span className="led text-[1.05rem] font-semibold opacity-80">
                  {p.cheapest ? `${p.cheapest},-` : ""}
                </span>
                <span className="led text-right text-[1.15rem] font-bold">{p.min} min</span>
              </Link>
            </li>
          ))}
          {board.length === 0 && (
            <li className="led px-4 py-4 text-[1.1rem] font-bold">Na dnešek zatím žádné menu</li>
          )}
        </ol>
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={locate}
            disabled={locating === "busy"}
            className="inline-flex items-center gap-2 border border-[#3a3d42] px-3 py-2 text-sm font-semibold text-led-text hover:border-led disabled:opacity-60"
          >
            <Icon name="locate" className="size-4" />
            {locating === "busy" ? "Zjišťuji polohu…" : origin === CENTER ? "Počítat od mé polohy" : "Aktualizovat polohu"}
          </button>
          {locating === "denied" && (
            <span className="text-xs text-[#c9cdd3]">Poloha nedostupná, počítám od Horního náměstí.</span>
          )}
        </div>
      </section>

      {/* network map */}
      <section
        aria-label="Mapa podniků"
        className="relative h-[46dvh] [grid-area:map] md:self-start md:sticky md:top-14 md:h-[calc(100dvh-3.5rem)]"
      >
        <MapView pins={onlyMenu ? pins.filter((p) => p.has_menu_today) : pins} selected={selected} onSelect={setSelected} />
        {sel && (
          <div className="absolute inset-x-3 bottom-3 md:right-auto md:w-[22rem] bg-sheet shadow-[0_2px_4px_rgb(0_0_0/0.2),0_10px_30px_rgb(0_0_0/0.18)]">
            <Link href={`/restaurace/${sel.slug}`} className="flex items-center gap-3 p-3 hover:bg-frame">
              <span className="min-w-0 flex-1">
                <span className="block truncate font-sign text-xl font-bold leading-tight">{sel.name}</span>
                <span className="block text-sm text-ink-2">
                  {sel.has_menu_today ? "Dnes má menu" : "Menu dnes nezveřejnil"}
                  {sel.cheapest ? ` · od ${sel.cheapest} Kč` : ""} · {sel.min} min pěšky
                </span>
              </span>
              <ArrowBox />
            </Link>
          </div>
        )}
      </section>

      {/* printed timetable: every place */}
      <section aria-labelledby="list-title" className="bg-sheet [grid-area:list]">
        <div className="sticky top-14 z-10 border-b-2 border-ink bg-sheet px-4 pt-4 pb-3">
          <h2 id="list-title" className="font-sign text-2xl font-bold leading-none">
            {onlyMenu ? "Podniky s menu" : "Všechny podniky"}{" "}
            <span className="font-semibold text-ink-3 tnum">{visible.length}</span>
          </h2>
          <div className="mt-3 flex gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Hledat podnik"
              className="min-w-0 flex-1 border border-ink/40 bg-sheet px-3 py-2 text-[0.95rem] outline-none placeholder:text-ink-3 focus:border-ink"
              aria-label="Hledat podnik"
            />
            <button
              type="button"
              onClick={() => setOnlyMenu((v) => !v)}
              aria-pressed={onlyMenu}
              className={`shrink-0 border px-3 py-2 text-[0.95rem] font-semibold ${
                onlyMenu ? "border-route bg-route text-sheet" : "border-ink/40 bg-sheet text-ink hover:border-ink"
              }`}
            >
              Jen s menu
            </button>
          </div>
        </div>
        <ul className="rows">
          {visible.map((p) => (
            <li key={p.id}>
              <Link
                href={`/restaurace/${p.slug}`}
                onMouseEnter={() => setSelected(p.slug)}
                className={`group grid grid-cols-[3.25rem_1fr_auto_auto] items-center gap-3 py-3 pr-3 pl-4 hover:bg-frame ${
                  selected === p.slug ? "bg-frame" : ""
                }`}
              >
                <span className="text-right leading-none">
                  <span className={`font-sign text-[1.75rem] font-bold tnum ${p.has_menu_today ? "" : "text-ink-3"}`}>
                    {p.min}
                  </span>
                  <span className="block text-[0.7rem] font-semibold text-ink-3">min</span>
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    {p.has_menu_today && <span aria-hidden className="size-3.5 shrink-0 bg-route" />}
                    <span className={`truncate text-[1.05rem] font-semibold ${p.has_menu_today ? "" : "text-ink-2"}`}>
                      {p.name}
                    </span>
                  </span>
                  <span className={`block text-sm text-ink-2 ${p.has_menu_today ? "pl-[1.375rem]" : ""}`}>
                    {AMENITY_LABEL[p.amenity] ?? p.amenity}
                    {p.has_menu_today ? (p.cheapest ? ` · menu od ${p.cheapest} Kč` : " · menu dnes") : ""}
                  </span>
                </span>
                {p.n_reviews > 0 && p.avg_rating != null ? <Score value={p.avg_rating} count={p.n_reviews} /> : <span />}
                <span className="grid size-8 place-items-center bg-frame-2 text-ink group-hover:bg-ink group-hover:text-sheet">
                  <Icon name="arrow-right" className="size-4" />
                </span>
              </Link>
            </li>
          ))}
          {visible.length === 0 && (
            <li className="px-4 py-6 text-ink-2">
              Nic nenalezeno.{" "}
              {onlyMenu && (
                <button className="font-semibold text-ink underline" onClick={() => setOnlyMenu(false)}>
                  Hledat i v podnicích bez menu
                </button>
              )}
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
