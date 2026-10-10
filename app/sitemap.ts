import type { MetadataRoute } from "next";
import { SITE, WORKS, workPath } from "@/lib/works";

/** the house, and every painting's own page, with its photograph */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE, changeFrequency: "monthly", priority: 1, images: [`${SITE}/og.jpg`] },
    ...WORKS.map((w) => ({
      url: `${SITE}${workPath(w.id)}`,
      changeFrequency: "yearly" as const,
      priority: 0.7,
      images: [`${SITE}/art/works/${w.id}.jpg`],
    })),
  ];
}
