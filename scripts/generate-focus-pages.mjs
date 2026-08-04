#!/usr/bin/env node
/**
 * One-off generator: copies marlie/index.html into per-person focus pages.
 * Strips the AI Research Log panel and clears the TASKS block for refresh.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

const src = readFileSync(join(ROOT, "marlie/index.html"), "utf8");

const members = [
  { slug: "olivia", name: "Olivia" },
  { slug: "carolina", name: "Carolina" },
  { slug: "ashley", name: "Ashley" },
];

function buildPage({ slug, name }) {
  let html = src;

  /* Every newline below is \r?\n on purpose. An editor that rewrites
     marlie/index.html as CRLF would otherwise silently stop these strips from
     matching — the page still builds, it just quietly keeps the AI log. */

  /* Drops the .log-card rule only. `.list-empty` deliberately sits outside
     this block — the pins and list panels use it too. */
  html = html.replace(
    /\r?\n    \/\* ---- AI research log card[^\r\n]*\r?\n    \.log-card \{[\s\S]*?\r?\n    \}\r?\n/,
    "\n"
  );
  html = html.replace(
    /\r?\n        <section class="panel log-card">[\s\S]*?<\/section>\r?\n\r?\n/,
    "\n"
  );
  html = html.replace("<!-- RIGHT: AI log + links -->", "<!-- RIGHT: links -->");

  html = html.replaceAll("Marlie", name);
  html = html.replaceAll("marlie-view-v2", `${slug}-view-v2`);
  /* Drives the localStorage key and the /api/data/<slug> endpoint, so each
     page reads and writes its own pins and list. */
  html = html.replace('const SLUG = "marlie";', `const SLUG = "${slug}";`);
  html = html.replace(
    /content="[^"]*personal focus page[^"]*"/,
    `content="${name}'s personal focus page — Monday tasks and quick links."`
  );

  html = html.replace(
    /(\/\/ >>> TASKS-START[^\r\n]*\r?\n)[\s\S]*?(\r?\n      \/\/ <<< TASKS-END)/,
    "$1$2"
  );

  return html;
}

for (const m of members) {
  const dir = join(ROOT, m.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), buildPage(m));
  console.log(`Wrote ${m.slug}/index.html`);
}
