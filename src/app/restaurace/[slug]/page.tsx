import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { MiniMap } from "@/components/MiniMap";
import { ReviewList } from "@/components/ReviewList";
import { Icon, Score } from "@/components/sign";
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
    <Suspense fallback={<div className="mx-auto max-w-5xl px-4 py-10 font-sign text-2xl font-bold text-ink-2">Načítám…</div>}>
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
    <article className="mx-auto max-w-5xl px-4 pt-5 pb-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav className="mb-4 text-sm font-medium">
        <Link href="/" className="inline-flex items-center gap-1.5 text-ink-2 hover:text-ink">
          <Icon name="arrow-left" className="size-4" /> Mapa
        </Link>
      </nav>

      {/* stop sign: name plate + location */}
      <header className="grid gap-px bg-ink md:grid-cols-[1fr_320px]">
        <div className="bg-sheet p-5">
          <h1 className="font-sign text-[2.6rem] font-bold leading-[0.95] tracking-[-0.015em] text-balance md:text-6xl">{r.name}</h1>
          <p className="mt-2 text-ink-2">
            {AMENITY_LABEL[r.amenity] ?? r.amenity} · {r.address ? `${r.address}, Olomouc` : "Olomouc"}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
            {score.n_reviews > 0 && score.avg_rating ? (
              <Score value={score.avg_rating} count={score.n_reviews} size="lg" />
            ) : (
              <span className="text-ink-2">Zatím bez hodnocení</span>
            )}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <a
              className="inline-flex items-center gap-3 bg-ink py-1 pr-4 pl-1 font-semibold text-sheet hover:bg-[#2a2c30]"
              target="_blank"
              rel="noopener"
              href={`https://www.google.com/maps/dir/?api=1&destination=${r.lat},${r.lon}&travelmode=walking`}
            >
              <span className="grid size-9 place-items-center bg-led text-ink">
                <Icon name="walk" />
              </span>
              Trasa pěšky
            </a>
            {r.website && (
              <a
                href={r.website}
                className="inline-flex items-center gap-2 border-2 border-ink px-4 py-2 font-semibold hover:bg-frame"
                rel="nofollow noopener"
                target="_blank"
              >
                Web podniku <Icon name="external" className="size-4" />
              </a>
            )}
          </div>
          {r.opening_hours && <p className="mt-4 text-sm text-ink-2">Otevírací doba (OSM): {r.opening_hours}</p>}
        </div>
        <MiniMap lon={r.lon} lat={r.lat} />
      </header>

      {/* noon timetable */}
      <section aria-labelledby="menu-title" className="mt-8 bg-sheet shadow-[0_1px_2px_rgb(0_0_0/0.12),0_6px_24px_rgb(0_0_0/0.06)]">
        <div className="board flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-3">
          <h2 id="menu-title" className="led text-2xl font-bold uppercase">Polední menu</h2>
          <p className="led text-lg font-bold first-letter:uppercase">{dateLabel}</p>
        </div>
        {menu.items.length === 0 ? (
          <p className="px-5 py-6 text-ink-2">
            Na dnešek menu nemáme. Jedl jsi tu? Brzy půjde menu vyfotit a nahrát.
          </p>
        ) : (
          <div>
            {[
              { title: "Polévky", items: soups },
              { title: "Hlavní jídla", items: mains },
            ]
              .filter((s) => s.items.length)
              .map((s) => (
                <div key={s.title} className="md:grid md:grid-cols-[9rem_1fr]">
                  <h3 className="border-b border-ink bg-frame px-5 py-2 font-sign text-lg font-bold md:border-r md:border-b-0 md:border-t md:py-3">
                    {s.title}
                  </h3>
                  <ul className="rows md:border-t md:border-ink">
                    {s.items.map((i) => (
                      <li key={i.dish_id} className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 px-5 py-3.5 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                        <div className="min-w-0">
                          <Link href={`/jidlo/${i.slug}`} className="text-[1.08rem] font-semibold leading-snug hover:underline">
                            {i.name}
                          </Link>
                          {i.n_reviews > 0 && i.avg_rating ? (
                            <div className="mt-1.5">
                              <Score value={i.avg_rating} count={i.n_reviews} />
                            </div>
                          ) : null}
                        </div>
                        <span className="text-right font-sign text-2xl font-bold leading-none tnum">
                          {i.price ? (
                            <>
                              {i.price}
                              <span className="ml-0.5 text-sm font-semibold text-ink-2">Kč</span>
                            </>
                          ) : (
                            <span className="text-base text-ink-3">bez ceny</span>
                          )}
                        </span>
                        <Link
                          href={`/hodnotit/${i.dish_id}`}
                          className="col-span-2 inline-flex items-center justify-self-start border-2 border-ink py-0.5 pr-3 pl-0.5 text-sm font-semibold hover:bg-ink hover:text-sheet sm:col-span-1"
                        >
                          <span className="mr-2 grid size-7 place-items-center bg-ink text-sheet">
                            <Icon name="arrow-right" className="size-4" />
                          </span>
                          Ohodnotit
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        )}
        <p className="border-t border-rule px-5 py-2.5 text-xs text-ink-3">
          Zdroj menu: menicka.cz. Ceny a nabídku ověř u podniku.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="mb-4 font-sign text-3xl font-bold">Hodnocení jídel</h2>
        <ReviewList reviews={reviews} showDish />
      </section>
    </article>
  );
}
