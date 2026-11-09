"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";

import { AMENITY_LABEL } from "@/lib/config";
import { slugify } from "@/lib/slug";
import type { RestaurantPin } from "@/lib/types";

import { Stars } from "./Stars";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-paper-2" />,
});

export function Explorer({ pins }: { pins: RestaurantPin[] }) {
  const [onlyMenu, setOnlyMenu] = useState(true);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const visible = useMemo(() => {
    const needle = slugify(q);
    return pins
      .filter((p) => (!onlyMenu || p.has_menu_today) && (!q || slugify(p.name).includes(needle)))
      .sort(
        (a, b) =>
          Number(b.has_menu_today) - Number(a.has_menu_today) ||
          (b.avg_rating ?? 0) - (a.avg_rating ?? 0) ||
          a.name.localeCompare(b.name, "cs"),
      );
  }, [pins, onlyMenu, q]);

  const nMenu = pins.filter((p) => p.has_menu_today).length;

  return (
    <div className="grid md:grid-cols-[380px_1fr] md:h-[calc(100dvh-57px)]">
      <section className="order-2 md:order-1 flex flex-col border-r border-line md:overflow-hidden">
        <div className="space-y-3 border-b border-line p-4">
          <h1 className="font-display text-2xl font-semibold leading-tight">
            Kam dnes na oběd?
          </h1>
          <p className="text-sm text-ink-2">
            {nMenu} podniků má dnes polední menu. Ohodnoť, co jsi jedl, a pomoz ostatním vybrat.
          </p>
          <div className="flex gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Hledat podnik…"
              className="min-w-0 flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-ink"
              aria-label="Hledat podnik"
            />
            <button
              onClick={() => setOnlyMenu((v) => !v)}
              aria-pressed={onlyMenu}
              className={`shrink-0 rounded-lg border px-3 py-2 text-sm ${
                onlyMenu ? "border-tomato bg-tomato text-paper" : "border-line bg-white"
              }`}
            >
              Dnes menu
            </button>
          </div>
        </div>
        <ul className="divide-y divide-line md:overflow-y-auto">
          {visible.map((p) => (
            <li key={p.id}>
              <Link
                href={`/restaurace/${p.slug}`}
                onMouseEnter={() => setSelected(p.slug)}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-paper-2 ${selected === p.slug ? "bg-paper-2" : ""}`}
              >
                <span
                  aria-hidden
                  className={`size-2.5 shrink-0 rounded-full ${p.has_menu_today ? "bg-tomato" : "bg-line"}`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{p.name}</span>
                  <span className="block text-xs text-ink-2">
                    {AMENITY_LABEL[p.amenity] ?? p.amenity}
                    {p.cheapest ? ` · menu od ${p.cheapest} Kč` : ""}
                  </span>
                </span>
                {p.n_reviews > 0 && p.avg_rating != null ? (
                  <span className="shrink-0 text-right text-xs">
                    <Stars value={p.avg_rating} />
                    <span className="block text-ink-2">{p.n_reviews}×</span>
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
          {visible.length === 0 && (
            <li className="p-4 text-sm text-ink-2">
              Nic nenalezeno.{" "}
              {onlyMenu && (
                <button className="underline" onClick={() => setOnlyMenu(false)}>
                  Zobrazit všechny podniky
                </button>
              )}
            </li>
          )}
        </ul>
      </section>
      <section className="order-1 md:order-2 h-[45dvh] md:h-auto relative">
        <MapView pins={onlyMenu ? pins.filter((p) => p.has_menu_today) : pins} selected={selected} onSelect={setSelected} />
        {selected && (
          <div className="absolute bottom-3 left-3 right-3 md:right-auto md:w-80 rounded-xl border border-line bg-paper p-3 shadow-lg">
            {(() => {
              const p = pins.find((x) => x.slug === selected)!;
              return (
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{p.name}</div>
                    <div className="text-xs text-ink-2">
                      {p.has_menu_today ? "Dnes má menu" : "Menu dnes nezveřejnil"}
                      {p.cheapest ? ` · od ${p.cheapest} Kč` : ""}
                    </div>
                  </div>
                  <Link href={`/restaurace/${p.slug}`} className="rounded-lg bg-tomato px-3 py-2 text-sm font-medium text-paper">
                    Detail
                  </Link>
                </div>
              );
            })()}
          </div>
        )}
      </section>
    </div>
  );
}
