import fs from "node:fs";
import path from "node:path";
import Studio from "@/components/Studio";
import { welcomeScript } from "@/lib/welcome";
import Works, { Contact } from "@/components/Works";
import { EMAIL, INSTAGRAM, SITE } from "@/lib/works";
import WELCOME_FONTS from "@/lib/welcome-fonts.json";

type Dims = Record<string, { w: number; h: number }>;

/** image sizes come from the manifest, so every image reserves its box */
function readDims(): Dims {
  const file = path.join(process.cwd(), "public/art/manifest.json");
  const { works } = JSON.parse(fs.readFileSync(file, "utf8")) as { works: { id: string; w: number; h: number }[] };
  return Object.fromEntries(works.map((w) => [w.id, { w: w.w, h: w.h }]));
}

const PERSON = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Dr Dolly Prasad",
  honorificPrefix: "Dr",
  jobTitle: "Painter",
  url: SITE,
  image: `${SITE}/og.jpg`,
  email: `mailto:${EMAIL}`,
  address: { "@type": "PostalAddress", addressLocality: "New Delhi", addressCountry: "IN" },
  sameAs: [INSTAGRAM.url, "https://drdollyprasad.wordpress.com"],
};

/** the studio's files carry a hash of their content (next.config), so they cache for a year */
const V = process.env.NEXT_PUBLIC_ASSET_V ?? "";
const versioned = (url: string) => V ? `${url}?v=${V}` : url;

export default function Page() {
  const dims = readDims();
  return (
    <>
      {WELCOME_FONTS.filter((href) => href.includes("cormorant") || href.includes("devanagari"))
        .map((href) => <link key={href} rel="preload" as="font" type="font/woff2" href={href} crossOrigin="anonymous" />)}
      {/* the house's plan and model are the longest part of the way in: asked for with the page */}
      <link rel="preload" as="fetch" href={versioned("/house/house.json")} crossOrigin="anonymous" />
      <link rel="preload" as="fetch" href={versioned("/house/house.glb")} crossOrigin="anonymous" />
      <Studio dims={dims} />
      {/* the welcome's painting for this visit, chosen before anything is fetched (components/Preloader) */}
      <script dangerouslySetInnerHTML={{ __html: welcomeScript(V) }} />
      <Works dims={dims} />
      <Contact />
      {/* who she is, for a search engine: the painter, where she works, where else she is */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(PERSON) }} />
    </>
  );
}
