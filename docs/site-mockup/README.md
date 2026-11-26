# Website mock-up

The design the website is built to, approved by the owner on 2026-11-26. The plan that builds it is
[`../site-plan.md`](../site-plan.md).

It was drawn as a design canvas on claude.ai:
<https://claude.ai/artifact/2wC9URywqdnL7YrbPTKVSU>. The canvas is private and opens only for the
owner. Everything here is exported from it, so this folder is the reference everyone else uses.

## What is here

| Path | What it is |
|---|---|
| `screenshots/` | Full-page pictures of every page at 1440 px wide, in English (`en-*`) and Romanian (`ro-*`), and three moments the full pages don't show. **Start here.** |
| `en/`, `ro/` | Every page as static HTML. Open `en/index.html` in a browser. It needs a connection only for its fonts |
| `canvas/` | The canvas's own files, unchanged: one `.dc.html` per page and per shared part, and `canvas.json`, the canvas's layout. These hold the exact styles and both languages' text |
| `assets/` | The pictures the pages use, and `blob-ids.json`, which names the file behind each `/_blob/<id>` in `canvas/` |
| `tools/export_mockup.mjs` | Makes `en/`, `ro/` and `screenshots/` from `canvas/` |

### The pages

| Page | Canvas file | Pictures |
|---|---|---|
| Home | `canvas/Main.dc.html` | `screenshots/en-home.jpg`, `ro-home.jpg` |
| Downloads | `canvas/Downloads.dc.html` | `en-downloads.jpg`, `ro-downloads.jpg`, `en-downloads-linux.jpg` (Linux picked on both cards) |
| Screenshots | `canvas/Screenshots.dc.html` | `en-screenshots.jpg`, `ro-screenshots.jpg`, `en-screenshot-viewer.jpg` (the viewer open) |
| About | `canvas/About.dc.html` | `en-about.jpg`, `ro-about.jpg` |
| Header, on every page | `canvas/Header.dc.html` | `en-language-menu.jpg` (the language menu open) |
| Footer, on every page | `canvas/Footer.dc.html` | at the foot of every full page |

## What the static pages leave out

On the canvas the pages work: the language menu translates them, the Windows/Linux/macOS switches
change the download, the screenshot filters filter and a screenshot opens in a viewer. The static
export keeps none of that. In it, the globe in the header links to the same page in the other
language, and `screenshots/` shows the moments that need a click.

## Reading the canvas files

Each `.dc.html` is HTML with inline styles, plus a script at the end:

- `{{t.title}}` and the like are filled from the script's `renderVals()`. The text of both
  languages is in its `texts(lang)`, and lists such as the screenshots and the computer opponents
  are in `renderVals()` itself.
- `<sc-for list="{{items}}" as="item">` repeats its content once per item, and
  `<sc-if value="{{flag}}">` shows its content when the flag is true.
- `<dc-import name="Header" …>` places `Header.dc.html` there, with the other attributes as its
  inputs.
- `/_blob/<id>` is a picture: `assets/blob-ids.json` names its file.

## Known flaws, fixed in the build, not here

- **The terminal thumbnails on the Screenshots page are taller than the others.** Each thumbnail
  is meant to be the same 16:10 box, with the terminal pictures shown whole inside it.
- **The pages are drawn for a wide window.** They wrap at phone width but were never designed for
  it. The plan designs the phone layouts.

The plan's section 2 lists every place where the site departs from the mock-up on purpose.

## The pictures

- **The cards** are the desktop client's: [Vector Playing Cards](https://opengameart.org/content/playing-cards-vector-png)
  by Byron Knoll, in the public domain. `card-back.svg` and the felt are the browser client's.
- **The desktop screenshots and GIF** come from `docs/readme/` in `romanian_whist_desktop`, and the
  **terminal ones** from `docs/readme/` in `romanian_whist_terminal`. The desktop GIF here is a
  smaller copy, 760 px wide.
- **The browser screenshots** were taken from the browser client's look page, which draws the game
  from fixtures with no server: in `romanian_whist_web`, `npx vite build --mode look`, then
  `look.html?shot=menu`, `hand-8-cards`, `sheet-online` and `sheet-lobby` at 1920×1080, scaled
  to 1600×900.
- **The fonts** are Playfair Display, Cormorant Garamond and Alegreya Sans, under the SIL Open Font
  License, from Google Fonts.

## Exporting again

After a change to the canvas, put its files in `canvas/` (and any new picture in `assets/`, with
its id in `blob-ids.json`), then:

```
node docs/site-mockup/tools/export_mockup.mjs
```

It needs Playwright with Chromium. Once the site's `package.json` exists, its `@playwright/test`
is enough; before that, `npm install --no-save playwright` in the repository, then
`npx playwright install chromium`.
