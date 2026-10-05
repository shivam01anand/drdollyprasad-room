# Audit — what is still not hers

**Provenance:** three independent sub-agent audits were launched and all three died
immediately on a session rate limit. This is my own pass, not an independent one. It should
be re-run by fresh agents when the limit resets — a self-audit by the person who wrote the
code is worth less, and the items below are the ones I already suspected.

Ranked by how much a visitor would feel it.

---

## 1 · The camera still enters through his open wall, not her door

**The biggest miss, and it is mine.** `SITE-CONCEPT.md` says the way in is the door —
*Bandh Darwaze*, her own threshold series, the lock hanging open. The room has that door.
But `rig.ts` `START` still places the camera outside the **open front**, which is David
Lee's device (he deletes `Wall_03` so the camera can look in from outside).

She has a *door*. A visitor should arrive at it, and come through it.

**Fix:** move `START` outside the left wall, beyond the door, and make the first two seconds
a push through the opening. The front can stay open for the wide shots; the *arrival* must
be the door.

## 2 · The window is his, scaled

2.2 × 1.3 m at a 1.3 m sill is a studio window — close kin to his 2.97 × 1.46 m opening.
Her light, in *Bandh Darwaze I* and every interior, is a **small, high, deep-set opening**
that throws a shaft, not a wash.

**Fix:** roughly 1.1 × 0.95 m, sill at ~1.7 m, in a 0.45 m wall. Less light, more event.
The chajja then matters more, and the grille shadow becomes a single readable shape
instead of stripes across the room.

## 3 · Room proportions are loft-like

6.4 × 5.2 × 3.35 m reads as a converted studio. A room off a Delhi courtyard is narrower
and proportionally taller — nearer 4.6 × 4.2 × 3.6 m. The current width is why the hero
wall needed the flanking canvas moved off it.

## 4 · *Threads of Faith* is her newest major work and its subject is missing

The painting is timber rails wound with hundreds of red threads and dozens of brass bells,
against sandstone cut with राम. The room has **one** thread hank on the floor and **one**
bell. The rail itself — the thing the painting is actually of — is not there.

**Fix:** a timber rail along the back or left wall at ~2.1 m, wound with thread, bells hung
at irregular lengths. It is also the natural home for the "shake the room" interaction:
drag and the bells swing. Cheap to build — torus rings on a cylinder, instanced bells.

## 5 · There is nothing growing

*Blooming Innocence*, *Under Canopy of Greens*, *Whispers of Stillness* and *The Peepal
Shrine* are four canvases of dense foliage — and forest green measures **12.5% of her recent
palette**, up from absent. The room has no plant life at all.

**Fix:** a courtyard glimpse through the open door — bougainvillea or banana against bright
sky. It also gives the door somewhere to lead, which it currently does not.

## 6 · No torn poster, no wall of small repeated things

*Shree 420* and *Mother India* both paint a torn film poster pasted on plaster.
*Patra Petika* is a wall of stamps; *The Matka and the Coins* a wall of coins. That
"wall covered in many small printed things" is one of her most recurrent surfaces and the
room has none of it.

**Fix:** one torn, bleached poster on the plaster, at the scale she paints them.

## 7 · Microcopy is still his register

"SHAKE THE ROOM" is lifted straight from his cursor label. "SCROLL ↓" likewise.
Hers would be quieter and in her own idiom — the room *settles*, it does not get shaken.

## 8 · The brick competes with the hero

The plaster-loss patches are large, warm and on the **same wall** as *Twenty Paise*. They
pull the eye off the one painting the hero shot exists to show.

**Fix:** move the loss to the left wall and the lower back wall, below the hanging line.

## 9 · The turquoise door is the second-saturated thing in frame

It is a legitimate quote from *Bandh Darwaze III*, but in shot C it competes. Either
desaturate further or turn the door so less of the face is seen in that framing.

## 10 · Seven regular ceiling beams read modern

Old rooms have fewer, heavier beams with visible purlins between. Minor, but it is part of
why the room still reads "converted space".

---

## Not findings

The mechanics are deliberately the original's and should stay: the camera rig, the 3.26 s
intro structure, the key offsets, the two-stage follower, the paused 41.5 s timeline, the
post-processing order, the scramble speed hierarchy, the footer card.

## Untested

- The "shake the room" physics has **never actually been exercised** — only the toggle path
  was read, not run.
- The HUD fade at the hand-over to the collage was added and not verified.
- Mobile at ~390 px has not been opened once.
- `playIntro()` is not idempotent: it reads `restY` from the current position, so a second
  call leaves every object stranded 1.7 m up. Worth guarding.

---

# Status after the audits — 4 Oct

Two of three audits completed (the third hit a session limit twice). They found more than
this self-audit did, and corrected it in two places.

## Applied

- **Walls now cast shadows.** `shell.ts` carried the original's `castShadow = !/^Wall|…/`
  rule verbatim. That is right for a thin white cube with a 3 m window; here it meant the
  sun passed straight through 0.45 m walls and there was **no aperture shadow at all** —
  which is why the grille printed stripes across everything instead of a shaft. One regex.
  This was the single highest-value finding and the self-audit missed it.
- Sun angle lowered (7.8, 4.6, 0.6) so the shaft actually reaches into the room rather than
  dying beside the window; intensity up to carry it.
- **A second source through the open door.** A room off a courtyard is lit twice, and her
  door is ajar. Without it a small high window in thick walls starves the room.
- `LIGHT.clear` `#ffffff` → `#d8cebc`. White is not in her palette; Bone is her brightest
  measured value, and *The Aarti*'s great white dhoti has "barely any pure white at all".
- Bloom 0.45 → 0.16, threshold 0.97: it was glazing her canvases. Her paint is matte.
- Metals matted (aluminium 0.72 → 0.18 metalness). *The Kadhai Seller*: "these are not
  shiny objects, and she resists making them shiny."
- `FogExp2` added — her grounds are never optically clean.
- Cool hemisphere fill, so the shaft reads hot (*The Aarti* splits its ground by temperature).
- **Table and easel deleted.** Both were his studio furniture. Her figures are on the
  ground in every instance, and the easel carried a blank canvas — the brightest object in
  the room — in a room whose rule is that the art is the only colour, under a poem that
  ends "I don't paint / Am not a painter".
- Thread hank moved out of the open floor, where it was the most saturated thing in frame.
- **Invented dimensions removed from the collage.** It was rendering estimates as hard fact
  (`24″`). Only artist-stated values remain; the rest show "—".

## Corrected by the audits

- My #9 was wrong. The door turquoise measures ~16% saturation — not competing. The
  second-most-saturated thing was the **thread hank**, badly placed mid-floor.
- My #8 was right to move the brick but for the wrong reason: the installation photograph
  puts it behind the **middle of a run of three**, not behind a single hero.

## Open, and needing a decision

**The two-language seam.** Both audits independently flag that `SITE-CONCEPT.md` specifies
her central device — the room renders as line drawing except where attention falls — and it
was never built. They are right that it is absent. But that concept predates the
instruction to keep the original's mechanics and change only the room, so whether it is
in scope is the client's call, not the auditors'.

## Still outstanding

Accumulation over one-of-each (she paints heaps, never single spaced objects); framed
canvases (18 catalogue entries say "framed"; they currently float as unframed planes);
the *Threads of Faith* rail; foliage through the doorway; the *Bandh Darwaze* canvases
hung beside the door they are quoted from; re-cutting B and C, which are currently the
same shot mirrored; the collage leading on the elegy rather than the present tense.

## Round 2 applied — framing and the rest

- **Real frames** on every canvas: four timber rails standing proud plus a backing,
  replacing planes floating 85 mm off the plaster behind an invisible mount. Eighteen
  catalogue entries read "oil on canvas, framed".
- **The four *Bandh Darwaze* panels are now hung** — a tight low run right of the hero.
  The room quoted that series for its door, its hasp, its open padlock, its studs and its
  interlace jamb, and never showed the paintings.
- **Accumulation, not one-of-each.** A spread heap of six matkas with one tipped so an
  interior is open (*Terracotta*); a stack of seven blackened kadhais with their ring
  handles, which are that painting's whole compositional device (*The Kadhai Seller*);
  four churns clustered (*Shree 420*); kettles paired (*Mother India*).
- **The *Threads of Faith* rail** — a timber rail wound with thread, fifteen brass bells on
  cords at irregular drops. Raised to 2.92 m after a first pass hung the bells across the
  canvases.
- **A courtyard through the door**, with foliage: the room's only green, and the first
  thing the door has ever led to. Plus an outer wall, so the building has an outside
  instead of an endless stone plain.
- **B and C re-cut into her beats** — *what is leaving* (the Gone Are The Days run, brick
  behind it as the gallery hung her) and *what is still* (the recent work at the window,
  green entering). They were previously the same shot mirrored.
- Brick moved to the left wall, behind the run it was built to meet.
- Thread desaturated to `#7E3326`; it had become the loudest thing in the room.
- Light warmed and exposure raised after the cool fill drained the room grey.

Still open: the seam decision; the collage leading on the elegy rather than the present;
microcopy; mobile; the three untested interactions.
