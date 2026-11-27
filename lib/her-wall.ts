/**
 * The wall about her, at the courtyard's north wall where the easel stood (stop 4, lib/chapters.ts).
 * One data object: the final words drop in here and nothing else changes.
 *
 * PLACEHOLDER TEXT (2026-11-26): every line below is a stand-in until the writer's words arrive.
 * Sources: dolly-engine kb/exhibitions.json (the list and the count, newest first), kb/artist.md and
 * kb/voice.md (collectors), lib/site.ts (the press line, the bio's first line). Nothing is invented;
 * nothing is presented as her words. The photograph is the Sacred Fragments opening, Oct 2026
 * (public/site/ex/sf-02.jpg, cropped to her as a photograph; no painting is in it).
 */
export const HER_WALL = {
  /** true until the final words are in (the preview shows this to whoever reads the page source) */
  placeholder: true,
  /** the stretch of the courtyard's north wall it is set on, site metres (x east, y up; the wall plane is z) */
  wall: { z: -6, x0: 1.15, x1: 2.85, y0: 0.55, y1: 2.5 },
  photo: {
    src: "/art/her/dolly-prasad.jpg",
    width: 435,
    height: 700,
    alt: "Dr Dolly Prasad outside the Visual Arts Gallery, India Habitat Centre, in a red printed saree, smiling, one hand on the gallery's poster stand.",
    /** under the photograph */
    caption: "Sacred Fragments, October 2026.",
  },
  heading: "Dr Dolly Prasad",
  bio: "A painter in New Delhi, working mostly in oil on canvas. She has shown in Delhi and beyond since 2005.",
  exhibitionsHeading: "Selected exhibitions",
  /** newest first; five lines */
  exhibitions: [
    { year: "2026", line: "India Habitat Centre, Delhi" },
    { year: "2018", line: "Art Fair, Jaipur" },
    { year: "2018", line: "Kala Mela, Delhi" },
    { year: "2016", line: "Cabinet Secretariat, Delhi" },
    { year: "2015", line: "CSOI Club, Delhi" },
  ],
  /** of the 19 shows and fairs on record, the five above are lettered; "and 14 more" */
  exhibitionsTotal: 19,
  press: "Press: Delhi Times, Must See, Must Do.",
  collectors: "Collectors: India, the USA and the UK.",
};

export const herWallMore = () => HER_WALL.exhibitionsTotal - HER_WALL.exhibitions.length;
