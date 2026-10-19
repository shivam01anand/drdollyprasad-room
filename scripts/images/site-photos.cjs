/**
 * Lighter photographs for the website (backlog sprint, 18 Oct 2026).
 *  - Exhibition photographs in public/site/ex: at most 1200 px on the long
 *    side, re-encoded (mozjpeg, q76). They are shown no wider than ~760 px.
 *  - 320 px copies in public/site/ex/sm for slideshow strips and small cards.
 *  - 280 px painting copies in public/site/thumbs/sm for the page-title bands.
 *  - lib/image-sizes.json regenerated, so every <img> reserves its space.
 * Paintings (public/art) are never touched here. Re-running is safe: photographs
 * already at 1200 px or less are left as they are.
 *
 *   node scripts/images/site-photos.cjs
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const root = path.join(__dirname, "..", "..");
const EX = path.join(root, "public/site/ex");
const SM = path.join(EX, "sm");

(async () => {
  fs.mkdirSync(SM, { recursive: true });
  let before = 0, after = 0;
  for (const f of fs.readdirSync(EX).filter((f) => f.endsWith(".jpg"))) {
    const p = path.join(EX, f);
    const src = fs.readFileSync(p);
    before += src.length;
    const sm = await sharp(src).rotate().resize({ width: 320, height: 320, fit: "inside" }).jpeg({ quality: 72, mozjpeg: true }).toBuffer();
    fs.writeFileSync(path.join(SM, f), sm);
    const meta = await sharp(src).metadata();
    // already done: never re-encode a JPEG twice
    if (Math.max(meta.width, meta.height) <= 1200) { after += src.length; continue; }
    const out = await sharp(src).rotate().resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 76, mozjpeg: true }).toBuffer();
    if (out.length < src.length) fs.writeFileSync(p, out);
    after += Math.min(out.length, src.length);
  }
  console.log(`exhibition photographs: ${Math.round(before / 1024)} KB -> ${Math.round(after / 1024)} KB`);

  // 280 px copies of the painting thumbnails, for the blurred bands behind page titles
  const TH = path.join(root, "public/site/thumbs"), TS = path.join(TH, "sm");
  fs.mkdirSync(TS, { recursive: true });
  for (const f of fs.readdirSync(TH).filter((f) => f.endsWith(".jpg"))) {
    const out = await sharp(path.join(TH, f)).resize({ width: 280, height: 280, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 70, mozjpeg: true }).toBuffer();
    fs.writeFileSync(path.join(TS, f), out);
  }

  const sizes = {};
  for (const dir of ["public/site/thumbs", "public/site/thumbs/sm", "public/site/ex", "public/site/ex/sm", "public/site/video"]) {
    const abs = path.join(root, dir);
    if (!fs.existsSync(abs)) continue;
    for (const f of fs.readdirSync(abs).filter((f) => f.endsWith(".jpg")).sort()) {
      const m = await sharp(path.join(abs, f)).metadata();
      sizes[`/${dir.replace(/^public\//, "")}/${f}`] = [m.width, m.height];
    }
  }
  fs.writeFileSync(path.join(root, "lib/image-sizes.json"), JSON.stringify(sizes));
  console.log(`image sizes: ${Object.keys(sizes).length} files`);
})();
