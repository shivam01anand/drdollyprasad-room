# Making changes: preview first, then publish

The website is built from this GitHub repository by Vercel. Claude Code edits
the local files; Git branches determine which changes are previews and which
are published to <https://drdollyprasad.com>.

| Action | Result |
| --- | --- |
| Edit files or commit locally | Stays on your computer |
| Push a branch other than `main` | Vercel creates a preview; the main website stays unchanged |
| Push to `main`, or merge a pull request into `main` | Vercel builds and publishes the successful deployment to drdollyprasad.com |

The production/default branch is **`main`**. `house` is retained as the original
development branch; pushing it creates a preview.

Preview links open without a Vercel login and can be shared for review. A preview
has its own Vercel URL; the public domain continues to show the production build.

## First time on your own computer

```sh
git clone https://github.com/shivam01anand/drdollyprasad-room.git
cd drdollyprasad-room
npm ci
npm run dev
```

Authenticate GitHub as your own account when pushing. `shubhamanand0412` has
accepted the repository invitation and has write access. No ownership transfer,
Vercel team membership or additional deploying seat is needed while this
repository is public.

## Each change

1. Start from the latest production branch and make a new branch:

   ```sh
   git switch main
   git pull --ff-only origin main
   git switch -c shubham/contact-update
   ```

   Pick a different descriptive branch name for each piece of work.

2. Use Claude Code to edit that branch. Check the site locally with
   `npm run dev`.

3. Before pushing, run the existing checks:

   ```sh
   npm run check:motion
   npm run build
   ```

4. Commit the intended files, then push the branch:

   ```sh
   git add path/to/changed-file
   git commit -m "Describe the change"
   git push -u origin shubham/contact-update
   ```

5. Open a pull request on GitHub with **base `main`**. The Vercel deployment
   check/comment links to the preview. Share that link and review the change on
   phone and desktop.

6. When ready to publish, merge the pull request into `main`. Vercel builds it
   automatically. A failed build leaves the previous working deployment live.
   A successful production deployment updates drdollyprasad.com.

## Prompt to give Claude Code

> Read README.md, CONTINUATION.md and CONTRIBUTING.md. Start from the latest
> main and create a feature branch for my change. Make the change, run the
> existing motion check and production build, push the feature branch, and open
> a pull request into main. Give me the Vercel preview link. Do not merge the
> pull request or push to main until I explicitly ask you to publish.

## Current publishing permissions

`main` is currently **not protected by a required review rule**. A collaborator
with write access can push directly to it or merge a pull request, and either
action can publish. The preview/review flow above is the recommended working
process; it is not an enforced approval gate.

Keep raw scans, local review outputs and environment files out of commits. The
Blender/figure source and known validation limits are covered in
[CONTINUATION.md](CONTINUATION.md) and [README.md](README.md).
