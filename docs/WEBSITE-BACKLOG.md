# Website backlog

The live list of what is still wrong or missing on drdollyprasad.com. It is
not an instruction to build anything today. Every team reads it, adds to it,
and works from it in the next website run.

Last updated 19 October 2026. The 18 October sprint (S1 to S12a, critique
passes 1 and 2) is live on `main` and has been removed from this file, as the
rules below ask. Batch 19 Oct (painting-page thumbnails, Collections indigo,
bigger Key collections, copy gaps filled with the site's own voice) is on
branch `batch-2026-10-19` as a preview and leaves this file when made live.

## How this list works

- **Brand owns the website.** Brand is accountable for whether it is great,
  consistent and on-theme. Brand keeps this file current.
- **COO runs the `website-test` skill** on each preview and gives the report
  to the teams. New findings are added here as items.
- **CEO and COO decide priority and sequence.** Reorder items freely; keep the
  reasons.
- **Every team may critique.** Add items with the `critique-the-experience`
  skill's checks: real devices, wide screens, states, theme fit, say it once.
- **When an item is solved, remove it from this file** and record what was
  decided in the project's design-decisions doc. Do not leave done items here.
- Each item has an id, a short statement in Shubham's terms, what "done"
  looks like, and an owner (a team, not a person).

Content and structure first; aesthetics once those settle.

## Open: batch of 19 October 2026

- **See it in your room, for every painting.** Every painting page should offer
  "See it in a room"; today only some have a room view. Small paintings and
  portraits need tighter crops so they do not float in a big wall. Waiting on
  ChatGPT's hallway room revisions (brief 004, round 2; the drop-in steps are
  at the end of this file). Owner: Design (ChatGPT), then Tech.
- **Studio preview due Wednesday 21 October.** The studio (the 3D house) is not
  changed by batch 19 Oct. Owner: Tech and Design.
- **Still open from the 18 October sprint:** S12 borders (needs ChatGPT
  design, see B1) and S13 glass behind pictures (see B4).

## Left after the 18 October sprint

- **Needs Mummy:** her own "From the artist" line; her hospital-to-easel story
  in her words (About now says only "a doctor and a self-taught painter");
  a name for Recent work ("Onset of Spring" is ours); Terracotta's year;
  Sacred Fragments visit hours; Threads of Faith's orientation; "Delhi" vs
  "New Delhi" in her record; the WhatsApp number. Four collection pages
  (Bandh Darwaze, Faith, Portraits, Onset of Spring) now carry a one-line
  stand-in in the site's own voice where her collection line is missing
  (`held` in `lib/site.ts`); her own words replace it when she writes them.
- **Needs ChatGPT design:** realistic rooms (brief 004); the new border (B1);
  glass behind pictures (B4).
- **Needs a decision:** the Resend key for the enquiry form (free account on
  drdollyprasad@gmail.com, key into Vercel as `RESEND_API_KEY`; no DNS).
- **Next technical pass:** home is still 3.5 MB on a phone (the moving wall
  loads 41 painting thumbnails; serve 280 px copies to phones); collection
  story pages are 8.8 phone screens (B9, density).

## Open items (round 3 review, PR #7)

### Design and visual system

**B1. Borders look wrong.** Owner: Design.
- The quiet diamond rule added in round 3 is rejected ("hideous").
- Interim, if a decision is needed before the new border exists: put the Faith
  prayer frieze back across every page (the old artwork is still in
  `public/site/border-*.png`; the new rule is `public/site/motif-*.svg` and the
  `.rail`/`.band` rules in `app/(site)/site.css`).
- Proper fix: Design commissions a custom border that suits all her work, not
  only the religious paintings. It should work as pictures and backgrounds.
  The image team (ChatGPT) supplies small PNG pieces; Design checks they tile
  and look right on phone, laptop and very wide screens.
- Done when: a border Shubham approves is on every page and no one calls it
  religious, busy or hideous.

**B2. Carousel edges must be crisp.** Owner: Design.
- Remove the soft fade and blur at the left and right ends of every moving row.
  Keep edges neat and clean.
- Applies to all carousels: key collections, on the walls, available now, the
  collection rows, and the Instagram strip. (In code: the `mask-image` fades on
  `.marq` and `.ig-roll`.)
- Done when: no carousel has a blurred or faded edge.

**B3. Reading the text is still hard.** Owner: Brand, with Design.
- Fonts and styles vary from place to place: sometimes italic, sometimes not;
  bold and colours change; headings and small labels read differently page to
  page.
- Set one voice per role (title, line, quote, label, body) and use it
  everywhere. Fewer sizes, fewer small capitals, one rule for italics and one
  for bold.
- Done when: the same kind of text looks the same on every page, and a first
  time reader finds it easy on a phone.

**B4. Picture backgrounds: glass.** Owner: Design.
- Still a challenge. Pictures should sit on a frosted-glass, slightly blurred
  background in their own colours, lifted with a soft 3D shadow, not on flat
  grey or beige. Check every place a picture sits: cards, tiles, carousels,
  the painting page, About.
- Done when: no picture sits on a flat grey block.

### Page openings and carousels

**B5. Running pictures behind page titles are gone; bring them back.** Owner:
Design and Engineering.
- This reverses the round 2 test finding that kept the moving wall on the home
  page only. Shubham wants it back on the other main pages.
- Works: a running carousel of paintings, softly blurred, behind the Works
  title.
- Collections: the same, running behind the word Collections.
- Exhibitions: the earlier format Shubham liked best, a running carousel with
  a centre white card on top. The card carries the summary, so the three number
  blocks are not needed (see B6).
- Done when: Works, Collections and Exhibitions each open on a moving picture
  band with the title card on top, and the first screen still shows content
  below it on phone and computer.

**B6. Exhibitions page: cut the extra blocks and get to the shows.** Owner: Brand.
- Compress Now showing a lot. It stays on the first screen.
- Remove the three number blocks (18, 4, 3). Their message moves into the
  centre card of the carousel in B5.
- Remove the rust and beige blocks so the page goes straight to the shows.
- Done when: the first screen shows the carousel, a slim Now showing line and
  the start of the first show.

**B7. One format for exhibition names.** Owner: Content.
- Today the titles differ ("An evening at India Habitat Centre", "an
  exhibition presented by ICCR"). Use one form: "Exhibition at India Habitat
  Centre", "Exhibition at ICCR", and so on.
- Everything on this page is an exhibition, so the word "Exhibition" is a
  small label, not a heading that repeats. Cut the white space it takes.
- Done when: every show title follows one pattern and the kind label is small.

**B8. Smaller slideshow tabs.** Owner: Design.
- The tabs for each show's photo sets ("The evening", "In front of the
  cameras", "A walk through the room") are too big. Make them much smaller and
  quieter, on phone and computer.
- Done when: the tabs are easy to tap but take little space.

### Layout density

**B9. Show more on every screen.** Owner: Brand.
- On phone and computer the first glance still has too much empty space and
  stacked blocks. Simplify and compress so more is visible without scrolling.
- Put text beside headings where possible; one row instead of a stack.
- Done when: each page's first screen carries the main message plus the first
  real content, checked on 390px, 1440px and 2560px.

## Carried forward from earlier rounds

These are not new from this review but are still open.

- **Design polish:** a consistent type scale (about seven sizes today),
  phone-first layouts, image weight and loading, and one colour and motion
  system.
- **Enquiry delivery:** the form still opens WhatsApp or the visitor's own mail
  app. Recommended fix is a form service (Resend: needs an account, three DNS
  records and an API key in Vercel). WhatsApp number still to set in
  `lib/site.ts`.
- **Needs Mummy's approval:**
  - the first-person "From the artist" line and the hospital story on About
    (the draft is in the design-decisions doc and is off the page until then);
  - a real name for the spring collection (currently "Onset of Spring", our
    working name);
  - Terracotta's year (2015, inside a 2016 to 2018 collection);
  - Threads of Faith's orientation (recorded 36 × 30 in, but the photo is wider
    than tall);
  - visiting hours for Sacred Fragments.
- **Strategy Deck stories:** bring the brand themes and stories from the master
  strategy document into the content once the look is settled.
- **Content gaps:** one paragraph per collection from Mummy; India Habitat
  Centre year and title; Sacred Fragments solo or group; the remaining shows.
- **Portrait:** a higher-resolution portrait (the current one is 150 px).

## Decided, not to reopen without a reason

- Her words are always verbatim and attributed. Drafted first-person copy stays
  off the page until she approves it.
- Say each fact once (tagline, price on request, counts).
- No em dashes in our own copy; ranges read "2016 to 2018"; no "c.".
- Never write "18 solo exhibitions": the record is exhibitions and art fairs.
- Nothing goes live until Shubham says "make it live".

## PR #11 review fixes (18 Oct 2026, night): P2 left open

Website test on the local production build at 360, 390, 768 and 1440 px (13
pages): no sideways scroll, no text under 13 px, no phone tap target under
40 px, no axe issues, no console errors, worst CLS 0.071 (Exhibitions,
computer). P2s not fixed in this pass:

- **P2 · Works is long on a computer.** Two to a row at 24 a page is about 10
  screens at 1440 px. Option: 12 a page, or 3 to a row above 1600 px. Owner: Brand.
- **P2 · Long phone pages.** Exhibitions (10 to 12 screens), collection stories
  (9 to 10). Unchanged by this pass. Owner: Content.
- **P2 · Slideshow arrows on a phone** sit a few pixels outside the narrower
  photographs now that the mat is gone. Option: small round arrows inside the
  frame. Owner: Design.
- **P2 · "On the walls" links on Exhibitions** wrap with a wide gap on a phone. Owner: Design.

## Border and divider drop-in (brief 006): where ChatGPT's files go

Shubham's PR #11 review replaced the dotted and diamond rules. Both slots below
take new files **with no code change**: copy the files in, rebuild, preview.

| Asset | Drop-in path (in the repo) | File size (2x) | Shown at | Notes |
|---|---|---|---|---|
| Border strip, computer | `public/site/borders/border-desktop@2x.png` | any width x 96 px | 48 px tall | Tiles sideways (`repeat-x`), so the left and right edges must meet without a seam. Ink #26211D on transparent. Under 60 KB. |
| Border strip, phone (640 px and under) | `public/site/borders/border-phone@2x.png` | any width x 72 px | 36 px tall | Same rules. A larger excerpt, not a shrunk copy of the computer strip. |
| Divider, the painting lady, computer | `public/site/dividers/painter-desktop@2x.png` | 104 x 128 | 52 x 64 | Transparent, ink only, centred, `alt=""`. |
| Divider, the painting lady, phone | `public/site/dividers/painter-phone@2x.png` | 78 x 96 | 39 x 48 | As above. |

- **Today's border files** are a clean strip cropped from the approved
  high-resolution `Team Handoffs/002-template-kit-80-posts/outputs/kit/T-a-single-4part/assets/village-perimeter.png`
  (the ground-line frieze, x 1024 to 3746, y 1176 to 1322, cut where the ground
  line matches so it tiles without a seam), recoloured to ink #26211D on
  transparent and downscaled only. They show at 80% opacity, top and bottom of
  every page (`components/site/Borders.tsx`, `.band` in `site.css`; the bottom
  strip starts at a different point so the two do not mirror). A height change
  means changing `--band` (48 px, 36 px on a phone) in the PR #11 block of `site.css`.
- **The painter divider** switches on by itself: `components/site/Divider.tsx`
  checks at build time for **both** painter files and, when they are there, uses
  them in every divider slot instead of the reading figure. Drop in only the
  approved pair (the 006 RETURN files of 18 Oct are review studies, not approved).
- The side rails are now a single hairline; there is no file for them.

## Divider asset (brief 005, pick C): what the final files must be

The divider is built and placed (`components/site/Divider.tsx`; home page at
three breaks, Collections page before bands 2 and 4, each collection's story
page before "The paintings in this collection"). **Final art is in** (005
RETURN-2): the same reading figure in all three slots, as a computer file
(`<name>.png`, 104 x 128, shown 52 x 64) and a phone file (`<name>-phone.png`,
78 x 96, shown 39 x 48), transparent, ink-only. To give a slot its own figure,
replace that pair at the same sizes; if the size changes, update `DIVIDER_PX`
and the heights in `site.css`.

Rules held by the component: `alt=""`, always its own block between sections
(at least 41 px from the nearest painting on a phone), never inside a section
that has paintings.

## Adding a hallway room (brief 004 round 2): data only

1. Put the image at `public/art/rooms/hallway-<id>.webp`: **1536 x 1024 px**,
   WebP, the painting already composited in (frontal, uncropped), same scene
   calibration as 05 and 40 (4.25 px/cm, floor line 790, centred at x 768).
2. Add one line to `lib/hallway-rooms.json`:
   `{ "id": "<id>", "work": "<work id from lib/works.ts>", "cm": <longest side in cm, default 91.4> }`.
   Optional overrides if a scene differs: `w`, `h`, `pxPerCm`, `floor`, `cx`.
3. Run `npm run check:rooms` (fails on a missing image, unknown work id or
   duplicate id). No code change; the room appears on that painting's page,
   labelled "Virtual room study", sized against the assumed 120 cm console.
A thumbnail (`hallway-<id>-thumb.webp`) is not needed: with one room per painting
the picker is not shown. A hallway entry replaces that painting's own tailored
room on the website (as 40 does).

**Second scene, "see it in your room" (019 Part 4, 20 Oct 2026):** the sunlit
console room, 1920 x 1080, image `public/art/rooms/console-<id>.webp` (+ `-thumb`),
entry `{ "id": "<id>", "work": "...", "room": "console", "cm": ..., "w": 1920, "h": 1080, "pxPerCm": ..., "floor": ..., "cx": ... }`.
Labelled "A sunlit living room", captioned "Virtual room study". Its sizes are the
Painting Master placeholders (unconfirmed). Source, crop and scale for each image:
`Team Handoffs/019-last-call-plates/outputs/see-in-room/MANIFEST.json` in the project folder.
Hallway images 03, 14, 15-18, 27, 38, 41 are round 3 (tighter camera); 05 and 40 stay round 2.
