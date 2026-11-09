"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { reviewCreated } from "@/app/actions";
import { TURNSTILE_SITE_KEY } from "@/lib/config";
import { shrinkImage, supabaseBrowser } from "@/lib/supabase-browser";

import { Icon, scoreTone } from "./sign";

type Props = { dish: { id: number; slug: string; restaurant_id: number; restaurant_slug: string } };

const NICK_KEY = "obedy-nickname";
const RATING_WORD = ["", "hrozné", "slabé", "ujde", "dobré", "výborné"];
const FIELD = "w-full border border-ink/40 bg-sheet px-3 py-2.5 text-base outline-none placeholder:text-ink-3 focus:border-ink";

export function ReviewForm({ dish }: Props) {
  const router = useRouter();
  const sb = supabaseBrowser();
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [price, setPrice] = useState("");
  const [portion, setPortion] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const nickRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => setHasSession(Boolean(data.session)));
    try {
      if (nickRef.current) nickRef.current.value = localStorage.getItem(NICK_KEY) ?? "";
    } catch {}
  }, [sb]);

  function pickFile(f: File | null) {
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  const needCaptcha = hasSession === false && Boolean(TURNSTILE_SITE_KEY);
  const canSubmit = rating > 0 && status !== "saving" && (!needCaptcha || captcha);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus("saving");
    setError("");
    try {
      // 1) anonymous session on first review
      let { data: s } = await sb.auth.getSession();
      if (!s.session) {
        const { error: authErr } = await sb.auth.signInAnonymously({
          options: captcha ? { captchaToken: captcha } : undefined,
        });
        if (authErr) throw authErr;
        s = (await sb.auth.getSession()).data;
      }
      const uid = s.session!.user.id;

      // 2) nickname
      const nick = (nickRef.current?.value ?? "").trim();
      if (nick.length >= 2) {
        try {
          localStorage.setItem(NICK_KEY, nick);
        } catch {}
        await sb.from("profiles").update({ nickname: nick.slice(0, 32) }).eq("id", uid);
      }

      // 3) review
      const { data: review, error: revErr } = await sb
        .from("reviews")
        .insert({
          dish_id: dish.id,
          restaurant_id: dish.restaurant_id,
          rating,
          price_paid: price ? Number(price) : null,
          portion,
          comment: comment.trim() || null,
        })
        .select("id")
        .single();
      if (revErr) {
        if (revErr.code === "23505") throw new Error("Tohle jídlo jsi dnes už hodnotil.");
        throw revErr;
      }

      // 4) photo
      if (file) {
        const img = await shrinkImage(file);
        const ext = img.type === "image/webp" ? "webp" : "jpg";
        const path = `${uid}/${review.id}-${Date.now()}.${ext}`;
        const { error: upErr } = await sb.storage.from("photos").upload(path, img.blob, {
          contentType: img.type,
          cacheControl: "31536000",
        });
        if (upErr) throw upErr;
        const { error: phErr } = await sb
          .from("photos")
          .insert({ review_id: review.id, path, width: img.width, height: img.height });
        if (phErr) throw phErr;
      }

      await reviewCreated(dish.restaurant_id, dish.restaurant_slug, dish.slug);
      router.push(`/jidlo/${dish.slug}`);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Něco se pokazilo, zkus to znovu.");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-7">
      <fieldset>
        <legend className="mb-2 font-sign text-xl font-bold">
          Hodnocení{rating > 0 && <span className="font-semibold text-ink-2">: {RATING_WORD[rating]}</span>}
        </legend>
        <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label="Hodnocení od 1 do 5, 5 je nejlepší">
          {[1, 2, 3, 4, 5].map((n) => {
            const on = n <= rating;
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} z 5, ${RATING_WORD[n]}`}
                onClick={() => setRating(n)}
                className={`flex h-16 flex-col items-center justify-center font-sign text-3xl font-bold leading-none tnum transition-colors duration-150 ${
                  on ? `${scoreTone(rating)} text-sheet` : "border-2 border-ink/25 bg-sheet text-ink-2 hover:border-ink"
                }`}
              >
                {n}
              </button>
            );
          })}
        </div>
        <div className="mt-1.5 flex justify-between text-xs text-ink-3">
          <span>1 hrozné</span>
          <span>5 výborné</span>
        </div>
      </fieldset>

      <div>
        <span className="mb-2 block font-sign text-xl font-bold">Fotka jídla</span>
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed border-ink/35 bg-sheet p-5 text-ink-2 hover:border-ink">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Náhled fotky" className="max-h-72 object-contain" />
          ) : (
            <>
              <span className="grid size-12 place-items-center bg-ink text-sheet">
                <Icon name="camera" className="size-6" />
              </span>
              <span className="font-semibold text-ink">Vyfotit nebo vybrat fotku</span>
              <span className="text-sm">nepovinné, zmenší se v telefonu</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label>
          <span className="mb-1.5 block font-semibold">Zaplatil jsem (Kč)</span>
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            value={price}
            onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
            className={`${FIELD} tnum`}
          />
        </label>
        <fieldset>
          <legend className="mb-1.5 font-semibold">Porce</legend>
          <div className="grid grid-cols-3 gap-px border border-ink/40 bg-ink/40">
            {["malá", "akorát", "velká"].map((label, i) => (
              <button
                key={label}
                type="button"
                aria-pressed={portion === i + 1}
                onClick={() => setPortion(portion === i + 1 ? null : i + 1)}
                className={`px-2 py-2.5 font-semibold ${portion === i + 1 ? "bg-ink text-sheet" : "bg-sheet hover:bg-frame"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <label className="block">
        <span className="mb-1.5 block font-semibold">Komentář</span>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="Omáčka výborná, knedlíky trochu tvrdé…"
          className={FIELD}
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block font-semibold">
          Přezdívka <span className="font-normal text-ink-3">(nepovinné)</span>
        </span>
        <input ref={nickRef} maxLength={32} className={FIELD} />
      </label>

      {needCaptcha && (
        <Turnstile siteKey={TURNSTILE_SITE_KEY} onSuccess={setCaptcha} options={{ language: "cs", size: "flexible" }} />
      )}

      {status === "error" && (
        <p role="alert" className="border-2 border-route bg-sheet p-3 font-semibold text-route-ink">
          {error}
        </p>
      )}

      <div>
        <button
          type="submit"
          disabled={!canSubmit}
          className="flex w-full items-center justify-between gap-4 bg-ink py-2 pr-2 pl-5 font-sign text-2xl font-bold text-sheet hover:bg-[#2a2c30] disabled:cursor-not-allowed disabled:bg-ink/35"
        >
          {status === "saving" ? "Ukládám…" : "Odeslat hodnocení"}
          <span className={`grid size-11 place-items-center ${canSubmit ? "bg-led text-ink" : "bg-sheet/25 text-sheet"}`}>
            <Icon name="arrow-right" className="size-6" />
          </span>
        </button>
        {!canSubmit && status !== "saving" && (
          <p className="mt-2 text-sm font-semibold text-ink">
            {rating === 0 ? "Chybí hodnocení: vyber číslo 1 až 5." : "Počkej na ověření, že nejsi robot."}
          </p>
        )}
        <p className="mt-2 text-sm text-ink-2">
          Bez registrace: prohlížeč dostane anonymní účet. Jedno jídlo můžeš hodnotit jednou denně.
        </p>
      </div>
    </form>
  );
}
