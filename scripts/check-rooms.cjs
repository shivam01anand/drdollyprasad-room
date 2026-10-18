// Fails if a hallway manifest entry has no image, a work id is unknown, or an id repeats.
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const { rooms } = require("../lib/hallway-rooms.json");
const works = fs.readFileSync(path.join(root, "lib/works.ts"), "utf8");
let bad = 0; const seen = new Set();
for (const r of rooms) {
  const f = path.join(root, "public/art/rooms", `hallway-${r.id}.webp`);
  if (!fs.existsSync(f)) { console.error(`missing image: ${f}`); bad++; }
  if (!works.includes(`"${r.work}"`)) { console.error(`unknown work id: ${r.work}`); bad++; }
  if (seen.has(r.id)) { console.error(`duplicate id: ${r.id}`); bad++; } seen.add(r.id);
}
console.log(bad ? `${bad} problem(s)` : `${rooms.length} hallway rooms OK`); process.exit(bad ? 1 : 0);
