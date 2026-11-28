/**
 * In the press (CR-005, Shubham, 18 Oct 2026): her exhibitions as reporters,
 * cameras and the papers saw them.
 *
 * Every line here comes from the approved post records in "Exhibition Posts -
 * Production/Posts" (02 In Front of the Cameras, 05 From the Paper Archive,
 * 08 Television Archive II), written in the website's third person. Names
 * of papers and channels appear only where those records name them: Delhi
 * Times (05) and NCR (08). Nothing recreated is used: the Triveni invitation
 * pages and the restored ICCR opening still are left out, and so is the
 * "Television Archive I" excerpt (it shows Sangeeta Sharma, not her: QA P1-5); the clipping is the
 * genuine scan, cropped to her entry.
 *
 * Files: public/site/press (1600 px photographs, 640 px copies in sm/, the NCR
 * television excerpt at 720p with their cover posters).
 */

export type PressItem = {
  id: string;
  kind: "photo" | "clipping" | "video";
  /** the large file (photographs and the clipping) or the video */
  src: string;
  /** the small copy shown in the collage */
  sm?: string;
  poster?: string;
  alt: string;
  /** a short line under the item */
  title: string;
  /** one or two sentences, facts from the post records only */
  line: string;
  /** where it comes from: venue and date, the paper, or the channel */
  source: string;
  /** a one-line credit, only where a record names the channel */
  credit?: string;
  /** the one line under the card's title, where it is not the source (Chief Content 2c, C10) */
  card?: string;
  /** R6 Home "In the press" panel (Chief Content R6 §2): bold = the named outlet or venue, small = what and when;
   *  each recombines this item's own fields above, no new facts */
  home?: { t: string; s: string };
};

const IHC = "India Habitat Centre · November 2010";
const ph = (n: string, alt: string, title: string, line: string): PressItem => ({
  id: n, kind: "photo", src: `/site/press/${n}.jpg`, sm: `/site/press/sm/${n}.jpg`, alt, title, line, source: IHC,
});

const RAW: PressItem[] = [
  { ...ph("ihc-press-01", "Dr Dolly Prasad smiles as a cameraman films her beside “Before the Engines”, a reporter’s microphone held up to her.",
    "In front of the cameras",
    "Interviewed beside “Before the Engines” at Open Palm Court, India Habitat Centre, New Delhi."),
    home: { t: "India Habitat Centre", s: "On camera · November 2010" } },
  {
    id: "tv-ncr-2010", kind: "video", src: "/site/press/tv-ncr-2010.mp4", poster: "/site/press/tv-ncr-2010-smile.jpg",
    alt: "A television excerpt: the camera moves from her paintings to Dr Dolly Prasad, speaking in the exhibition.",
    title: "On screen · June 2010",
    line: "The date on screen reads 12 June 2010. The camera moves off the paintings and onto her as she speaks.",
    source: "Television archive", credit: "Television. Original broadcast sound.", card: "Television · 12 June 2010",
    home: { t: "Television", s: "12 June 2010" },
  },
  ph("ihc-press-06", "Dr Dolly Prasad answers a reporter beside “Before the Engines”.",
    "Beside “Before the Engines”",
    "She stood beside the paintings to answer each reporter."),
  ph("ihc-press-03", "A reporter holds out a microphone to Dr Dolly Prasad beside her painting of a rickshaw puller.",
    "Questions at the wall",
    "The rickshaw puller behind her, the questions in front."),
  {
    id: "delhi-times", kind: "clipping", src: "/site/press/delhi-times-listing.jpg", sm: "/site/press/sm/delhi-times-listing.jpg",
    alt: "A Delhi Times clipping, Must See Must Do, listing Art Today And Tomorrow, a group show of paintings at Travancore Art Gallery, with one of her paintings.",
    title: "Delhi Times · Must See Must Do",
    line: "The paper’s Must See Must Do column listed Art Today And Tomorrow, a group show at Travancore Art Gallery that included her work.",
    source: "In the papers",
    home: { t: "Delhi Times", s: "Must See Must Do" },
  },
  { ...ph("ihc-press-b", "Dr Dolly Prasad listens in profile during an interview beside “Before the Engines”.",
    "Listening", "A camera at her shoulder, “Before the Engines” beside her."), src: "/site/ex/ihc-press-b.jpg", sm: "/site/ex/ihc-press-b.jpg",
    home: { t: "India Habitat Centre", s: "On camera · November 2010" } },
];

/** one mosaic, stills and the two television clips mixed and spread out (Shubham, 19 Oct 2026):
 *  the India Habitat Centre interview first, top left; a clip never sits next to the other */
const ORDER = ["ihc-press-01", "tv-ncr-2010", "ihc-press-06", "ihc-press-03", "delhi-times"];
// six cards, 3 + 3 (Chief Content 2c C11; Brand review #2 P1-6): "In conversation", "On the red-brick wall" and
// "The artist and her audience" dropped as near-duplicate interview photos; they stay in the IHC album // "Listening" (ihc-press-b) dropped: near-duplicate (Chief Content 2c, C11); the photo stays in the IHC album
export const PRESS_ITEMS: PressItem[] = ORDER.map((id) => RAW.find((p) => p.id === id)!);

/** R6 (Shubham 20 Oct 22:50, "a small In the press so people take her seriously"): the three named outlets or venues
 *  shown beside the artist on Home; Chief Content R6 §2 wording, from each item's `home` field */
export const PRESS_HOME = ["tv-ncr-2010", "delhi-times", "ihc-press-b"].map((id) => RAW.find((x) => x.id === id)!) as (PressItem & { home: { t: string; s: string } })[];

/** every item, for the moving press row on Exhibitions and About (R3, Shubham 20 Oct: all the press, all the accolades):
 *  the five above first, in their order, then "Listening" (ihc-press-b). Content elevate (Shubham 2026-11-22): the three
 *  near-duplicate interview stills (ihc-press-02, -04, -05) and the unconfirmed tv-archive clip are cut (supersedes R3 for these). */
export const PRESS_ALL: PressItem[] = [...PRESS_ITEMS, ...RAW.filter((p) => !ORDER.includes(p.id))];
