# CLAUDE.md

## Never freeze the owner's computer

The owner uses this machine while you work. A command that takes every core makes it unusable,
and that is worse than any wait. **Slower is always acceptable; a frozen desktop never is.**

- **Builds:** `nice -n 19 npm run build`. Image processing is the heavy part of it, so the build
  script sets `UV_THREADPOOL_SIZE=2` and `VIPS_CONCURRENCY=1`, and so does the Dockerfile, where the
  build also runs under `nice -n 19`. Never raise them, and never run Astro's build without them.
- **Tests:** `nice -n 19 npx vitest run --maxWorkers=2` and `nice -n 19 npm run e2e -- --workers=1`.
  Run one file or one `--grep` while iterating, and the whole suite once at the end.
- **The comparison pictures** (`npm run shots`) only at the end of a phase or when the owner asks,
  under `nice`, with one worker.
- **Docker:** one image build at a time, in the background: `docker compose build site`, then
  `docker compose up site`. Never `up --build` alongside another build.
- **One heavy command at a time.** Never a build and the browser tests at once.
- **Long jobs go in the background** (`run_in_background`), still under `nice`, so the owner can
  keep working and can stop them.

## Comments

- A comment says why the code is the way it is, when the code cannot say it. One to three lines.
- Never mention phases, plan sections, PR numbers, review findings, dates or who decided something.
  That is history, and history goes in the commit message.
- Never describe code that was removed or what the code used to do.
- No capitals for emphasis. Keep the warnings that prevent a crash, a deadlock or a hang, and make
  them short.
- Say a reason once, next to the code it explains. Don't send the reader to another function.

This applies to every comment you write or change. Existing comments that break it are cleaned up
in PRs of their own, one area at a time, not mixed into unrelated changes.

## The plan and the mock-up

`docs/site-plan.md` is the plan: read it before starting a phase, and write the phase's outcome
under it when the phase closes. `docs/site-mockup/` is the design: how every page looks and what it
says, in both languages. Where the code and the mock-up differ, the mock-up wins, except for the
departures in section 2.1 of the plan. Any other difference is the owner's to accept: show the two
pictures side by side and ask.

## Text in two languages

- Every word a visitor sees is in `src/i18n/en.ts` and `src/i18n/ro.ts`, never in a component.
  A change to one is a change to both, in the same commit.
- Romanian is the default language: its pages are at the root, English is under `/en/`.
- The game is called Romanian Whist in English and Whist in Romanian.
- Romanian is written with the comma below: ș and ț, never ş and ţ.
- The Romanian words for the game are the desktop client's (the plan's section 7.2): mână for a
  trick, licitație, atu, culoarea de jos, Fruntea, Neveul, Socotitor, adversari AI. Don't invent new
  ones; ask.
- Every link to a page of the site goes through `localizedPath()`, never a hand-written `href`.

## Versions

Use the latest release of every framework, library, tool, GitHub Action and Docker image, unless
there is a good reason not to. Each phase starts by checking for newer ones and updating, in a
commit of its own. A version held back goes in the plan's section 3.1 with its reason, and is
checked again at the next phase.

## Branch workflow

Branches are stacked: `master` -> the feature branch, `site/v1` -> `site/phase-N-<name>`.

- Each phase's branch comes off the feature branch, and its PR is against the feature branch,
  never `master`. When running `/code-review` on a phase branch, diff against the feature branch,
  or pass the PR number so GitHub's base branch is used.
- When every phase is merged, the feature branch is PR'd into `master`, and `master` is tagged with
  the version in `package.json` (`v1.0.0`). Each release after that is a tag on `master`, and the
  tag must match `package.json`.

## How each phase runs

1. **Plan.** The phase starts in plan mode, with the main agent on opus at high or xhigh effort
   (fable when the subscription offers it). Read the plan and the mock-up, check versions, and
   write the phase's detailed plan for the owner to approve. Nothing is written before that.
2. **Implement.** A sub-agent on sonnet at xhigh effort (`model: "sonnet"`, `effort: "xhigh"`)
   builds the approved plan on the phase branch and runs the checks and tests. Use a better way if
   one comes along, and say so.
3. **Open the PR** against the feature branch, with the comparison pictures for a visual phase.
4. **Review.** A separate sub-agent on opus at xhigh effort (`model: "opus"`, `effort: "xhigh"`)
   reviews the PR. It is a fresh agent, never a fork: it inherits none of the main agent's or the
   implementer's context, and it is read-only. Its prompt holds only the repository, the phase
   branch and the feature branch, the phase's requirements as they stand on the feature branch,
   this file, and the rating scales: severity from cosmetic (1) through an edge case (3) to a
   broken page or a wrong download (5); fix complexity from a line or two (1) through a new test
   (3) to a redesign (5).
5. **Report.** Put the findings in a table with both ratings, check each one against the code, and
   recommend, for each: fix now, defer (written in the plan as later work), or open a GitHub
   issue, with the order of the fixes. **The owner has the final say.** Fix nothing before they
   decide.
6. **Fix.** The same sonnet xhigh implementer makes the fixes (resume it; start a new one on sonnet
   at xhigh if it is gone). Then the checks, the tests and CI run again.
7. **Another round?** After each round of fixes, say whether you recommend another review, and why.
   Complex fixes usually need one. Another round is run the same way, by a fresh opus xhigh
   reviewer, of the fix commits. The owner decides.
8. **Write the outcome** under the phase in the plan, only after the reviews, so no reviewer reads
   an account of the work.
9. **Merge.** Ask the owner first, every time, then merge the phase's PR into the feature branch
   with a merge commit.

## Changing a PR: never `gh pr edit`

`gh pr edit` fails on the owner's repositories, with "GraphQL: Projects (classic) is being
deprecated …", and changes nothing. Don't try it first. Change a PR's description or title through
the REST API from the start, with the body written to a file:

```
gh api -X PATCH repos/conectionist/romanian_whist_site/pulls/<N> -F body=@<file>
gh api -X PATCH repos/conectionist/romanian_whist_site/pulls/<N> -f title='<title>'
```

`gh pr view` and `gh pr create` work as usual.

## End of every visual phase: show the owner side-by-side pictures

The owner wants to see each phase's result without running the site. A phase that changes how a
page looks ends with these in its closing message:

1. Take the pictures: `nice -n 19 npm run shots`. It writes each page in both languages at 1440 px
   and at 390 px, full height, into `build/shots/<phase>/` (`phase-2` and so on), plus the
   mock-up's moments (the screenshot viewer open, wide and on a phone; the language menu open; the
   phone menu open; Downloads with Linux and with macOS picked).
2. It pairs each picture with the mock-up's of the same name in `docs/site-mockup/screenshots/`:
   the site on the left, the mock-up on the right, each labelled, as
   `build/shots/<phase>/compare-<page>.png`, where `<page>` is the picture's name, such as
   `en-home`. `build/` is git-ignored, so these are never committed.
   Add a close-up of any part where the two differ: a whole page is small.
3. Link the comparisons, wide and phone. Add a line or two on what matches the mock-up and what
   still differs.

If a phase's pictures are identical to the previous phase's, say so, and still link them.

## Explaining something visual: text first, then offer a recording

When something visual needs explaining and isn't obvious, explain it in text first, with a
screenshot if that helps. Then **offer** to show it moving. Don't record unless the owner says yes.

When the owner says yes, record the site itself, not the owner's screen: a short Playwright script
in the scratchpad that opens the page with `recordVideo`, moves the mouse in small steps so hover
states show, and clicks only what the demo needs. Turn the video into a GIF:

```
nice -n 19 ffmpeg -y -loglevel error -i demo.webm \
    -vf "fps=12,scale=780:-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse" demo.gif
```

Put two or three labelled stills beside it with Pillow, enlarged around the spot that matters, and
link the GIF and the stills with a line for each. Keep everything in the scratchpad, never in the
repo.
