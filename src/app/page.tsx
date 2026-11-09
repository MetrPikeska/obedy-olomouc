import { Explorer } from "@/components/Explorer";
import { SITE_NAME, SITE_URL } from "@/lib/config";
import { getPins } from "@/lib/data";

export default async function Home() {
  const pins = await getPins();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "cs",
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Explorer pins={pins} />
    </>
  );
}
