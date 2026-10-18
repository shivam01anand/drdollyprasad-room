# Website backlog

The live list of what is still wrong or missing on drdollyprasad.com. It is
not an instruction to build anything today. Every team reads it, adds to it,
and works from it in the next website run.

Last updated 18 October 2026 (evening): backlog sprint on branch
`backlog-2026-10-18`, which builds on PR #7 (`content-round-2`). Critique pass 1
is below; items marked **Built** are on the sprint preview and leave this file
when Shubham makes them live.

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

## Backlog sprint, 18 October 2026: critique pass 1

**Method.** Website test (skill `website-test`, lean run: 9 key pages at 390 px
and 1440 px). The live domain could not be reached from the build machine
(network policy), so "live" was measured on a production build of `main`
(identical code to drdollyprasad.com). The branch starts from PR #7, which
already carries the round 2 plan A and B items, so PR #7 was measured too.

| Measure (9 pages) | Live (`main`) | PR #7 |
|---|---|---|
| Worst layout shift (CLS) | 0.754 home, 0.70 collections, 0.67 works | 0.16 exhibitions |
| Home transfer, phone | 4.2 MB | 4.3 MB |
| About / Exhibitions transfer, phone | 0.9 / 4.3 MB | 4.8 / 3.0 MB |
| Phone tap targets under 44 px (sum) | 168 | 145 |
| Type sizes on one page (most) | 22 | 22 |
| Accessibility (axe) issues | 9 (incl. 1 critical) | 2 (contrast, About) |
| Enquiry form sends by itself | No: opens mail app | No: opens mail app |

Each finding: what, where, why, exact fix, priority (P0 must, P1 should, P2
nice). The merged list at the end is what this sprint builds.

### Brand (owner of the whole site)

1. **The painting does not fill the first screen.** Painting pages, both
   sizes. Shubham's ask; the art is the product. On a phone the painting sits
   at 62% of the screen under the title, lead and breadcrumb; on a computer it
   is boxed to 600 px. Fix: the painting fills the first screen (title and
   label only above it), tap or click zooms, pinch zooms on a phone; the room
   view is the second view. **P0.**
2. **Running pictures behind the page titles are missing (B5).** Works,
   Collections, Exhibitions. Shubham's round 3 review reverses round 2's "wall
   on home only". Fix: a short, softly blurred moving band with the title card
   on it; content must still show on the first screen. **P1.**
3. **Carousel edges fade and blur (B2).** Every moving row and the Instagram
   strip. Shubham: edges must be crisp. Fix: remove the edge masks. **P1.**
4. **Two taglines on the home first screen.** Header ("The everyday, held
   sacred.") and the home card say the same line twice. Round 2: one tagline.
   Fix: the card drops it; the header carries it. **P1.**
5. **Too many type voices (B3).** Up to 22 font sizes on one page; 14
   uppercase styles; text links, tabs and form labels all in spaced capitals.
   Fix: snap to a seven-step scale (13, 15, 17, 19, 24, section and page
   titles) and keep small capitals for eyebrows, buttons and filters only
   (about half). **P1.**
6. **Exhibitions opens on blocks, not shows (B6).** The rust Now showing box,
   the beige 18/4/3 number blocks and a 70-word lede push the first show below
   the fold (7 screens on a computer, 10 on a phone). Fix: moving band with a
   centre card carrying the summary, one slim Now showing line, then the
   shows. **P1.**
7. **Slideshow tabs are heavy (B8).** Exhibitions. Fix: small text tabs with
   an underline, 44 px tall to tap. **P1.**
8. **"Artist's statement" is not hers.** About. An artist's statement is by
   the artist; this one is written about her in the third person. Fix: label
   it "The work". **P1.**
9. **Borders (B1).** Every page. The quiet diamond rule is rejected; no
   replacement exists yet. Needs ChatGPT design (commissioned border). **P1,
   not buildable this sprint.**
10. **Glass behind pictures (B4).** Cards and carousels still sit on flat
    stone. Wait for ChatGPT's brief 004 mocks so it is designed once. **P2.**

### Content (first full read of every page)

1. **About tells a story we cannot support.** About, "From the hospital to the
   easel". It says she *began* as a doctor and *turned* to painting, and
   describes patients "counting their days". The brand record says she is a
   *practising* doctor and a self-taught painter; when and why she started is
   an open question. Invented biography. Fix: slim to what is recorded (a
   doctor and a self-taught painter; the play of emotion on faces has always
   held her), and put the full story on the Needs Mummy list. **P0.**
2. **Home: "from Triveni Kala Sangam to the First International Kala Mela".**
   Home, On the walls. Implies Triveni (2007) was first; her record starts in
   2005 and ends with Jaipur, October 2018. Fix: "2005 to 2018, among them
   India Habitat Centre, ICCR and the First International Kala Mela." **P1.**
3. **Exhibition names in four forms (B7).** "An evening at India Habitat
   Centre", "A Lifetime to Paint", "First International Kala Mela", "Recent
   paintings, with Sangeeta Sharma", with "Exhibition" repeated as a large
   label. Fix: the heading is the show's own name where it has one, otherwise
   the venue; the kind and date go in one small line ("Exhibition · November
   2010"). Conflict noted: B7 asked for "Exhibition at …" headings, but also
   asked for the word not to repeat; the small label keeps it once. **P1.**
4. **Exhibitions lede repeats About.** The venue list and "covered on
   television and in the papers" appear in the Exhibitions lede, the In the
   news intro and About. Fix: the lede goes (its message moves into the band's
   card); In the news keeps the press line. **P1.**
5. **Price on request twice on Enquire.** Lede and side note. Fix: keep the
   lede. **P1.**
6. **The 18/4/3 facts repeat the record.** Exhibitions. 18 is the record's own
   heading; "3 continents" is on About. Fix: one line in the band's card. **P1.**
7. **Painting page names the collection twice in the first lines.** Breadcrumb
   and label line both link it. Fix: the label line keeps it; the breadcrumb
   is dropped on a phone, where the first screen is for the painting. **P2.**
8. **Her pull line and the full text repeat on painting pages.** The lead
   repeats a sentence that the In her words tab gives in full. Keep (it is the
   hook), noted only. **P2, no change.**
9. **City names in the record ("Delhi" and "New Delhi").** It is her list as
   she gives it; leave until she confirms. **P2, Needs Mummy.**
10. **Still open from earlier rounds (Needs Mummy):** her own "From the
    artist" line; a name for Recent work ("Onset of Spring" is ours);
    Terracotta's year; visit hours for Sacred Fragments; Threads of Faith's
    orientation; the hospital story in her words.

### Tech

1. **Enquiry form does not send.** Enquire. It opens the visitor's mail app
   (the test confirms no request is made). Fix: the form posts to the site's
   own `/api/enquire`; that sends through Resend when `RESEND_API_KEY` is set
   in Vercel (free tier; no DNS needed if the Resend account uses
   drdollyprasad@gmail.com, which is where enquiries go). Until the key is
   set, it falls back to today's mail-app step, so nothing breaks. Includes a
   hidden spam trap. **P0 (code), decision for the key.**
2. **Layout shift on Exhibitions, 0.16.** Cause: Now showing is drawn only
   after the page loads (`Until` renders nothing on the server), pushing
   everything down; slideshow photos have no reserved size. Same cause on the
   home strip and painting pages. Fix: render dated items on the server and
   only remove them in the browser once past their date; give slideshow
   photos width and height. **P0.**
3. **Painting zoom exists only in the 3D studio.** `components/Lightbox.tsx` +
   `lib/closelook.ts`. Fix: a full-screen viewer for painting pages that reuses
   `CloseLook` (click or tap to zoom at the point, wheel and trackpad pinch),
   with touch pinch added, Esc and the back gesture to close, and the 2000 px
   file loaded on first zoom. **P0.**
4. **Image weight.** Exhibition photographs are 1500 px at about 200 KB each
   (5.9 MB in all); About's rolls load 1100 px painting files (about 250 KB
   each, 4.8 MB page); slideshow thumbnails load the full photograph. Fix:
   re-encode exhibition photos at 1200 px (5.9 to 2.6 MB), use the 640 px
   thumbnails in rolls, and 320 px thumbnails in slideshow strips. **P1.**
5. **Tap targets under 44 px on a phone.** Text links (21 px), footer links
   (23 px), breadcrumb, Share/Instagram row, painting-page tabs (34 px), About
   roll dots (9 px), theme tabs (37 px), exhibition "On the walls" links and
   record links. Fix: 44 px minimum touch height on phones, without changing
   how they look. **P1.**
6. **Text under 13 px.** 11 to 12.5 px labels on cards, tiles and filters. Fix:
   13 px floor (part of Brand 5). **P1.**
7. **Contrast on About (axe).** Only on elements still waiting to reveal; fix
   by revealing on load what is already near the screen. Check again on the
   preview. **P2.**
8. **Pictures without reserved size.** Story chapter images, slideshows, the
   press clipping. Fix: width and height from the image manifest. **P1.**

### Merged build list (duplicates removed)

| # | Item | From | Priority | Status |
|---|---|---|---|---|
| S1 | Painting fills the first screen; tap, click, wheel and pinch zoom; room second | Brand 1, Tech 3 | P0 | Built |
| S2 | Enquiry posts and sends itself when the key is set; mail-app fallback | Tech 1 | P0 | Built (key = decision) |
| S3 | About opening slimmed to recorded facts; "The work" label | Content 1, Brand 8 | P0 | Built |
| S4 | Dated items rendered on the server; reserved image sizes | Tech 2, 8 | P0 | Built |
| S5 | Moving bands behind Works, Collections, Exhibitions titles | Brand 2 | P1 | Built |
| S6 | Exhibitions: summary in the band card, slim Now showing, blocks and lede gone, small tabs, one name format | Brand 6, 7; Content 3, 4, 6 | P1 | Built |
| S7 | Crisp carousel edges | Brand 3 | P1 | Built |
| S8 | One tagline on home; home exhibitions line; price once on Enquire | Brand 4; Content 2, 5 | P1 | Built |
| S9 | Seven-step type scale, 13 px floor, half the small capitals | Brand 5, Tech 6 | P1 | Built |
| S10 | Image weight | Tech 4 | P1 | Built |
| S11 | 44 px tap targets on phones | Tech 5 | P1 | Built |
| S12a | Exhibitions jump links one row on phones; small photos in a smaller box | Pass 2 | P1 | Built |
| S12 | Borders | Brand 9 | P1 | Needs ChatGPT design |
| S13 | Glass behind pictures | Brand 10 | P2 | Needs ChatGPT design |

### Critique pass 2 (on the sprint build) and results

Pass 2 found, and fixed: on a phone the painting's box was a fixed 70% of the
screen, so a landscape painting floated in a tall blurred box (now the box fits
the painting, which sits right under its title); small photographs filled a
large box (now a smaller one); story-page paintings had no reserved size; the
About theme numbers failed contrast (4.36:1); Share, filters, pager and
buttons were 36 to 42 px on a phone (now 44 px); exhibition jump links wrapped
to four rows on a phone (now one sideways row). Stopped after pass 2 (2-loop
limit).

| Measure (9 pages, 390 and 1440 px) | Live (`main`) | After sprint |
|---|---|---|
| Worst layout shift (CLS) | 0.754 (home) | 0.037 |
| Phone transfer: home / About / Exhibitions | 4.2 / 0.9* / 4.3 MB | 3.5 / 1.8 / 1.7 MB |
| Phone tap targets under 44 px | 148 | 1 |
| Type sizes on the busiest page | 22 | 13 |
| Text under 13 px (instances) | 123 | 0 |
| Accessibility (axe) issues | 9 (1 critical) | 0 |
| Pictures without a reserved size | 230 | 12 |
| Enquiry sends itself | No | Yes, once `RESEND_API_KEY` is set (falls back to the mail app until then) |
| Painting page, phone, painting top edge | below title, lead and crumb | 196 px from the top |

\* Live About measured lighter because its rolls had not yet loaded the
paintings PR #7 added; PR #7's About was 4.8 MB.

### Left after this sprint

- **Needs Mummy:** her own "From the artist" line; her hospital-to-easel story
  in her words (About now says only "a doctor and a self-taught painter");
  a name for Recent work ("Onset of Spring" is ours); Terracotta's year;
  Sacred Fragments visit hours; Threads of Faith's orientation; "Delhi" vs
  "New Delhi" in her record; the WhatsApp number.
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

## Divider asset (brief 005, pick C): what the final files must be

The divider is built and placed (`components/site/Divider.tsx`; home page at
three breaks, Collections page before bands 2 and 4, each collection's story
page before "The paintings in this collection"). It shows **temporary**
crops of the rough (`005-Borders-Rough.jpg`), upscaled 5x from a 25 px figure.
They are a stand-in only and must not go live.

**To drop in the final art, replace these three files, same names, nothing else:**

| Path | Figure |
|---|---|
| `public/site/dividers/reading.png` | reading (home breaks 1 and 4 of the Collections story pages, Collections band 2) |
| `public/site/dividers/praying.png` | praying (home break 2, Collections band 4) |
| `public/site/dividers/seated.png` | seated (home break 3) |

Spec for each: transparent PNG, **170 x 192 px** (3x of the 64 px tall desktop
size; the page shows it 58 px tall on a phone and 70 px on a computer, width
automatic, so keep the same aspect, about 0.885), ink **#26211D** on transparent
(no white halo, no paper tone), a single crisp line weight like the Instagram
Faith border, figure centred and facing inward, 6 to 10 px of clear margin
inside the canvas, under 25 KB each. If the final size differs, change
`DIVIDER_PX` in `Divider.tsx` to match (it sets width/height so there is no
layout shift). One file for all three is fine while only one figure exists.
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
