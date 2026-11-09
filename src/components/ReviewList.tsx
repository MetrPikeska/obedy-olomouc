import Link from "next/link";

import { photoUrl } from "@/lib/config";
import type { Review } from "@/lib/types";

import { Score } from "./sign";

const PORTION = ["", "malá porce", "akorát", "velká porce"];

export function ReviewList({ reviews, showDish = false }: { reviews: Review[]; showDish?: boolean }) {
  if (reviews.length === 0) {
    return <p className="border-t-2 border-ink bg-sheet px-5 py-4 text-ink-2">Zatím nikdo nehodnotil. Buď první, kdo napíše, jak to chutnalo.</p>;
  }
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {reviews.map((r) => (
        <li key={r.id} className="bg-sheet shadow-[0_1px_2px_rgb(0_0_0/0.12),0_4px_16px_rgb(0_0_0/0.05)]">
          {r.photos[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl(r.photos[0])}
              alt={r.dish_name ? `Fotka: ${r.dish_name}` : "Fotka jídla"}
              loading="lazy"
              className="aspect-[4/3] w-full object-cover"
            />
          )}
          <div className="space-y-2 p-4">
            {showDish && r.dish_slug && (
              <Link href={`/jidlo/${r.dish_slug}`} className="block font-sign text-lg font-bold leading-tight hover:underline">
                {r.dish_name}
              </Link>
            )}
            <div className="flex items-center gap-3 text-sm text-ink-2">
              <Score value={r.rating} />
              <span className="font-semibold text-ink">{r.nickname ?? "anonym"}</span>
              <span className="tnum">{new Date(r.review_date).toLocaleDateString("cs-CZ")}</span>
            </div>
            {(r.price_paid || r.portion) && (
              <p className="text-sm text-ink-2">
                {[r.price_paid ? `${r.price_paid} Kč` : null, r.portion ? PORTION[r.portion] : null].filter(Boolean).join(" · ")}
              </p>
            )}
            {r.comment && <p className="leading-relaxed">{r.comment}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}
