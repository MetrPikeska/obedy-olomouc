import type { MetadataRoute } from "next";

import { SITE_URL, pragueToday } from "@/lib/config";
import { getDishSlugs, getRestaurantSlugs } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [restaurants, dishes] = await Promise.all([getRestaurantSlugs(), getDishSlugs()]);
  const today = pragueToday();
  return [
    { url: `${SITE_URL}/`, lastModified: today, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/o-projektu`, changeFrequency: "monthly", priority: 0.3 },
    ...restaurants.map((r) => ({
      url: `${SITE_URL}/restaurace/${r.slug}`,
      lastModified: r.has_menu ? today : undefined,
      changeFrequency: (r.has_menu ? "daily" : "weekly") as "daily" | "weekly",
      priority: r.has_menu ? 0.8 : 0.4,
    })),
    ...dishes.map((d) => ({
      url: `${SITE_URL}/jidlo/${d.slug}`,
      lastModified: d.updated,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];
}
