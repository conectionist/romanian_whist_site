# Website mock-up

The design the website is built to, approved by the owner on 2026-11-26. The plan that builds it is
[`../site-plan.md`](../site-plan.md).

It was drawn as a design canvas on claude.ai:
<https://claude.ai/artifact/2wC9URywqdnL7YrbPTKVSU>. The canvas is private and opens only for the
owner. Everything here is exported from it, so this folder is the reference everyone else uses.

## What is here

| Path | What it is |
|---|---|
| `screenshots/` | Full-page pictures of every page in English (`en-*`) and Romanian (`ro-*`), at 1440 px wide and on a phone (`*-phone`, 390 px at twice the density), and the moments the full pages don't show. **Start here.** |
| `en/`, `ro/` | Every page as static HTML. Open `en/index.html` in a browser, and narrow the window to see the phone layout. It needs a connection only for its fonts |
| `canvas/` | The canvas's own files, unchanged: one `.dc.html` per page and per shared part, and `canvas.json`, the canvas's layout. These hold the exact styles, the phone layout's CSS and both languages' text |
| `assets/` | The pictures the pages use, and `blob-ids.json`, which names the file behind each `/_blob/<id>` in `canvas/` |
| `tools/export_mockup.mjs` | Makes `en/`, `ro/` and `screenshots/` from `canvas/` |

### The pages

| Page | Canvas file | Pictures |
|---|---|---|
| Home | `canvas/Main.dc.html` | `en-home`, `ro-home`, and their `-phone` |
| Downloads | `canvas/Downloads.dc.html` | `en-downloads`, `ro-downloads`, and their `-phone`; `en-downloads-linux` (Linux picked on both cards); `en-downloads-macos` (macOS picked: the experimental warning) |
| Screenshots | `canvas/Screenshots.dc.html` | `en-screenshots`, `ro-screenshots`, and their `-phone`; `en-screenshot-viewer` and `en-screenshot-viewer-phone` (the viewer open) |
| About | `canvas/About.dc.html` | `en-about`, `ro-about`, and their `-phone` |
| Header, on every page | `canvas/Header.dc.html` | `en-language-menu` (the language menu open); `en-menu-phone` (the phone menu open) |
| Footer, on every page | `canvas/Footer.dc.html` | at the foot of every full page |

### Wide and narrow

The pages reflow at two widths, in the CSS at the top of each page's `.dc.html`:

- **880 px and below:** the header's four links fold behind a Menu button; the logo and the language
  menu stay.
- **600 px and below (phones):** the side margins drop to 16 px, every grid is one column, the
  Menu button shows its icon alone, the card fan shrinks, the screenshot filters are two by two,
  and the screenshot viewer's arrows move below the picture.

## What the static pages leave out

On the canvas the pages work, and open in Romanian, the site's default: the language menu
translates them, the Menu button opens, the Windows/Linux/macOS switches change the download, the
screenshot filters filter and a screenshot opens in a viewer. The static export keeps none of that. In it, the globe in the header links to the
same page in the other language, and `screenshots/` shows the moments that need a click.

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
- The classes (`nav-links`, `menu-btn`, `stack-1`, `fan` and the like) exist only for the phone
  layout's CSS.

The plan's section 2.1 lists every place where the site departs from the mock-up on purpose.

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
- **The Android robot** is reproduced or modified from work created and shared by Google and used
  according to terms described in the Creative Commons 3.0 Attribution License. It is drawn inline,
  in the canvas files.

## Exporting again

After a change to the canvas, put its files in `canvas/` (and any new picture in `assets/`, with
its id in `blob-ids.json`), then:

```
node docs/site-mockup/tools/export_mockup.mjs
```

It needs Playwright with Chromium. Once the site's `package.json` exists, its `@playwright/test`
is enough; before that, `npm install --no-save playwright` in the repository, then
`npx playwright install chromium`.
