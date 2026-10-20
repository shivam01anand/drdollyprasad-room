#!/usr/bin/env node
/**
 * npm run check:type (4-REVIEW1-DECISION 3.1, Guard 2). Type, colour and case are owned by
 * app/(site)/tokens.css. This counts font-size, font-family, letter-spacing and
 * text-transform:uppercase declarations in app/(site)/**.css outside tokens.css (@font-face
 * excepted), and fontSize in site TSX. The old files still hold many such declarations (now dead
 * under the layer), so this is a ratchet: it exits 1 if any count rises above
 * scripts/type-baseline.json. Delete dead rules, then run with --update to lower the baseline.
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const walk = (d, ext) => readdirSync(d).flatMap((f) => {
  const p = join(d, f);
  return statSync(p).isDirectory() ? walk(p, ext) : ext.some((e) => p.endsWith(e)) ? [p] : [];
});
const PROPS = { "font-size": /font-size\s*:/g, "font-family": /font-family\s*:/g, "letter-spacing": /letter-spacing\s*:/g, uppercase: /text-transform\s*:\s*uppercase/g };
const counts = {};
for (const f of walk("app/(site)", [".css"])) {
  if (f.endsWith("tokens.css")) continue;
  const css = readFileSync(f, "utf8").replace(/@font-face\s*{[^}]*}/g, "");
  counts[f] = Object.fromEntries(Object.entries(PROPS).map(([k, re]) => [k, (css.match(re) || []).length]));
}
for (const f of [...walk("app/(site)", [".tsx"]), ...walk("components/site", [".tsx"])]) {
  const n = (readFileSync(f, "utf8").match(/fontSize\s*:/g) || []).length;
  if (n) counts[f] = { fontSize: n };
}
const base = "scripts/type-baseline.json";
if (process.argv.includes("--update")) { writeFileSync(base, JSON.stringify(counts, null, 1) + "\n"); console.log("type baseline updated"); process.exit(0); }
let was = {};
try { was = JSON.parse(readFileSync(base, "utf8")); } catch { console.error("no baseline: run with --update"); process.exit(1); }
const up = [];
for (const [f, c] of Object.entries(counts)) for (const [k, n] of Object.entries(c)) {
  const b = was[f]?.[k] ?? 0;
  if (n > b) up.push(`${f}: ${k} ${b} -> ${n}`);
}
if (up.length) { console.error("Type set outside tokens.css (put it in tokens.css @layer final):\n  " + up.join("\n  ")); process.exit(1); }
console.log("check:type ok (no new type declarations outside tokens.css)");
