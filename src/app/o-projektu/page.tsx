import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "O projektu",
  description: "Jak vznikají data aplikace Obědy Olomouc: OpenStreetMap, menicka.cz a hodnocení strávníků.",
  alternates: { canonical: "/o-projektu" },
};

export default function About() {
  return (
    <article className="mx-auto my-6 max-w-2xl space-y-4 bg-sheet px-5 py-8 text-[1.05rem] leading-relaxed shadow-[0_1px_2px_rgb(0_0_0/0.12),0_6px_24px_rgb(0_0_0/0.06)] md:px-10">
      <h1 className="font-sign text-5xl font-bold leading-none">O projektu</h1>
      <p>
        Obědy Olomouc je semestrální projekt předmětu KGI/ACART na Univerzitě Palackého. Autoři: Hrbáček, Koutník,
        Tobola, Lípová, Mikeska.
      </p>
      <h2 className="!mt-8 border-t-2 border-ink pt-3 font-sign text-2xl font-bold">Odkud jsou data</h2>
      <ul className="list-[square] marker:text-route space-y-1 pl-5">
        <li>
          Podniky (restaurace, kavárny, bistra, hospody v hranicích obce Olomouc) pocházejí z OpenStreetMap,
          © přispěvatelé OSM, licence ODbL.
        </li>
        <li>Polední menu se jednou denně přebírá z veřejného výpisu menicka.cz a páruje se na podniky z OSM.</li>
        <li>Hodnocení a fotky jídel přidávají uživatelé bez registrace, přes anonymní účet v prohlížeči.</li>
      </ul>
      <h2 className="!mt-8 border-t-2 border-ink pt-3 font-sign text-2xl font-bold">Co přijde</h2>
      <ul className="list-[square] marker:text-route space-y-1 pl-5">
        <li>Vyfocení tabule s menu a převod na text (OCR přes vision model).</li>
        <li>Automatické štítky jídla z fotky.</li>
        <li>Izochrona „kam stihnu za pauzu“: dosah 5, 10 a 15 minut pěšky.</li>
        <li>Doporučení podle tvých hodnocení a polohy.</li>
      </ul>
    </article>
  );
}
