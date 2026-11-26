# Romanian Whist website: implementation plan

> **Status: plan, 2026-11-26. Nothing is built yet.** Phase 0, the mock-up and this plan, is in
> review: it is the pull request that adds this file, against `master`. Once the review is done and
> it is merged, the feature branch is made from `master` and phase 1 starts on a branch of its own
> ([§15](#15-phases)). The owner has settled the decisions marked "decided" in
> [§17](#17-decisions-with-defaults); the plan assumes the defaults of the others.

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
to see what it looks like and to learn the rules. It has four pages, each in Romanian and English.
**Romanian is the default language**, because the game is mostly played by Romanians: it is at the
root, and English is under `/en/` (D4). The slugs are English words in both languages.

| Page | Romanian | English | What it is for |
|---|---|---|---|
| Home | `/` | `/en/` | What the game is, how to play in three steps, where to get it |
| Downloads | `/downloads/` | `/en/downloads/` | The desktop and terminal clients for Windows, Linux and macOS, the browser client, Android to come |
| Screenshots | `/screenshots/` | `/en/screenshots/` | Real screenshots of every client, filtered by client, with a viewer |
| About | `/about/` | `/en/about/` | The rules and scoring, the nine computer opponents, the open-source repositories, credits |

Plus a 404 page in each language.

**The visitor's location picks the language** on the first page of a visit: a visitor from Romania
or the Republic of Moldova gets Romanian, one from anywhere else gets English, and a language picked
in the menu always wins ([§7.3](#73-picking-the-language-by-location), D5).

**It is a static site, with no backend.** The pages are the same for every visitor, and the server
stores nothing. The one piece of data that changes, the latest release of each client, is read from GitHub's API when the
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
- **`en/`, `ro/`**: the same pages as static HTML, to open in a browser and inspect. The folders keep
  these names; the site's own addresses are `/` for Romanian and `/en/` for English.

The canvas files are a specification, not code to keep. Their inline styles become component CSS
built on the tokens of [§5](#5-the-look-tokens-and-parts), and their script becomes Astro
components and data files.

### 2.1 Where the site departs from the mock-up, on purpose

| # | In the mock-up | In the site | Why |
|---|---|---|---|
| M1 | The language is a setting kept in the browser; the page redraws itself | Each language is its own set of pages, `/` (Romanian) and `/en/` (English); the language menu links to the same page in the other language | Search engines index both, a link opens in its language, and it works without JavaScript ([§7](#7-languages)) |
| M2 | Fonts from Google Fonts | Fonts served by the site itself | No request to a third party, which matters for privacy in the EU, and the content-security-policy can stay `'self'` ([§12](#12-security-and-privacy)) |
| M3 | Download buttons go to the releases page | Each goes straight to the file of the latest release, with its size | Read from GitHub when the site is built ([§8](#8-release-data)) |
| M4 | The version and date in each card are typed in | They come from the release data | The same |
| M5 | The OS switches start on Windows | They start on Linux for a Linux visitor, else on Windows, and never on macOS | D8 |
| M6 | Two animated GIFs, one of them 5 MB | Short muted looping videos with a still poster, paused for people who ask for less motion | Size, and [§10.4](#104-motion) |
| M7 | No 404 page, no credits | A 404 page in each language; a short Credits section at the end of About | Needed by a real site; the card art, the fonts and the Android robot ask for credit (D14) |
| M8 | Thumbnails open a viewer drawn with a fixed `div` | The viewer is a native `<dialog>`; each thumbnail is also a link to the full picture | Focus, Escape and the screen reader come with `<dialog>`, and without JavaScript the link still works ([§6.4](#64-screenshots)) |
| M9 | The phone menu is a `div` toggled by the page's state | A disclosure button with `aria-expanded` and `aria-controls`; without JavaScript, a `<details>` | It works for the keyboard and screen readers, and with JavaScript off ([§6.1](#61-on-every-page)) |
| M10 | No SHA-256 line | A small "SHA-256" line under File on each download card, copied from GitHub's digest | For people who check what they downloaded (D18, [§6.3](#63-downloads)) |
| M11 | The footer ends with the © line and the licences | The footer also shows the site's version, with the build's short commit in its `title` | So a page can be traced to its build ([§14.2](#142-versions-tags-and-the-changelog)) |
| M12 | No skip link | A skip link to `main`, the first thing the keyboard reaches | Keyboard users shouldn't tab through the header on every page ([§10.1](#101-accessible-as-built)) |
| M13 | No focus ring | A 2 px `--focus` ring with an offset on every interactive element | A keyboard user must always see where they are; the colour is `--focus` ([§5.1](#51-colours)) |
| M14 | The footer's links and the links inside sentences are about 22 px tall | Every target is at least 44 px high: the footer's links get padding, and a link in a sentence gets padding with an equal negative margin, so the text stays where the mock-up has it | Touch and pointer accuracy ([§10.1](#101-accessible-as-built)) |
| M15 | `--ink-faint` is `#a9b5a6` | `#b1bdae` | The felt behind text is lighter than `--felt`, and `#a9b5a6` is 4.35:1 on it, under 4.5:1 ([§5.1](#51-colours)) |
| M16 | The canvas opens in Romanian; the language is a setting the visitor changes | On the first page of a visit, a visitor from outside Romania and Moldova who lands on a Romanian page is sent to its English twin, and one from Romania or Moldova who lands on an English page to its Romanian twin; a language picked in the menu always wins | The owner's wish: the game is mostly played by Romanians, and the rest should read English ([§7.3](#73-picking-the-language-by-location), D5) |

Anything else the build wants to change is asked of the owner first, with the mock-up's picture and
the proposed one side by side.

---

## 3. Technology

| Part | Choice | Notes |
|---|---|---|
| Site generator | **Astro 7**, static output | Pages are `.astro` components rendered to HTML at build time. No server, no adapter |
| Language | **TypeScript**, strict | `tsconfig` as strict as the browser client's: `strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` |
| Styles | **Plain CSS** with custom properties | `src/styles/tokens.css` and component-scoped `<style>`, built into files (`build.inlineStylesheets: 'never'`). No Tailwind: the design is small and consistent, and its tokens are few |
| Scripts | **Plain TypeScript**, every script an external file | For the language choice and menu, the OS switches, the screenshot filters and the viewer. No inline script, so one `'self'` policy fits ([§12](#12-security-and-privacy)). No React, Vue or Svelte |
| Images | Astro's image pipeline (`astro:assets`, with `sharp`) | Responsive WebP/AVIF at several widths, lazy below the fold |
| Fonts | `@fontsource/*` packages | Self-hosted WOFF2, Latin and Latin Extended (Romanian's ă â î ș ț) |
| Sitemap | `@astrojs/sitemap` | With the `hreflang` pairs |
| Type checks | `@astrojs/check` | Checks `.astro` files as `tsc` checks `.ts` |
| Unit tests | **Vitest** | The small logic: release data, OS detection, the language choice, the dictionaries |
| Browser tests | **Playwright**, Chromium | End to end, the language landing by time zone, accessibility (with `@axe-core/playwright`) and the screenshots for comparison |
| Node | 26, the latest, in CI and the Docker image; 22.23.4 at least locally | Astro 7's floor is 22.23.4 |
| Container | Docker, Docker Compose; Caddy serves the pages | [§14.3](#143-docker) |

### 3.1 Always the latest versions

**Every framework, library, tool, GitHub Action and Docker image is at its latest release**, unless
there is a good reason not to, and the reason is written in the table below. Each phase starts by
checking (`npm outdated`, the actions' and the images' latest tags) and updating, in a commit of its
own, before its work. Dependabot proposes updates between phases, monthly, as pull requests against
the feature branch ([§14.6](#146-ci-and-automation)); the phase's own check is still the one that
decides, since it also settles the exceptions below. Versions are pinned exactly in
`package-lock.json`, the workflows and the Dockerfile, so a build is the same build tomorrow.

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
| TypeScript | 6.0.3 | 7.0.2 | `@astrojs/check`, the only checker of `.astro` files, asks for TypeScript 5 or 6, in its latest and in its beta; npm refuses to install it beside 7. Dependabot ignores TypeScript 7 while this stands ([§14.6](#146-ci-and-automation)) | A release of `@astrojs/check` that accepts 7 |

**Check Astro's own documentation in phase 1** before relying on a feature by name. This plan names
what is needed (i18n routing with Romanian unprefixed, the image pipeline, stylesheets and scripts
built as files, the sitemap), not the exact API, which moves between major versions.

---

## 4. Code layout

```
astro.config.mjs        site URL, base path, i18n (ro default and unprefixed, en), integrations,
                        build.inlineStylesheets: 'never'
package.json            scripts, exact versions, "version"
package-lock.json
tsconfig.json
Dockerfile              the build (capped, under nice), then Caddy serving dist/ (§14.3)
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
    ro.ts               the Romanian text, the default
    index.ts            Lang ('ro' | 'en'), t(lang), localizedPath(), otherLang()
  data/
    releases.ts         the build-time fetch from GitHub, mapped to platforms (§8)
    releases.fallback.json  the last good answer, for a build that can't reach GitHub
    screenshots.ts      the 18 screenshots: file, client, caption key
    opponents.ts        the nine computer opponents
    repos.ts            the five repositories and their licences
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
    Base.astro          <html lang>, <head> (title, description, canonical, hreflang, OG,
                        the language script), header, footer
  views/                one per page, taking lang: the page's body
    Home.astro  Downloads.astro  Screenshots.astro  About.astro  NotFound.astro
  pages/                thin routes: each renders its view with a language
    index.astro  downloads.astro  screenshots.astro  about.astro  404.astro      Romanian, at the root
    en/index.astro  en/downloads.astro  en/screenshots.astro  en/about.astro  en/404.astro   English
  scripts/              the client-side TypeScript; each one is built into a file, never inlined
    language.ts           the menu: keeps the visitor's pick (§7.1)
    language-choice.ts    the pure decision of §7.3, unit-tested
    language-redirect.ts  reads the browser and applies the decision; a classic blocking script (§7.3)
    os-switch.ts  screenshot-filter.ts  screenshot-viewer.ts
tests/
  unit/                 Vitest
  e2e/                  Playwright: pages, behaviour, accessibility
  look/                 Playwright: the comparison screenshots (§13.5)
tools/
  import_assets.py      copies the art and screenshots from the sibling repositories (§9)
  make_clips.sh         the GIFs to video (§9.3)
  pair_shots.py         the site's pictures beside the mock-up's
  check_links.mjs       every internal link and anchor in dist/ resolves, in both languages;
                        no inline script or style
  smoke.mjs             checks a running site: pages, 404s, headers, caching (§13.4)
docs/
  site-plan.md          this file
  site-mockup/          the mock-up
.github/
  workflows/ci.yml  workflows/deploy.yml
  dependabot.yml        on master, by its own pull request (§14.6)
CLAUDE.md  README.md  LICENSE
```

**One view per page, two thin routes.** `src/pages/downloads.astro` is three lines that render
`<Downloads lang="ro" />`, and `src/pages/en/downloads.astro` the same with `"en"`. The routes stay
obvious, and the page itself is written once. (Astro's dynamic routes could produce both from one
file; the thin routes are clearer and cost eight tiny files.)

**Every internal link goes through `localizedPath(lang, path)`**, which adds `/en` for English,
nothing for Romanian, and Astro's base path when the site is served from a sub-path
([§14.4](#144-hosting)). No `href` to a page of the site is written by hand.

---

## 5. The look: tokens and parts

Every value below is read from `docs/site-mockup/canvas/`. `src/styles/tokens.css` holds them as
custom properties, and components use the properties, never the raw values.

### 5.1 Colours

| Token | Value | Used for |
|---|---|---|
| `--felt` | `#0b2a1e` | The page's base, under the felt |
| `--felt-glow` | `rgba(46, 120, 78, 0.5)` | The radial glow at the top of Downloads, Screenshots and About |
| `--felt-glow-home` | `rgba(46, 120, 78, 0.55)` | The same glow on Home, which is a little stronger |
| `--felt-shade` | `rgba(5, 20, 14, 0.9)` | The darkening towards the foot |
| `--gold` | `#e2b65a` | Rules, borders, icons, the active underline |
| `--gold-text` | `#f0cd7a` | Links, the outline buttons' text, badges |
| `--gold-hover` | `#ffe3a3` | Links on hover |
| `--gold-pale` | `#f8e1a0` | Top of the gold headings' gradient, the active OS tab |
| `--gold-deep` | `#b98a33` | Foot of the gold headings' gradient |
| `--gold-warm` | `#c8963b` | Foot of the "How to play" heading's gradient, which has two stops, not three |
| `--button-top`, `--button-bottom` | `#f6da8f`, `#d4a347` | The gold button's gradient |
| `--button-ink` | `#1d1a0e` | Text on the gold button and the active filter |
| `--ink-strong` | `#f3ead6` | Headings, the logo, header links |
| `--ink` | `#e9e1cd` | Body text |
| `--ink-tagline` | `#efe4c8` | The italic taglines |
| `--ink-soft` | `#c3cdbd` | Paragraphs in panels |
| `--ink-muted` | `#b9c4b3` | Secondary lines, captions |
| `--ink-faint` | `#b1bdae` | Notes, captions, the footer's last line, things to come. The mock-up's `#a9b5a6` is too dark on the felt (M15) |
| `--ink-warm` | `#d9cfb8` | The row of clients in Home's hero |
| `--ink-motto` | `#e2d6b8` | The motto in the footer |
| `--ink-dim` | `#e3dccb` | The Android card's title, a little dimmer than the other cards' |
| `--good`, `--bad` | `#9fdcb3`, `#f2a58e` | The score table's gains and losses, the "Nothing to install" badge |
| `--panel` | `linear-gradient(180deg, rgba(20,52,38,0.88), rgba(8,28,20,0.94))` | Cards and panels |
| `--panel-border` | `rgba(226, 182, 90, 0.42)` | Their border |
| `--soon-border` | `rgba(169, 181, 166, 0.45)` | Android and other things to come, dashed or muted |
| `--header-bg`, `--footer-bg` | `rgba(5,20,14,0.72)`, `rgba(4,16,11,0.85)` | The bars |
| `--menu-bg` | `#0d2c20` | The language menu's list |
| `--menu-phone-bg` | `#08201a` | The phone menu's panel |
| `--terminal-bg` | `#161b22` | Behind the terminal screenshots |
| `--thumb-bg` | `#0a1f16` | Behind the other clients' thumbnails, which fill their box |
| `--spade-faint` | `#7fcf9a` | The large spade at Downloads' top right, at 10% opacity |
| `--android` | `#3ddc84` | The Android robot on Downloads' card. In the chips it is `--ink-faint`, muted |
| `--warn` | `#f5b971` | The macOS warning's icon; its border at 60% and its ground at 9% |
| `--warn-title`, `--warn-text` | `#f8cf9a`, `#e9dcc6` | The macOS warning's title and text |
| `--focus` | `#f8e1a0` | The focus ring, new: the mock-up draws none |

**The felt behind the text is lighter than `--felt`.** The glow and the texture lift it. In the
mock-up's pictures it is about `rgb(25, 81, 49)` behind notes, captions and Home's row of clients,
and as light as `rgb(34, 100, 64)` at the glow's centre, behind each page's title. The contrast of
`--ink-faint` is what that changes: the mock-up's `#a9b5a6` is 7.2:1 on `--felt` but **4.35:1 on
`rgb(25, 81, 49)`**, under 4.5:1. The site's `#b1bdae` is 4.76:1 there (and 7.9:1 on `--felt`),
still below `--ink-muted`, which is 5.1:1 there. It is listed as a departure (M15).

Every pair of text and background is checked for a contrast of 4.5:1 at least (3:1 for large
text), **on the felt as rendered, not on `--felt`**. axe reports text over a background image as
"incomplete", not as a violation, so the browser tests count its incomplete colour-contrast results
as failures and sample the rendered pixels behind text where axe can't
([§13.2](#132-in-the-browser-playwright)). Phase 1 measures the lightest pixel behind each text
token on the real page, and lightens a token until it passes there.

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
70% 12% on Home with `--felt-glow-home`, and 50% 8% on the other pages with `--felt-glow`), a
vertical darkening, and the felt texture tiled at 420 px. It is set once, on `body`, in
`global.css`.

### 5.5 The parts every page uses

| Part | In the mock-up | Component |
|---|---|---|
| The spade logo and the ornament (line, diamond, spade, diamond, line) | Every page | `Icon`, `Ornament` |
| The gold button and the outline button, 52 to 54 px high | Home, Downloads | `Button` with `variant` |
| The panel: gradient, gold border, radius, shadow | Everywhere | `Panel` |
| The segmented control | Downloads' OS switches, Screenshots' filters | `OsSwitch`; the filters reuse its CSS |
| The badge (version, "Nothing to install") | Downloads | inside `DownloadCard` |
| Stroke icons: monitor, terminal, globe, phone, people, chip, clock, letters, download, arrows, close, shield, code | Everywhere | `Icon name="…"`, inline SVG, `aria-hidden` |
| The Android robot, a filled icon | Downloads' Android card, Home's row of clients and platforms band | `Icon name="android"`, inline SVG, `aria-hidden` ([§9.4](#94-fonts-icons-and-images-made-for-the-site)) |

---

## 6. The pages

Each subsection names the mock-up's file and pictures, the page's parts in order, where its content
comes from, and how it behaves. Text is never written in a component: it comes from the dictionary
([§7](#7-languages)).

### 6.1 On every page

**`Base.astro`** sets `<html lang>`, the `<title>` (the game's name alone on Home, else "Descărcări
· Whist", "Downloads · Romanian Whist" and the like), the description, the canonical URL, the
`hreflang` links to both languages and `x-default`, which points at the English page, the Open Graph
and Twitter tags ([§11](#11-search-engines-sharing-and-speed)), the favicon set and `theme-color`
(`#0b2a1e`). After the `hreflang` links, still in `<head>`, it loads the language script
([§7.3](#73-picking-the-language-by-location)) as a plain `<script src>`, which blocks the page's
first paint so that a visitor who is moved never sees the wrong language. Its body is a skip link,
the header, `<main>`, the footer. The 404 pages have no `hreflang` links and are `noindex`
([§6.6](#66-the-404-pages)).

**The header** (`canvas/Header.dc.html`, every picture's top; `en-language-menu.jpg`,
`en-menu-phone.jpg`):

- the spade and the game's name, Romanian Whist or Whist, a link to Home;
- Play Online (the game, in the same tab), Downloads, Screenshots, About; the current page's link is
  `--gold-text` with a 2 px `--gold` underline and `aria-current="page"`;
- the language menu: the globe, `RO` or `EN`, a chevron. It opens a small list, English and
  Română, each a **link to the same page in that language**, the current one marked. Without
  JavaScript it is a `<details>`/`<summary>` and still works. Picking a language keeps the pick, and
  from then on it wins over the visitor's location ([§7.3](#73-picking-the-language-by-location),
  D5);
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
   to Downloads), and the row of four clients (Desktop, Terminal, Browser, and Android (soon) with
   its robot, muted). On the right: **the card fan**, the real cards 10♠ J♦ Q♣ K♥ A♠ from left to
   right, at −30°, −15°, 0°, 15° and 30° about a point below their centre, each 200 px wide, over a
   soft gold glow. The
   fan is decoration (`aria-hidden`). On a phone it goes below the text, at 62% of its size.
2. **Four features**, divided by thin gold rules: 2 to 6 players; nine computer opponents; 1-8-1 /
   8-1-8 with forehead and hidden rounds; English and Romanian.
3. **A seat at the table:** one framed screenshot of the desktop client, with its caption and a
   link to Screenshots. English shows `desktop-your-turn`, Romanian `desktop-ro-bidding`.
4. **How to play:** Bid, Play, Score, three numbered panels, then a link to About's rules.
5. **The platforms band:** a heading between two rules, then four chips: Desktop, Terminal and
   Browser link to Downloads (Browser to the game), Android is dashed, with its robot muted, and not a
   link.

### 6.3 Downloads

`canvas/Downloads.dc.html`; `screenshots/en-downloads.jpg`, `ro-downloads.jpg` and their
`-phone`, `en-downloads-linux.jpg`, `en-downloads-macos.jpg`.

1. **Title and tagline,** "Play your way.", the ornament, and a large faint spade behind, top
   right, as decoration.
2. **Four cards, two by two** (one column on a phone). Desktop, Terminal and Browser each have a
   picture across their top, an icon, a title, a line, a badge, and their actions.
   - **Desktop:** the badge is the release's version and date; the OS switch (Windows, Linux,
     macOS); the gold button "Download for Windows" to the file; then **File** (its name, in mono,
     and its size) and **Start** (how to start it, per system, below).
   - **Terminal:** the same, for the terminal client.
   - **Browser:** "Nothing to install", a paragraph, and an outline button, Play now, to the game.
   - **Android:** muted, and only that it is coming: the mock-up's picture of a phone holding two
     cards, the Android robot in green (`--android`), the title "Android", and a disabled "Coming
     soon" (a `<span>`, not a button). No description, no badge and no link anywhere on the site:
     the Android app's repository is private and empty.
3. **Two notes:** the builds are unsigned and need nothing installed; older versions and the source
   on GitHub, with links to both releases pages.
4. **The motto band:** two cards (A♠, A♥) and "One game. Everywhere."

**macOS is experimental** (D17, `en-downloads-macos.jpg`). Neither client's macOS build is signed
by Apple, and each runs only on a Mac with Apple Silicon and macOS 26 or later. The owner wants most
people to stay away from it unless they know what they are doing. So when macOS is picked on either
card:

- a warning sits between the switch and the button: a triangle icon, **"Experimental on macOS"**,
  and one paragraph. The text is the mock-up's, in both languages (`macTitle`, `macDesktop`,
  `macTerminal`); in English, for the desktop client: "It runs only on a Mac with Apple Silicon (M1
  or later) and macOS 26 or later. It isn't signed by Apple, so macOS refuses to open it at first:
  you have to allow it in System Settings › Privacy & Security. Download it only if you know what
  that means." The terminal's says "run" where this says "open";
- the button says **"Download for macOS (experimental)"**;
- without JavaScript, the macOS line of the list of three files carries the same warning.

The requirement is the clients' to fix, not the site's: the owner has opened
`conectionist/romanian_whist_desktop#64` (the macOS release runs only on Apple Silicon with macOS 26
or later) and `conectionist/romanian_whist_terminal#55` (the release binaries need macOS 26 on Apple
Silicon, and Ubuntu 24.04 on Linux). When they are fixed, the warning's first sentence changes
([Later](#later-when-there-is-a-reason)).

The Home page's platform chips still say "Windows, Linux, macOS": the label is where the download
is.

**How to start each one**, from the mock-up:

| | Windows | Linux | macOS |
|---|---|---|---|
| Desktop | Unzip it and run `bin\romanian_whist_desktop.exe`. | Unpack it and run `bin/romanian_whist_desktop`. Ubuntu 22.04 or later. | Unpack it and open `romanian_whist_desktop.app`. |
| Terminal | Run it from Windows Terminal or PowerShell. | Make it executable (`chmod +x`), then run it. Ubuntu 24.04 or later. | Make it executable (`chmod +x`), then run it from Terminal. |

**The OS switch.** Three buttons with `aria-pressed`, in a group labelled for its client. Picking
one changes that card's button, file and start line; the two cards switch on their own. **The
switches start on Linux for a Linux visitor, and on Windows for everyone else** (D8): a Mac, an
iPad, a phone and anything the browser doesn't name included, as the mock-up does. They never start
on macOS; a Mac user picks it themselves and sees its warning. The owner chose this so that most
people won't install the experimental builds. The system comes from
`navigator.userAgentData.platform`, else the user-agent string (Android's says Linux too, and is not
Linux here); a Mac user-agent with `navigator.maxTouchPoints` above 1 is an iPad (iPadOS says it is
a Mac), which is not Linux and starts on Windows. **Without JavaScript** the switch is not shown,
and the card lists all three files, each with its own link and start line.

**Release facts** come from [§8](#8-release-data). The date is written in the page's language with
`Intl.DateTimeFormat` and `timeZone: 'UTC'`, so it is the release's own day wherever the build runs:
"25 Nov 2026", "25 nov. 2026". The size is rounded: "44 MB", "613 KB". Under File, a small
"SHA-256" line gives the digest GitHub reports (D18, M10).

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
5. **Open source** (`#source`): five cards, one per repository (engine, desktop, terminal, server,
   browser), each with its licence. Android has none: its repository is private and empty, so it is
   not on the page and nothing links to it.
6. **Credits** (`#credits`), new (M7, D14): the card art (Byron Knoll, public domain), the fonts
   (SIL Open Font License), the portraits seen in the screenshots (made with AI image tools, as the
   desktop README says), and the Android robot: "The Android robot is reproduced or modified from
   work created and shared by Google and used according to terms described in the Creative Commons
   3.0 Attribution License." The credit is Google's wording, kept in English on both pages (in an
   element with `lang="en"`); whether to translate it is the owner's to decide in phase 5. If phase
   8 uses DB-IP's country database ([§7.3](#73-picking-the-language-by-location)), its credit goes
   here too.

The section ids are the same in both languages, so `#rules` works from either.

**The facts are checked against their sources in phase 5:** the rules and scoring against the
engine's `docs/RULES.md`, the opponents against the desktop README's table, the Romanian terms
against the desktop client's translation ([§7.2](#72-the-romanian-words)).

### 6.6 The 404 pages

Not in the mock-up (M7). The header and footer, the ornament, a title ("Cartea asta nu e în pachet."
/ "This card isn't in the deck."), one line, and the gold button to Home. The owner approves the
copy. Both pages are `noindex`, have no `hreflang` links, and are served at any depth, so every link
and file in them is absolute from the root, base path included. Their language menu leads to the
other language's Home, since a missing page has no twin.

**Where each is built.** Astro writes only the exact `/404` route as `404.html`; every other page is
laid out by `build.format`. So `src/pages/404.astro`, Romanian, becomes `dist/404.html`, and
`src/pages/en/404.astro`, English, becomes `dist/en/404/index.html`.

**Where each is served.** Caddy answers a missing path under `/en/` with `/en/404/index.html`, and
any other with `/404.html`, both with status 404 ([§14.3](#143-docker)). GitHub Pages serves only
the root `404.html`, for every missing path, so there the Romanian page is the only one, and it
links to the English home too, through its language menu.

---

## 7. Languages

### 7.1 How

- **Two copies of every page**, Romanian at the root and English under `/en/`, with English slugs in
  both (D4). Astro's i18n routing is configured with `ro` as the default locale, not prefixed, and
  `en`: `defaultLocale: 'ro'`, `locales: ['ro', 'en']`, no prefix for the default.
- **The text lives in two dictionaries.** `src/i18n/ro.ts` and `src/i18n/en.ts` each export one
  object; `en.ts` is the source, and `ro.ts` is of the same type (`typeof en`), so a missing or
  extra key is a type error. Lists (screenshots, opponents, repositories) keep their text in the
  dictionaries too, keyed by id.
- **`t(lang)`** returns the dictionary; components take `lang` as a prop. Dates and sizes are
  formatted with `Intl`, in the page's locale (`ro-RO`, `en-GB`).
- **The language menu** links to the same page in the other language, keeping the `#section`. When
  the visitor picks a language, it is kept in `localStorage` under `whist-site-lang`, as `ro` or
  `en` (with `try`/`catch` around every access: a blocked storage just means nothing is kept). The
  pick is read only by the language script of [§7.3](#73-picking-the-language-by-location), and
  there it wins over the visitor's location.
- **`hreflang`** links on every page, and in the sitemap, pair each page with its other language;
  `x-default` points at the English page.
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
| computer opponent | adversar AI, adversari AI |

**The computer opponents are "adversari AI"** (decided by the owner, 2026-11-26). The desktop client
says "Adversari" for its settings heading and "Bot" for a seat's name (`Bot %1`); the site uses the
owner's term, so the pages say the same thing everywhere.

**Romanian is written with the comma below:** ș and ț, never the cedilla forms ş and ţ. A unit test
fails on a cedilla anywhere in `ro.ts`.

**The game's name is Romanian Whist in English and Whist in Romanian** (D6, decided by the owner):
in the logo, the home page's title, the footer, the page titles, the sharing pictures and the
structured data. In running Romanian text it is "Whist" too ("Whist e un joc de cărți…").

### 7.3 Picking the language by location

The game is mostly played by Romanians, so Romanian is the default, and the visitor's location
decides when it should not be (D5, decided by the owner). **A visitor from Romania or the Republic
of Moldova gets Romanian; one from anywhere else gets English.** It looks at the location only, not
at the browser's language setting.

**The decision** is one pure function, `chooseLanguage()` in `src/scripts/language-choice.ts`, which
the browser script calls and the unit tests exercise. In this order:

1. **No twin:** a page with no page of the same content in the other language (the 404 pages) stays.
2. **A crawler,** recognised by its user agent (`bot`, `crawler`, `spider`, the named search engines
   and link-preview fetchers; not `HeadlessChrome`, so the browser tests exercise the script): stays.
3. **Not the first page of the visit** (below): stays. The visitor is moving through the site, and
   clicking a language link is such a move.
4. **The language to show** is the visitor's pick when there is one (`localStorage`, `whist-site-lang`:
   it always wins), else Romanian for a visitor from Romania or Moldova, else English.
5. **If that is the page's own language,** it stays. Otherwise it goes to the page's twin.

It works both ways: a visitor from abroad who lands on a Romanian page goes to its English twin, and
one from Romania or Moldova who lands on an English page goes to its Romanian twin. It moves with
`location.replace()`, so the back button isn't trapped on a page that would send the visitor on
again, and it keeps the query and the `#section`.

**The first page of a visit** is the first page this tab loads from outside the site: the script
reads a marker in `sessionStorage` (`whist-site-visit`), and when there is none, sets it and goes on
to decide. When `sessionStorage` can't be used (every access has a `try`/`catch`), the script does
nothing, because it could not tell the first page from the rest, and moving a visitor on every page
would trap them in a language they have just left.

**The twin's address** comes from the page's own `<link rel="alternate" hreflang>`, and the script
keeps only its path, so a preview or a mirror stays on its own origin. A page with no such link has
no twin.

**Now, on GitHub Pages,** there is no server to ask. The script, a few lines loaded blocking in
`<head>` so the page doesn't flash in the wrong language, reads the browser's time zone with
`Intl.DateTimeFormat().resolvedOptions().timeZone`:

- `Europe/Bucharest` or `Europe/Chisinau` counts as Romania or Moldova;
- anything else counts as abroad;
- no time zone at all means the script stays, since it can't tell.

Nothing leaves the browser. The script is a classic script, not a module: an Astro `<script>` is a
deferred module, which would run after the first paint. It is built into one small file from
`src/scripts/language-redirect.ts` (with esbuild, which Astro already depends on) and loaded with
`<script src>`, like every script of the site ([§12](#12-security-and-privacy)); phase 1 settles the
mechanism and writes it down. Without JavaScript the page stays as asked.

**Later, on the VPS (phase 8),** the country comes from the visitor's IP address, which is better
than a time zone. It is looked up on the server, in a local country database, with no third party:

- a Caddy built with a GeoIP module, for example `caddy-maxmind-geolocation`, through `xcaddy`;
  the image gets a build stage for it;
- a free country database refreshed monthly: **DB-IP Lite Country**, under CC BY 4.0 with no key,
  or **MaxMind GeoLite2**, with a free key. Which one is a phase 8 question, and DB-IP's credit goes
  in About's credits if it is used.

Where the decision is made had two ways; the owner chose the second (D23):

- **Caddy decides on the first request** and redirects. It needs a `lang` cookie for the visitor's
  own pick, and Caddyfile rules would have to skip crawlers by user agent. Not chosen.
- **Caddy answers a same-origin `/country` endpoint,** `ro` or `en`, which the same script asks
  first, falling back to the time zone when the answer is late or missing.

**The `/country` endpoint, decided by the owner, 2026-11-26.** The decision stays in one place, with one set of rules and
one set of tests, whether the answer comes from the IP address or the time zone. The pages stay the
same bytes for everyone, so a crawler never sees one page for some visitors and a redirect for
others, and caching is untouched. No cookie is needed, so D11 holds as written: the pick stays in
`localStorage`. Its cost is a short wait for the answer on the first page of a visit, where Caddy's
redirect would have none; phase 8 decides whether the page waits for it or moves the visitor once
it comes.

**Tests** ([§13](#13-testing)): unit tests for the decision (time zone, stored pick, crawler, the
`sessionStorage` marker), and an end-to-end test that sets Playwright's `timezoneId`
(`Europe/Bucharest`, then `America/New_York`) and checks where the landing page ends. **What can go
wrong** is in [§16](#16-risks): a time zone is not a location, search engines and redirects, and
the IP database ageing.

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
- **Icons:** the mock-up's inline stroke SVGs, in `Icon.astro`, `currentColor`. **The Android robot**
  is drawn inline too, as a filled shape (the paths are in `canvas/Downloads.dc.html`): `--android`
  (`#3ddc84`) on Downloads' card, and muted, `--ink-faint`, in the chips of Home's row of clients
  and platforms band. It is Google's work, used under the Creative Commons 3.0 Attribution License,
  and credited in About ([§6.5](#65-about), D14).
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
- A visible focus ring, 2 px `--focus` with an offset, on every interactive element (M13).
- Alt text on every picture that says something; the decorative ones (the card fan, the ornament,
  icons) are `alt=""` or `aria-hidden`.
- Targets at least 44 px high, the footer's links and links inside sentences included (M14).
- Contrast at least 4.5:1 (3:1 for large text), measured on the felt as it is rendered, not on
  `--felt` ([§5.1](#51-colours)): checked by axe on every page, in both languages, at each width,
  with axe's "incomplete" results counted as failures and the pixels behind text sampled where axe
  can't tell ([§13.2](#132-in-the-browser-playwright)).
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
screenshot opens as a picture. The language script doesn't run, so the page stays as asked
([§7.3](#73-picking-the-language-by-location)).

### 10.4 Motion

The only motion is the screenshot tiles' small lift on hover, the clips, and the menus opening.
Under `prefers-reduced-motion: reduce`, the lift and any transition are off and the clips don't
play by themselves.

---

## 11. Search engines, sharing and speed

- **Each page** has its title and a description in its language, a canonical URL, and `hreflang`
  links to `ro`, `en` and `x-default`, which points at the English page. The two 404 pages have
  none, and are `noindex`.
- **Redirects and crawlers.** The language script ([§7.3](#73-picking-the-language-by-location))
  skips crawlers, so a search engine always gets the page it asked for; `hreflang` and the canonical
  URLs tell it about both languages.
- **`sitemap-index.xml`** from `@astrojs/sitemap`, with the language pairs, and **`robots.txt`**
  pointing to it. **On GitHub Pages `robots.txt` is of no use:** it is served at
  `/romanian_whist_site/robots.txt`, and crawlers read only the root of a host, so they ignore it
  and don't find the sitemap by it. Until the VPS, the sitemap is submitted by hand, in Google
  Search Console and Bing Webmaster Tools (a step of phase 7).
- **Open Graph and Twitter tags**: title, description, the sharing picture of the page's language,
  `og:locale` of the page's language (`ro_RO` on the Romanian pages, with `en_GB` as
  `og:locale:alternate`; the reverse on the English ones).
- **Structured data** on Home: one JSON-LD `VideoGame` with the name (in the page's language), description, the platforms,
  the URL of the game, and the licence. Optional, small (D19). It is a `<script
  type="application/ld+json">`, which is data, not a script, so the content-security-policy doesn't
  block it ([§12](#12-security-and-privacy)).
- **Speed:** static HTML; JavaScript only for the small scripts of [§4](#4-code-layout), a few
  kilobytes in all; responsive images, lazy below the fold, with their sizes set so nothing jumps; two preloaded
  fonts. **Budgets**, checked in CI on the built `dist/` (a small script, no Lighthouse needed):
  each page's HTML, CSS and JavaScript together under 100 KB compressed, and the images a page
  loads before any scroll under 400 KB at 1440 px.

---

## 12. Security and privacy

- **No cookies, no analytics, no third-party requests** (D11). Fonts, pictures and scripts are the
  site's own. The only things a visitor's browser asks of anyone else are the links they click: the
  game, GitHub.
- **One content-security-policy, and no inline code at all.** The site has no inline `<script>` and
  no inline `<style>`, no `style=` attribute and no event-handler attribute. Every stylesheet is a
  file (`build.inlineStylesheets: 'never'`), every script is a file (the language script, which
  must run before the first paint, is a plain blocking `<script src>` in `<head>`,
  [§7.3](#73-picking-the-language-by-location)), and nothing is styled from a script except through
  classes and custom properties set in the stylesheets. So `'self'` covers everything, and **one
  policy, written once, serves both as Caddy's header and as the `<meta http-equiv>` on GitHub
  Pages.** Astro's own hashed policy is not used: a header with `script-src 'self'` would block the
  inline code that Astro's hashed `<meta>` allows, since the browser applies both. A JSON-LD block is
  data, not a script, and the policy doesn't touch it.
  The policy:

  ```
  default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self';
  connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'
  ```

  With it, in Caddy: `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, and no
  `Server` header. These are the browser client's Caddyfile's, with one difference: its
  `form-action` is `'self'`, and the site's is `'none'`, because the site has no forms. **In the
  Docker image, Caddy sends them as headers** ([§14.3](#143-docker)). GitHub Pages can't set
  headers, so the published build carries the policy in a `<meta http-equiv>`, without
  `frame-ancestors`, which a `<meta>` ignores, and the referrer policy as `<meta name="referrer"
  content="no-referrer">`. On Pages, until the VPS, the site can be framed by others, which the
  plan accepts for a site with no logins or forms. Checked twice: a test over `dist/` fails on any
  inline script (JSON-LD aside), `<style>`, `style=` or `on…=` attribute, and a browser test fails on
  any CSP violation on any page, against the image too.
- **What the language choice reads** ([§7.3](#73-picking-the-language-by-location)): the browser's
  time zone, read in the browser and sent nowhere; the visitor's own pick and a visit marker, in
  `localStorage` and `sessionStorage`, which are not cookies and are never sent to a server. On the
  VPS the country comes from the visitor's IP address, looked up on the server in a local database:
  no third party sees it, and the lookup keeps nothing. Whether Caddy keeps an access log is decided
  in phase 8 and written here then.
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
  and iOS map as expected, and the switches start on Linux for Linux and on Windows for all the
  rest. **An iPad** (a Mac user-agent with `navigator.maxTouchPoints` above 1) is detected as an
  iPad, not a Mac, and starts on Windows; a real Mac (no touch points) is detected as a Mac and
  starts on Windows too;
- **the language choice** ([§7.3](#73-picking-the-language-by-location)): `chooseLanguage()` as a
  table of cases: the time zones `Europe/Bucharest` and `Europe/Chisinau` (home), `Europe/London`,
  `America/New_York`, an unknown one (abroad) and none (stays); a stored pick of each language
  winning over each location; crawlers (Googlebot, bingbot, a link-preview fetcher) against ordinary
  Chrome, Safari, Firefox and `HeadlessChrome`; the `sessionStorage` marker (first page, not first,
  storage unusable); a page with no twin;
- **formatting:** dates (with `timeZone: 'UTC'`, so a release at 23:30 UTC is that day in every
  zone the test runs in) and sizes in both locales;
- **`localizedPath`:** both languages, with and without a base path and a `#section`; Romanian adds
  nothing and English adds `/en`.

### 13.2 In the browser (Playwright)

`tests/e2e/`, against `astro preview`, Chromium:

- every page in both languages loads with no console error and no CSP violation; its `<html lang>`,
  title and `hreflang` are right (`x-default` on the English page); the 404 pages are `noindex`;
- **the language landing** ([§7.3](#73-picking-the-language-by-location)): with Playwright's
  `timezoneId` `Europe/Bucharest`, landing on `/` stays and landing on `/en/` goes to `/`; with
  `America/New_York`, landing on `/` goes to `/en/` and `/en/` stays; `Europe/Chisinau` as Bucharest.
  The second page of a visit is never moved, a stored pick wins over the time zone, a crawler's user
  agent is not moved, a 404 page is not moved, the query and `#section` are kept, and the back button
  leaves the site instead of returning to the page that moved. Every other test starts with the pick
  for the page's language already stored (an init script), so the language script never moves it;
- the header: the current page is marked; the language menu opens with the mouse and the keyboard
  and goes to the same page in the other language, `#section` kept; the phone menu at 390 px;
- Downloads: each OS switch changes its card's button, file and start line, and the link is the
  file's; with JavaScript off, the three files are listed;
- Screenshots: each filter shows its count of tiles; the viewer opens from a tile, moves with the
  buttons and the arrow keys, closes with Escape and the button, and gives focus back to the tile;
  with JavaScript off, a tile opens the picture;
- **accessibility:** axe finds nothing on any page, in either language, at 390 and 1440 px, with
  the menus and the viewer open too;
- **contrast on the felt:** axe lists text over a background image as "incomplete", not as a
  violation, so the tests treat every incomplete colour-contrast result as a failure. Where axe
  can't compute a ground, the test makes the text transparent (a style the test adds with the
  context's `bypassCSP`), takes the rendered pixels of the element's box, and checks the text's
  colour against the lightest of them: 4.5:1, or 3:1 for large text;
- **no inline code:** no inline script (JSON-LD aside), `<style>`, `style=` or `on…=` attribute in any
  built page ([§12](#12-security-and-privacy));
- **no sideways scroll** at 360 px, on any page.

### 13.3 After the build

- `tools/check_links.mjs` walks `dist/`: every internal link and `#anchor` resolves, every page has
  its other-language twin (the 404 pages excepted), every picture exists, and no page has inline
  code ([§12](#12-security-and-privacy)).
- the size budgets of [§11](#11-search-engines-sharing-and-speed).

### 13.4 The image

In CI, on every pull request ([§14.6](#146-ci-and-automation)):

- the image builds, and `caddy validate` passes on its Caddyfile inside it;
- `docker compose up` starts it, and a smoke script (`tools/smoke.mjs`, as the browser client has)
  checks that every page answers 200 in both languages, a missing page answers 404 with the right
  language's page (`/nope` with the Romanian `404.html`, `/en/nope` with the English
  `/en/404/index.html`, both `noindex`), the headers of [§12](#12-security-and-privacy) are there,
  the hashed assets are cached for a year and the pages are not;
- the browser tests run once more against the container, not just `astro preview`;
- the image stays under its size budget (Caddy and the pages: 80 MB), summed from its layers as the
  browser client does.

### 13.5 Comparing with the mock-up

`tests/look/` is a Playwright project, run only when asked (`npm run shots`). It takes each page in
both languages at 1440 px and at 390 px (twice the density), full height, plus the six moments the
mock-up has (the viewer open, wide and on a phone; the language menu open; the phone menu open;
Downloads with Linux and with macOS picked), into `build/shots/<phase>/` (`phase-2` and so on), with
the mock-up's names: `<page>` below is such a name, `en-home`, `ro-downloads-phone` and the like.
`tools/pair_shots.py` (Pillow) puts each picture beside the mock-up's of the same name, labelled
"site" and "mock-up", as `build/shots/<phase>/compare-<page>.png`. Like the other browser tests, it
starts each page with the pick for its language stored, so the language script doesn't move it.

`build/` is git-ignored: the comparisons are for the owner's review, not the repository.

---

## 14. Building, running and deploying

### 14.1 Scripts

| Command | Does |
|---|---|
| `npm ci` | Installs the exact versions |
| `npm run dev` | The dev server at `http://localhost:4321` |
| `npm run check` | `astro check`: types in `.astro` and `.ts` |
| `npm run build` | `astro build` into `dist/`, then the link check and the budgets. The script sets `UV_THREADPOOL_SIZE=2` and `VIPS_CONCURRENCY=1`: Astro's image step otherwise runs as many tasks at once as there are cores |
| `npm run preview` | Serves `dist/` |
| `npm test` | Vitest |
| `npm run e2e` | Builds, then Playwright's e2e tests |
| `npm run shots` | The comparison pictures and their pairs ([§13.5](#135-comparing-with-the-mock-up)) |
| `npm run releases:update` | Refreshes `releases.fallback.json` |
| `docker compose --profile dev up dev` | The dev server in a container, at `http://127.0.0.1:4321`, reloading as files change |
| `docker compose build site` then `docker compose up site` | The image built from this checkout, at `http://127.0.0.1:8000` |

On the owner's machine, under `nice` and with few workers, as `CLAUDE.md` says. The build's two
settings are in the script itself, so no one has to remember them.

### 14.2 Versions, tags and the changelog

As the server and the browser client do:

- **`package.json`'s `version` is the site's.** It stays `0.x` while the plan is built, and becomes
  `1.0.0` when the feature branch is merged into `master` ([§15](#15-phases)).
- **Each release is a tag on `master`,** `v1.0.0` and so on, and the tag must be the version in
  `package.json`: CI checks it, as the browser client's does.
- **The image has no address of its own** until the VPS is chosen: its `SITE_URL` build argument
  has no default, and the canonical links, `hreflang`, the sitemap and the sharing tags are built
  from it. So **publishing the image waits for phase 8**, when the VPS address is set as a
  repository variable (`SITE_URL`); the `publish` job runs only when that variable is set
  ([§14.6](#146-ci-and-automation)). From then on, a tag publishes the image to
  `ghcr.io/conectionist/romanian_whist_site`, as `1.0.0` and `1.0` (the version and `major.minor`);
  each push to `master` publishes `latest`; every build is also `sha-<commit>`. The VPS pins a
  version. Phase 7's tag, `v1.0.0`, deploys GitHub Pages and publishes no image.
- **`CHANGELOG.md`** starts at `1.0.0`, in the clients' style: a section per version, with
  "Added", "Changed" and "Fixed".
- The footer shows the version, with the build's short commit in its `title` (M11).

### 14.3 Docker

**The image** (`Dockerfile`), in two stages, as the browser client's:

1. **Build:** `node:26.13.1-trixie-slim` (Debian, not Alpine, as the browser client chose for its
   tools' glibc binaries); `npm ci` with npm's cache mounted; then `npm run build` **under
   `nice -n 19`, with `UV_THREADPOOL_SIZE=2` and `VIPS_CONCURRENCY=1` set in the Dockerfile too**,
   as the browser client's runs its build under `nice`: the image step must not take every core of
   a machine someone is using. The build reads the release data from GitHub
   ([§8](#8-release-data)), with the token passed as a BuildKit secret (`--secret
   id=github_token`), never a build argument or a layer; without it, or with no network, it uses
   the fallback and says so. **`SITE_URL` is a build argument with no default**: the build stops
   without it, since the image has no address of its own ([§14.2](#142-versions-tags-and-the-changelog)).
   `BASE_PATH` is one too, `/` by default. The commit is a build argument too, as the browser
   client's `WHIST_WEB_COMMIT` is, since the build context has no git history.
2. **Serve:** `caddy:2.11.9-alpine`, with `deploy/Caddyfile` and `dist/` in `/srv`, the licence in
   `/usr/share/licenses/`, OCI labels (title, source, licence `AGPL-3.0-or-later`), and
   `caddy validate` run at build time.

**The Caddyfile** (`deploy/Caddyfile`), modelled on the browser client's:

- `{$SITE_ADDRESS::80}`: a domain name gets HTTPS by itself; `:80` serves plain HTTP;
- `file_server` from `/srv`, `encode zstd gzip`, hidden dotfiles;
- the headers of [§12](#12-security-and-privacy), written once as a snippet and imported where the
  pages are served and again in `handle_errors`, so error pages carry them too, as the browser
  client's Caddyfile does;
- caching: Astro's hashed files (`/_astro/*`) for a year, `immutable`; the pages `no-cache`;
  everything else an hour; only on successful answers;
- a missing page: `/en/404/index.html` under `/en/`, else `/404.html`, both with status 404
  ([§6.6](#66-the-404-pages)).

**`compose.yaml`**, at the root, for this machine:

- **`site`:** built from this checkout with `SITE_URL=http://127.0.0.1:8000`, `ports:
  ["127.0.0.1:8000:80"]`, `SITE_ADDRESS=:80`, hardened as the browser client's (`read_only`,
  `tmpfs: [/tmp]`, `cap_drop: [ALL]`, `no-new-privileges`);
- **`dev`,** in the `dev` profile: `node:26.13.1-trixie-slim` running `npm ci && npm run dev --
  --host 0.0.0.0`, with the checkout mounted and `node_modules` in a named volume, at
  `127.0.0.1:4321`. Nothing but Docker is needed on the machine. **It runs as the host user,
  `user: "${UID:-1000}:${GID:-1000}"`,** so it leaves no root-owned files in the checkout (most
  shells don't export `UID`, so another user than 1000 exports `UID` and `GID`, or puts them in
  `.env`). Phase 1 makes sure that user can write to the `node_modules` volume and to npm's cache,
  and writes down how.

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
headers (so the CSP is also a `<meta>`, [§12](#12-security-and-privacy)), no redirects, a `robots.txt`
that crawlers ignore ([§11](#11-search-engines-sharing-and-speed)), and one `404.html` for the whole
site ([§6.6](#66-the-404-pages)). **The repository has Pages off today:** before the first deploy,
in the repository's Settings, Pages, the owner sets Source to "GitHub Actions" (phase 7).

**Later: the owner's VPS, behind Caddy** (D3), from the Docker image and
`deploy/docker-compose.yml` ([§14.3](#143-docker)), at an address the owner chooses then. **GitHub
Pages stays on**, serving a redirect-only build instead of the site: each page has a `<meta
http-equiv="refresh">` to its new address and a `rel="canonical"` link to it (and a plain link, for
anyone the refresh doesn't move), and the 404 page leads to the new Home. So old links, and search
engines, are moved to the new address. Pages is not turned off.

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
  `docker compose config`; the image builds with a local `SITE_URL` (with Buildx and the Actions
  cache); then
  [§13.4](#134-the-image): compose up, the smoke script, the browser tests against the container,
  the size budget; the logs on failure.
- **`publish`:** after both, on a push to `master` or a tag, or a manual run that asks for it, never
  a pull request, and **only when the repository variable `SITE_URL` is set**, which is phase 8's
  step: the image to `ghcr.io/conectionist/romanian_whist_site`, built with that variable as its
  `SITE_URL`, with `docker/metadata-action`'s tags (`latest` from `master`, the version and
  `major.minor` from a tag, `sha-<commit>`), with `packages: write`. Until then the job is skipped,
  and the `docker` job builds the image with a local address, to test it.

**`.github/workflows/deploy.yml`** (GitHub Pages, until the VPS): on pushes to `master`, by hand
(`workflow_dispatch`) and once a day (`schedule`), builds with the release data and the Pages base
path and deploys (`actions/upload-pages-artifact`, `actions/deploy-pages`, with `pages: write` and
`id-token: write`). The scheduled run says in its summary which releases it found. On the VPS, the
daily refresh becomes a scheduled rebuild of the image, decided in phase 8.

**`.github/dependabot.yml`**: npm, GitHub Actions and Docker (the two base images), monthly, each
grouped into one pull request, as the terminal client does for its actions. It ignores TypeScript 7
while the exception of [§3.1](#31-always-the-latest-versions) stands.

**Dependabot reads its configuration only from the default branch, `master`.** So the file goes to
`master` by a small pull request of its own, at the start of phase 1, with `target-branch: site/v1`,
which makes its pull requests go against the feature branch. When the feature branch is merged into
`master`, a second small pull request takes `target-branch` out, so the updates go to `master`.

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

### Phase 0: the mock-up and the plan — S (in review)

- **Work:** the mock-up on a design canvas, approved by the owner; its export into
  `docs/site-mockup/` (static pages in both languages, full-page pictures wide and on a phone, the
  canvas's files and pictures, the export tool); this plan; `CLAUDE.md`, `README.md` and
  `.gitignore`.
- **Done when:** the owner has the plan, and its pull request is merged into `master`.

Its outcome is written here after the review and the merge, as for every phase
([§15.2](#152-how-each-phase-runs)).

### Phase 1: the base — M

- **Work:**
  - **first, a small pull request of its own, against `master`:** `.github/dependabot.yml`, with
    `target-branch: site/v1` and TypeScript 7 ignored ([§14.6](#146-ci-and-automation)), because
    Dependabot reads its configuration only from `master`;
  - the versions checked and updated ([§3.1](#31-always-the-latest-versions));
  - the Astro project: `package.json` (version `0.1.0`) with exact versions and the scripts of
    [§14.1](#141-scripts) (the build capped with `UV_THREADPOOL_SIZE=2` and `VIPS_CONCURRENCY=1`),
    `tsconfig.json`, `astro.config.mjs` (site, base, i18n with Romanian the unprefixed default,
    sitemap, `inlineStylesheets: 'never'`);
  - Docker: the `Dockerfile`, `deploy/Caddyfile`, `compose.yaml` with `site` and `dev`,
    `deploy/docker-compose.yml` and `.env.example`, `.dockerignore` ([§14.3](#143-docker));
  - `.github/`: CI with its three jobs, the `publish` job waiting for the `SITE_URL` variable,
    `deploy.yml` turned off until phase 7;
  - `tokens.css` and `global.css` ([§5](#5-the-look-tokens-and-parts)), the fonts, the felt, with
    the lightest rendered felt measured and each text token checked on it;
  - `Base.astro`, the header (logo, links, current page, the language menu, the Menu button and its
    list), the footer, the skip link, `Icon`, `Ornament`, `Button`, `Panel`;
  - the i18n machinery and both dictionaries with the header's, footer's and metadata's text;
  - the language choice by time zone ([§7.3](#73-picking-the-language-by-location)): the pure
    decision, the blocking script, and the way it is built as a file, written down in the outcome;
  - the eight routes, Romanian at the root and English under `/en/`, each with its title and an
    empty body, and the two 404 pages;
  - `import_assets.py` and the imported assets; the favicon set;
  - the tests: Vitest with the dictionary, `localizedPath`, OS-detection and language-choice tests;
    Playwright with the header's tests, the time-zone landing tests, axe (incomplete results counted)
    and the no-inline-code check; the look project and `pair_shots.py`; `check_links.mjs`; the
    smoke script;
  - the README's "Building and running" section, with and without Docker.
- **Done when:**
  - CI is green on the pull request, the `docker` job included;
  - every route answers in both languages, from `npm run dev`, from the dev container and from the
    image, and the language menu goes between them, with and without JavaScript;
  - a visitor with the time zone `America/New_York` who lands on `/` ends on `/en/`, and one with
    `Europe/Bucharest` stays; a stored pick wins; the page has no inline script or style;
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
  cards, the OS switch with its no-JavaScript fallback (starting on Linux for Linux, else Windows),
  the macOS warning with its requirement, the Android card (robot and "Coming soon" only), the
  release facts, the notes, the motto band; the phone layout; tests.
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

- **Work:** [§6.5](#65-about): the game, the rules and scoring, the opponents, the five
  repositories, the credits (the Android robot's included); the facts checked against their sources
  and the check written in the outcome; the phone layout; tests.
- **Ask the owner** whether the Android robot's credit, Google's English wording, is translated on
  the Romanian page or kept in English ([§6.5](#65-about)).
- **Done when:** `compare-en-about`, `compare-ro-about` and their `-phone` are linked; every fact
  has its source named in the outcome; the owner approves.

### Phase 6: finish — M

- **Work:** the 404 pages ([§6.6](#66-the-404-pages)); the metadata, sitemap, `robots.txt`, the
  sharing pictures and the structured data ([§11](#11-search-engines-sharing-and-speed)); the CSP,
  one policy for both the headers and the `<meta>`, and its tests ([§12](#12-security-and-privacy));
  the size budgets; a full keyboard and screen reader pass over every page (NVDA or VoiceOver, by
  the owner or noted as not done); reduced motion; a last look at every page at 360, 390, 768, 1024,
  1440 and 1920 px.
- **Done when:** every check of [§13](#13-testing) passes in CI; the comparisons of every page are
  linked once more; the owner approves.

### Phase 7: release — S

- **Work:**
  - **an owner step first:** in the repository's Settings, Pages, set Source to "GitHub Actions".
    Pages is off today, and the first deploy fails without it;
  - `deploy.yml` turned on; `CHANGELOG.md` with `1.0.0`; `package.json` at `1.0.0`;
  - the feature branch's pull request into `master`; once the owner has approved and it is merged,
    the tag `v1.0.0`, which deploys GitHub Pages. It publishes **no image**: the image has no
    address until phase 8 ([§14.2](#142-versions-tags-and-the-changelog));
  - the site live on GitHub Pages; a smoke test against it (every page answers, the downloads
    resolve); the sitemap submitted by hand in Google Search Console and Bing Webmaster Tools
    ([§11](#11-search-engines-sharing-and-speed));
  - then, the owner deciding each, small pull requests in the other repositories that link to the
    site: the READMEs, and the browser client's About.
- **Done when:** the site is live at `conectionist.github.io/romanian_whist_site`, the scheduled
  rebuild has run once by itself, the sitemap is submitted, and the owner approves.

### Phase 8: the VPS — S, when the owner says

- **Work:**
  - the site on the owner's VPS from `deploy/docker-compose.yml`, beside the game's server: its own
    Caddy or the game's, its address, HTTPS;
  - **the repository variable `SITE_URL` set to that address, and the image published** for the
    first time, so the first image is of this phase's own tag
    ([§14.2](#142-versions-tags-and-the-changelog));
  - **the language by IP address** ([§7.3](#73-picking-the-language-by-location)): the Caddy build
    with a GeoIP module, the country database (DB-IP Lite Country or MaxMind GeoLite2, the owner
    choosing) and its monthly refresh, the `/country` endpoint the script asks (D23), the time zone
    staying as the fallback, DB-IP's credit in About if it is used, and the tests for it;
  - the daily refresh of the release data there;
  - **GitHub Pages stays on, serving a redirect-only build** ([§14.4](#144-hosting)): each page a
    `<meta http-equiv="refresh">` and a canonical link to its new address;
  - the sitemap submitted again at the new address; the links in the other repositories updated.
  On a branch off `master`, with a tag of its own.
- **Done when:** the site is served from the VPS with its headers, the image is published, a visitor
  from outside Romania and Moldova lands on English by IP address, the old address leads to the new
  one, and the owner approves.

### Later, when there is a reason

- **Android:** when the app is published and its repository is public, its card gets its store
  link, the "(soon)"s go, and About's list gets a sixth card. No link to the repository until then.
- **A news or changes page**, if the owner wants one: the clients' changelogs, gathered at build
  time.
- **The releases trigger** of [§8](#8-release-data), from the client repositories.
- **macOS:** when `romanian_whist_desktop#64` and `romanian_whist_terminal#55` are fixed, the
  warning's first sentence, the requirement, changes (and the terminal's "Ubuntu 24.04 or later" line
  with it, if #55 changes that). If the builds are ever signed and notarised, the "experimental"
  label goes.

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
| The CSP and Astro's inline scripts and styles | There is none: stylesheets and scripts are files, so one `'self'` policy serves as header and `<meta>`; a check over `dist/` fails on any inline code, and a browser test fails on any violation, against the image too ([§12](#12-security-and-privacy)) |
| GitHub turns off a scheduled workflow after 60 days with no activity in the repository, so new releases would stop reaching the site | The deploy workflow's summary names the releases it found; the release trigger of §8 removes the need; until then, a push or a manual run re-enables it, and phase 7's outcome says so |
| GitHub Pages' limits: no headers, a base path, a `robots.txt` that crawlers ignore | The `<meta>` CSP; `localizedPath` for every link, so the base path is one setting; the sitemap submitted by hand ([§11](#11-search-engines-sharing-and-speed)); all go with the VPS |
| A time zone isn't a location: a traveller, or a Romanian abroad with a foreign time zone, is sent to English | A language picked in the menu always wins and is kept; the redirect happens only on the first page of a visit and never traps the back button; the IP address replaces the time zone on the VPS ([§7.3](#73-picking-the-language-by-location)) |
| Search engines and redirects: a crawler moved away from the page it asked for, or both languages mistaken for one | The script skips crawlers by user agent; the pages are the same for everyone; `hreflang` and canonical URLs name both languages ([§11](#11-search-engines-sharing-and-speed)) |
| The IP database ages, so a country is wrong for a new range | A monthly refresh, an owner's check that it ran, and the time zone as the fallback; a wrong country costs one click on the language menu, and the pick is kept ([§7.3](#73-picking-the-language-by-location)) |
| Dependabot reads its configuration only from `master`, so a file on the feature branch does nothing | The file goes to `master` first, at the start of phase 1, with `target-branch: site/v1` ([§14.6](#146-ci-and-automation)) |
| The image's build takes every core of the owner's machine (Astro's image step) | The build script and the Dockerfile cap it (`UV_THREADPOOL_SIZE=2`, `VIPS_CONCURRENCY=1`), and the Docker build runs under `nice` ([§14.3](#143-docker)) |
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
| D4 | Which language is at the root, and what are the addresses? | **Decided by the owner, 2026-11-26:** Romanian at the root (`/downloads/`), English under `/en/` (`/en/downloads/`); the slugs are English words in both. Translated slugs (`/descarcari/`) are possible later |
| D5 | Does the site pick the language for the visitor? | **Decided by the owner, 2026-11-26:** yes, by location, on the first page of a visit: Romania and Moldova get Romanian, anywhere else English; a pick in the menu always wins. The time zone now, the IP address on the VPS ([§7.3](#73-picking-the-language-by-location)) |
| D6 | The game's name? | **Decided by the owner, 2026-11-26:** Romanian Whist in English, Whist in Romanian |
| D7 | Where does a download button go? | To the file of the latest release, from the build's release data; to the releases page when that file is missing |
| D8 | Which system do the OS switches start on? | **Decided by the owner, 2026-11-26:** Linux for a Linux visitor; Windows for everyone else, a Mac and an iPad included, as the mock-up does. They never start on macOS, so that most people don't install the experimental builds; a Mac user picks it themselves ([§6.3](#63-downloads)) |
| D9 | How does a new release reach the site? | A daily scheduled rebuild, plus by hand. A trigger from the client repositories later, if wanted |
| D10 | The GIFs? | Short muted looping videos with a poster, not playing by themselves under reduced motion |
| D11 | Analytics? | None. If wanted later, a cookieless one the site hosts or that keeps no personal data, named in this plan first |
| D12 | Branches? | **Decided by the owner, 2026-11-26:** stacked: `master`, a feature branch, a branch per phase off it; phases merge into the feature branch, the feature branch into `master`; releases are tags ([§15.1](#151-branches-and-tags)) |
| D13 | The header on a phone? | The links fold behind a Menu button at 880 px and below, as in the mock-up; the logo and the language menu stay |
| D14 | Credits? | A short Credits section at the end of About: the card art, the fonts, the portraits, and the Android robot ("reproduced or modified from work created and shared by Google and used according to terms described in the Creative Commons 3.0 Attribution License"); DB-IP's, if phase 8 uses it |
| D15 | Versions and releases? | `package.json`'s version, tags on `master` checked against it, the image published per tag, `CHANGELOG.md` from 1.0.0 ([§14.2](#142-versions-tags-and-the-changelog)) |
| D16 | Where does "Report a problem" go? | The desktop client's issues, as in the mock-up. The alternative is a short page that lists each repository's issues |
| D17 | macOS? | **Decided by the owner, 2026-11-26:** both clients' macOS builds are labelled experimental, with a warning that also names what they need (Apple Silicon, macOS 26 or later), so that only people who know what they're doing install them ([§6.3](#63-downloads)) |
| D18 | Show each file's SHA-256? | Yes, small, under File, copied from GitHub's digest |
| D19 | Structured data (JSON-LD)? | Yes, one `VideoGame` on Home |
| D20 | Versions? | **Decided by the owner, 2026-11-26:** the latest of everything, unless there is a good reason, written down ([§3.1](#31-always-the-latest-versions)) |
| D21 | The feature branch's name? | `site/v1` |
| D22 | How does each phase run? | **Decided by the owner, 2026-11-26:** [§15.2](#152-how-each-phase-runs) |
| D23 | On the VPS, how is the country known, and where is the language decided? | **Decided by the owner, 2026-11-26:** a same-origin `/country` endpoint from Caddy with a GeoIP module, asked by the same script, so there is no cookie and one set of rules. Phase 8 picks the database: DB-IP Lite Country (CC BY 4.0, no key) or MaxMind GeoLite2 (a free key) ([§7.3](#73-picking-the-language-by-location)) |

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
  `.github/workflows/ci.yml` (the CI this one is modelled on); `deploy/Caddyfile` (the headers
  [§12](#12-security-and-privacy) starts from) and `Dockerfile` (the build under `nice`); the look
  page ([§9.2](#92-the-browser-screenshots)); `public/` (the cards and the felt);
  `tools/make_icons.py`.
- `romanian_whist_desktop#64` and `romanian_whist_terminal#55`: the macOS and Ubuntu requirements
  ([§6.3](#63-downloads)).
- `romanian_whist_engine`: `docs/RULES.md`, the rules the About page summarises.
- `romanian_whist_server`: `docs/server-plan.md` §13, the review procedure.

**Outside**

- Astro's documentation: internationalisation routing, images (`astro:assets`),
  `build.inlineStylesheets` and how scripts are built, `@astrojs/sitemap`, deploying to GitHub
  Pages.
- Phase 8: Caddy's `xcaddy` and the `caddy-maxmind-geolocation` module; the DB-IP Lite Country and
  MaxMind GeoLite2 country databases and their licences.
- The browser's `Intl.DateTimeFormat().resolvedOptions().timeZone`, which the language script reads.
- GitHub's REST API: [the latest release](https://docs.github.com/en/rest/releases/releases#get-the-latest-release).
- GitHub Pages: custom domains, and deploying with Actions.
- WAI-ARIA Authoring Practices: the disclosure (the menus) and the modal dialog (the viewer).
