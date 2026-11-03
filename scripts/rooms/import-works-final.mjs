#!/usr/bin/env node
// Re-imports the ChatGPT photoreal room images (WORKS-FINAL/16x9) into the site.
// Usage: node scripts/rooms/import-works-final.mjs [WORKS-FINAL dir]
// Default dir: the staged copy under /mnt/user-data/uploads. Stage fresh files first with
// device_stage_files (16x9/*.jpg + MANIFEST.json), or point at a local copy of the folder.
// Writes public/art/rooms-v2/<slug>-1600.webp and -2400.webp and lib/rooms-v2.json.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { execFileSync } from "node:child_process";
import os from "node:os";

const SRC = process.argv[2] || "/mnt/user-data/uploads/Mummy Artwork/Team Handoffs/021-studio-plants/outputs/WORKS-FINAL";
const OUT = path.resolve("public/art/rooms-v2");
const JSON_OUT = path.resolve("lib/rooms-v2.json");
// room setting codes in the manifest -> the caption name (no em dashes)
const ROOM = {
  "01-delhi": "A drawing room in Delhi", "01-delhi-kajal": "A drawing room in Delhi",
  "02-verandah": "A verandah", "03-apartment": "An apartment living room", "03-apartment-khadi": "An apartment living room",
  "04-reading": "A reading room", "04-reading-kajal": "A reading room", "05-dining": "A dining room", "05-dining-khadi": "A dining room",
  "S1-console": "A living room", "S2-reading": "A reading room", "S3-cluster": "A living room",
};
const manifest = JSON.parse(fs.readFileSync(path.join(SRC, "MANIFEST.json"), "utf8"));
fs.mkdirSync(OUT, { recursive: true });
// the manifest rectangles lag behind the images, so find each painting in its photo by template matching
const locFile = path.join(os.tmpdir(), "rooms-v2-locate.json");
execFileSync("python3", ["-I", path.resolve("scripts/rooms/locate-art.py"), SRC, locFile], { stdio: ["ignore", "ignore", "inherit"] });
const found = JSON.parse(fs.readFileSync(locFile, "utf8"));
const out = {};
for (const e of manifest) {
  const f = path.join(SRC, "16x9", `${e.slug}.jpg`);
  if (!fs.existsSync(f)) { console.warn("missing", e.slug); continue; }
  const [W, H] = e.output_size_px || [2400, 1350];
  for (const w of [1600, 2400]) {
    await sharp(f).resize({ width: w, withoutEnlargement: true }).webp({ quality: 82 }).toFile(path.join(OUT, `${e.slug}-${w}.webp`));
  }
  const g = e.group_rectangle_px; const r = e.painting_rectangle_px || (Array.isArray(g) ? { x: g[0], y: g[1], w: g[2], h: g[3] } : g);
  const pct = (v, t) => Math.round((v / t) * 1000) / 10;
  const f2 = found[e.slug];
  const art = f2 && f2.score >= 0.8 ? { x: f2.x, y: f2.y, w: f2.w, h: f2.h } : { x: pct(r.x, W), y: pct(r.y, H), w: pct(r.w, W), h: pct(r.h, H) };
  out[e.slug] = {
    room: ROOM[e.room_setting_used] || "A room",
    w: 1600, h: Math.round(1600 * H / W),
    files: { "1600": `/art/rooms-v2/${e.slug}-1600.webp`, "2400": `/art/rooms-v2/${e.slug}-2400.webp` },
    art,
  };
}
fs.writeFileSync(JSON_OUT, JSON.stringify(out, null, 1) + "\n");
console.log(`imported ${Object.keys(out).length} works`);
