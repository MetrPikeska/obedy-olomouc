import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import Link from "next/link";

import { InstallPrompt, RegisterSW } from "@/components/pwa";
import { SITE_NAME, SITE_URL } from "@/lib/config";

import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME}: denní menu a hodnocení jídel`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Polední menu olomouckých restaurací na mapě. Hodnocení a fotky konkrétních jídel od lidí, kteří je dnes jedli.",
  applicationName: SITE_NAME,
  appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: "default" },
  openGraph: { type: "website", locale: "cs_CZ", siteName: SITE_NAME },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#c8412b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="cs" className={`${inter.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <header className="sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
            <Link href="/" className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/icon-192.png" alt="" width={32} height={32} className="size-8" />
              <span className="font-display text-xl font-semibold tracking-tight">Obědy Olomouc</span>
            </Link>
            <nav className="ml-auto flex items-center gap-4 text-sm text-ink-2">
              <Link href="/" className="hover:text-ink">Mapa</Link>
              <Link href="/o-projektu" className="hover:text-ink">O projektu</Link>
              <InstallPrompt />
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-line text-xs text-ink-2">
          <div className="mx-auto max-w-6xl px-4 py-4 flex flex-wrap gap-x-4 gap-y-1">
            <span>Semestrální projekt KGI/ACART, UP Olomouc 2026</span>
            <span>
              Podniky ©{" "}
              <a className="underline" href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>{" "}
              přispěvatelé (ODbL)
            </span>
            <span>
              Denní menu: <a className="underline" href="https://www.menicka.cz/olomouc.html">menicka.cz</a>
            </span>
          </div>
        </footer>
        <RegisterSW />
      </body>
    </html>
  );
}
