import Link from "next/link";

export const metadata = { title: "Offline", robots: { index: false } };

export default function Offline() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="font-display text-3xl font-semibold">Jsi offline</h1>
      <p className="mt-2 text-ink-2">
        Stránky, které jsi už otevřel, fungují i bez připojení. Hodnocení a fotky odešleš, až budeš zase online.
      </p>
      <Link href="/" className="mt-6 inline-block rounded-lg bg-tomato px-4 py-2 text-paper">
        Zpět na mapu
      </Link>
    </div>
  );
}
