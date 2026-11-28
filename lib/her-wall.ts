/**
 * The wall about her, at the courtyard's north wall where the easel stood (stop 4, lib/chapters.ts).
 * One data object: the final words drop in here and nothing else changes.
 */
export const HER_WALL = {
  /** the stretch of the courtyard's north wall it is set on, site metres (x east, y up; the wall plane is z) */
  wall: { z: -6, x0: 1.15, x1: 2.85, y0: 0.55, y1: 2.5 },
  photo: {
    src: "/site/press/sm/ihc-press-01.jpg",
    width: 640,
    height: 428,
    alt: "Dr Dolly Prasad smiles beside “Before the Engines” as a cameraman films her and a reporter holds out a microphone, Open Palm Court, India Habitat Centre, 2010.",
    /** under the photograph */
    caption: "Beside “Before the Engines”, in front of the cameras.",
    /** the larger file, for the About page */
    large: "/site/press/ihc-press-01.jpg",
    largeWidth: 1600,
    largeHeight: 1071,
  },
  heading: "Dr Dolly Prasad",
  bio: "A painter in New Delhi, working mostly in oil on canvas, sometimes with charcoal or pastel. Exhibitions and art fairs have shown her work since 2005.",
  exhibitionsHeading: "Key exhibitions",
  /** newest first; the two confirmed entries (kb/exhibitions.json e19, e13) */
  exhibitions: [
    { year: "2026", line: "Sacred Fragments: A Journey Home, Visual Arts Gallery, India Habitat Centre, New Delhi" },
    { year: "2010", line: "Open Palm Court, India Habitat Centre, New Delhi" },
  ],
  /** of the 19 shows and fairs on record, two are listed; "and 17 more since 2005" */
  exhibitionsTotal: 19,
  press: "Press: Television, June 2010 · Delhi Times, Must See, Must Do.",
  collectors: "Her paintings have been shown at nearly twenty exhibitions and art fairs, and are in private collections in India and abroad.",
};

export const herWallMore = () => HER_WALL.exhibitionsTotal - HER_WALL.exhibitions.length;
