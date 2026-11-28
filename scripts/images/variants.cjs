/**
 * Lighter copies of every painting and exhibition photograph, for phones (elevate round, 26 Nov 2026).
 *
 * For each source JPEG it writes an AVIF copy at 800 px (where the photograph is wider) and at full width into public/i/ (Vercel build time, 27 Nov 2026: AVIF only; the JPEG is the fallback), next to a
 * manifest (lib/image-variants.json) that components/site/Pic.tsx reads to build <picture> + srcset.
 * The file name carries a hash of the SOURCE file, so /i/ can be cached for a year and a replaced
 * painting photograph still shows at once (its copies get new names).
 *
 * Presentation only: a copy is the whole picture, resized and re-encoded. Nothing is cropped,
 * retouched or recoloured (4:4:4 chroma so her reds keep their edge), and the source JPEGs are
 * never written to. Re-running is safe: copies that exist are kept, copies of sources that have
 * changed or gone are removed.
 *
 *   node scripts/images/variants.cjs
 */
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const root = path.join(__dirname, "..", "..");
const pub = path.join(root, "public");
const OUT = path.join(pub, "i");
// Vercel keeps .next/cache between builds, so copies made once are reused: only new or changed photographs are encoded.
const CACHE = path.join(root, ".next", "cache", "image-variants");

/** folder, the widths wanted below the full width */
const SETS = [
  { dir: "site/thumbs", widths: [800] },
  { dir: "site/ex", widths: [800] },
  // press clippings and television stills: small tiles on the home page, so full width only
  { dir: "site/press", widths: [] },
  { dir: "site/press/sm", widths: [] },
  { dir: "site/video", widths: [] },
  // the painting page shows the /art/large file where there is one, else the /art/works file: copies of that one only
  { dir: "art/large", widths: [800] },
  { dir: "art/works", widths: [800], unless: "art/large" },
];
// Checked by eye on her reds (Mannat, Threads of Faith) against the JPEG at 2x: no visible loss, and the mean
// colour of the picture moves by less than 0.4 of 255 per channel. AVIF below 55 began to soften the thread.
const AVIF = { quality: 60, effort: 4, chromaSubsampling: "4:4:4" };

(async () => {
  const manifest = {};
  const keep = new Set();
  let made = 0, bytes = { jpg: 0, avif: 0 };
  for (const { dir, widths, unless } of SETS) {
    const abs = path.join(pub, dir);
    for (const f of fs.readdirSync(abs).filter((f) => f.endsWith(".jpg")).sort()) {
      if (unless && fs.existsSync(path.join(pub, unless, f))) continue;
      const srcPath = path.join(abs, f);
      const buf = fs.readFileSync(srcPath);
      const hash = crypto.createHash("sha1").update(buf).digest("hex").slice(0, 8);
      const meta = await sharp(buf).metadata();
      // a copy is only worth having when it is clearly smaller than the next one up
      const ws = [...widths.filter((w) => w <= meta.width * 0.85), meta.width];
      manifest[`/${dir}/${f}`] = [hash, meta.width, meta.height, ws];
      bytes.jpg += buf.length;
      fs.mkdirSync(path.join(OUT, dir), { recursive: true });
      for (const w of ws) {
        for (const [ext, opt] of [["avif", AVIF]]) {
          const rel = path.join(dir, `${f.slice(0, -4)}.${hash}.${w}.${ext}`);
          const out = path.join(OUT, rel);
          keep.add(rel);
          const cached = path.join(CACHE, rel);
          if (!fs.existsSync(out)) {
            fs.mkdirSync(path.dirname(out), { recursive: true });
            if (fs.existsSync(cached)) fs.copyFileSync(cached, out);
            else {
              const img = sharp(buf).resize({ width: w, withoutEnlargement: true, kernel: "lanczos3" });
              fs.writeFileSync(out, await img.avif(opt).toBuffer());
              fs.mkdirSync(path.dirname(cached), { recursive: true });
              fs.copyFileSync(out, cached);
              made++;
            }
          }
          if (w === meta.width) bytes[ext] += fs.statSync(out).size;
        }
      }
    }
  }
  // copies whose source has changed or gone
  let gone = 0;
  const sweep = (d) => {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) sweep(p);
      else if (!keep.has(path.relative(OUT, p))) { fs.unlinkSync(p); gone++; }
    }
  };
  sweep(OUT);
  fs.writeFileSync(path.join(root, "lib/image-variants.json"), JSON.stringify(manifest) + "\n");
  const kb = (n) => `${Math.round(n / 1024)} KB`;
  console.log(`${Object.keys(manifest).length} photographs, ${made} copies written, ${gone} removed`);
  console.log(`full width, all files: JPEG ${kb(bytes.jpg)} · AVIF ${kb(bytes.avif)}`);
})();
