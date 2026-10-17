import path from "node:path";
import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: false,
  // the dev badge sat on top of the header pills
  devIndicators: false,
  // a lockfile higher up the disk must not be mistaken for this project's root
  outputFileTracingRoot: path.dirname(fileURLToPath(import.meta.url)),
  // each variant builds into its own directory so several dev servers can run
  distDir: process.env.DIST_DIR || ".next",
  async headers() {
    return [{
      // Font filenames contain their content hash, so repeat visits reuse them.
      source: "/fonts/:path*",
      headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
    }];
  },
  // one address: www sends people to the bare domain
  async redirects() {
    return [{
      source: "/:path*",
      has: [{ type: "host", value: "www.drdollyprasad.com" }],
      destination: "https://drdollyprasad.com/:path*",
      permanent: true,
    }];
  },
};
