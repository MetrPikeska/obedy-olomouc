import Link from "next/link";

import { photoUrl } from "@/lib/config";
import type { Review } from "@/lib/types";

import { Stars } from "./Stars";

const PORTION = ["", "malá porce", "akorát", "velká porce"];

export function ReviewList({ reviews, showDish = false }: { reviews: Review[]; showDish?: boolean }) {
  if (reviews.length === 0) {
    return <p className="text-ink-2">Zatím nikdo nehodnotil. Buď první, kdo napíše, jak to chutnalo.</p>;
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {reviews.map((r) => (
        <li key={r.id} className="overflow-hidden rounded-2xl border border-line bg-white/60">
          {r.photos[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl(r.photos[0])}
              alt={r.dish_name ? `Fotka: ${r.dish_name}` : "Fotka jídla"}
              loading="lazy"
              className="aspect-[4/3] w-full object-cover"
            />
          )}
          <div className="space-y-1 p-3">
            {showDish && r.dish_slug && (
              <Link href={`/jidlo/${r.dish_slug}`} className="block font-medium hover:underline">
                {r.dish_name}
              </Link>
            )}
            <div className="flex items-center gap-2 text-xs text-ink-2">
              <Stars value={r.rating} />
              <span>{r.nickname ?? "anonym"}</span>
              <span>· {new Date(r.review_date).toLocaleDateString("cs-CZ")}</span>
            </div>
            {(r.price_paid || r.portion) && (
              <p className="text-xs text-ink-2">
                {[r.price_paid ? `${r.price_paid} Kč` : null, r.portion ? PORTION[r.portion] : null].filter(Boolean).join(" · ")}
              </p>
            )}
            {r.comment && <p className="text-sm">{r.comment}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}
