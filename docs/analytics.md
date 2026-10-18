# Visitor analytics

PostHog covers the latest conventional website and the 3D studio at `/studio`.
The working **public capture token from the live Book2Kindle browser tracker** is
stored in this Vercel project's production and preview environment variables.
It writes into the US PostHog project **672709** ("Dolly.creates", owned by Shubham) from 18 Oct 2026; earlier data stays in project **317586**. No personal
API key is included in the frontend or committed to Git.

Every event carries `app_name: drdollyprasad`, its `analytics_environment`
(`production`, `preview` or `local`), and `is_test`. Use all three filters in
[the prepared analytics views](analytics-views.md). Those links open unsaved
queries, rather than claiming a saved dashboard already exists.

## What to investigate

- Visitors and returning anonymous browsers; city/country, device, browser/OS,
  referring domain and UTM campaign properties are available in PostHog.
- Which paintings people click and actually open, including the studio lightbox.
- Collection/status/size filters, pagination, painting/room view switches and
  successful sharing or copying of a painting link.
- Email/WhatsApp handoffs, form starts, copying an enquiry message, and Instagram
  links. A handoff does **not** prove the visitor sent the message.
- Exhibition video starts/completions, studio load failures, settled studio
  chapters, scroll milestones, foreground-tab time and last observed pages.
- Masked session replays. The existing project's remote configuration was
  checked: recording is enabled but its automatic URL trigger matches only
  Book2Kindle. Dolly starts recording with an SDK URL-trigger override for each
  session (including idle-session rotation), subject to the capture opt-out.
  A session ID alone is not proof its replay
  uploaded successfully; use recordings actually listed in PostHog.

## Events

| Event | Observation |
| --- | --- |
| `$pageview` | One per Next route, including the first arrival. Changing catalogue filters does not add pageviews. |
| `painting_clicked` | A painting link or 3D canvas painting was clicked. |
| `painting_viewed` | A painting page mounted or a studio lightbox opened; includes title, ID, collection and availability. |
| `painting_view_changed`, `painting_shared` | Room/painting view chosen; native share completed or link copied. |
| `painting_closed` | A studio lightbox was closed; includes seconds since that painting opened. Automatic room slides do not count as manual view choices. |
| `works_viewed`, `works_filter_changed`, `works_page_changed` | Catalogue visit, filter choice and pagination. |
| `collection_viewed` | A collection page mounted. |
| `enquiry_clicked`, `enquiry_viewed`, `enquiry_started` | Contact link intent, enquiry page and first form focus. |
| `enquiry_handoff` | Email or WhatsApp opened; includes method, source and painting when known. |
| `contact_copied`, `enquiry_message_copied` | Copy succeeded; the copied content is not sent to analytics. |
| `studio_viewed`, `studio_clicked`, `studio_load_started`, `studio_ready`, `studio_load_failed` | Studio entry and loading outcome/timing. |
| `studio_chapter_viewed` | A chapter stayed selected for 700 ms; includes chapter and room. |
| `navigation_clicked`, `outbound_link_clicked`, `control_clicked` | Navigation, external destination and public button labels. |
| `video_played`, `video_completed` | A visitor played or finished an exhibition video. |
| `page_scrolled`, `page_engagement` | Depth milestones and cumulative visibility snapshots keyed by `page_view_id`. |

## Privacy and interpretation

Visitors are anonymous browser IDs, not verified names. Clearing storage or
using another device can create another visitor. Names, phone/email input,
message text and copied message contents are not analytics event properties.
Replay masks inputs; network headers/bodies, console capture and canvas frame
recording are disabled. The 3D studio's canvas is not reproduced in replay;
its stage and moving wall labels are blocked from replay mutation recording.
Chapter and painting events describe its journey while the painting lightbox
remains recordable. Approximate IP-based location can be affected by VPNs/mobile networks.

Only catalogue/UTM query parameters are retained in analytics URLs. Page
engagement measures foreground-tab visibility, not attention, and can have
multiple cumulative checkpoints. The prepared dwell-time query deduplicates
them by page visit. Hidden tabs and last observed pages are not proof of
abandonment. Ad blockers, Do Not Track and browser termination can prevent
some events or recordings. Data begins with the analytics deployment; it cannot
reconstruct earlier visits.

## Configuration and maintenance

| Vercel variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_POSTHOG_KEY` | Public project capture token; required to enable tracking. |
| `NEXT_PUBLIC_POSTHOG_HOST` | Ingestion host; currently `https://us.i.posthog.com`. |
| `NEXT_PUBLIC_POSTHOG_UI_HOST` | App host; currently `https://us.posthog.com`. |

Without the public key, local development does not collect analytics. An
optional `?analytics_test=1` marks that tab's session as test traffic, across
navigation; use `?analytics_test=0` to clear it. Previews are tagged separately
and excluded from the prepared production views. Removing the capture key
and rebuilding disables the integration.

`node scripts/setup-posthog.cjs --links` regenerates the prepared links. To
validate the queries against PostHog and save the dashboard, provide a valid
server-side `POSTHOG_PERSONAL_API_KEY` (`phx_…`) with query, dashboard and insight
permissions, plus `POSTHOG_PROJECT_ID=317586`, then run
`node --env-file=.env.local scripts/setup-posthog.cjs`. This setup script is
never imported into the site. It only manages objects tagged
`managed:drdollyprasad-analytics`.

## Validation

`npm run check:analytics` runs browser-DOM/React journeys with a test SDK sink:
deferred first clicks, SPA navigation, filters without duplicate pageviews,
painting-to-enquiry attribution, actual form/copy behaviour, exclusion of private
input, handoff semantics, sharing and listener cleanup. It is not a real-device
or visual-browser test. Run `npm run check:motion` and `npm run build` as well.

A separate smoke check using the real PostHog SDK accepted tagged test
pageview, painting-click and verification requests with HTTP 200. After the
shared-project URL-trigger override, it also emitted an actual `$snapshot` and
the recording upload endpoint returned HTTP 200. Playback of a stored recording
still requires authenticated verification in PostHog. Test sessions are excluded
from the prepared production views.

The SDK is a separate asynchronous chunk, initiated after hydration. Explicit
events replace broad DOM autocapture, scroll work is throttled and the studio
does not add analytics to its rendering loop. Replays load through the SDK's
existing remote recording configuration.
