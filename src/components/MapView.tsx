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
      // places without menu today: small muted dots
      m.addLayer({
        id: "pins-other",
        type: "circle",
        source: "pins",
        filter: ["==", ["get", "menu"], 0],
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 12, 2.5, 16, 6],
          "circle-color": ["case", [">", ["get", "n"], 0], "#3f7d4e", "#9b8f82"],
          "circle-opacity": 0.75,
          "circle-stroke-width": 1,
          "circle-stroke-color": "#faf6ef",
        },
      });
      // places with lunch menu today: tomato, colored by rating when rated
      m.addLayer({
        id: "pins-menu",
        type: "circle",
        source: "pins",
        filter: ["==", ["get", "menu"], 1],
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 12, 5, 16, 11],
          "circle-color": [
            "case",
            ["==", ["get", "n"], 0],
            "#c8412b",
            ["interpolate", ["linear"], ["get", "rating"], 1, "#c8412b", 3, "#d99a1e", 5, "#3f7d4e"],
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#faf6ef",
        },
      });
      m.addLayer({
        id: "pins-selected",
        type: "circle",
        source: "pins",
        filter: ["==", ["get", "slug"], ""],
        paint: { "circle-radius": 16, "circle-color": "transparent", "circle-stroke-width": 3, "circle-stroke-color": "#221d17" },
      });
      m.addLayer({
        id: "pins-label",
        type: "symbol",
        source: "pins",
        filter: ["==", ["get", "menu"], 1],
        minzoom: 14.5,
        layout: {
          "text-field": ["get", "name"],
          "text-size": 12,
          "text-offset": [0, 1.3],
          "text-anchor": "top",
          "text-font": ["Noto Sans Regular"],
          "text-optional": true,
        },
        paint: { "text-color": "#221d17", "text-halo-color": "#faf6ef", "text-halo-width": 1.5 },
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
