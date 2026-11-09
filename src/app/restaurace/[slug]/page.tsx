import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { MiniMap } from "@/components/MiniMap";
import { ReviewList } from "@/components/ReviewList";
import { Stars } from "@/components/Stars";
import { AMENITY_LABEL, SITE_URL } from "@/lib/config";
import { getRestaurant, getRestaurantReviews, getRestaurantScore, getRestaurantSlugs, getTodayMenu } from "@/lib/data";

export async function generateStaticParams() {
  const slugs = await getRestaurantSlugs();
  // prerender places with a menu or reviews, the rest render on first visit
  return slugs.filter((s) => s.has_menu).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/restaurace/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const r = await getRestaurant(slug);
  if (!r) return { title: "Podnik nenalezen" };
  const menu = await getTodayMenu(r.id);
  const mains = menu.items.filter((i) => i.category === "main").slice(0, 3).map((i) => i.name);
  return {
    title: `${r.name}: polední menu a hodnocení jídel`,
    description: mains.length
      ? `Dnes v ${r.name}: ${mains.join(", ")}. Hodnocení a fotky jídel, Olomouc.`
      : `${r.name}, Olomouc${r.address ? `, ${r.address}` : ""}. Hodnocení a fotky jídel.`,
    alternates: { canonical: `/restaurace/${r.slug}` },
    openGraph: { type: "website", url: `/restaurace/${r.slug}` },
  };
}

export default function RestaurantPage(props: PageProps<"/restaurace/[slug]">) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl p-6 text-ink-2">Načítám…</div>}>
      <RestaurantDetail params={props.params} />
    </Suspense>
  );
}

async function RestaurantDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = await getRestaurant(slug);
  if (!r) notFound();
  const [menu, score, reviews] = await Promise.all([
    getTodayMenu(r.id),
    getRestaurantScore(r.id),
    getRestaurantReviews(r.id),
  ]);
  const soups = menu.items.filter((i) => i.category === "soup");
  const mains = menu.items.filter((i) => i.category !== "soup");
  const dateLabel = new Date(menu.date).toLocaleDateString("cs-CZ", { weekday: "long", day: "numeric", month: "long" });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": r.amenity === "cafe" ? "CafeOrCoffeeShop" : r.amenity === "fast_food" ? "FastFoodRestaurant" : r.amenity === "pub" ? "BarOrPub" : "Restaurant",
    name: r.name,
    url: `${SITE_URL}/restaurace/${r.slug}`,
    geo: { "@type": "GeoCoordinates", latitude: r.lat, longitude: r.lon },
    address: {
      "@type": "PostalAddress",
      streetAddress: r.address ?? undefined,
      addressLocality: "Olomouc",
      addressCountry: "CZ",
    },
    servesCuisine: r.cuisine?.split(";") ?? undefined,
    telephone: r.phone ?? undefined,
    sameAs: r.website ?? undefined,
    ...(score.n_reviews > 0 && score.avg_rating
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: score.avg_rating, reviewCount: score.n_reviews, bestRating: 5, worstRating: 1 } }
      : {}),
    ...(menu.items.length
      ? {
          hasMenu: {
            "@type": "Menu",
            name: `Polední menu ${menu.date}`,
            hasMenuSection: [
              { name: "Polévky", items: soups },
              { name: "Hlavní jídla", items: mains },
            ]
              .filter((s) => s.items.length)
              .map((s) => ({
                "@type": "MenuSection",
                name: s.name,
                hasMenuItem: s.items.map((i) => ({
                  "@type": "MenuItem",
                  name: i.name,
                  url: `${SITE_URL}/jidlo/${i.slug}`,
                  ...(i.price ? { offers: { "@type": "Offer", price: i.price, priceCurrency: "CZK" } } : {}),
                })),
              })),
          },
        }
      : {}),
  };

  return (
    <article className="mx-auto max-w-4xl px-4 py-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav className="mb-3 text-sm text-ink-2">
        <Link href="/" className="hover:underline">Mapa</Link> / {r.name}
      </nav>
      <header className="mb-6 grid gap-4 md:grid-cols-[1fr_280px]">
        <div>
          <p className="text-xs uppercase tracking-wider text-tomato">{AMENITY_LABEL[r.amenity] ?? r.amenity}</p>
          <h1 className="font-display text-4xl font-semibold leading-tight">{r.name}</h1>
          <p className="mt-1 text-ink-2">{r.address ? `${r.address}, Olomouc` : "Olomouc"}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            {score.n_reviews > 0 && score.avg_rating ? (
              <span className="flex items-center gap-2">
                <Stars value={score.avg_rating} size="lg" />
                <span className="text-ink-2">
                  {score.avg_rating.toLocaleString("cs-CZ")} · {score.n_reviews} hodnocení
                </span>
              </span>
            ) : (
              <span className="text-ink-2">Zatím bez hodnocení</span>
            )}
            {r.website && (
              <a href={r.website} className="underline" rel="nofollow noopener" target="_blank">Web podniku</a>
            )}
            <a
              className="underline"
              target="_blank"
              rel="noopener"
              href={`https://www.google.com/maps/dir/?api=1&destination=${r.lat},${r.lon}&travelmode=walking`}
            >
              Trasa pěšky
            </a>
          </div>
          {r.opening_hours && <p className="mt-2 text-xs text-ink-2">Otevírací doba (OSM): {r.opening_hours}</p>}
        </div>
        <MiniMap lon={r.lon} lat={r.lat} />
      </header>

      <section className="rounded-2xl border border-line bg-white/60 p-5">
        <h2 className="font-display text-2xl font-semibold">Polední menu</h2>
        <p className="mb-4 text-sm text-ink-2 first-letter:uppercase">{dateLabel}</p>
        {menu.items.length === 0 ? (
          <p className="text-ink-2">
            Na dnešek menu nemáme. Jedl jsi tu? Brzy půjde menu vyfotit a nahrát.
          </p>
        ) : (
          <div className="space-y-5">
            {[
              { title: "Polévky", items: soups },
              { title: "Hlavní jídla", items: mains },
            ]
              .filter((s) => s.items.length)
              .map((s) => (
                <div key={s.title}>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-2">{s.title}</h3>
                  <ul className="space-y-2.5">
                    {s.items.map((i) => (
                      <li key={i.dish_id} className="group">
                        <div className="flex items-end">
                          <Link href={`/jidlo/${i.slug}`} className="hover:underline">
                            {i.name}
                          </Link>
                          <span className="leader" />
                          <span className="whitespace-nowrap font-medium tabular-nums">{i.price ? `${i.price} Kč` : ""}</span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-3 text-xs text-ink-2">
                          {i.n_reviews > 0 && i.avg_rating ? (
                            <span className="flex items-center gap-1">
                              <Stars value={i.avg_rating} /> {i.n_reviews}×
                            </span>
                          ) : null}
                          <Link href={`/hodnotit/${i.dish_id}`} className="font-medium text-tomato hover:underline">
                            Ohodnotit
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-display text-2xl font-semibold">Hodnocení jídel</h2>
        <ReviewList reviews={reviews} showDish />
      </section>
    </article>
  );
}
