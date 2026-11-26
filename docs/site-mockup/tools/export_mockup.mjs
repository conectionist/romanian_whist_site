// Turns the design canvas's pages (../canvas/*.dc.html) into plain static HTML, one copy per
// language, and takes full-page screenshots of them.
//
//   node docs/site-mockup/tools/export_mockup.mjs
//
// Needs Playwright with Chromium. The fonts come from Google Fonts, so it needs a connection.

import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
function loadChromium() {
  for (const name of ["@playwright/test", "playwright"]) {
    try {
      return require(name).chromium;
    } catch {
      // Try the next one.
    }
  }
  throw new Error("Playwright is not installed: npm install --no-save playwright");
}

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CANVAS = join(ROOT, "canvas");
const blobs = JSON.parse(readFileSync(join(ROOT, "assets", "blob-ids.json"), "utf8"));
const sources = Object.fromEntries(
  readdirSync(CANVAS)
    .filter((file) => file.endsWith(".dc.html"))
    .map((file) => [file.replace(/\.dc\.html$/, ""), readFileSync(join(CANVAS, file), "utf8")]),
);

const PAGES = [
  { name: "Main", file: "index" },
  { name: "Downloads", file: "downloads" },
  { name: "Screenshots", file: "screenshots" },
  { name: "About", file: "about" },
];
const LANGS = ["en", "ro"];

// Moments the full pages don't show: each is a viewport-sized shot, in English.
const MOMENTS = [
  { shot: "screenshot-viewer", page: "Screenshots", state: { at: 0 }, height: 900 },
  { shot: "language-menu", page: "Main", children: { Header: { open: true } }, height: 260 },
  { shot: "downloads-linux", page: "Downloads", state: { desktopOs: "linux", terminalOs: "linux" }, height: 1250 },
];

// Runs in the browser, so the HTML parser and the DOM are the browser's own.
function renderPage({ sources, pageName, lang, state, children, blobs, fileOf, otherLangFile }) {
  class DCLogic {
    constructor(props) {
      this.props = props || {};
      this.state = null;
    }
    setState() {}
    forceUpdate() {}
  }

  const out = document.implementation.createHTMLDocument("");
  const helmetLinks = new Map();
  const helmetStyles = [];

  function lookup(path, scope) {
    const p = path.trim();
    if (p === "true") return true;
    if (p === "false") return false;
    if (p === "null") return null;
    if (/^-?\d+(\.\d+)?$/.test(p)) return Number(p);
    let value = scope;
    for (const key of p.split(".")) {
      if (value === null || value === undefined) return undefined;
      value = value[key];
    }
    return value;
  }
  const HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;
  const WHOLE = /^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/;
  const text = (s, scope) => s.replace(HOLE, (_, p) => {
    const v = lookup(p, scope);
    return v === undefined || v === null ? "" : String(v);
  });
  const value = (s, scope) => {
    const m = WHOLE.exec(s);
    return m ? lookup(m[1], scope) : text(s, scope);
  };

  function component(name, props, stateOverride) {
    // A <template> may sit anywhere, a table included, where an unknown element would be moved out.
    const prepared = sources[name]
      .replace(/<sc-(for|if)\b/g, '<template data-sc="$1"')
      .replace(/<\/sc-(for|if)>/g, "</template>");
    const doc = new DOMParser().parseFromString(prepared, "text/html");
    const script = doc.querySelector("script[data-dc-script]").textContent;
    const Component = new Function("DCLogic", `${script}\nreturn Component;`)(DCLogic);
    const instance = new Component(props);
    instance.props = props;
    instance.state = { ...(stateOverride || {}) };
    const vals = instance.renderVals();

    const root = doc.querySelector("x-dc");
    const helmet = root.querySelector("helmet");
    for (const node of helmet ? helmet.children : []) {
      if (node.localName === "link") helmetLinks.set(node.getAttribute("href"), node.outerHTML);
      if (node.localName === "style") helmetStyles.push(node.textContent);
    }
    const nodes = [];
    for (const child of root.childNodes) {
      if (child !== helmet) nodes.push(...expand(child, vals));
    }
    return { nodes, title: doc.title };
  }

  function expand(node, scope) {
    if (node.nodeType === Node.TEXT_NODE) return [out.createTextNode(text(node.textContent, scope))];
    if (node.nodeType !== Node.ELEMENT_NODE) return [];

    if (node.localName === "template" && node.dataset.sc === "for") {
      const list = value(node.getAttribute("list"), scope) || [];
      const as = node.getAttribute("as");
      return list.flatMap((item, index) => {
        const inner = { ...scope, [as]: item, $index: index };
        return [...node.content.childNodes].flatMap((c) => expand(c, inner));
      });
    }
    if (node.localName === "template" && node.dataset.sc === "if") {
      return value(node.getAttribute("value"), scope) ? [...node.content.childNodes].flatMap((c) => expand(c, scope)) : [];
    }
    if (node.localName === "dc-import") {
      const props = {};
      for (const attr of node.attributes) {
        if (attr.name === "name" || attr.name.startsWith("hint-")) continue;
        props[attr.name.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = value(attr.value, scope);
      }
      const name = node.getAttribute("name");
      return component(name, props, children[name]).nodes;
    }

    const element = out.createElementNS(node.namespaceURI, node.localName);
    for (const attr of node.attributes) {
      if (/^on[A-Z]/.test(attr.name) || /^on[a-z]+$/.test(attr.name)) continue;
      const v = value(attr.value, scope);
      if (v === undefined || v === null || typeof v === "function") continue;
      element.setAttribute(attr.name, String(v));
    }
    for (const child of node.childNodes) element.append(...expand(child, scope));
    return [element];
  }

  const { nodes, title } = component(pageName, {}, { lang, ...state });
  const body = out.body;
  body.append(...nodes);

  // Links between the canvas's pages become links between the exported files.
  const relink = (url) => {
    const m = /^([A-Za-z]+)\.dc\.html(#.*)?$/.exec(url);
    return m ? `${fileOf[m[1]]}.html${m[2] || ""}` : url;
  };
  const asset = (s) => s.replace(/\/_blob\/([0-9a-f]{32})/g, (_, id) => `../assets/${blobs[id]}`);
  for (const a of body.querySelectorAll("a[href]")) a.setAttribute("href", relink(a.getAttribute("href")));
  for (const img of body.querySelectorAll("img[src]")) img.setAttribute("src", asset(img.getAttribute("src")));
  for (const el of body.querySelectorAll("[style]")) el.setAttribute("style", asset(el.getAttribute("style")));

  // The canvas's language menu needs its script; here the globe links to the other language instead.
  const globe = body.querySelector("header button[aria-expanded]");
  if (globe) {
    const link = out.createElement("a");
    link.setAttribute("href", `../${otherLangFile}`);
    link.setAttribute("style", `${globe.getAttribute("style")}; text-decoration: none`);
    link.setAttribute("aria-label", globe.getAttribute("aria-label"));
    link.append(...globe.childNodes);
    globe.replaceWith(link);
  }

  const head = [
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${title}</title>`,
    ...helmetLinks.values(),
    `<style>\n${asset([...new Set(helmetStyles)].join("\n"))}\n</style>`,
  ].join("\n");
  return `<!doctype html>\n<html lang="${lang}">\n<head>\n${head}\n</head>\n<body>\n${body.innerHTML}\n</body>\n</html>\n`;
}

const chromium = loadChromium();
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent("<!doctype html><html><body></body></html>");
const fileOf = Object.fromEntries(PAGES.map((p) => [p.name, p.file]));

async function render(pageName, lang, state = {}, children = {}) {
  const other = lang === "en" ? "ro" : "en";
  return page.evaluate(renderPage, {
    sources, pageName, lang, state, children, blobs, fileOf,
    otherLangFile: `${other}/${fileOf[pageName]}.html`,
  });
}

async function shoot(htmlPath, shotPath, { width = 1440, height = 900, fullPage = true } = {}) {
  const shotPage = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await shotPage.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle" });
  await shotPage.evaluate(() => document.fonts.ready);
  await shotPage.screenshot({ path: shotPath, fullPage, type: "jpeg", quality: 86, animations: "disabled" });
  await shotPage.close();
}

mkdirSync(join(ROOT, "screenshots"), { recursive: true });
for (const lang of LANGS) {
  mkdirSync(join(ROOT, lang), { recursive: true });
  for (const p of PAGES) {
    const html = join(ROOT, lang, `${p.file}.html`);
    writeFileSync(html, await render(p.name, lang));
    await shoot(html, join(ROOT, "screenshots", `${lang}-${p.file === "index" ? "home" : p.file}.jpg`));
    console.log(`${lang}/${p.file}.html`);
  }
}

// A moment is drawn beside the English pages, so its relative links work, and removed once shot.
for (const m of MOMENTS) {
  const html = join(ROOT, "en", "_moment.html");
  writeFileSync(html, await render(m.page, "en", m.state, m.children));
  await shoot(html, join(ROOT, "screenshots", `en-${m.shot}.jpg`), { height: m.height, fullPage: false });
  rmSync(html);
  console.log(`screenshots/en-${m.shot}.jpg`);
}

await browser.close();
