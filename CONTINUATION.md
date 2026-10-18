# Dr Dolly Prasad: continuation and handover

Updated 18 October 2026. This records the work continued from the original
Claude conversation and the current published website.

## Where the project stands

- Website: <https://drdollyprasad.com>.
- Repository: <https://github.com/shivam01anand/drdollyprasad-room>.
- Working/default branch: `house`.
- Application implementation through: `f8c2befbbacf0a387309006638f365b626e7245f`.
- Initial 18 October production promotion:
  `dpl_9e7XCkKrkyXzVWBcAdzVw18jkM1Z`. Later GitHub pushes can create newer
  deployments of the same application code.
- Before this release, the custom domain still pointed to the 7 October build,
  `6aad79dc532fde286efa2c0d96b7547c73cabcf6`. The newer versions had been previews.
- On 18 October, the user explicitly requested publishing the latest version.
  The existing preview was promoted, and the custom-domain alias was verified
  against the resulting ready production deployment.

## Resume the original Claude conversation

The original local Claude Code session is:

`e4e0b24d-ba82-4835-ae12-fd73fe010820`

It was verified against the local conversation log, including the October 12
artist-figure work and commit `9223e33`. It started in `/Users/velotio`.

On the original Mac:

```sh
cd /Users/velotio
claude --resume e4e0b24d-ba82-4835-ae12-fd73fe010820
```

Then tell Claude:

> Continue only the Dr Dolly Prasad website in
> /Users/velotio/projects/drdollyprasad-room. First read CONTINUATION.md,
> README.md, docs/scan-preview.md and docs/performance.md. The published site
> includes the continuation work; inspect the current Git state before editing.

This long-running local conversation also contains later work on other
projects. The session ID is local to that Mac; cloning this repository does not
copy the conversation. A new collaborator should start a fresh chat with this
handover file rather than copying the raw conversation archive.

## Changes continued from the Claude work

The continuation started from the artist-at-easel version at `9223e33`. The
final implementation preserves the painting pose and the gallery design.

### Artist likeness and pose

- Reviewed the supplied Scaniverse captures and isolated take 124 from the
  surrounding bed/room. Raw captures remain local and ignored by Git.
- The published figure uses her captured head on the original painting body:
  seated on the stool, looking toward the canvas, holding the brush at the
  painting. The full hands-in-lap seated scan is not the published painter.
- The head alignment, body/head separation, depth and day/night integration,
  plus the generic-head download-failure fallback, are documented in
  [docs/scan-preview.md](docs/scan-preview.md).
- Original arm, hand, brush, body and stool positions and their lightmap UVs
  are retained. Fine hair/ear detail remains limited by the supplied capture.

### Interaction and loading

- Removed the shake-the-room controls and motion-permission flow.
- Fixed Contact navigation from the phone menu by releasing its scroll lock
  before navigating.
- Served the existing fonts locally and scoped welcome/studio preloads to the
  home page, so individual painting pages do not preload the entire studio.
- Started model, manifest, surfaces and near-room photographs concurrently;
  reused the welcome hero image inside the house.
- Moved painting relief arithmetic to a worker where supported, retained the
  fallback, and kept background image work moving without batch waterfalls.
- Reduced repeated stationary wall-label work and made header luminance reads
  asynchronous on supported WebGL 2 browsers.

### Phone composition and camera continuity

- Phone stops now fit the full labelled painting groups, including frame
  edges, at the viewport's aspect ratio.
- Desktop camera composition remains unchanged from the pre-phone-fit version.
- Restored the intended 1.6-second touch-scroll glide and 2.6-second camera
  step limit; removed the later desktop auto-snap.
- Layout measurements no longer finish an in-progress camera glide. Genuine
  resizes preserve and remap progress; phone browser-bar height changes are
  coalesced before resizing GPU targets.
- Off-screen artist-head work is culled. Background texture uploads and
  relief attachments wait for a resting camera where possible.

Implementation detail and measurement limits are in
[docs/performance.md](docs/performance.md).

### Commit map

| Commit | Work |
| --- | --- |
| `518feda` | Local scan review behind explicit opt-in |
| `286624c` | Isolate take 124 from its surroundings |
| `6837a3b` | Initial isolated-scan integration; painter pose later corrected below |
| `f0d666b` | Adapt her likeness to the original painting pose |
| `8ba9d33` | Remove shake-the-room controls |
| `d398ee4` | Loading waterfalls and worker-based painting relief |
| `53e0143` | Home-page-only studio preloads |
| `2acd359` | Phone menu Contact/scroll-lock fix |
| `f8c2bef` | Full phone painting groups and uninterrupted camera glides |

## Validation and remaining work

Passed on 18 October:

- `npm run build`: compilation, TypeScript validation and all 49 static routes.
- `npm run check:motion`: 120 phone group compositions, reduced-motion cases,
  30/60/120 Hz simulated camera updates and resize continuity.
- Production deployment is ready, and `drdollyprasad.com` resolves to that
  deployment. The home page, a painting page, sitemap and robots file return
  HTTP 200 without authentication.
- Earlier checks compared desktop camera matrices at 2,595 positions across
  three viewport sizes and checked source asset preservation.

Browser automation is disconnected on the original Mac. There has not been a
new measured real-browser FPS profile or complete real-phone regression pass.
The motion checks are geometric/simulated tests, not proof that every device
will render without dropped frames. Follow up with actual phone/desktop
profiling, including all gallery stops, Contact, lightbox, zoom, filters,
day/night and returning to the studio.

## Collaboration and publishing

On 18 October, the user explicitly approved making **only this repository
public** to allow collaboration without an additional Vercel deploying seat.
Other personal repositories are handled separately and are not shared through
this project. Tracked environment files were absent from both the current tree
and Git history; a targeted scan of the current text files found no common
credential patterns. This is not an exhaustive security audit.

GitHub user `shubhamanand0412` was invited as a collaborator with **write**
permission. The invitation must be accepted before he can push. Ownership
transfer is unnecessary. No Vercel team membership or paid seat was added.

The repository is connected to the existing Vercel project `drdollyprasad`.
The intended production branch is **`house`**, not `main`:

- Push to `house`: Vercel builds and publishes to `drdollyprasad.com` after a
  successful deployment.
- Push to a feature branch: use its Vercel preview to review the change.
- Merge the feature branch into `house` when it should go live.

Keep this repository public for free Vercel collaboration. Making it private
again changes that arrangement: Vercel requires private-repository commit
authors to belong to the deploying team, and hooks/CLI automation do not remove
that requirement. Avoid adding a general account-wide token to GitHub Actions;
the native Vercel connection handles deployment without sharing such a token.

References:

- <https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/repository-access-and-collaboration/inviting-collaborators-to-a-personal-repository>
- <https://vercel.com/docs/deployments/troubleshoot-project-collaboration>
- <https://vercel.com/docs/git/vercel-for-github>

For a fresh local checkout:

```sh
git clone https://github.com/shivam01anand/drdollyprasad-room.git
cd drdollyprasad-room
git switch house
npm ci
npm run dev
```

Read [README.md](README.md) for the application structure and Blender workflow.
Keep the raw scans and local review outputs out of commits. Use the actual
artist wording and confirmed catalogue details when editing content.

## Content handoff and the strategy PDF

An Instagram kit was assembled locally on the original Mac, with a separate
`06_EXHIBITIONS_AND_INTERVIEWS` folder containing the official Sacred Fragments
poster, two catalogue-submission work images, archive interview/gallery photos,
an 18-entry exhibition/participation timeline and captions. The archive photo
dates/venues are not confirmed. Actual interview recordings were not located.
Drive upload was not completed because the Drive integration was unavailable.

The supplied 40-page Claude website strategy review was read. Its larger
information-architecture redesign is a proposal, not an implementation included
in this continuation. Check the current code before adopting findings from that
review: the published continuation already includes individual painting pages,
sitemap/robots routes and subsequent mobile/performance changes.
