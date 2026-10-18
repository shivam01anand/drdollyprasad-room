import type { MetadataRoute } from "next";
import { SITE } from "@/lib/works";

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: "/analytics" }, sitemap: `${SITE}/sitemap.xml` };
}
