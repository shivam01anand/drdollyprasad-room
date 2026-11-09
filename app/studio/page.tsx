import fs from "node:fs";
import path from "node:path";
import PhotoStudio from "@/components/PhotoStudio";
import { EMAIL, INSTAGRAM, SITE } from "@/lib/works";
import { WALLS } from "@/lib/studio-walls";

type Dims = Record<string, { w: number; h: number }>;

/** image sizes come from the manifest, so the lightbox reserves each painting's box */
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

/** the studio as photographs (Shubham, 8 Nov 2026); the 3D house is kept at /studio/house */
export default function Page() {
  const dims = readDims();
  return (
    <>
      <link rel="preload" as="image" href="/art/large/woman-with-poppies.jpg" />
      {WALLS[0] && <link rel="prefetch" as="image" href={`${WALLS[0].image}-1600.webp`} />}
      <PhotoStudio dims={dims} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(PERSON) }} />
    </>
  );
}
