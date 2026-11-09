import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "O projektu",
  description: "Jak vznikají data aplikace Obědy Olomouc: OpenStreetMap, menicka.cz a hodnocení strávníků.",
  alternates: { canonical: "/o-projektu" },
};

export default function About() {
  return (
    <article className="mx-auto max-w-2xl space-y-4 px-4 py-8 leading-relaxed">
      <h1 className="font-display text-4xl font-semibold">O projektu</h1>
      <p>
        Obědy Olomouc je semestrální projekt předmětu KGI/ACART na Univerzitě Palackého. Autoři: Hrbáček, Koutník,
        Tobola, Lípová, Mikeska.
      </p>
      <h2 className="font-display text-2xl font-semibold">Odkud jsou data</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          Podniky (restaurace, kavárny, bistra, hospody v hranicích obce Olomouc) pocházejí z OpenStreetMap,
          © přispěvatelé OSM, licence ODbL.
        </li>
        <li>Polední menu se jednou denně přebírá z veřejného výpisu menicka.cz a páruje se na podniky z OSM.</li>
        <li>Hodnocení a fotky jídel přidávají uživatelé bez registrace, přes anonymní účet v prohlížeči.</li>
      </ul>
      <h2 className="font-display text-2xl font-semibold">Co přijde</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Vyfocení tabule s menu a převod na text (OCR přes vision model).</li>
        <li>Automatické štítky jídla z fotky.</li>
        <li>Izochrona „kam stihnu za pauzu“: dosah 5, 10 a 15 minut pěšky.</li>
        <li>Doporučení podle tvých hodnocení a polohy.</li>
      </ul>
    </article>
  );
}
