# CLAUDE.md

## Never freeze the owner's computer

The owner uses this machine while you work. A command that takes every core makes it unusable,
and that is worse than any wait. **Slower is always acceptable; a frozen desktop never is.**

- **Builds:** `nice -n 19 npm run build`. Image processing is the heavy part of it.
- **Tests:** `nice -n 19 npx vitest run --maxWorkers=2` and `nice -n 19 npm run e2e -- --workers=1`.
  Run one file or one `--grep` while iterating, and the whole suite once at the end.
- **The comparison pictures** (`npm run shots`) only at the end of a phase or when the owner asks,
  under `nice`, with one worker.
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
- Romanian is written with the comma below: ș and ț, never ş and ţ.
- The Romanian words for the game are the desktop client's (the plan's section 7.2): mână for a
  trick, licitație, atu, culoarea de jos, Fruntea, Neveul, Socotitor. Don't invent new ones; ask.
- Every link to a page of the site goes through `localizedPath()`, never a hand-written `href`.

## Branch workflow

Work goes on a branch off `master` and is PR'd against `master`, one branch per phase,
`site/phase-N-<name>`. When running `/code-review` on a branch, diff against `master`, or pass the
PR number so GitHub's base branch is used. The review procedure is in section 15 of
`docs/site-plan.md`.

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

1. Take the pictures: `nice -n 19 npm run shots`. It writes each page in both languages at 1440 px,
   full height, and at 390 px, into `build/shots/<name>/`, plus the mock-up's three moments (the
   screenshot viewer open, the language menu open, Downloads with Linux picked).
2. It pairs each 1440 px picture with the mock-up's of the same name in
   `docs/site-mockup/screenshots/`: the site on the left, the mock-up on the right, each labelled,
   as `build/shots/<name>/compare-<name>.png`. `build/` is git-ignored, so these are never
   committed. Add a close-up of any part where the two differ: a whole page is small.
3. Link the comparisons, and the 390 px pictures on their own (the mock-up has none). Add a line or
   two on what matches the mock-up and what still differs.

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
