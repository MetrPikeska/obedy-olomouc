"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { reviewCreated } from "@/app/actions";
import { TURNSTILE_SITE_KEY } from "@/lib/config";
import { shrinkImage, supabaseBrowser } from "@/lib/supabase-browser";

type Props = { dish: { id: number; slug: string; restaurant_id: number; restaurant_slug: string } };

const NICK_KEY = "obedy-nickname";

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
    <form onSubmit={submit} className="space-y-6">
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Hodnocení</legend>
        <div className="flex gap-1" role="radiogroup" aria-label="Počet hvězdiček">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} z 5`}
              onClick={() => setRating(n)}
              className={`text-4xl leading-none transition ${n <= rating ? "text-mustard" : "text-line hover:text-mustard/60"}`}
            >
              ★
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <span className="mb-2 block text-sm font-medium">Fotka jídla</span>
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed border-line bg-white/60 p-4 text-sm text-ink-2 hover:border-ink-2">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Náhled fotky" className="max-h-64 rounded-lg object-contain" />
          ) : (
            <>
              <span className="text-3xl" aria-hidden>📷</span>
              <span>Vyfotit nebo vybrat fotku</span>
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

      <div className="grid grid-cols-2 gap-4">
        <label className="text-sm">
          <span className="mb-1 block font-medium">Zaplatil jsem (Kč)</span>
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            value={price}
            onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
            className="w-full rounded-lg border border-line bg-white px-3 py-2"
          />
        </label>
        <fieldset className="text-sm">
          <legend className="mb-1 font-medium">Porce</legend>
          <div className="flex overflow-hidden rounded-lg border border-line">
            {["malá", "akorát", "velká"].map((label, i) => (
              <button
                key={label}
                type="button"
                aria-pressed={portion === i + 1}
                onClick={() => setPortion(portion === i + 1 ? null : i + 1)}
                className={`flex-1 px-2 py-2 ${portion === i + 1 ? "bg-ink text-paper" : "bg-white"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">Komentář</span>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="Omáčka výborná, knedlíky trochu tvrdé…"
          className="w-full rounded-lg border border-line bg-white px-3 py-2"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">Přezdívka (nepovinné)</span>
        <input
          ref={nickRef}
          maxLength={32}
          className="w-full rounded-lg border border-line bg-white px-3 py-2"
        />
      </label>

      {needCaptcha && (
        <Turnstile siteKey={TURNSTILE_SITE_KEY} onSuccess={setCaptcha} options={{ language: "cs", size: "flexible" }} />
      )}

      {status === "error" && <p className="rounded-lg bg-tomato/10 p-3 text-sm text-tomato-2">{error}</p>}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-xl bg-tomato py-3 text-lg font-semibold text-paper disabled:opacity-40"
      >
        {status === "saving" ? "Ukládám…" : "Odeslat hodnocení"}
      </button>
      <p className="text-xs text-ink-2">
        Bez registrace: prohlížeč dostane anonymní účet. Jedno jídlo můžeš hodnotit jednou denně.
      </p>
    </form>
  );
}
