import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ReviewList } from "@/components/ReviewList";
import { Icon, Score } from "@/components/sign";
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
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-10 font-sign text-2xl font-bold text-ink-2">Načítám…</div>}>
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
    <article className="mx-auto max-w-3xl px-4 pt-5 pb-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav className="mb-4 text-sm font-medium">
        <Link href={`/restaurace/${d.restaurant.slug}`} className="inline-flex items-center gap-1.5 text-ink-2 hover:text-ink">
          <Icon name="arrow-left" className="size-4" /> {d.restaurant.name}
        </Link>
      </nav>

      <header className="bg-sheet shadow-[0_1px_2px_rgb(0_0_0/0.12),0_6px_24px_rgb(0_0_0/0.06)]">
        <div className="border-b-2 border-ink p-5">
          <h1 className="font-sign text-[2.3rem] font-bold leading-[0.98] tracking-[-0.01em] text-balance md:text-5xl">{d.name}</h1>
          <p className="mt-2 text-ink-2">
            {d.category === "soup" ? "Polévka" : "Hlavní jídlo"} v podniku{" "}
            <Link href={`/restaurace/${d.restaurant.slug}`} className="font-semibold text-ink underline">
              {d.restaurant.name}
            </Link>
          </p>
        </div>
        <div className="grid grid-cols-2 gap-px bg-rule sm:grid-cols-[1fr_1fr_auto]">
          <div className="bg-sheet p-4">
            <div className="text-sm font-semibold text-ink-2">Hodnocení</div>
            <div className="mt-2 flex h-11 items-center">
              {d.score.n_reviews && d.score.avg_rating ? (
                <Score value={d.score.avg_rating} count={d.score.n_reviews} size="lg" />
              ) : (
                <span className="font-sign text-3xl font-bold leading-none" aria-label="zatím bez hodnocení">–</span>
              )}
            </div>
          </div>
          <div className="bg-sheet p-4">
            <div className="text-sm font-semibold text-ink-2">Naposledy za</div>
            <div className="mt-2 flex h-11 items-center font-sign text-3xl font-bold leading-none tnum">
              {lastPrice ? (
                <>
                  {lastPrice}
                  <span className="ml-1 self-end pb-1 text-base font-semibold text-ink-2">Kč</span>
                </>
              ) : (
                <span aria-label="cena neuvedena">–</span>
              )}
            </div>
          </div>
          <Link
            href={`/hodnotit/${d.id}`}
            className="col-span-2 flex items-center justify-between gap-4 bg-ink px-5 py-4 font-sign text-xl font-bold text-sheet hover:bg-[#2a2c30] sm:col-span-1"
          >
            Ohodnotit jídlo
            <span className="grid size-9 place-items-center bg-led text-ink">
              <Icon name="arrow-right" />
            </span>
          </Link>
        </div>
      </header>

      {d.prices.length > 1 && (
        <section className="mt-8">
          <h2 className="mb-2 font-sign text-xl font-bold">Kdy bylo v menu</h2>
          <ol className="flex flex-wrap gap-px bg-rule text-sm">
            {d.prices.map((p) => (
              <li key={p.date} className="bg-sheet px-3 py-1.5 tnum">
                {new Date(p.date).toLocaleDateString("cs-CZ")}
                {p.price ? <span className="ml-2 font-semibold">{p.price} Kč</span> : null}
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="mt-12">
        <h2 className="mb-4 font-sign text-3xl font-bold">Hodnocení a fotky</h2>
        <ReviewList reviews={d.reviews} />
      </section>
    </article>
  );
}
