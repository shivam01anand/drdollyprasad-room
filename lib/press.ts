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
};

const IHC = "India Habitat Centre · November 2010";
const ph = (n: string, alt: string, title: string, line: string): PressItem => ({
  id: n, kind: "photo", src: `/site/press/${n}.jpg`, sm: `/site/press/sm/${n}.jpg`, alt, title, line, source: IHC,
});

const RAW: PressItem[] = [
  ph("ihc-press-01", "Dr Dolly Prasad smiles as a cameraman films her beside The Bullocks, a reporter’s microphone held up to her.",
    "In front of the cameras",
    "Interviewed beside The Bullocks at Open Palm Court, India Habitat Centre, New Delhi."),
  {
    id: "tv-ncr-2010", kind: "video", src: "/site/press/tv-ncr-2010.mp4", poster: "/site/press/tv-ncr-2010-smile.jpg",
    alt: "A television excerpt: the camera moves from her paintings to Dr Dolly Prasad, speaking in the exhibition.",
    title: "On screen · June 2010",
    line: "The recording carries a 12 June 2010 date display. The camera turns from the paintings to her, speaking within the exhibition.",
    source: "Television archive", credit: "NCR television. Original broadcast sound.", card: "NCR television · 12 June 2010",
  },
  {
    id: "tv-archive", kind: "video", src: "/site/press/tv-archive.mp4", poster: "/site/press/tv-archive.jpg",
    alt: "A television excerpt: a reporter stands in a gallery with paintings on its walls, then the camera moves across the work.",
    title: "On television",
    line: "A report from a gallery, with paintings on the walls behind. Its date and channel are not recorded.",
    source: "Television archive", credit: "Original broadcast sound.",
  },
  ph("ihc-press-06", "Dr Dolly Prasad answers a reporter beside The Bullocks.",
    "Beside The Bullocks",
    "The interviews took place beside the paintings themselves."),
  ph("ihc-press-03", "A reporter holds out a microphone to Dr Dolly Prasad beside her painting of a rickshaw puller.",
    "Questions at the wall",
    "The rickshaw puller behind her, the questions in front."),
  {
    id: "delhi-times", kind: "clipping", src: "/site/press/delhi-times-listing.jpg", sm: "/site/press/sm/delhi-times-listing.jpg",
    alt: "A Delhi Times clipping, Must See Must Do, listing Art Today And Tomorrow, a group show of paintings at Travancore Art Gallery, with one of her paintings.",
    title: "Delhi Times · Must See Must Do",
    line: "A listing for Art Today And Tomorrow, a group show of paintings at Travancore Art Gallery. The genuine scanned clipping.",
    source: "In the papers",
  },
  ph("ihc-press-02", "Dr Dolly Prasad speaks into a reporter’s microphone, The Bullocks behind her.",
    "In conversation",
    "Listening to the artist offers another way into the work."),
  ph("ihc-press-04", "Dr Dolly Prasad is interviewed against the red-brick wall, her rickshaw puller painting behind her.",
    "On the red-brick wall",
    "The people and objects she paints are right there behind her."),
  { ...ph("ihc-press-b", "Dr Dolly Prasad listens in profile during an interview beside The Bullocks.",
    "Listening", "A camera at her shoulder, The Bullocks beside her."), src: "/site/ex/ihc-press-b.jpg", sm: "/site/ex/ihc-press-b.jpg" },
  ph("ihc-press-05", "Dr Dolly Prasad in conversation with a reporter, the rickshaw puller painting behind her.",
    "The artist and her audience",
    "Meeting an audience through conversation as well as through paint."),
];

/** one mosaic, stills and the two television clips mixed and spread out (Shubham, 19 Oct 2026):
 *  the India Habitat Centre interview first, top left; a clip never sits next to the other */
const ORDER = ["ihc-press-01", "tv-ncr-2010", "ihc-press-06", "ihc-press-03", "delhi-times", "tv-archive"];
// six cards, 3 + 3 (Chief Content 2c C11; Brand review #2 P1-6): "In conversation", "On the red-brick wall" and
// "The artist and her audience" dropped as near-duplicate interview photos; they stay in the IHC album // "Listening" (ihc-press-b) dropped: near-duplicate (Chief Content 2c, C11); the photo stays in the IHC album
export const PRESS_ITEMS: PressItem[] = ORDER.map((id) => RAW.find((p) => p.id === id)!);

/** the shorter set for About: four photographs and the NCR excerpt */
export const PRESS_SHORT = ["ihc-press-01", "tv-ncr-2010", "ihc-press-06", "ihc-press-03", "tv-archive", "delhi-times"]
  .map((id) => PRESS_ITEMS.find((p) => p.id === id)!);

/** every item, for the moving press row on Exhibitions and About (R3, Shubham 20 Oct: all the press, all the accolades):
 *  the six above first, in their order (the two clips apart), then the four that had been left out */
export const PRESS_ALL: PressItem[] = [...PRESS_ITEMS, ...RAW.filter((p) => !ORDER.includes(p.id))];
