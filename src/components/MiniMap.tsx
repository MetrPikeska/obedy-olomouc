"use client";

import dynamic from "next/dynamic";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-paper-2" />,
});

export function MiniMap({ lon, lat }: { lon: number; lat: number }) {
  return (
    <div className="h-48 overflow-hidden rounded-2xl border border-line md:h-full md:min-h-44">
      <MapView
        focus={{ lon, lat }}
        pins={[{ id: 0, slug: "x", name: "", amenity: "restaurant", lat, lon, has_menu_today: true, n_reviews: 0, avg_rating: null, cheapest: null }]}
      />
    </div>
  );
}
