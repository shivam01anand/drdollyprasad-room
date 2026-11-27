import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));

/** One hash of the studio's files (the house, its surfaces, the paintings it hangs). Their addresses
 *  carry it (lib/room/house.ts assetUrl), so they can be cached for a year and still change on a deploy. */
function assetVersion() {
  const h = crypto.createHash("sha1");
  for (const dir of ["public/house", "public/tex", "public/art/room", "public/art/welcome"]) {
    const walk = (d) => {
      if (!fs.existsSync(d)) return;
      for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
        const f = path.join(d, e.name);
        if (e.isDirectory()) walk(f);
        else { h.update(path.relative(ROOT, f)); h.update(fs.readFileSync(f)); }
      }
    };
    walk(path.join(ROOT, dir));
  }
  return h.digest("hex").slice(0, 10);
}
const ASSET_V = assetVersion();
const YEAR = "public, max-age=31536000, immutable";

/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: false,
  // the dev badge sat on top of the header pills
  devIndicators: false,
  // a lockfile higher up the disk must not be mistaken for this project's root
  outputFileTracingRoot: ROOT,
  env: { NEXT_PUBLIC_ASSET_V: ASSET_V },
  // each variant builds into its own directory so several dev servers can run
  distDir: process.env.DIST_DIR || ".next",
  async headers() {
    return [{
      source: "/analytics/:path*",
      headers: [
        { key: "Cache-Control", value: "private, no-store" },
        { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        { key: "Referrer-Policy", value: "same-origin" },
        { key: "X-Frame-Options", value: "DENY" },
      ],
    }, {
      // Font filenames contain their content hash, so repeat visits reuse them.
      source: "/fonts/:path*",
      headers: [{ key: "Cache-Control", value: YEAR }],
    },
    // the studio's own files: versioned by ASSET_V, so a year and immutable
    ...["/house/:path*", "/tex/:path*", "/art/room/:path*", "/art/welcome/:path*"].map((source) => ({
      source, headers: [{ key: "Cache-Control", value: YEAR }],
    })),
    // the lighter copies of her photographs (scripts/images/variants.cjs): the name carries a hash of the source, so a year and immutable
    { source: "/i/:path*", headers: [{ key: "Cache-Control", value: YEAR }] },
    // her other photographs and the decoders keep their plain names: a day fresh, then revalidated in the background
    // (the website's own pictures in /site and the share cards in /og joined this rule on 26 Nov 2026; they were re-checked on every visit)
    ...["/site/:path*", "/og/:path*", "/og.jpg", "/art/large/:path*", "/art/works/:path*", "/art/xl/:path*", "/art/rooms/:path*", "/art/figure/:path*", "/draco/:path*"].map((source) => ({
      source, headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
    }))];
  },
  // one address: www sends people to the bare domain
  async redirects() {
    return [
      // the newest collection was renamed Bahaar (18 Nov 2026); old addresses still land
      { source: "/series/recent-work", destination: "/series/bahaar", permanent: true },
      { source: "/series/onset-of-spring", destination: "/series/bahaar", permanent: true },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.drdollyprasad.com" }],
        destination: "https://drdollyprasad.com/:path*",
        permanent: true,
      },
    ];
  },
};
