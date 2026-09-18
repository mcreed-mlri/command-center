#!/usr/bin/env node
/* Extract the board's hardcoded Google Drive tree out of index.html.
 *
 * The tree lives inline in the LINKS array rather than in a data file, so the
 * only way to diff it against live Drive is to parse it back out. Printing it
 * as JSON means the diff step can be a script instead of eyeballing two long
 * lists, which is where mistakes crept in when this was done by hand.
 *
 * Usage:  node board-tree.mjs [index.html]  >  board.json
 *
 * Output: { file, countLabel, drives: [...ids], nodes: [ {...} ] }
 *   node.parent is the folder the row sits under ON THE BOARD:
 *     - a top-level row belongs to the shared drive whose `lead: true` row
 *       precedes it (that row is the "open the whole drive" pin)
 *     - a subfolder row belongs to the row that opened `children: [`
 */
import { readFileSync } from "node:fs";

const file = process.argv[2] ?? "index.html";
const lines = readFileSync(file, "utf8").split("\n");

const start = lines.findIndex((l) => l.includes('name: "Google Drive"'));
if (start < 0) {
  console.error(`Could not find the Google Drive tile in ${file}.`);
  console.error("Has the tile been renamed, or is this the wrong file?");
  process.exit(1);
}

// The tile ends where the next tile begins.
let end = lines.length;
for (let i = start + 1; i < lines.length; i++) {
  if (/^\s*\{ section:/.test(lines[i])) { end = i; break; }
}

const ROW   = /\{ name: "((?:[^"\\]|\\.)*)"/;
const ID    = /drive\.google\.com\/drive\/folders\/([A-Za-z0-9_-]+)/;
const CAT   = /cat: "((?:[^"\\]|\\.)*)"/;
const COLOR = /color: "(#[0-9a-fA-F]{3,8})"/;
const COUNT = /count: "([^"]*)"/;

const countLabel = COUNT.exec(lines.slice(start, end).join("\n"))?.[1] ?? null;

const nodes = [];
const drives = [];
const stack = [];        // ids of rows whose `children: [` is still open
let currentDrive = null;

for (let i = start; i < end; i++) {
  const line = lines[i];

  // `] },` closes a children array.
  if (/^\s*\]\s*\},\s*$/.test(line)) { stack.pop(); continue; }

  const row = ROW.exec(line);
  if (!row) continue;

  const id = ID.exec(line)?.[1] ?? null;

  // A `lead: true` row is the pinned "open the whole drive" link. It is not a
  // folder on the board, it marks which drive the rows beneath it belong to.
  if (/lead:\s*true/.test(line)) {
    currentDrive = id;
    if (id) drives.push(id);
    continue;
  }

  if (id) {
    nodes.push({
      id,
      name: row[1],
      parent: stack.length ? stack[stack.length - 1] : currentDrive,
      cat: CAT.exec(line)?.[1] ?? null,
      color: COLOR.exec(line)?.[1] ?? null,
      depth: stack.length,
      line: i + 1,
    });
  }

  // A row that opens a drill-down ends with a comma and no closing brace,
  // because its `children: [` is on the next line.
  if (/,\s*$/.test(line) && !/\}\s*,\s*$/.test(line)) stack.push(id);
}

console.log(JSON.stringify({ file, countLabel, drives, nodes }, null, 2));
