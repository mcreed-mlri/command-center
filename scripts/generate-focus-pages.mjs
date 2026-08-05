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

  /* The AI research log panel used to live on marlie/index.html only, and three
     replaces here stripped it out of the generated pages. It has since been
     removed from the source, so those replaces matched nothing — dropped rather
     than left in place looking load-bearing. If a marlie-only panel is ever
     added back, strip it here and assert the replace actually fired. */

  html = html.replaceAll("Marlie", name);
  html = html.replaceAll("marlie-view-v2", `${slug}-view-v2`);
  /* Drives the localStorage key and the /api/data/<slug> endpoint, so each
     page reads and writes its own pins and list. */
  html = html.replace('const SLUG = "marlie";', `const SLUG = "${slug}";`);
  html = html.replace('|| "marlie"', `|| "${slug}"`);
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
