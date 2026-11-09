import "server-only";

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";

import { HAS_SUPABASE, SUPABASE_ANON_KEY, SUPABASE_URL, pragueToday } from "./config";
import { slugify } from "./slug";
import type { Dish, MenuItem, Restaurant, RestaurantPin, Review, Score } from "./types";

/*
 * Read-only data access for server components.
 * With Supabase env vars set it reads the database (anon key, public RLS).
 * Without them it falls back to the ETL JSON in /data so the app runs before the
 * Supabase project exists (no reviews in that mode).
 */

const db = () =>
  createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });

// ------------------------------------------------------------------ static fallback

type StaticMenu = {
  menicka_id: number;
  soups: string[];
  mains: { name: string; price: number | null }[];
};

let staticCache: Promise<{
  restaurants: Restaurant[];
  menus: Map<number, MenuItem[]>;
  dishes: Map<string, Dish & { price: number | null }>;
}> | null = null;

function loadStatic() {
  staticCache ??= (async () => {
    const dataDir = path.join(process.cwd(), "data");
    const raw = JSON.parse(await readFile(path.join(dataDir, "restaurants.json"), "utf8")) as Omit<
      Restaurant,
      "id"
    >[];
    const restaurants: Restaurant[] = raw.map((r, i) => ({ ...r, id: i + 1 }));
    const byMenicka = new Map(restaurants.filter((r) => r.menicka_id).map((r) => [r.menicka_id!, r]));

    const files = (await readdir(path.join(dataDir, "menus"))).filter((f) => f.endsWith(".json")).sort();
    const latest = files.at(-1);
    const menus = new Map<number, MenuItem[]>();
    const dishes = new Map<string, Dish & { price: number | null }>();
    if (latest) {
      const day = JSON.parse(await readFile(path.join(dataDir, "menus", latest), "utf8")) as StaticMenu[];
      let dishId = 1;
      for (const m of day) {
        const r = byMenicka.get(m.menicka_id);
        if (!r) continue;
        const items: MenuItem[] = [];
        const all = [
          ...m.soups.map((name) => ({ name, price: null, category: "soup" as const })),
          ...m.mains.map((x) => ({ ...x, category: "main" as const })),
        ];
        all.forEach((x, i) => {
          const slug = `${r.slug}--${slugify(x.name)}`.slice(0, 120);
          const id = dishId++;
          items.push({ dish_id: id, slug, name: x.name, category: x.category, price: x.price, position: i + 1 });
          dishes.set(slug, { id, slug, name: x.name, category: x.category, restaurant_id: r.id, price: x.price });
        });
        menus.set(r.id, items);
      }
    }
    return { restaurants, menus, dishes };
  })();
  return staticCache;
}

// ------------------------------------------------------------------ queries

export async function getPins(): Promise<RestaurantPin[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("restaurants", "reviews", "menus");

  if (!HAS_SUPABASE) {
    const s = await loadStatic();
    return s.restaurants.map((r) => {
      const menu = s.menus.get(r.id);
      return {
        id: r.id,
        slug: r.slug,
        name: r.name,
        amenity: r.amenity,
        lat: r.lat,
        lon: r.lon,
        has_menu_today: Boolean(menu?.length),
        n_reviews: 0,
        avg_rating: null,
        cheapest: minPrice(menu),
      };
    });
  }

  const sb = db();
  const [rs, scores, today] = await Promise.all([
    sb.from("restaurants").select("id,slug,name,amenity,lat,lon").order("name"),
    sb.from("restaurant_scores").select("restaurant_id,n_reviews,avg_rating").gt("n_reviews", 0),
    sb.from("today_menu_items").select("restaurant_id,price,category"),
  ]);
  if (rs.error) throw rs.error;
  const scoreBy = new Map((scores.data ?? []).map((s) => [s.restaurant_id as number, s]));
  const menuBy = new Map<number, MenuItem[]>();
  for (const it of (today.data ?? []) as (MenuItem & { restaurant_id: number })[]) {
    menuBy.set(it.restaurant_id, [...(menuBy.get(it.restaurant_id) ?? []), it]);
  }
  return (rs.data ?? []).map((r) => {
    const sc = scoreBy.get(r.id);
    const menu = menuBy.get(r.id);
    return {
      ...r,
      has_menu_today: Boolean(menu?.length),
      n_reviews: sc?.n_reviews ?? 0,
      avg_rating: sc?.avg_rating ?? null,
      cheapest: minPrice(menu),
    };
  });
}

function minPrice(menu?: MenuItem[]): number | null {
  const prices = (menu ?? []).filter((m) => m.category === "main" && m.price).map((m) => m.price!);
  return prices.length ? Math.min(...prices) : null;
}

export async function getRestaurantSlugs(): Promise<{ slug: string; has_menu: boolean }[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("restaurants");
  const pins = await getPins();
  return pins.map((p) => ({ slug: p.slug, has_menu: p.has_menu_today || p.n_reviews > 0 }));
}

export async function getRestaurant(slug: string): Promise<Restaurant | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("restaurants", `restaurant:${slug}`);
  if (!HAS_SUPABASE) {
    const s = await loadStatic();
    return s.restaurants.find((r) => r.slug === slug) ?? null;
  }
  const { data, error } = await db().from("restaurants").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data;
}

export type MenuWithScores = { date: string; items: (MenuItem & Score)[] };

export async function getTodayMenu(restaurantId: number): Promise<MenuWithScores> {
  "use cache";
  cacheLife("hours");
  cacheTag("menus", "reviews", `menu:${restaurantId}`);
  const date = pragueToday();
  if (!HAS_SUPABASE) {
    const s = await loadStatic();
    const items = (s.menus.get(restaurantId) ?? []).map((m) => ({ ...m, n_reviews: 0, avg_rating: null }));
    return { date, items };
  }
  const sb = db();
  const { data, error } = await sb
    .from("today_menu_items")
    .select("dish_id,slug,name,category,price,position")
    .eq("restaurant_id", restaurantId)
    .order("category", { ascending: false })
    .order("position");
  if (error) throw error;
  const ids = (data ?? []).map((d) => d.dish_id);
  const { data: scores } = ids.length
    ? await sb.from("dish_scores").select("dish_id,n_reviews,avg_rating").in("dish_id", ids)
    : { data: [] };
  const by = new Map((scores ?? []).map((s) => [s.dish_id as number, s]));
  return {
    date,
    items: (data ?? []).map((d) => ({
      ...(d as MenuItem),
      n_reviews: by.get(d.dish_id)?.n_reviews ?? 0,
      avg_rating: by.get(d.dish_id)?.avg_rating ?? null,
    })),
  };
}

export async function getRestaurantScore(restaurantId: number): Promise<Score> {
  "use cache";
  cacheLife("hours");
  cacheTag("reviews", `score:${restaurantId}`);
  if (!HAS_SUPABASE) return { n_reviews: 0, avg_rating: null };
  const { data } = await db()
    .from("restaurant_scores")
    .select("n_reviews,avg_rating")
    .eq("restaurant_id", restaurantId)
    .maybeSingle();
  return data ?? { n_reviews: 0, avg_rating: null };
}

const REVIEW_SELECT =
  "id,dish_id,rating,price_paid,portion,comment,review_date,dishes(name,slug),profiles(nickname),photos(path)";

type ReviewRow = {
  id: number;
  dish_id: number;
  rating: number;
  price_paid: number | null;
  portion: number | null;
  comment: string | null;
  review_date: string;
  dishes: { name: string; slug: string } | null;
  profiles: { nickname: string | null } | null;
  photos: { path: string }[];
};

function mapReview(r: ReviewRow): Review {
  return {
    id: r.id,
    dish_id: r.dish_id,
    dish_name: r.dishes?.name,
    dish_slug: r.dishes?.slug,
    rating: r.rating,
    price_paid: r.price_paid,
    portion: r.portion,
    comment: r.comment,
    review_date: r.review_date,
    nickname: r.profiles?.nickname ?? null,
    photos: (r.photos ?? []).map((p) => p.path),
  };
}

export async function getRestaurantReviews(restaurantId: number, limit = 20): Promise<Review[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("reviews", `reviews:r:${restaurantId}`);
  if (!HAS_SUPABASE) return [];
  const { data, error } = await db()
    .from("reviews")
    .select(REVIEW_SELECT)
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as unknown as ReviewRow[]).map(mapReview);
}

export type DishDetail = Dish & {
  restaurant: Pick<Restaurant, "id" | "slug" | "name" | "address" | "lat" | "lon">;
  score: Score;
  prices: { date: string; price: number | null }[];
  reviews: Review[];
};

export async function getDish(slug: string): Promise<DishDetail | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("reviews", "menus", `dish:${slug}`);
  if (!HAS_SUPABASE) {
    const s = await loadStatic();
    const d = s.dishes.get(slug);
    if (!d) return null;
    const r = s.restaurants.find((x) => x.id === d.restaurant_id)!;
    return {
      ...d,
      restaurant: { id: r.id, slug: r.slug, name: r.name, address: r.address, lat: r.lat, lon: r.lon },
      score: { n_reviews: 0, avg_rating: null },
      prices: [{ date: pragueToday(), price: d.price }],
      reviews: [],
    };
  }
  const sb = db();
  const { data: d, error } = await sb
    .from("dishes")
    .select("id,slug,name,category,restaurant_id,restaurants(id,slug,name,address,lat,lon)")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!d) return null;
  const [score, prices, reviews] = await Promise.all([
    sb.from("dish_scores").select("n_reviews,avg_rating").eq("dish_id", d.id).maybeSingle(),
    sb.from("menu_items").select("price,menus(date)").eq("dish_id", d.id).limit(60),
    sb.from("reviews").select(REVIEW_SELECT).eq("dish_id", d.id).order("created_at", { ascending: false }).limit(30),
  ]);
  const priceRows = (prices.data ?? []) as unknown as { price: number | null; menus: { date: string } }[];
  return {
    id: d.id,
    slug: d.slug,
    name: d.name,
    category: d.category,
    restaurant_id: d.restaurant_id,
    restaurant: d.restaurants as unknown as DishDetail["restaurant"],
    score: score.data ?? { n_reviews: 0, avg_rating: null },
    prices: priceRows.map((p) => ({ date: p.menus.date, price: p.price })).sort((a, b) => a.date.localeCompare(b.date)),
    reviews: ((reviews.data ?? []) as unknown as ReviewRow[]).map(mapReview),
  };
}

export async function getDishById(id: number): Promise<(Dish & { restaurant: Pick<Restaurant, "slug" | "name"> }) | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("menus", `dish-id:${id}`);
  if (!HAS_SUPABASE) {
    const s = await loadStatic();
    const d = [...s.dishes.values()].find((x) => x.id === id);
    if (!d) return null;
    const r = s.restaurants.find((x) => x.id === d.restaurant_id)!;
    return { ...d, restaurant: { slug: r.slug, name: r.name } };
  }
  const { data } = await db()
    .from("dishes")
    .select("id,slug,name,category,restaurant_id,restaurants(slug,name)")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  return { ...data, restaurant: data.restaurants as unknown as { slug: string; name: string } };
}

export async function getDishSlugs(): Promise<{ slug: string; updated: string }[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("menus");
  if (!HAS_SUPABASE) {
    const s = await loadStatic();
    return [...s.dishes.keys()].map((slug) => ({ slug, updated: pragueToday() }));
  }
  const { data } = await db().from("dishes").select("slug,created_at").limit(5000);
  return (data ?? []).map((d) => ({ slug: d.slug, updated: d.created_at.slice(0, 10) }));
}
