import type { MetadataRoute } from "next";
import { SITE, WORKS, workPath } from "@/lib/works";
import { SERIES_PAGES } from "@/lib/site";

/** the website's pages, the series stories, every painting's own page with its photograph, and the studio */
export default function sitemap(): MetadataRoute.Sitemap {
  const page = (path: string, priority: number, changeFrequency: "monthly" | "yearly" = "monthly") =>
    ({ url: `${SITE}${path}`, priority, changeFrequency });
  return [
    { ...page("", 1), images: [`${SITE}/og.jpg`] },
    page("/works", 0.9),
    page("/series", 0.8),
    ...SERIES_PAGES.map((s) => ({ ...page(`/series/${s.slug}`, 0.8), images: [`${SITE}/art/works/${s.hero}.jpg`] })),
    page("/exhibitions", 0.7),
    page("/about", 0.7),
    page("/enquire", 0.5, "yearly"),
    page("/studio", 0.6),
    ...WORKS.map((w) => ({
      url: `${SITE}${workPath(w.id)}`,
      changeFrequency: "yearly" as const,
      priority: 0.7,
      images: [`${SITE}/art/works/${w.id}.jpg`],
    })),
  ];
}
