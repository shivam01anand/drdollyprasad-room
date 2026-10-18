import fs from "node:fs";
import path from "node:path";
import Studio from "@/components/Studio";
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

export default function Page() {
  const dims = readDims();
  return (
    <>
      {WELCOME_FONTS.filter((href) => href.includes("cormorant") || href.includes("devanagari"))
        .map((href) => <link key={href} rel="preload" as="font" type="font/woff2" href={href} crossOrigin="anonymous" />)}
      <link rel="preload" as="image" href="/art/large/woman-with-poppies.jpg" />
      <link rel="preload" as="fetch" href="/house/house.json" crossOrigin="anonymous" />
      <link rel="preload" as="fetch" href="/house/house.glb" crossOrigin="anonymous" fetchPriority="low" />
      <Studio dims={dims} />
      <Works dims={dims} />
      <Contact />
      {/* who she is, for a search engine: the painter, where she works, where else she is */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(PERSON) }} />
    </>
  );
}
