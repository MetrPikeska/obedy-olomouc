import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ReviewForm } from "@/components/ReviewForm";
import { HAS_SUPABASE } from "@/lib/config";
import { getDishById } from "@/lib/data";

export const metadata: Metadata = {
  title: "Ohodnotit jídlo",
  robots: { index: false, follow: false },
};

export default function RatePage(props: PageProps<"/hodnotit/[dishId]">) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-xl p-6 text-ink-2">Načítám…</div>}>
      <Rate params={props.params} />
    </Suspense>
  );
}

async function Rate({ params }: { params: Promise<{ dishId: string }> }) {
  const { dishId } = await params;
  const id = Number(dishId);
  if (!Number.isInteger(id)) notFound();
  const dish = await getDishById(id);
  if (!dish) notFound();
  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <nav className="mb-3 text-sm text-ink-2">
        <Link href={`/restaurace/${dish.restaurant.slug}`} className="hover:underline">
          {dish.restaurant.name}
        </Link>
      </nav>
      <h1 className="font-display text-3xl font-semibold leading-tight">{dish.name}</h1>
      <p className="mb-6 text-ink-2">Jak ti chutnalo?</p>
      {HAS_SUPABASE ? (
        <ReviewForm dish={{ id: dish.id, slug: dish.slug, restaurant_id: dish.restaurant_id, restaurant_slug: dish.restaurant.slug }} />
      ) : (
        <p className="rounded-xl border border-line bg-paper-2 p-4 text-sm">
          Hodnocení zatím nejde uložit: aplikace běží bez databáze (chybí proměnné Supabase).
        </p>
      )}
    </div>
  );
}
