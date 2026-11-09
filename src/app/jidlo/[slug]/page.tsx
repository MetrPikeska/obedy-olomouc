import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ReviewList } from "@/components/ReviewList";
import { Stars } from "@/components/Stars";
import { SITE_URL } from "@/lib/config";
import { getDish } from "@/lib/data";

export async function generateMetadata({ params }: PageProps<"/jidlo/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const d = await getDish(slug);
  if (!d) return { title: "Jídlo nenalezeno" };
  return {
    title: `${d.name} (${d.restaurant.name})`,
    description: `${d.name} v podniku ${d.restaurant.name}, Olomouc. ${
      d.score.n_reviews ? `Hodnocení ${d.score.avg_rating}/5 z ${d.score.n_reviews} recenzí.` : "Hodnocení a fotky od strávníků."
    }`,
    alternates: { canonical: `/jidlo/${d.slug}` },
  };
}

export default function DishPage(props: PageProps<"/jidlo/[slug]">) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl p-6 text-ink-2">Načítám…</div>}>
      <DishDetailView params={props.params} />
    </Suspense>
  );
}

async function DishDetailView({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = await getDish(slug);
  if (!d) notFound();
  const lastPrice = d.prices.filter((p) => p.price).at(-1)?.price;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MenuItem",
    name: d.name,
    url: `${SITE_URL}/jidlo/${d.slug}`,
    ...(lastPrice ? { offers: { "@type": "Offer", price: lastPrice, priceCurrency: "CZK" } } : {}),
    ...(d.score.n_reviews && d.score.avg_rating
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: d.score.avg_rating, reviewCount: d.score.n_reviews, bestRating: 5, worstRating: 1 } }
      : {}),
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav className="mb-3 text-sm text-ink-2">
        <Link href="/" className="hover:underline">Mapa</Link> /{" "}
        <Link href={`/restaurace/${d.restaurant.slug}`} className="hover:underline">{d.restaurant.name}</Link>
      </nav>
      <p className="text-xs uppercase tracking-wider text-tomato">{d.category === "soup" ? "Polévka" : "Hlavní jídlo"}</p>
      <h1 className="font-display text-3xl font-semibold leading-tight">{d.name}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-2">
        {d.score.n_reviews && d.score.avg_rating ? (
          <span className="flex items-center gap-2">
            <Stars value={d.score.avg_rating} size="lg" /> {d.score.n_reviews} hodnocení
          </span>
        ) : (
          <span>Zatím bez hodnocení</span>
        )}
        {lastPrice && <span>Naposledy za {lastPrice} Kč</span>}
        <Link href={`/hodnotit/${d.id}`} className="rounded-lg bg-tomato px-4 py-2 font-medium text-paper">
          Ohodnotit jídlo
        </Link>
      </div>

      {d.prices.length > 1 && (
        <section className="mt-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-2">Kdy bylo v menu</h2>
          <ul className="flex flex-wrap gap-2 text-xs">
            {d.prices.map((p) => (
              <li key={p.date} className="rounded-full border border-line px-2 py-1">
                {new Date(p.date).toLocaleDateString("cs-CZ")} {p.price ? `· ${p.price} Kč` : ""}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-3 font-display text-2xl font-semibold">Hodnocení a fotky</h2>
        <ReviewList reviews={d.reviews} />
      </section>
    </article>
  );
}
