/**
 * The wall about her, at the courtyard's north wall where the easel stood (stop 4, lib/chapters.ts).
 * One data object: the final words drop in here and nothing else changes.
 */
export const HER_WALL = {
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
  bio: "A painter in New Delhi, working mostly in oil on canvas, sometimes with charcoal or pastel. Exhibitions and art fairs have shown her work since 2005.",
  exhibitionsHeading: "Selected exhibitions",
  /** newest first; the two confirmed entries (kb/exhibitions.json e19, e13) */
  exhibitions: [
    { year: "2026", line: "Sacred Fragments: A Journey Home, Visual Arts Gallery, India Habitat Centre, New Delhi" },
    { year: "2010", line: "Open Palm Court, India Habitat Centre, New Delhi" },
  ],
  /** of the 19 shows and fairs on record, two are listed; "and 17 more since 2005" */
  exhibitionsTotal: 19,
  press: "Press: Television, June 2010 · Delhi Times, Must See, Must Do.",
  collectors: "In private collections in India, the USA and the UK.",
};

export const herWallMore = () => HER_WALL.exhibitionsTotal - HER_WALL.exhibitions.length;
