"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource, Map as MLMap, MapLayerMouseEvent } from "maplibre-gl";
import { useEffect, useRef } from "react";

import { OLOMOUC_CENTER } from "@/lib/config";
import type { RestaurantPin } from "@/lib/types";

const STYLE = "https://tiles.openfreemap.org/styles/positron";

// Turbopack cannot resolve MapLibre's worker via import.meta.url; serve it from /public
if (typeof window !== "undefined") {
  maplibregl.setWorkerUrl(new URL("/maplibre-gl-worker.mjs", window.location.origin).href);
}

/** Square stop marker drawn once into an RGBA bitmap for a symbol layer. */
function stopSquare(px: number, fill: string, ring: string, ringPx: number, ratio = 2) {
  const n = px * ratio;
  const c = document.createElement("canvas");
  c.width = c.height = n;
  const g = c.getContext("2d")!;
  g.fillStyle = ring;
  g.fillRect(0, 0, n, n);
  const r = ringPx * ratio;
  g.fillStyle = fill;
  g.fillRect(r, r, n - 2 * r, n - 2 * r);
  return { width: n, height: n, data: new Uint8Array(g.getImageData(0, 0, n, n).data.buffer) };
}

function toGeoJSON(pins: RestaurantPin[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: pins.map((p) => ({
      type: "Feature",
      id: p.id,
      geometry: { type: "Point", coordinates: [p.lon, p.lat] },
      properties: {
        slug: p.slug,
        name: p.name,
        menu: p.has_menu_today ? 1 : 0,
        rating: p.avg_rating ?? 0,
        n: p.n_reviews,
        cheapest: p.cheapest ?? 0,
      },
    })),
  };
}

type Props = {
  pins: RestaurantPin[];
  selected?: string | null;
  onSelect?: (slug: string) => void;
  /** single-restaurant mini map */
  focus?: { lon: number; lat: number };
  className?: string;
};

export default function MapView({ pins, selected, onSelect, focus, className }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<MLMap | null>(null);
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    if (!box.current) return;
    const m = new maplibregl.Map({
      container: box.current,
      style: STYLE,
      center: focus ? [focus.lon, focus.lat] : OLOMOUC_CENTER,
      zoom: focus ? 16 : 13.3,
      attributionControl: { compact: true },
      cooperativeGestures: Boolean(focus),
    });
    map.current = m;
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    if (!focus) {
      m.addControl(
        new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: false }),
        "top-right",
      );
    }

    m.on("load", () => {
      m.addSource("pins", { type: "geojson", data: toGeoJSON(pins) });
      // square stops: red ring = menu today, grey = no menu, amber frame = selected
      m.addImage("stop-menu", stopSquare(22, "#141518", "#d42a1f", 4), { pixelRatio: 2 });
      m.addImage("stop-other", stopSquare(12, "#7b818a", "#ffffff", 1.5), { pixelRatio: 2 });
      m.addImage("stop-selected", stopSquare(36, "rgba(255,178,26,0.35)", "#141518", 3), { pixelRatio: 2 });
      const size = (lo: number, hi: number) =>
        ["interpolate", ["linear"], ["zoom"], 12, lo, 16, hi] as maplibregl.ExpressionSpecification;
      m.addLayer({
        id: "pins-other",
        type: "symbol",
        source: "pins",
        filter: ["==", ["get", "menu"], 0],
        layout: { "icon-image": "stop-other", "icon-size": size(0.5, 1), "icon-allow-overlap": true },
      });
      m.addLayer({
        id: "pins-selected",
        type: "symbol",
        source: "pins",
        filter: ["==", ["get", "slug"], ""],
        layout: { "icon-image": "stop-selected", "icon-allow-overlap": true, "icon-ignore-placement": true },
      });
      m.addLayer({
        id: "pins-menu",
        type: "symbol",
        source: "pins",
        filter: ["==", ["get", "menu"], 1],
        layout: {
          "icon-image": "stop-menu",
          "icon-size": size(0.55, 1),
          "icon-allow-overlap": true,
                  },
      });
      m.addLayer({
        id: "pins-label",
        type: "symbol",
        source: "pins",
        filter: ["==", ["get", "menu"], 1],
        minzoom: 14.5,
        layout: {
          "text-field": ["get", "name"],
          "text-size": 13,
          "text-offset": [0, 1.2],
          "text-anchor": "top",
          "text-font": ["Noto Sans Bold"],
          "text-optional": true,
        },
        paint: { "text-color": "#141518", "text-halo-color": "#ffffff", "text-halo-width": 2 },
      });

      for (const layer of ["pins-menu", "pins-other"]) {
        m.on("mouseenter", layer, () => (m.getCanvas().style.cursor = "pointer"));
        m.on("mouseleave", layer, () => (m.getCanvas().style.cursor = ""));
        m.on("click", layer, (e: MapLayerMouseEvent) => {
          const f = e.features?.[0];
          if (f) onSelectRef.current?.(f.properties.slug as string);
        });
      }
    });
    return () => m.remove();
    // map is created once; pins updates are handled below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const src = map.current?.getSource("pins") as GeoJSONSource | undefined;
    src?.setData(toGeoJSON(pins));
  }, [pins]);

  useEffect(() => {
    const m = map.current;
    if (!m || !selected) return;
    const apply = () => {
      if (m.getLayer("pins-selected")) m.setFilter("pins-selected", ["==", ["get", "slug"], selected]);
      const p = pins.find((x) => x.slug === selected);
      if (p) m.easeTo({ center: [p.lon, p.lat], zoom: Math.max(m.getZoom(), 15), duration: 600 });
    };
    if (m.isStyleLoaded()) apply();
    else m.once("idle", apply);
  }, [selected, pins]);

  return <div ref={box} className={className ?? "h-full w-full"} />;
}
