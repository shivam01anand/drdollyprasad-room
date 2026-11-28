import { RECORD, SACRED_FRAGMENTS, SHOWS } from "@/lib/site";

/** the key shows lead the About page with their photographs; every other entry on her record runs in the slow row below them */
export const KEY_SHOWS = [SACRED_FRAGMENTS, SHOWS.find((x) => x.id === "india-habitat-centre-2010")!].map((x) => ({
  id: x.id, name: x.name ?? x.title, where: x.where ?? `${x.venue}, ${x.city} · ${x.when}`, photos: x.albums.flatMap((a) => a.photos),
}));
export const OTHER_SHOWS = RECORD.filter((r) => r.show !== "sacred-fragments" && r.show !== "india-habitat-centre-2010")
  .map((r) => ({ name: r.venue, venue: r.city || "India", year: r.month ? `${r.month} ${r.year}` : r.year }));
