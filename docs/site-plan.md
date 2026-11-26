# Romanian Whist website: implementation plan

> **Status: plan, 2026-11-26. Nothing is built yet.** Phase 0, the mock-up and this plan, is the
> pull request that adds this file, against `master`. Once it is merged, the feature branch is made
> from `master` and phase 1 starts on a branch of its own ([§15](#15-phases)). The owner has
> settled the decisions marked "decided" in [§17](#17-decisions-with-defaults); the plan assumes the
> defaults of the others.

This plan is for whoever builds the website: the owner, or an agent picking the work up cold. It
says what to build, where each part of it comes from, in what order, and how to tell each phase is
done. When a phase is finished, its outcome is written under it, as the other repositories' plans
do.

**Read first, in this order**

1. This file, once, top to bottom.
2. The mock-up, [`docs/site-mockup/`](site-mockup/README.md): its README, then every picture in
   `screenshots/`, then `en/index.html` in a browser. **The mock-up is the target for how the site
   looks and what each page says.** The owner approved it on 2026-11-26.
3. The README of each client, because the site describes them: `romanian_whist_desktop` (features,
   the computer players, the download table, credits), `romanian_whist_terminal` (its screens) and
   `romanian_whist_web` (what the browser client does). The site's facts come from there.

---

## Contents

1. [Summary](#1-summary)
2. [The mock-up is the target](#2-the-mock-up-is-the-target)
3. [Technology](#3-technology)
4. [Code layout](#4-code-layout)
5. [The look: tokens and parts](#5-the-look-tokens-and-parts)
6. [The pages](#6-the-pages)
7. [Languages](#7-languages)
8. [Release data](#8-release-data)
9. [Assets](#9-assets)
10. [Accessibility, phones and motion](#10-accessibility-phones-and-motion)
11. [Search engines, sharing and speed](#11-search-engines-sharing-and-speed)
12. [Security and privacy](#12-security-and-privacy)
13. [Testing](#13-testing)
14. [Building, running and deploying](#14-building-running-and-deploying)
15. [Phases](#15-phases)
16. [Risks](#16-risks)
17. [Decisions, with defaults](#17-decisions-with-defaults)
18. [References](#18-references)

---

## 1. Summary

The website introduces Romanian Whist and sends people to it: to play online, to download a client,
to see what it looks like and to learn the rules. It has four pages, each in English and Romanian:

| Page | English | Romanian | What it is for |
|---|---|---|---|
| Home | `/` | `/ro/` | What the game is, how to play in three steps, where to get it |
| Downloads | `/downloads/` | `/ro/downloads/` | The desktop and terminal clients for Windows, Linux and macOS, the browser client, Android to come |
| Screenshots | `/screenshots/` | `/ro/screenshots/` | Real screenshots of every client, filtered by client, with a viewer |
| About | `/about/` | `/ro/about/` | The rules and scoring, the nine computer opponents, the open-source repositories, credits |

Plus a 404 page in each language.

**It is a static site, with no backend.** Nothing changes per visitor and nothing is stored. The one
piece of data that changes, the latest release of each client, is read from GitHub's API when the
site is built ([§8](#8-release-data)). The game's server stays the only backend, and the site only
links to it: **Play Online** goes to `https://whist.akdscloud.eu`.

It is built with **Astro**, as static HTML, CSS and a few small scripts, in TypeScript, with no UI
framework ([§3](#3-technology)). **It runs in Docker:** an image of Caddy serving the built pages,
started with Docker Compose, which is how it will be deployed on the owner's VPS, beside the game's
server; the dev server runs in Docker too ([§14.3](#143-docker)). Until the VPS takes it, the site
is published on GitHub Pages, at `conectionist.github.io/romanian_whist_site`
([§14.4](#144-hosting), D2 and D3).

**It works on phones as well as on wide windows.** The mock-up has both layouts
([§10.2](#102-phones-and-narrow-windows)).

**The game's name** is Romanian Whist in English and Whist in Romanian (D6).

---

## 2. The mock-up is the target

The mock-up decides how the site looks and what it says: colours, type, spacing, every section and
its order, and the copy in both languages. When the code and the mock-up differ, the mock-up wins,
unless the difference is one listed below, the browser forces it, or the owner accepts it.

Its pieces, in [`docs/site-mockup/`](site-mockup/README.md):

- **`screenshots/`**: what each page must look like at 1440 px and on a 390 px phone, in each
  language, and the moments that need a click (the menus open, the viewer open, Linux or macOS
  picked). Every visual phase ends with the site's pictures beside these
  ([§13.5](#135-comparing-with-the-mock-up)).
- **`canvas/*.dc.html`**: the exact values. Each element's inline style is the specification: its
  colours, sizes, gaps, radii and shadows. Each file's `texts(lang)` is the copy in both languages,
  and its `renderVals()` holds the lists (screenshots, opponents, repositories).
- **`en/`, `ro/`**: the same pages as static HTML, to open in a browser and inspect.

The canvas files are a specification, not code to keep. Their inline styles become component CSS
built on the tokens of [§5](#5-the-look-tokens-and-parts), and their script becomes Astro
components and data files.

### 2.1 Where the site departs from the mock-up, on purpose

| # | In the mock-up | In the site | Why |
|---|---|---|---|
| M1 | The language is a setting kept in the browser; the page redraws itself | Each language is its own set of pages, `/` and `/ro/`; the language menu links to the same page in the other language | Search engines index both, a link opens in its language, and it works without JavaScript ([§7](#7-languages)) |
| M2 | Fonts from Google Fonts | Fonts served by the site itself | No request to a third party, which matters for privacy in the EU, and the content-security-policy can stay `'self'` ([§12](#12-security-and-privacy)) |
| M3 | Download buttons go to the releases page | Each goes straight to the file of the latest release, with its size | Read from GitHub when the site is built ([§8](#8-release-data)) |
| M4 | The version and date in each card are typed in | They come from the release data | The same |
| M5 | The OS switches start on Windows | They start on the visitor's system when the browser says which it is, else on Windows | D8 |
| M6 | Two animated GIFs, one of them 5 MB | Short muted looping videos with a still poster, paused for people who ask for less motion | Size, and [§10.4](#104-motion) |
| M7 | No 404 page, no credits | A 404 page in each language; a short Credits section at the end of About | Needed by a real site; the card art and fonts ask for credit (D14) |
| M8 | Thumbnails open a viewer drawn with a fixed `div` | The viewer is a native `<dialog>`; each thumbnail is also a link to the full picture | Focus, Escape and the screen reader come with `<dialog>`, and without JavaScript the link still works ([§6.4](#64-screenshots)) |
| M9 | The phone menu is a `div` toggled by the page's state | A disclosure button with `aria-expanded` and `aria-controls`; without JavaScript, a `<details>` | It works for the keyboard and screen readers, and with JavaScript off ([§6.1](#61-on-every-page)) |

Anything else the build wants to change is asked of the owner first, with the mock-up's picture and
the proposed one side by side.

---

## 3. Technology

| Part | Choice | Notes |
|---|---|---|
| Site generator | **Astro 7**, static output | Pages are `.astro` components rendered to HTML at build time. No server, no adapter |
| Language | **TypeScript**, strict | `tsconfig` as strict as the browser client's: `strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` |
| Styles | **Plain CSS** with custom properties | `src/styles/tokens.css` and component-scoped `<style>`. No Tailwind: the design is small and consistent, and its tokens are few |
| Scripts | **Plain TypeScript** in `<script>` blocks | For the language menu, the OS switches, the screenshot filters and the viewer. No React, Vue or Svelte |
| Images | Astro's image pipeline (`astro:assets`, with `sharp`) | Responsive WebP/AVIF at several widths, lazy below the fold |
| Fonts | `@fontsource/*` packages | Self-hosted WOFF2, Latin and Latin Extended (Romanian's ă â î ș ț) |
| Sitemap | `@astrojs/sitemap` | With the `hreflang` pairs |
| Type checks | `@astrojs/check` | Checks `.astro` files as `tsc` checks `.ts` |
| Unit tests | **Vitest** | The small logic: release data, OS detection, the dictionaries |
| Browser tests | **Playwright**, Chromium | End to end, accessibility (with `@axe-core/playwright`) and the screenshots for comparison |
| Node | 26, the latest, in CI and the Docker image; 22.23.4 at least locally | Astro 7's floor is 22.23.4 |
| Container | Docker, Docker Compose; Caddy serves the pages | [§14.3](#143-docker) |

### 3.1 Always the latest versions

**Every framework, library, tool, GitHub Action and Docker image is at its latest release**, unless
there is a good reason not to, and the reason is written in the table below. Each phase starts by
checking (`npm outdated`, the actions' and the images' latest tags) and updating, in a commit of its
own, before its work. Dependabot keeps them current between phases
([§14.6](#146-ci-and-automation)). Versions are pinned exactly in `package-lock.json`, the
workflows and the Dockerfile, so a build is the same build tomorrow.

The latest on 2026-11-26:

| What | Version |
|---|---|
| `astro` | 7.4.13 |
| `@astrojs/check` | 0.9.12 |
| `@astrojs/sitemap` | 3.7.6 |
| `@playwright/test` | 1.65.1 |
| `@axe-core/playwright` | 4.14.1 |
| `vitest` | 5.1.2 |
| `sharp` | 0.35.5 |
| `@fontsource/playfair-display`, `@fontsource/cormorant-garamond`, `@fontsource/alegreya-sans` | 5.3.0 |
| `@types/node` | 26.6.11 |
| Node, in CI and the image | 26.13.1 (`node:26.13.1-trixie-slim`) |
| Caddy | 2.11.9 (`caddy:2.11.9-alpine`) |
| The actions | as the browser client's workflow: `actions/checkout@v7`, `actions/setup-node@v7`, `docker/build-push-action@v7`, … checked again in phase 1 |

**The exceptions, and why:**

| What | Held at | Instead of | Why | Until |
|---|---|---|---|---|
| TypeScript | 6.0.3 | 7.0.2 | `@astrojs/check`, the only checker of `.astro` files, asks for TypeScript 5 or 6, in its latest and in its beta; npm refuses to install it beside 7 | A release of `@astrojs/check` that accepts 7 |

**Check Astro's own documentation in phase 1** before relying on a feature by name. This plan names
what is needed (i18n routing, the image pipeline, the content-security-policy support, the sitemap),
not the exact API, which moves between major versions.

---

## 4. Code layout

```
astro.config.mjs        site URL, base path, i18n, integrations, CSP
package.json            scripts, exact versions, "version"
package-lock.json
tsconfig.json
Dockerfile              the build, then Caddy serving dist/ (§14.3)
.dockerignore
compose.yaml            the site from this checkout, and the dev server, on this machine
deploy/
  Caddyfile             the site's headers, caching and 404 pages
  docker-compose.yml    the published image, with automatic HTTPS, for the VPS
  .env.example
CHANGELOG.md            from 1.0.0
public/                 copied as is: favicon set, robots.txt, the OG images
src/
  i18n/
    en.ts               the English text: the source, and the shape ro.ts must match
    ro.ts               the Romanian text
    index.ts            Lang, t(lang), localizedPath(), otherLang()
  data/
    releases.ts         the build-time fetch from GitHub, mapped to platforms (§8)
    releases.fallback.json  the last good answer, for a build that can't reach GitHub
    screenshots.ts      the 18 screenshots: file, client, caption key
    opponents.ts        the nine computer opponents
    repos.ts            the six repositories and their licences
    links.ts            the game's address, GitHub URLs, in one place
  assets/               processed by the image pipeline (§9)
    cards/  screenshots/  textures/  video/
  styles/
    tokens.css          §5's tokens
    global.css          reset, body, felt background, focus ring, skip link
  components/
    Header.astro  Footer.astro  LanguageMenu.astro  SkipLink.astro
    Button.astro  Ornament.astro  Icon.astro  Panel.astro  SectionTitle.astro
    CardFan.astro  FeatureList.astro  HowToPlay.astro  PlatformBand.astro
    DownloadCard.astro  OsSwitch.astro  ReleaseFacts.astro  MottoBand.astro
    ScreenshotGrid.astro  ScreenshotViewer.astro  Clip.astro
    RulesSteps.astro  ScoreTable.astro  OpponentTable.astro  RepoList.astro  Credits.astro
  layouts/
    Base.astro          <html lang>, <head> (title, description, canonical, hreflang, OG), header, footer
  views/                one per page, taking lang: the page's body
    Home.astro  Downloads.astro  Screenshots.astro  About.astro  NotFound.astro
  pages/                thin routes: each renders its view with a language
    index.astro  downloads.astro  screenshots.astro  about.astro  404.astro
    ro/index.astro  ro/downloads.astro  ro/screenshots.astro  ro/about.astro  ro/404.astro
  scripts/              the client-side TypeScript, imported by the components
    language.ts  os-switch.ts  screenshot-filter.ts  screenshot-viewer.ts
tests/
  unit/                 Vitest
  e2e/                  Playwright: pages, behaviour, accessibility
  look/                 Playwright: the comparison screenshots (§13.5)
tools/
  import_assets.py      copies the art and screenshots from the sibling repositories (§9)
  make_clips.sh         the GIFs to video (§9.3)
  pair_shots.py         the site's pictures beside the mock-up's
  check_links.mjs       every internal link and anchor in dist/ resolves, in both languages
  smoke.mjs             checks a running site: pages, 404s, headers, caching (§13.4)
docs/
  site-plan.md          this file
  site-mockup/          the mock-up
.github/
  workflows/ci.yml  workflows/deploy.yml  dependabot.yml
CLAUDE.md  README.md  LICENSE
```

**One view per page, two thin routes.** `src/pages/downloads.astro` is three lines that render
`<Downloads lang="en" />`, and `src/pages/ro/downloads.astro` the same with `"ro"`. The routes stay
obvious, and the page itself is written once. (Astro's dynamic routes could produce both from one
file; the thin routes are clearer and cost eight tiny files.)

**Every internal link goes through `localizedPath(lang, path)`**, which adds `/ro` for Romanian
and Astro's base path when the site is served from a sub-path ([§14.4](#144-hosting)). No `href`
to a page of the site is written by hand.

---

## 5. The look: tokens and parts

Every value below is read from `docs/site-mockup/canvas/`. `src/styles/tokens.css` holds them as
custom properties, and components use the properties, never the raw values.

### 5.1 Colours

| Token | Value | Used for |
|---|---|---|
| `--felt` | `#0b2a1e` | The page's base, under the felt |
| `--felt-glow` | `rgba(46, 120, 78, 0.55)` | The radial glow at the top of each page |
| `--felt-shade` | `rgba(5, 20, 14, 0.9)` | The darkening towards the foot |
| `--gold` | `#e2b65a` | Rules, borders, icons, the active underline |
| `--gold-text` | `#f0cd7a` | Links, the outline buttons' text, badges |
| `--gold-hover` | `#ffe3a3` | Links on hover |
| `--gold-pale` | `#f8e1a0` | Top of the gold headings' gradient, the active OS tab |
| `--gold-deep` | `#b98a33` | Foot of the gold headings' gradient |
| `--button-top`, `--button-bottom` | `#f6da8f`, `#d4a347` | The gold button's gradient |
| `--button-ink` | `#1d1a0e` | Text on the gold button and the active filter |
| `--ink-strong` | `#f3ead6` | Headings, the logo, header links |
| `--ink` | `#e9e1cd` | Body text |
| `--ink-tagline` | `#efe4c8` | The italic taglines |
| `--ink-soft` | `#c3cdbd` | Paragraphs in panels |
| `--ink-muted` | `#b9c4b3` | Secondary lines, captions |
| `--ink-faint` | `#a9b5a6` | Notes, the footer's last line, things to come |
| `--good`, `--bad` | `#9fdcb3`, `#f2a58e` | The score table's gains and losses, the "Nothing to install" badge |
| `--panel` | `linear-gradient(180deg, rgba(20,52,38,0.88), rgba(8,28,20,0.94))` | Cards and panels |
| `--panel-border` | `rgba(226, 182, 90, 0.42)` | Their border |
| `--soon-border` | `rgba(169, 181, 166, 0.45)` | Android and other things to come, dashed or muted |
| `--header-bg`, `--footer-bg` | `rgba(5,20,14,0.72)`, `rgba(4,16,11,0.85)` | The bars |
| `--terminal-bg` | `#161b22` | Behind the terminal screenshots |
| `--warn` | `#f5b971` | The macOS warning's icon; its border at 60% and its ground at 9% |
| `--warn-title`, `--warn-text` | `#f8cf9a`, `#e9dcc6` | The macOS warning's title and text |
| `--focus` | `#f8e1a0` | The focus ring, new: the mock-up draws none |

Every pair of text and background is checked for a contrast of 4.5:1 at least, by axe in the
browser tests ([§13.2](#132-in-the-browser-playwright)). The values above pass on `--felt`; a change of either
side must keep it so.

### 5.2 Type

| Token | Font | Used for |
|---|---|---|
| `--font-display` | Playfair Display, 600 and 700 | Headings, the logo, card titles, the step numbers |
| `--font-script` | Cormorant Garamond, italic 500 and 600 | Taglines, "A seat at the table", "In motion", the motto |
| `--font-body` | Alegreya Sans, 400, 500 and 700 | Everything else; 17 px, line height 1.5 |
| `--font-mono` | `ui-monospace, Menlo, Consolas, monospace` | File names, repository names |

The sizes the mock-up uses: the home title `clamp(60px, 7.4vw, 108px)`, a page title
`clamp(48px, 6vw, 76px)`, taglines 36 px (home) and 30 px (other pages), section headings 38 to 40
px, card titles 27 px (Downloads) and 21 to 25 px elsewhere, small capitals labels 13 to 14 px with
2.5 to 4 px letter spacing. The gold headings are a vertical gradient from `--gold-pale` through
`--gold` to `--gold-deep`, clipped to the text, with a solid `--gold` fallback for browsers without
`background-clip: text`.

### 5.3 Space and shape

- **Width:** content at most 1180 px, 1280 px for the hero, the screenshot grid and the footer;
  48 px either side on a wide window, 16 px on a phone.
- **Breakpoints,** the mock-up's two: 880 px and below, the header's links fold behind the Menu
  button; 600 px and below, the phone layout ([§10.2](#102-phones-and-narrow-windows)).
- **Header:** 76 px high. **Radii:** 999 px for buttons and chips, 16 to 18 px for cards and
  panels, 12 to 14 px for notes and small cards, 10 px for pictures inside a frame.
- **Shadows:** cards `0 22px 44px rgba(0,0,0,0.35)`, the framed screenshot
  `0 28px 60px rgba(0,0,0,0.45)`, cards in the hero `drop-shadow(0 16px 22px rgba(0,0,0,0.5))`.

### 5.4 The felt

Each page's background is three layers over `--felt`: a radial glow (an ellipse 70% by 55%, at
70% 12% on Home and 50% 8% on the other pages), a vertical darkening, and the felt texture tiled at
420 px. It is set once, on `body`, in `global.css`.

### 5.5 The parts every page uses

| Part | In the mock-up | Component |
|---|---|---|
| The spade logo and the ornament (line, diamond, spade, diamond, line) | Every page | `Icon`, `Ornament` |
| The gold button and the outline button, 52 to 54 px high | Home, Downloads | `Button` with `variant` |
| The panel: gradient, gold border, radius, shadow | Everywhere | `Panel` |
| The segmented control | Downloads' OS switches, Screenshots' filters | `OsSwitch`; the filters reuse its CSS |
| The badge (version, "Nothing to install", "In the works") | Downloads | inside `DownloadCard` |
| Stroke icons: monitor, terminal, globe, phone, people, chip, clock, letters, download, arrows, close, shield, code | Everywhere | `Icon name="…"`, inline SVG, `aria-hidden` |

---

## 6. The pages

Each subsection names the mock-up's file and pictures, the page's parts in order, where its content
comes from, and how it behaves. Text is never written in a component: it comes from the dictionary
([§7](#7-languages)).

### 6.1 On every page

**`Base.astro`** sets `<html lang>`, the `<title>` (the game's name alone on Home, else "Downloads
· Romanian Whist", "Descărcări · Whist" and the like), the description, the canonical URL, the `hreflang` links to both
languages and `x-default` (English), the Open Graph and Twitter tags ([§11](#11-search-engines-sharing-and-speed)),
the favicon set and `theme-color` (`#0b2a1e`). Its body is a skip link, the header, `<main>`, the
footer.

**The header** (`canvas/Header.dc.html`, every picture's top; `en-language-menu.jpg`,
`en-menu-phone.jpg`):

- the spade and the game's name, Romanian Whist or Whist, a link to Home;
- Play Online (the game, in the same tab), Downloads, Screenshots, About; the current page's link is
  `--gold-text` with a 2 px `--gold` underline and `aria-current="page"`;
- the language menu: the globe, `EN` or `RO`, a chevron. It opens a small list, English and
  Română, each a **link to the same page in that language**, the current one marked. Without
  JavaScript it is a `<details>`/`<summary>` and still works. Picking a language remembers it
  (D5);
- at 880 px and below, the four links fold behind a Menu button, which opens them as a list under
  the header, 52 px a row; on a phone the button is its icon alone, with its label for screen
  readers. It is a disclosure (`aria-expanded`, `aria-controls`), a `<details>` without JavaScript
  (M9, D13, [§10.2](#102-phones-and-narrow-windows)). The language menu stays beside it. Opening
  one closes the other.

**The footer** (`canvas/Footer.dc.html`): the logo, the motto ("One game. Everywhere."), one line
on the project; three columns of links: Play (Play online, Downloads, Screenshots, Rules), Source
code (Engine, Desktop, Terminal, Browser, Server) and Help (Report a problem, About); then a last
line, "© 2026" with the game's name, and the licences. The year is the build's year.

### 6.2 Home

`canvas/Main.dc.html`; `screenshots/en-home.jpg`, `ro-home.jpg` and their `-phone`.

1. **Hero.** On the left, centred: the title in gold, "Romanian / Whist" on two lines in English
   and "Whist" in Romanian, the ornament,
   the tagline, one paragraph, the two buttons (Play Online, gold, to the game; Download, outline,
   to Downloads), and the row of four clients (Desktop, Terminal, Browser, Android (soon)). On the
   right: **the card fan**, the real cards 10♠ J♦ Q♣ K♥ A♠ from left to right, at −30°, −15°,
   0°, 15° and 30° about a point below their centre, each 200 px wide, over a soft gold glow. The
   fan is decoration (`aria-hidden`). On a phone it goes below the text, at 62% of its size.
2. **Four features**, divided by thin gold rules: 2 to 6 players; nine computer opponents; 1-8-1 /
   8-1-8 with forehead and hidden rounds; English and Romanian.
3. **A seat at the table:** one framed screenshot of the desktop client, with its caption and a
   link to Screenshots. English shows `desktop-your-turn`, Romanian `desktop-ro-bidding`.
4. **How to play:** Bid, Play, Score, three numbered panels, then a link to About's rules.
5. **The platforms band:** a heading between two rules, then four chips: Desktop, Terminal and
   Browser link to Downloads (Browser to the game), Android is dashed and not a link.

### 6.3 Downloads

`canvas/Downloads.dc.html`; `screenshots/en-downloads.jpg`, `ro-downloads.jpg` and their
`-phone`, `en-downloads-linux.jpg`, `en-downloads-macos.jpg`.

1. **Title and tagline,** "Play your way.", the ornament, and a large faint spade behind, top
   right, as decoration.
2. **Four cards, two by two** (one column on a phone). Each has a picture across its top, an icon,
   a title, a line, a badge, and its actions.
   - **Desktop:** the badge is the release's version and date; the OS switch (Windows, Linux,
     macOS); the gold button "Download for Windows" to the file; then **File** (its name, in mono,
     and its size) and **Start** (how to start it, per system, below).
   - **Terminal:** the same, for the terminal client.
   - **Browser:** "Nothing to install", a paragraph, and an outline button, Play now, to the game.
   - **Android:** muted, "In the works", a paragraph, and a disabled "Coming soon" (a `<span>`, not
     a button).
3. **Two notes:** the builds are unsigned and need nothing installed; older versions and the source
   on GitHub, with links to both releases pages.
4. **The motto band:** two cards (A♠, A♥) and "One game. Everywhere."

**macOS is experimental** (D17, `en-downloads-macos.jpg`). Neither client's macOS build is signed
by Apple, and the owner wants most people to stay away from it unless they know what they are
doing. So when macOS is picked on either card:

- a warning sits between the switch and the button: a triangle icon, **"Experimental on macOS"**,
  and one paragraph: the build isn't signed by Apple, so macOS refuses to open (or run) it at
  first; it has to be allowed in System Settings › Privacy & Security; download it only if you know
  what that means. The text is the mock-up's, in both languages (`macTitle`, `macDesktop`,
  `macTerminal`);
- the button says **"Download for macOS (experimental)"**;
- without JavaScript, the macOS line of the list of three files carries the same warning.

The Home page's platform chips still say "Windows, Linux, macOS": the label is where the download
is.

**How to start each one**, from the mock-up:

| | Windows | Linux | macOS |
|---|---|---|---|
| Desktop | Unzip it and run `bin\romanian_whist_desktop.exe`. | Unpack it and run `bin/romanian_whist_desktop`. Ubuntu 22.04 or later. | Unpack it and open `romanian_whist_desktop.app`. |
| Terminal | Run it from Windows Terminal or PowerShell. | Make it executable (`chmod +x`), then run it. | Make it executable (`chmod +x`), then run it from Terminal. |

**The OS switch.** Three buttons with `aria-pressed`, in a group labelled for its client. Picking
one changes that card's button, file and start line; the two cards switch on their own. The first
choice is the visitor's system when the browser says which it is (`navigator.userAgentData.platform`,
else the user-agent string), else Windows (D8). A Mac visitor gets macOS, with its warning.
**Without JavaScript** the switch is not shown, and the card lists all three files, each with its
own link and start line.

**Release facts** come from [§8](#8-release-data). The date is written in the page's language with
`Intl.DateTimeFormat`: "25 Nov 2026", "25 nov. 2026". The size is rounded: "44 MB", "613 KB".
Optionally, a "SHA-256" line that copies the digest GitHub gives (D18).

### 6.4 Screenshots

`canvas/Screenshots.dc.html`; `screenshots/en-screenshots.jpg`, `ro-screenshots.jpg` and their
`-phone`, `en-screenshot-viewer.jpg`, `en-screenshot-viewer-phone.jpg`.

1. **Title and tagline,** "See it in play.", then **the filters**: All 18, Desktop 8, Terminal 6,
   Browser 4. The counts are computed from the data.
2. **The grid,** three columns at 1440 px, two on a tablet, one on a phone. Each tile is a link to
   the full picture, with a thumbnail in a 16:10 box (terminal pictures whole, on `--terminal-bg`;
   the others cover the box), a client badge and the caption. The order is the mock-up's:
   desktop, browser, terminal.
3. **In motion:** the desktop and terminal clips side by side, each with its caption (M6).

**The filters** are buttons with `aria-pressed`. A filter hides the other tiles and the counts stay.
Without JavaScript the filters are not shown, and every tile is.

**The viewer** is a `<dialog>`, opened with `showModal()` when a tile is clicked (the link's own
navigation is cancelled). It shows the full picture, the client, the caption and "3 of 18", with
Previous, Next and Close buttons. Escape closes it (the dialog's own behaviour), the left and right
arrow keys move through the pictures **while the dialog is open** (the listener is on the dialog,
never the document), focus returns to the tile that opened it, and the order follows the current
filter. On a phone, Previous and Next sit below the picture, and a swipe moves too.

**The data**, in `src/data/screenshots.ts`: 18 entries, each with its file, its client and a caption
key. The captions are the mock-up's, in `en.ts` and `ro.ts`.

### 6.5 About

`canvas/About.dc.html`; `screenshots/en-about.jpg`, `ro-about.jpg` and their `-phone`.

1. **Title, tagline and the four contents chips**, which link to the sections below.
2. **The game** (`#game`): three paragraphs beside the forehead-round screenshot.
3. **Rules and scoring** (`#rules`): the deal, the bidding, the play, as numbered steps; beside them
   the scoring table (exact bid: 5 + bid; a miss: minus the difference; 5th exact bid in a row:
   +10; 5th miss in a row: −10) and its note; then the link to the engine's `docs/RULES.md` ("(in
   English)" on the Romanian page).
4. **Nine computer opponents** (`#opponents`): a table, in a box that scrolls sideways on a phone.
5. **Open source** (`#source`): six cards, one per repository, with its licence; Android dashed,
   "planned".
6. **Credits** (`#credits`), new (M7, D14): the card art (Byron Knoll, public domain), the fonts
   (SIL Open Font License), the portraits seen in the screenshots (made with AI image tools, as the
   desktop README says).

The section ids are the same in both languages, so `#rules` works from either.

**The facts are checked against their sources in phase 5:** the rules and scoring against the
engine's `docs/RULES.md`, the opponents against the desktop README's table, the Romanian terms
against the desktop client's translation ([§7.2](#72-the-romanian-words)).

### 6.6 The 404 page

Not in the mock-up (M7). The header and footer, the ornament, a title ("This card isn't in the
deck." / "Cartea asta nu e în pachet."), one line, and the gold button to Home. The owner approves
the copy. Caddy answers a missing path under `/ro/` with the Romanian page and any other with the
English one ([§14.3](#143-docker)). GitHub Pages serves `404.html` for every missing path, so
there the English one links to the Romanian home as well.

---

## 7. Languages

### 7.1 How

- **Two copies of every page**, English at the root and Romanian under `/ro/`, with English slugs in
  both (D4). Astro's i18n routing is configured with `en` as the default locale, not prefixed, and
  `ro`.
- **The text lives in two dictionaries.** `src/i18n/en.ts` exports one object; `ro.ts` exports one
  of the same type (`typeof en`), so a missing or extra key is a type error. Lists (screenshots,
  opponents, repositories) keep their text in the dictionaries too, keyed by id.
- **`t(lang)`** returns the dictionary; components take `lang` as a prop. Dates and sizes are
  formatted with `Intl`, in the page's locale (`en-GB`, `ro-RO`).
- **The language menu** links to the same page in the other language, keeping the `#section`. When
  the visitor picks a language, it is kept in `localStorage` (with `try`/`catch`: a blocked storage
  just means nothing is kept). On a later visit to `/`, a tiny inline script sends someone who
  picked Romanian to `/ro/` (D5). Nothing else is detected or redirected, so search engines and
  shared links always get the page they asked for.
- **`hreflang`** links on every page, and in the sitemap, pair each page with its other language.
- **Each element in a language other than the page's** has its own `lang`: "English" and
  "Română" in the menu, the repository names.

### 7.2 The Romanian words

The site uses the words the desktop client's translation uses
(`i18n/romanian_whist_desktop_ro_RO.ts` in `romanian_whist_desktop`), so the site and the games say
the same thing. The mock-up already does:

| English | Romanian |
|---|---|
| trick, tricks | mână, mâini |
| bid (noun / verb) | licitație / a licita |
| trump | atu |
| the suit led | culoarea de jos |
| forehead round | Fruntea |
| hidden round | Neveul |
| rules | Regulament; "Regulile pe scurt" for the short rules |
| round history | Istoricul rundelor |
| final results | Rezultate finale |
| Random, First card, Low risk, Ducking, Cyborg | Aleatoriu, Prima carte, Risc mic, Eschivă, Cyborg |
| Reckoner Alpha, Beta, Gamma, Delta | Socotitor Alfa, Beta, Gama, Delta |
| computer opponent | adversar virtual |

**Romanian is written with the comma below:** ș and ț, never the cedilla forms ş and ţ. A unit test
fails on a cedilla anywhere in `ro.ts`.

**The game's name is Romanian Whist in English and Whist in Romanian** (D6, decided by the owner):
in the logo, the home page's title, the footer, the page titles, the sharing pictures and the
structured data. In running Romanian text it is "Whist" too ("Whist e un joc de cărți…").

---

## 8. Release data

The Downloads page, and the badge on its cards, show the latest release of the desktop and terminal
clients. `src/data/releases.ts` reads them **when the site is built**, from GitHub's REST API:

```
GET https://api.github.com/repos/conectionist/romanian_whist_desktop/releases/latest
GET https://api.github.com/repos/conectionist/romanian_whist_terminal/releases/latest
```

with the workflow's `GITHUB_TOKEN` when it is set (CI), and without it locally. From each answer it
keeps `tag_name`, `published_at`, `html_url`, and for each asset its `name`, `size`,
`browser_download_url` and `digest`. It picks the asset of each system by the end of its name:

| Client | Windows | Linux | macOS |
|---|---|---|---|
| Desktop (`romanian_whist_desktop-<v>-…`) | `-windows.zip` | `-linux.tar.gz` | `-macos.tar.gz` |
| Terminal (`terminal_romanian_whist-<v>-…`) | `-windows.exe` | `-linux` | `-macos` |

These are the names of the current releases, desktop `v2.1.2` and terminal `v2.5.7`, checked on
2026-11-26: the desktop's are 31 to 44 MB, the terminal's 0.3 to 0.6 MB, and each has a SHA-256
digest.

**When it fails**, because GitHub can't be reached or an expected file is missing:

- the build uses `src/data/releases.fallback.json`, the last good answer, committed, and says so
  in its log and in the CI job's summary;
- a missing system's button falls back to that client's releases page;
- a deploy build from `master` fails instead, unless it is the scheduled rebuild, so a broken
  mapping is noticed rather than published (the scheduled one keeps the site up).

`npm run releases:update` refreshes the fallback file by hand.

**Keeping it current** (D9): the deploy workflow runs on every push to `master`, by hand, and once a
day on a schedule, so a new release reaches the site within a day. Later, the desktop and terminal
release workflows could trigger the site's deploy at once (a `repository_dispatch` with a token
that can reach this repository); that is a change in those repositories, and the owner's call.

The mapping and the fallback are unit-tested with a recorded answer of each API call
(`tests/unit/fixtures/`).

---

## 9. Assets

### 9.1 Where they come from

| Asset | Source | Into |
|---|---|---|
| Card faces A♠ K♥ Q♣ J♦ 10♠ A♥, the card back | `romanian_whist_web/public/cards/` (WebP and SVG, from the desktop client's art) | `src/assets/cards/` |
| The felt texture | `romanian_whist_web/public/table/felt.webp` | `src/assets/textures/` |
| Desktop screenshots, 8, two of them Romanian | `romanian_whist_desktop/docs/readme/` and `docs/readme/ro/` (PNG) | `src/assets/screenshots/desktop-*` |
| Terminal screenshots, 6 | `romanian_whist_terminal/docs/readme/` (PNG) | `src/assets/screenshots/terminal-*` |
| Browser screenshots, 4 | the browser client's look page ([§9.2](#92-the-browser-screenshots)) | `src/assets/screenshots/browser-*` |
| The two clips | `gameplay.gif` in the desktop and terminal `docs/readme/` | `src/assets/video/` ([§9.3](#93-the-clips)) |

**`tools/import_assets.py`** copies them from checkouts beside this repository (`../romanian_whist_*`,
or the paths it is given) and writes `src/assets/SOURCES.md`: each file, where it came from, and the
source repository's commit. The pictures are committed; the tool is how they are refreshed when a
client's screenshots change. The originals go in as they are (PNG); the image pipeline makes the
sizes the pages need, so no hand-made resizing is kept.

`docs/site-mockup/assets/` already holds every picture, as WebP; they can seed phase 1, but the
import tool is the lasting way.

### 9.2 The browser screenshots

The browser client has no committed screenshots. Its look page draws the game from fixtures with no
server. In a checkout of `romanian_whist_web` with its server submodule:

```
git submodule update --init libs/romanian_whist_server
npm ci
npx vite build --mode look
npx vite preview --mode look --outDir dist-look --port 4174
```

then `look.html?shot=menu`, `hand-8-cards`, `sheet-online` and `sheet-lobby` at 1920×1080
(the mock-up's four). The import tool can drive this with Playwright, or the four PNGs are taken
once and kept. Its phone-width pictures are not used: the browser client is not laid out for upright
phones yet.

### 9.3 The clips

The two GIFs become MP4 (H.264) and WebM (VP9), muted, looping, at their own size or 1280 px wide at
most, with a poster (the first frame, WebP). `tools/make_clips.sh` runs ffmpeg under `nice`. The
desktop GIF is 5 MB; the video should be well under 1 MB. On the page: `<video muted loop
playsinline preload="none" poster="…">` with both sources, autoplay only when the visitor hasn't
asked for less motion and the clip is on screen (an `IntersectionObserver`), and a pause button.

### 9.4 Fonts, icons and images made for the site

- **Fonts:** the three `@fontsource` packages, only the weights of [§5.2](#52-type), Latin and Latin
  Extended. The two used above the fold (Playfair Display 700, Alegreya Sans 400) are preloaded.
  `font-display: swap`. Each font's OFL notice ships with it.
- **Icons:** the mock-up's inline stroke SVGs, in `Icon.astro`, `currentColor`.
- **Favicon:** the gold spade on `--felt`, as SVG, a 32 px ICO, a 180 px Apple touch icon and
  192/512 px PNGs, made once from the SVG (the browser client's `tools/make_icons.py` does the same
  and can be adapted).
- **Sharing pictures:** 1200×630, one per language: the card fan, the title and the tagline, on the
  felt. Drawn once with Playwright from a page of the site's own, kept in `public/og/`.

---

## 10. Accessibility, phones and motion

### 10.1 Accessible as built

- Real elements: links for navigation, buttons for actions, `<details>` and `<dialog>` where they
  fit; never a click handler on a `div`.
- One `<h1>` per page, headings in order, landmarks (`header`, `nav` with labels, `main`, `footer`),
  a skip link to `main`.
- A visible focus ring, 2 px `--focus` with an offset, on every interactive element.
- Alt text on every picture that says something; the decorative ones (the card fan, the ornament,
  icons) are `alt=""` or `aria-hidden`.
- Targets at least 44 px high.
- Contrast at least 4.5:1, checked by axe on every page, in both languages, at each width.
- Everything works with the keyboard alone, the viewer and the menus included.

### 10.2 Phones and narrow windows

The site is for phones as much as for wide windows, and **the mock-up has both layouts**: every
page at 390 px in both languages (`screenshots/*-phone.jpg`), the phone menu open and the viewer
open on a phone. Its CSS has two breakpoints, which the site keeps:

- **880 px and below:** the header's four links fold behind the Menu button (D13); the logo and the
  language menu stay;
- **600 px and below:** the side margin drops to 16 px; the header's name shrinks to 20 px and the
  Menu button to its icon; every grid is one column (features, Downloads' cards and notes,
  screenshots, repositories); the features lose their dividing rules for rules between them; the
  card fan sits under the hero's text at 62%; the page tops lose some padding; the screenshot
  filters are two by two; the viewer's arrows go below the picture; Downloads' version badges move
  under the card's title.

Between the two, and up from 600 px, the grids reflow by themselves (`auto-fit` with a minimum
column width), as the mock-up's do.

Each page phase checks its page at 360, 390, 768 and 1440 px, and shows the owner its 390 px
pictures beside the mock-up's. The opponents table scrolls sideways in its own box; nothing else
makes the page scroll sideways (a browser test checks it at 360 px). Every target is 44 px at least,
on a phone too.

### 10.3 Without JavaScript

Every page reads fully and every link works without JavaScript: the language menu is a `<details>`,
the OS switch gives way to the three files, the filters disappear and every screenshot shows, and a
screenshot opens as a picture.

### 10.4 Motion

The only motion is the screenshot tiles' small lift on hover, the clips, and the menus opening.
Under `prefers-reduced-motion: reduce`, the lift and any transition are off and the clips don't
play by themselves.

---

## 11. Search engines, sharing and speed

- **Each page** has its title and a description in its language, a canonical URL, and `hreflang`
  links to both languages and `x-default`.
- **`sitemap-index.xml`** from `@astrojs/sitemap`, with the language pairs, and **`robots.txt`**
  pointing to it.
- **Open Graph and Twitter tags**: title, description, the sharing picture of the page's language,
  `og:locale` `en_GB` / `ro_RO` and the other as `og:locale:alternate`.
- **Structured data** on Home: one JSON-LD `VideoGame` with the name (in the page's language), description, the platforms,
  the URL of the game, and the licence. Optional, small (D19).
- **Speed:** static HTML; JavaScript only for the four small scripts, a few kilobytes in all;
  responsive images, lazy below the fold, with their sizes set so nothing jumps; two preloaded
  fonts. **Budgets**, checked in CI on the built `dist/` (a small script, no Lighthouse needed):
  each page's HTML, CSS and JavaScript together under 100 KB compressed, and the images a page
  loads before any scroll under 400 KB at 1440 px.

---

## 12. Security and privacy

- **No cookies, no analytics, no third-party requests** (D11). Fonts, pictures and scripts are the
  site's own. The only things a visitor's browser asks of anyone else are the links they click: the
  game, GitHub.
- **A content-security-policy** of `default-src 'self'; object-src 'none'; base-uri 'self';
  form-action 'none'; frame-ancestors 'none'` at least, with `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin` and no `Server` header, as the browser client's
  Caddyfile sets them. **In the Docker image, Caddy sends them as headers**
  ([§14.3](#143-docker)). GitHub Pages can't set headers, so the published build also carries the
  policy in a `<meta http-equiv>`, where `frame-ancestors` has no effect: on Pages, until the VPS,
  the site can be framed by others, which the plan accepts for a site with no logins or forms.
  Astro inlines small scripts and styles by default; use Astro's built-in CSP support, which adds
  their hashes, if Astro 7 has it, else build with inline stylesheets and scripts turned off so
  `'self'` covers them. Checked in a browser test: no CSP violation on any page.
- **External links** go to known places only (`links.ts`); none opens a new window.
- **The release data** is read at build time only; the visitor's browser never calls GitHub's API.
- **Dependencies** are pinned, updated by Dependabot ([§14.6](#146-ci-and-automation)), and `npm
  audit` runs in CI.

---

## 13. Testing

### 13.1 Unit tests (Vitest)

`tests/unit/`:

- **the dictionaries:** `ro` has every key of `en`, no value is empty, no Romanian value has a
  cedilla ş or ţ, and the screenshot captions exist for every entry of `screenshots.ts`;
- **release data:** the recorded API answers map to the six files with their sizes and digests; a
  missing asset falls back; a failed fetch uses the fallback file;
- **OS detection:** user-agent strings and `userAgentData` values of Windows, macOS, Linux, Android
  (falls back to Windows, the Android card says why) and iOS map as expected;
- **formatting:** dates and sizes in both locales;
- **`localizedPath`:** both languages, with and without a base path and a `#section`.

### 13.2 In the browser (Playwright)

`tests/e2e/`, against `astro preview`, Chromium:

- every page in both languages loads with no console error and no CSP violation; its `<html lang>`,
  title and `hreflang` are right;
- the header: the current page is marked; the language menu opens with the mouse and the keyboard
  and goes to the same page in the other language, `#section` kept; the phone menu at 390 px;
- Downloads: each OS switch changes its card's button, file and start line, and the link is the
  file's; with JavaScript off, the three files are listed;
- Screenshots: each filter shows its count of tiles; the viewer opens from a tile, moves with the
  buttons and the arrow keys, closes with Escape and the button, and gives focus back to the tile;
  with JavaScript off, a tile opens the picture;
- **accessibility:** axe finds nothing on any page, in either language, at 390 and 1440 px, with
  the menus and the viewer open too;
- **no sideways scroll** at 360 px, on any page.

### 13.3 After the build

- `tools/check_links.mjs` walks `dist/`: every internal link and `#anchor` resolves, every page has
  its other-language twin, and every picture exists.
- the size budgets of [§11](#11-search-engines-sharing-and-speed).

### 13.4 The image

In CI, on every pull request ([§14.6](#146-ci-and-automation)):

- the image builds, and `caddy validate` passes on its Caddyfile inside it;
- `docker compose up` starts it, and a smoke script (`tools/smoke.mjs`, as the browser client has)
  checks that every page answers 200 in both languages, a missing page answers 404 with the right
  language's page, the headers of [§12](#12-security-and-privacy) are there, the hashed assets are
  cached for a year and the pages are not;
- the browser tests run once more against the container, not just `astro preview`;
- the image stays under its size budget (Caddy and the pages: 80 MB), summed from its layers as the
  browser client does.

### 13.5 Comparing with the mock-up

`tests/look/` is a Playwright project, run only when asked (`npm run shots`). It takes each page in
both languages at 1440 px and at 390 px (twice the density), full height, plus the six moments the
mock-up has (the viewer open, wide and on a phone; the language menu open; the phone menu open;
Downloads with Linux and with macOS picked), into `build/shots/<name>/`, with the mock-up's names.
`tools/pair_shots.py` (Pillow) puts each picture beside the mock-up's of the same name, labelled
"site" and "mock-up", as `compare-<name>.png`.

`build/` is git-ignored: the comparisons are for the owner's review, not the repository.

---

## 14. Building, running and deploying

### 14.1 Scripts

| Command | Does |
|---|---|
| `npm ci` | Installs the exact versions |
| `npm run dev` | The dev server at `http://localhost:4321` |
| `npm run check` | `astro check`: types in `.astro` and `.ts` |
| `npm run build` | `astro build` into `dist/`, then the link check and the budgets |
| `npm run preview` | Serves `dist/` |
| `npm test` | Vitest |
| `npm run e2e` | Builds, then Playwright's e2e tests |
| `npm run shots` | The comparison pictures and their pairs ([§13.5](#135-comparing-with-the-mock-up)) |
| `npm run releases:update` | Refreshes `releases.fallback.json` |
| `docker compose --profile dev up dev` | The dev server in a container, at `http://127.0.0.1:4321`, reloading as files change |
| `docker compose build site` then `docker compose up site` | The image built from this checkout, at `http://127.0.0.1:8000` |

On the owner's machine, under `nice` and with few workers, as `CLAUDE.md` says.

### 14.2 Versions, tags and the changelog

As the server and the browser client do:

- **`package.json`'s `version` is the site's.** It stays `0.x` while the plan is built, and becomes
  `1.0.0` when the feature branch is merged into `master` ([§15](#15-phases)).
- **Each release is a tag on `master`,** `v1.0.0` and so on, and the tag must be the version in
  `package.json`: CI checks it, as the browser client's does.
- **A tag publishes the image** to `ghcr.io/conectionist/romanian_whist_site`, as `1.0.0` and `1.0`;
  each push to `master` publishes `latest`; every build is also `sha-<commit>`
  ([§14.6](#146-ci-and-automation)). The VPS pins a version.
- **`CHANGELOG.md`** starts at `1.0.0`, in the clients' style: a section per version, with
  "Added", "Changed" and "Fixed".
- The footer shows the version, with the build's short commit in its `title`.

### 14.3 Docker

**The image** (`Dockerfile`), in two stages, as the browser client's:

1. **Build:** `node:26.13.1-trixie-slim` (Debian, not Alpine, as the browser client chose for its
   tools' glibc binaries); `npm ci` with npm's cache mounted; then `npm run build`. The build
   reads the release data from GitHub ([§8](#8-release-data)), with the token passed as a BuildKit
   secret (`--secret id=github_token`), never a build argument or a layer; without it, or with no
   network, it uses the fallback and says so. `SITE_URL` and `BASE_PATH` are build arguments, the
   image's defaults being the VPS's address and `/`. The commit is a build argument too, as the
   browser client's `WHIST_WEB_COMMIT` is, since the build context has no git history.
2. **Serve:** `caddy:2.11.9-alpine`, with `deploy/Caddyfile` and `dist/` in `/srv`, the licence in
   `/usr/share/licenses/`, OCI labels (title, source, licence `AGPL-3.0-or-later`), and
   `caddy validate` run at build time.

**The Caddyfile** (`deploy/Caddyfile`), modelled on the browser client's:

- `{$SITE_ADDRESS::80}`: a domain name gets HTTPS by itself; `:80` serves plain HTTP;
- `file_server` from `/srv`, `encode zstd gzip`, hidden dotfiles;
- the headers of [§12](#12-security-and-privacy), set again in `handle_errors` so error pages carry
  them too;
- caching: Astro's hashed files (`/_astro/*`) for a year, `immutable`; the pages `no-cache`;
  everything else an hour; only on successful answers;
- a missing page: `/ro/404.html` under `/ro/`, else `/404.html`, with status 404.

**`compose.yaml`**, at the root, for this machine:

- **`site`:** built from this checkout, `ports: ["127.0.0.1:8000:80"]`, `SITE_ADDRESS=:80`, hardened
  as the browser client's (`read_only`, `tmpfs: [/tmp]`, `cap_drop: [ALL]`,
  `no-new-privileges`);
- **`dev`,** in the `dev` profile: `node:26.13.1-trixie-slim` running `npm ci && npm run dev --
  --host 0.0.0.0`, with the checkout mounted and `node_modules` in a named volume, at
  `127.0.0.1:4321`. Nothing but Docker is needed on the machine.

**`deploy/docker-compose.yml`**, for the VPS, as the browser client's: the published image at a
pinned tag, `restart: unless-stopped`, the same hardening with `NET_BIND_SERVICE`, ports 80 and
443 (and 443/udp), `SITE_ADDRESS` from `.env` (refusing to start without it), Caddy's two volumes,
and log rotation. **`deploy/.env.example`** names the settings. If the VPS's Caddy for the game
already holds ports 80 and 443, the site's container joins that Caddy instead, as the server's
README describes for its own image; which of the two is a phase 8 question.

**Not now:** putting it on the VPS is phase 8, when the owner says so (D3).

### 14.4 Hosting

**Until the VPS: GitHub Pages**, at `https://conectionist.github.io/romanian_whist_site/` (D2). It
is built by `deploy.yml` with `BASE_PATH=/romanian_whist_site/`, and every link already goes through
`localizedPath` ([§4](#4-code-layout)), so the base path is one setting. Pages has no response
headers (so the CSP is also a `<meta>`, [§12](#12-security-and-privacy)) and no redirects.

**Later: the owner's VPS, behind Caddy** (D3), from the Docker image and
`deploy/docker-compose.yml` ([§14.3](#143-docker)), at an address the owner chooses then. GitHub
Pages is turned off when the VPS serves the site, and the old address points to the new one with a
small redirect page.

### 14.5 Branches

See [§15](#15-phases): `master`, then the feature branch, then one branch per phase.

### 14.6 CI and automation

Modelled on the browser client's workflow.

**`.github/workflows/ci.yml`**: on pull requests (to the feature branch and to `master`), on pushes
to `master` and the feature branch, on version tags (`v*.*.*`), and by hand; `paths-ignore` for
`**/*.md` (the site's text is in TypeScript, so no page is written in Markdown).

- `permissions: contents: read`; `concurrency` that cancels a pull request's older run but never
  one on `master`; `timeout-minutes` on every job.
- **`build`:** Node 26 with npm's cache; `npm ci`; `npm audit --omit=dev`; `npm run check`,
  `npm test`, `npm run build` (link check and budgets included); Playwright's Chromium, then the
  e2e tests; on failure, the report as an artifact; the built `dist/` as an artifact, so a pull
  request's site can be downloaded and looked at.
- **`docker`:** a tag must be `package.json`'s version; the compose files pass
  `docker compose config`; the image builds (with Buildx and the Actions cache); then
  [§13.4](#134-the-image): compose up, the smoke script, the browser tests against the container,
  the size budget; the logs on failure.
- **`publish`:** after both, on a push to `master` or a tag, or a manual run that asks for it, never
  a pull request: the image to `ghcr.io/conectionist/romanian_whist_site` with `docker/metadata-action`'s
  tags (`latest` from `master`, the version and `major.minor` from a tag, `sha-<commit>`), with
  `packages: write`.

**`.github/workflows/deploy.yml`** (GitHub Pages, until the VPS): on pushes to `master`, by hand
(`workflow_dispatch`) and once a day (`schedule`), builds with the release data and the Pages base
path and deploys (`actions/upload-pages-artifact`, `actions/deploy-pages`, with `pages: write` and
`id-token: write`). The scheduled run says in its summary which releases it found. On the VPS, the
daily refresh becomes a scheduled rebuild of the image, decided in phase 8.

**`.github/dependabot.yml`**: npm, GitHub Actions and Docker (the two base images), monthly, each
grouped into one pull request, as the terminal client does for its actions.

---

## 15. Phases

Each phase has a branch and a pull request. Its outcome is written under it when it closes: what was
built, what the owner decided, and where the build departed from this plan. Sizes are relative: S,
M, L.

### 15.1 Branches and tags

As in the desktop client's redesign, the branches are stacked (D12, decided by the owner):

```
master ─── site/v1 (the feature branch) ─┬─ site/phase-1-base
                                          ├─ site/phase-2-home
                                          └─ …
```

- **Phase 0,** this plan and the mock-up, is merged into `master` directly, so that the feature
  branch and every phase start from them.
- **The feature branch, `site/v1`,** is made from `master` once phase 0 is merged (D21).
- **Each phase's branch** comes off the feature branch, `site/phase-N-<name>`, and its pull request
  is **against the feature branch, never `master`**. When a phase is done it is merged into the
  feature branch with a merge commit.
- **When every phase is done,** the feature branch is merged into `master` by a pull request of its
  own, `package.json` becomes `1.0.0`, and `master` is tagged `v1.0.0` ([§14.2](#142-versions-tags-and-the-changelog)).
- After that, work goes on a branch off `master`, PR'd against `master`, and each release is a tag.

### 15.2 How each phase runs

Set by the owner on 2026-11-26. `CLAUDE.md` holds the same steps, for the agent running them.

1. **Planning.** The phase starts in plan mode, with the main agent on opus at high or extra-high
   effort (fable, when the subscription offers it). It reads this plan, the phase's part of the
   mock-up and the code so far, checks for newer versions ([§3.1](#31-always-the-latest-versions)),
   and writes the phase's detailed plan: the files, the order, the tests, and its answers to any
   open decision. The owner approves it before anything is written.
2. **Implementation.** A sub-agent on sonnet at extra-high effort builds the approved plan on the
   phase branch, commits, and runs the checks and tests (under `nice`, as `CLAUDE.md` says). The
   main agent checks the result against the plan and the mock-up.
3. **The pull request.** The main agent opens it against the feature branch, with the comparison
   pictures ([§13.5](#135-comparing-with-the-mock-up)) for a visual phase.
4. **The code review.** A separate sub-agent on opus at extra-high effort, which **starts cold**: a
   fresh agent, never a fork, with none of the main agent's or the implementer's context,
   read-only. Its prompt holds only the repository, the phase branch and the feature branch, the
   phase's requirements as they stand on the feature branch, `CLAUDE.md`, and the rating scales.
   The phase's outcome is not written yet, so it can't read anyone's account of the work.
5. **The findings.** Each is rated 1 to 5 for **severity** (cosmetic 1, an edge case 3, a broken
   page or a wrong download 5) and for **fix complexity** (a line or two 1, a new test 3, a
   redesign 5). The main agent puts them in a table, checks each one against the code, and
   recommends, for each: **fix now**, **defer** (written in this plan as later work) or **open a
   GitHub issue**, with the order of the fixes.
6. **The owner decides.** Nothing is fixed before that.
7. **The fixes** are made by the same sonnet implementer (a new one on sonnet at extra-high effort
   if it is gone), then the checks, the tests and CI run again.
8. **Another round?** After each round of fixes, the main agent says whether it recommends another
   review, and why: for complex fixes, or ones that touched much, it usually does. Another round is
   run the same way, by a fresh opus reviewer at extra-high effort, of the fix commits. The owner
   decides.
9. **The outcome** is written under the phase in this plan, with the pictures linked in the closing
   message.
10. **The merge.** The main agent asks the owner first, then merges the phase's pull request into
   the feature branch.

### Phase 0: the mock-up and the plan — S ✅ COMPLETE

- **Work:** the mock-up on a design canvas, approved by the owner; its export into
  `docs/site-mockup/` (static pages in both languages, full-page pictures wide and on a phone, the
  canvas's files and pictures, the export tool); this plan; `CLAUDE.md`, `README.md` and
  `.gitignore`.
- **Done when:** the owner has the plan, and its pull request is merged into `master`.

**Outcome** (branch `claude/happy-wozniak-2x27tk`, its pull request against `master`):

- The owner chose, on the canvas: Downloads grouped by client (desktop, terminal, browser, Android)
  rather than by operating system; the card fan from 10 to Ace; `https://whist.akdscloud.eu` for
  Play Online; a working language switch, with the desktop client's Romanian words.
- The owner chose Astro, plain CSS and TypeScript with no UI framework, and a static site with no
  backend, after the options were laid out.
- After the first draft of this plan, the owner asked for, and the mock-up and plan now have:
  "Whist" as the Romanian name; macOS labelled experimental on Downloads; phone layouts for every
  page; the latest versions of everything; Docker and Docker Compose; stacked branches with tags;
  and the way each phase runs ([§15.2](#152-how-each-phase-runs)). The mock-up's terminal
  thumbnails, which were taller than the others, were fixed on the canvas at the same time.

### Phase 1: the base — M

- **Work:**
  - the versions checked and updated first ([§3.1](#31-always-the-latest-versions));
  - the Astro project: `package.json` (version `0.1.0`) with exact versions and the scripts of
    [§14.1](#141-scripts), `tsconfig.json`, `astro.config.mjs` (site, base, i18n, sitemap, CSP);
  - Docker: the `Dockerfile`, `deploy/Caddyfile`, `compose.yaml` with `site` and `dev`,
    `deploy/docker-compose.yml` and `.env.example`, `.dockerignore` ([§14.3](#143-docker));
  - `.github/`: CI with its three jobs, `deploy.yml` turned off until phase 7, Dependabot;
  - `tokens.css` and `global.css` ([§5](#5-the-look-tokens-and-parts)), the fonts, the felt;
  - `Base.astro`, the header (logo, links, current page, the language menu, the Menu button and its
    list), the footer, the skip link, `Icon`, `Ornament`, `Button`, `Panel`;
  - the i18n machinery and both dictionaries with the header's, footer's and metadata's text;
  - the eight routes, each with its title and an empty body, and the two 404 pages;
  - `import_assets.py` and the imported assets; the favicon set;
  - the tests: Vitest with the dictionary and `localizedPath` tests; Playwright with the header's
    tests and axe; the look project and `pair_shots.py`; `check_links.mjs`; the smoke script;
  - the README's "Building and running" section, with and without Docker.
- **Done when:**
  - CI is green on the pull request, the `docker` job included;
  - every route answers in both languages, from `npm run dev`, from the dev container and from the
    image, and the language menu goes between them, with and without JavaScript;
  - the comparisons of the header and footer (the top and foot of each page) are linked, wide and
    on a phone, with the language menu and the phone menu open;
  - the owner approves.

### Phase 2: Home — M

- **Work:** [§6.2](#62-home): the hero with the card fan, the features, the framed screenshot per
  language, How to play, the platforms band; the page's phone layout; its text in both languages;
  its e2e and axe tests.
- **Done when:** `compare-en-home`, `compare-ro-home` and their `-phone` are linked; no difference
  remains that the owner hasn't accepted; the owner approves.

### Phase 3: Downloads and the release data — M

- **Work:** [§8](#8-release-data) (the fetch, the mapping, the fallback, their tests,
  `releases:update`, the token as a secret in the image's build); [§6.3](#63-downloads): the four
  cards, the OS switch with its no-JavaScript fallback and the visitor's system first, the macOS
  warning, the release facts, the notes, the motto band; the phone layout; tests.
- **Done when:**
  - every download button is the right file of the latest release, checked against GitHub by a
    test that reads the built page;
  - picking macOS shows the warning and the "(experimental)" button, on both cards, with and
    without JavaScript;
  - a build with GitHub unreachable still produces the page, from the fallback, and says so;
  - `compare-en-downloads`, `compare-ro-downloads`, their `-phone`, `compare-en-downloads-linux`
    and `compare-en-downloads-macos` are linked;
  - the owner approves.

### Phase 4: Screenshots — M

- **Work:** [§6.4](#64-screenshots): the data, the thumbnails and full sizes from the image
  pipeline, the grid of 16:10 boxes, the filters, the `<dialog>` viewer, the clips
  ([§9.3](#93-the-clips)); the phone layout; tests.
- **Done when:** `compare-en-screenshots`, `compare-ro-screenshots`, their `-phone`,
  `compare-en-screenshot-viewer` and `compare-en-screenshot-viewer-phone` are linked; the viewer
  passes its keyboard and focus tests; the page is within its budget; the owner approves.

### Phase 5: About — S

- **Work:** [§6.5](#65-about): the game, the rules and scoring, the opponents, the repositories,
  the credits; the facts checked against their sources and the check written in the outcome; the
  phone layout; tests.
- **Done when:** `compare-en-about`, `compare-ro-about` and their `-phone` are linked; every fact
  has its source named in the outcome; the owner approves.

### Phase 6: finish — M

- **Work:** the 404 pages ([§6.6](#66-the-404-page)); the metadata, sitemap, `robots.txt`, the
  sharing pictures and the structured data ([§11](#11-search-engines-sharing-and-speed)); the CSP,
  as headers and as the `<meta>`, and its test ([§12](#12-security-and-privacy)); the size budgets;
  a full keyboard and screen reader pass over every page (NVDA or VoiceOver, by the owner or noted
  as not done); reduced motion; a last look at every page at 360, 390, 768, 1024, 1440 and 1920 px.
- **Done when:** every check of [§13](#13-testing) passes in CI; the comparisons of every page are
  linked once more; the owner approves.

### Phase 7: release — S

- **Work:** `deploy.yml` turned on; `CHANGELOG.md` with `1.0.0`; `package.json` at `1.0.0`; the
  feature branch's pull request into `master`; once the owner has approved and it is merged, the
  tag `v1.0.0`, which publishes the image; the site live on GitHub Pages; a smoke test against it
  (every page answers, the downloads resolve); then, the owner deciding each, small pull requests in
  the other repositories that link to the site: the READMEs, and the browser client's About.
- **Done when:** the site is live at `conectionist.github.io/romanian_whist_site`, the image
  `1.0.0` is published, the scheduled rebuild has run once by itself, and the owner approves.

### Phase 8: the VPS — S, when the owner says

- **Work:** the site on the owner's VPS from `deploy/docker-compose.yml` and the published image,
  beside the game's server: its own Caddy or the game's, its address, HTTPS; the daily refresh of
  the release data there; GitHub Pages turned off and its address sent to the new one; the links
  in the other repositories updated. On a branch off `master`, with a tag of its own.
- **Done when:** the site is served from the VPS with its headers, the old address leads to it, and
  the owner approves.

### Later, when there is a reason

- **Android:** when the app is published, its card gets its store link and a picture, and the
  "(soon)"s go. The same in the platforms band and the About card.
- **A news or changes page**, if the owner wants one: the clients' changelogs, gathered at build
  time.
- **The releases trigger** of [§8](#8-release-data), from the client repositories.
- **macOS:** if the builds are ever signed and notarised, the "experimental" label goes.

---

## 16. Risks

| Risk | What keeps it small |
|---|---|
| Astro 7's API differs from what this plan assumes | The plan names features, not calls; phase 1 checks each against Astro's documentation and writes any difference in its outcome |
| The latest version of something breaks something | Each phase updates first, in a commit of its own, and the checks and tests run before the phase's work; a version held back is written in [§3.1](#31-always-the-latest-versions) with its reason |
| `@astrojs/check` and TypeScript 7 | TypeScript stays on 6.0.x until `@astrojs/check` allows 7 ([§3.1](#31-always-the-latest-versions)) |
| GitHub's API is down, rate-limited or answers differently at build time | The workflow's token; the committed fallback; a master build fails loudly while the scheduled one keeps the site up; unit tests on recorded answers ([§8](#8-release-data)) |
| The image's build has no network, or no token | The fallback, and the build says so; the token is a BuildKit secret, so it is never in a layer |
| A client renames its release files | The mapping test, and the build's check that every system has its file, fail and say which |
| The CSP and Astro's inline scripts and styles | Astro's CSP support, or no inlining; a browser test fails on any violation, against the image too |
| GitHub turns off a scheduled workflow after 60 days with no activity in the repository, so new releases would stop reaching the site | The deploy workflow's summary names the releases it found; the release trigger of §8 removes the need; until then, a push or a manual run re-enables it, and phase 7's outcome says so |
| GitHub Pages' limits: no headers, a base path | The `<meta>` CSP; `localizedPath` for every link, so the base path is one setting; both go with the VPS |
| The pages are heavy: 18 screenshots and two clips | The image pipeline's sizes, lazy loading, videos instead of GIFs, and the budgets in CI |
| The Romanian drifts from the games' own words | The glossary of [§7.2](#72-the-romanian-words); the owner reads every page in Romanian in its phase |
| The phone layouts lose something the wide ones have | The mock-up's phone pictures are compared in every page phase, as the wide ones are |
| The site's facts drift from the clients (a new opponent, a new platform) | Each fact's source is named in phase 5's outcome; the release data is automatic |
| A reviewer sees the implementer's account and is biased by it | The reviewer is a fresh agent with only the requirements; the outcome is written after the review ([§15.2](#152-how-each-phase-runs)) |

---

## 17. Decisions, with defaults

The plan assumes each default until the owner decides otherwise.

| # | Question | Default |
|---|---|---|
| D1 | What is the site built with? | **Decided by the owner, 2026-11-26:** Astro, TypeScript and plain CSS, static, no UI framework, no backend |
| D2 | Its address? | **Decided by the owner, 2026-11-26:** `conectionist.github.io/romanian_whist_site` for now. The game keeps `whist.akdscloud.eu` |
| D3 | Where is it hosted? | **Decided by the owner, 2026-11-26:** eventually the owner's VPS, behind Caddy, from the Docker image with Docker Compose (phase 8, not now); GitHub Pages until then |
| D4 | Romanian addresses? | English slugs under `/ro/`: `/ro/downloads/`. Translated slugs (`/ro/descarcari/`) are possible later |
| D5 | Does the site pick the language for the visitor? | No detection. An explicit pick is remembered, and only then does `/` send the visitor to `/ro/` |
| D6 | The game's name? | **Decided by the owner, 2026-11-26:** Romanian Whist in English, Whist in Romanian |
| D7 | Where does a download button go? | To the file of the latest release, from the build's release data; to the releases page when that file is missing |
| D8 | Which system do the OS switches start on? | The visitor's, when the browser says (macOS with its warning); else Windows |
| D9 | How does a new release reach the site? | A daily scheduled rebuild, plus by hand. A trigger from the client repositories later, if wanted |
| D10 | The GIFs? | Short muted looping videos with a poster, not playing by themselves under reduced motion |
| D11 | Analytics? | None. If wanted later, a cookieless one the site hosts or that keeps no personal data, named in this plan first |
| D12 | Branches? | **Decided by the owner, 2026-11-26:** stacked: `master`, a feature branch, a branch per phase off it; phases merge into the feature branch, the feature branch into `master`; releases are tags ([§15.1](#151-branches-and-tags)) |
| D13 | The header on a phone? | The links fold behind a Menu button at 880 px and below, as in the mock-up; the logo and the language menu stay |
| D14 | Credits? | A short Credits section at the end of About: the card art, the fonts, the portraits |
| D15 | Versions and releases? | `package.json`'s version, tags on `master` checked against it, the image published per tag, `CHANGELOG.md` from 1.0.0 ([§14.2](#142-versions-tags-and-the-changelog)) |
| D16 | Where does "Report a problem" go? | The desktop client's issues, as in the mock-up. The alternative is a short page that lists each repository's issues |
| D17 | macOS? | **Decided by the owner, 2026-11-26:** both clients' macOS builds are labelled experimental, with a warning, so that only people who know what they're doing install them ([§6.3](#63-downloads)) |
| D18 | Show each file's SHA-256? | Yes, small, under File, copied from GitHub's digest |
| D19 | Structured data (JSON-LD)? | Yes, one `VideoGame` on Home |
| D20 | Versions? | **Decided by the owner, 2026-11-26:** the latest of everything, unless there is a good reason, written down ([§3.1](#31-always-the-latest-versions)) |
| D21 | The feature branch's name? | `site/v1` |
| D22 | How does each phase run? | **Decided by the owner, 2026-11-26:** [§15.2](#152-how-each-phase-runs) |

---

## 18. References

**This repository**

- `docs/site-mockup/`: the mock-up, its README, its pictures and its source.
- The design canvas, for the owner: <https://claude.ai/artifact/2wC9URywqdnL7YrbPTKVSU>.

**The other repositories**

- `romanian_whist_desktop`: `README.md` (features, the computer players, the download table,
  credits); `docs/readme/` (the screenshots); `i18n/romanian_whist_desktop_ro_RO.ts` (the Romanian
  words); `CLAUDE.md` (the end-of-phase comparisons this repository's `CLAUDE.md` follows).
- `romanian_whist_terminal`: `README.md` and `docs/readme/`; `.github/dependabot.yml`.
- `romanian_whist_web`: `README.md`; `docs/page-plan.md` (the plan this one is modelled on);
  `.github/workflows/ci.yml` (the CI this one is modelled on); the look page
  ([§9.2](#92-the-browser-screenshots)); `public/` (the cards and the felt); `tools/make_icons.py`.
- `romanian_whist_engine`: `docs/RULES.md`, the rules the About page summarises.
- `romanian_whist_server`: `docs/server-plan.md` §13, the review procedure.

**Outside**

- Astro's documentation: internationalisation routing, images (`astro:assets`), the
  content-security-policy support, `@astrojs/sitemap`, deploying to GitHub Pages.
- GitHub's REST API: [the latest release](https://docs.github.com/en/rest/releases/releases#get-the-latest-release).
- GitHub Pages: custom domains, and deploying with Actions.
- WAI-ARIA Authoring Practices: the disclosure (the menus) and the modal dialog (the viewer).
