import * as THREE from "three";
import { aim, type Pose } from "./room/rig";
import type { Anchors } from "./room/shell";
import { ROOM } from "./room/shell";

/**
 * One chapter model owns the copy, the camera framing and the beat, so the
 * three can never drift apart.
 *
 * Every framing leaves the lower left of the frame to the copy and puts the
 * work in the right two-thirds.
 */
export type Chapter = {
  id: string;
  /** the label above the copy; also the accessible name of the beat */
  eyebrow: string;
  /** rendered as a paragraph; omit for a beat the room carries alone */
  body?: string;
  /** her own words, set as a quotation */
  quote?: string;
  /** rendered as verse, one line per line */
  verse?: string;
  /** the section is content of its own (the featured slider) */
  slot?: "featured";
  /** the header sits on dark material in this framing: set it in light ink */
  ink?: "light";
  pose: Pose | ((a: Anchors) => Pose);
  /** a portrait screen frames one thing, above the copy */
  narrow?: Pose | ((a: Anchors) => Pose);
};

export const POEM = `They are not things,
They are everything
They come to me
They hold my hand
They give me a brush
Then sit quietly
In front of me
I put them on canvas
I don’t paint
Am not a painter`;

const HX = ROOM.w / 2, HZ = ROOM.d / 2;

/** the establishing shot: square-on to Twenty Paise, the whole altar wall */
export const START: Pose = aim([0, 1.6, -HZ + 0.05], 0, 5.3, 0.0);

/** rearrange: a dollhouse view in through the open side */
export const MESS: Pose = aim([0, 1.25, -0.2], 0, 9.8, 0, -0.12);

export const CHAPTERS: Chapter[] = [
  {
    id: "presence",
    eyebrow: "“Twenty Paise”",
    // no copy: the painting is the whole statement
    pose: aim([0, 1.58, -HZ + 0.05], 0, 4.15),
  },
  {
    id: "leaving",
    eyebrow: "Gone Are The Days · c. 2016–2018",
    body:
      "Fourteen paintings of a country’s discarded equipment. Withdrawn coins, a pillar " +
      "postbox, hand-lettered posters for the last single-screen cinemas, a tonga going " +
      "out as an auto-rickshaw arrives. What is leaving she paints in full oil; what is " +
      "arriving she draws as a single bare line.",
    pose: aim([-HX, 1.5, 0.05], Math.PI / 2, 4.35, -0.03),
    // a phone holds the painting in the upper half, clear of the label
    narrow: aim([-HX, 1.06, 0.05], Math.PI / 2, 4.0, -0.03),
  },
  {
    id: "still",
    eyebrow: "Recent work · 2024–",
    body:
      "Then the register changes. Hotter reds, a darker ground, and green entering her " +
      "palette for the first time. Her own words for these: pause, stillness, silence, " +
      "listening. Two have already gone to New York and London.",
    pose: aim([HX, 1.55, -0.05], -Math.PI / 2, 4.35, -0.03),
    narrow: aim([HX, 1.42, -1.72], -Math.PI / 2, 3.1, -0.02),
  },
  {
    id: "close",
    eyebrow: "Bandh Darwaze · Closed Doors · 2018",
    ink: "light",
    body:
      "Four paintings of old doors, one foot square. A hasp, a bolt, a heart-shaped " +
      "knocker, and a padlock hanging open on its staple. Her only work without a figure " +
      "in it, and the closest she comes to abstraction.",
    // square to the leaf, a little off its normal so the hardware has depth
    // square to the leaf and close enough that the leaf fills the frame;
    // the hardware sits right of centre, the copy over plain planks
    pose: (a) => {
      const yaw = Math.atan2(a.leafNormal.x, a.leafNormal.z) - 0.06;
      // from inside the room the leaf's free edge is on the left, so the
      // hardware sits left of centre; aim below it so it rides in the upper
      // half of the frame, clear of the copy
      const along = new THREE.Vector3(-a.leafNormal.z, 0, a.leafNormal.x).multiplyScalar(-0.35);
      return aim([a.lock.x + along.x, a.lock.y - 0.07, a.lock.z + along.z], yaw, 0.8, 0);
    },
    narrow: (a) => {
      const yaw = Math.atan2(a.leafNormal.x, a.leafNormal.z) - 0.06;
      const along = new THREE.Vector3(-a.leafNormal.z, 0, a.leafNormal.x).multiplyScalar(-0.13);
      return aim([a.lock.x + along.x, a.lock.y - 0.16, a.lock.z + along.z], yaw, 0.95, 0);
    },
  },
  {
    id: "shrine",
    eyebrow: "Artist’s statement",
    verse: POEM,
    pose: aim([ROOM.niche.x - 0.24, 1.4, -HZ], -0.1, 1.95, -0.03),
    narrow: aim([ROOM.niche.x, 0.89, -HZ], 0, 2.3, 0),
  },
  {
    id: "featured",
    eyebrow: "Featured",
    slot: "featured",
    // the sun on the floor through the grille: a quiet ground for the cards
    pose: aim([-0.55, 0.0, 0.05], -0.35, 3.4, 0, -1.02),
  },
  {
    id: "plan",
    eyebrow: "Eighteen solo exhibitions · 2005–2018",
    body:
      "Triveni Kala Sangam · India Habitat Centre · ICCR · Travancore Art Gallery · " +
      "Lalit Kala Akademi · Nehru Art Gallery, Bombay.",
    quote:
      "As an artist whose work knows no borders, my pieces have journeyed far and wide, " +
      "finding their place in numerous private art collections globally. My creative " +
      "expression has resonated with diverse audiences, building connections that span " +
      "continents.",
    pose: aim([0.15, 0, 0.1], 0, 9.2, 0, -Math.PI / 2),
  },
];

export function resolvePoses(a: Anchors, narrow = false): Pose[] {
  return CHAPTERS.map((c) => {
    const p = narrow && c.narrow ? c.narrow : c.pose;
    return typeof p === "function" ? p(a) : p;
  });
}

/** portrait screens get their own framings */
export const isNarrow = (aspect: number) => aspect < 0.85;
