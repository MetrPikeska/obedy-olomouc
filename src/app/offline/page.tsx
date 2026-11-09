import Link from "next/link";

export const metadata = { title: "Offline", robots: { index: false } };

export default function Offline() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <div className="board mx-auto mb-6 w-fit px-5 py-3"><span className="led text-2xl font-bold uppercase">Mimo provoz</span></div>
      <h1 className="font-sign text-4xl font-bold">Jsi offline</h1>
      <p className="mt-2 text-ink-2">
        Stránky, které jsi už otevřel, fungují i bez připojení. Hodnocení a fotky odešleš, až budeš zase online.
      </p>
      <Link href="/" className="mt-6 inline-block bg-ink px-5 py-2.5 font-semibold text-sheet">
        Zpět na mapu
      </Link>
    </div>
  );
}
