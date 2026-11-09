import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed, Doto } from "next/font/google";
import Link from "next/link";

import { InstallPrompt, RegisterSW } from "@/components/pwa";
import { SITE_NAME, SITE_URL } from "@/lib/config";

import "./globals.css";

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});
const barlowCond = Barlow_Condensed({
  variable: "--font-barlow-cond",
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700", "800"],
});
const doto = Doto({ variable: "--font-doto", subsets: ["latin", "latin-ext"], axes: ["ROND"] });

const CONTRACT = `
THESIS: Lunch as a departure. Every place is a destination with walking minutes, today's menu is the noon timetable. Refuses the delivery-app photo card feed and the cream bistro menu.
OWN-WORLD: Olomouc tram stop at noon. Dark LED board, amber Doto dot matrix, white printed timetable sheet, black Barlow Condensed sign lettering, hairline rules, red route mark = menu today, square pictogram insets, no rounded cards.
STORY: The visitor sees what serves lunch today and how far it is, opens a place, reads the menu like a timetable, rates the dish they ate.
FIRST VIEWPORT: Mobile: LED board "Dnes v poledne" with nearest places, minutes and price, map below, timetable list after. Desktop: board + list left 440px, map right full height.
FORM: Stop departure board + printed timetable, candidate 5 of 7, seed bad8eca8.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME}: denní menu a hodnocení jídel`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Polední menu olomouckých restaurací na mapě. Hodnocení a fotky konkrétních jídel od lidí, kteří je dnes jedli.",
  applicationName: SITE_NAME,
  appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: "black" },
  openGraph: { type: "website", locale: "cs_CZ", siteName: SITE_NAME },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#121315",
  width: "device-width",
  initialScale: 1,
};

/** Brand mark: the app icon, a small LED board showing noon over the red route bar. */
function Mark() {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/icons/icon-192.png" alt="" width={36} height={36} className="size-9" />;
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="cs" className={`${barlow.variable} ${barlowCond.variable} ${doto.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <div hidden dangerouslySetInnerHTML={{ __html: `<!--${CONTRACT}-->` }} />
        <header className="sticky top-0 z-30 h-14 bg-sheet shadow-[0_1px_0_var(--ink),0_2px_10px_rgb(0_0_0/0.08)]">
          <div className="mx-auto flex h-full max-w-[1600px] items-center gap-3 px-4">
            <Link href="/" className="flex items-center gap-2.5" aria-label="Obědy Olomouc, na mapu">
              <Mark />
              <span className="font-sign text-[1.375rem] leading-none">
                <span className="font-bold">Obědy</span> <span className="font-semibold text-ink-2">Olomouc</span>
              </span>
            </Link>
            <nav className="ml-auto flex items-center gap-1 text-[0.95rem] font-medium">
              <Link href="/" className="hidden px-2.5 py-2 hover:bg-frame sm:block">Mapa</Link>
              <Link href="/o-projektu" className="px-2.5 py-2 hover:bg-frame">O projektu</Link>
              <InstallPrompt />
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="bg-board text-[0.8rem] text-[#b9bec6]">
          <div className="mx-auto flex max-w-[1600px] flex-wrap gap-x-6 gap-y-1 px-4 py-4">
            <span>Semestrální projekt KGI/ACART, UP Olomouc 2026</span>
            <span>
              Podniky ©{" "}
              <a className="underline hover:text-led" href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>{" "}
              přispěvatelé (ODbL)
            </span>
            <span>
              Denní menu:{" "}
              <a className="underline hover:text-led" href="https://www.menicka.cz/olomouc.html">menicka.cz</a>
            </span>
          </div>
        </footer>
        <RegisterSW />
      </body>
    </html>
  );
}
