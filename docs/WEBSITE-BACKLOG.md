# Website backlog

The live list of what is still wrong or missing on drdollyprasad.com. It is
not an instruction to build anything today. Every team reads it, adds to it,
and works from it in the next website run.

Last updated 18 October 2026, from Shubham's review of the preview for PR #7
(branch `content-round-2`).

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

## Open items

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
