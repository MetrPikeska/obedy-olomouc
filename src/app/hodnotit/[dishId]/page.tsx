import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ReviewForm } from "@/components/ReviewForm";
import { Icon } from "@/components/sign";
import { HAS_SUPABASE } from "@/lib/config";
import { getDishById } from "@/lib/data";

export const metadata: Metadata = {
  title: "Ohodnotit jídlo",
  robots: { index: false, follow: false },
};

export default function RatePage(props: PageProps<"/hodnotit/[dishId]">) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-xl px-4 py-10 font-sign text-2xl font-bold text-ink-2">Načítám…</div>}>
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
    <div className="mx-auto max-w-xl px-4 pt-5 pb-14">
      <nav className="mb-4 text-sm font-medium">
        <Link href={`/restaurace/${dish.restaurant.slug}`} className="inline-flex items-center gap-1.5 text-ink-2 hover:text-ink">
          <Icon name="arrow-left" className="size-4" /> {dish.restaurant.name}
        </Link>
      </nav>
      <div className="border-t-4 border-ink bg-sheet shadow-[0_1px_2px_rgb(0_0_0/0.12),0_6px_24px_rgb(0_0_0/0.06)]">
        <div className="p-5">
          <h1 className="font-sign text-[2rem] font-bold leading-[1.02] text-balance">{dish.name}</h1>
          <p className="mt-1 mb-6 text-ink-2">Jak ti chutnalo?</p>
          {HAS_SUPABASE ? (
            <ReviewForm dish={{ id: dish.id, slug: dish.slug, restaurant_id: dish.restaurant_id, restaurant_slug: dish.restaurant.slug }} />
          ) : (
            <p className="border-2 border-dashed border-rule p-4">
              Hodnocení zatím nejde uložit: aplikace běží bez databáze (chybí proměnné Supabase).
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
