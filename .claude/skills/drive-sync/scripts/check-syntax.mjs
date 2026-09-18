#!/usr/bin/env node
/* Syntax gate for the board's hand-edited JavaScript.
 *
 * index.html carries its whole app in two inline <script> blocks, so a stray
 * comma in the LINKS array ships a blank page — the browser fails silently and
 * Cloudflare has no build step to catch it. `node --check` on the extracted
 * blocks is the cheapest guard that exists here.
 *
 * Usage:  node check-syntax.mjs [index.html] [sw.js]
 * Exits non-zero if anything fails to parse.
 */
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const htmlPath = process.argv[2] ?? "index.html";
const swPath = process.argv[3] ?? "sw.js";
const tmp = mkdtempSync(join(tmpdir(), "drive-sync-"));

let failed = false;
const check = (file, label) => {
  try {
    execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
    console.log(`ok    ${label}`);
  } catch (e) {
    failed = true;
    console.error(`FAIL  ${label}`);
    console.error(String(e.stderr ?? e.message).trim());
  }
};

// sw.js is a plain module, check it directly.
check(swPath, swPath);

// index.html needs its inline scripts pulled out first. Each block is wrapped
// in its own `{}` so a `const` in one cannot collide with the same name in the
// other — they are separate scripts in the browser too.
const html = readFileSync(htmlPath, "utf8");
const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
let m, n = 0, out = "";
while ((m = re.exec(html))) { n++; out += `\n;{\n${m[1]}\n}\n`; }

if (!n) {
  console.error(`FAIL  ${htmlPath}: found no inline <script> blocks — did the file change shape?`);
  failed = true;
} else {
  const extracted = join(tmp, "inline.js");
  writeFileSync(extracted, out);
  check(extracted, `${htmlPath} (${n} inline script block${n === 1 ? "" : "s"})`);
}

process.exit(failed ? 1 : 0);
