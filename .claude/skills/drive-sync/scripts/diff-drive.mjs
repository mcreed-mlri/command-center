#!/usr/bin/env node
/* Diff the board's Drive tree against what live Drive actually contains.
 *
 * Doing this by eye across ~45 folders is where errors hide: a folder that
 * moved parent looks identical to one that vanished unless you check both
 * lists in both directions. The script reports each case separately so the
 * structural changes (the ones worth asking the user about) stand out from
 * the routine ones.
 *
 * Usage:  node diff-drive.mjs board.json live.json
 *
 *   board.json  output of board-tree.mjs
 *   live.json   every `files` array the Drive connector returned this sweep,
 *               concatenated into one flat array of {id, title, parentId}
 *
 * Exit code is 0 when the board matches Drive, 1 when there is drift, so a
 * caller can branch on "anything to do?" without parsing the report.
 */
import { readFileSync } from "node:fs";

const [boardPath, livePath] = process.argv.slice(2);
if (!boardPath || !livePath) {
  console.error("Usage: node diff-drive.mjs board.json live.json");
  process.exit(2);
}

const board = JSON.parse(readFileSync(boardPath, "utf8"));
const liveRaw = JSON.parse(readFileSync(livePath, "utf8"));

// Accept either a bare array or {files:[...]}, and tolerate a list of either.
const live = (Array.isArray(liveRaw) ? liveRaw : liveRaw.files ?? [])
  .flatMap((f) => (f && Array.isArray(f.files) ? f.files : [f]))
  .filter((f) => f && f.id);

const liveById = new Map(live.map((f) => [f.id, f]));
const boardById = new Map(board.nodes.map((n) => [n.id, n]));
const knownParents = new Set([...board.drives, ...board.nodes.map((n) => n.id)]);

const dead = [];      // on the board, not found live → would be a dead link
const added = [];     // new, and a row for it fits the board as it stands
const tooDeep = [];   // new, but would need a 3rd drill-down level to show
const renamed = [];   // same id, different title
const moved = [];     // same id, different parent

// The board's accordion renders exactly two levels: a folder row, and its
// subfolders as leaves. So a new folder can be added as a row only if its
// parent is a shared drive (depth -1) or a top-level row (depth 0). A parent
// already at depth 1 would put the newcomer at depth 2, which the renderer
// cannot draw — that needs a code change, not a data edit.
const parentDepth = (id) => (board.drives.includes(id) ? -1 : boardById.get(id)?.depth ?? null);

for (const n of board.nodes) {
  const f = liveById.get(n.id);
  if (!f) { dead.push(n); continue; }
  if (f.title !== n.name) renamed.push({ ...n, liveName: f.title });
  if (f.parentId && f.parentId !== n.parent) {
    moved.push({ ...n, liveParent: f.parentId, liveParentName: liveById.get(f.parentId)?.title ?? "(not queried)" });
  }
}

for (const f of live) {
  if (boardById.has(f.id)) continue;
  if (!knownParents.has(f.parentId)) continue;   // below anything the board knows
  (parentDepth(f.parentId) >= 1 ? tooDeep : added).push(f);
}

const name = (id) => liveById.get(id)?.title ?? boardById.get(id)?.name ?? id;
const section = (title, rows, fmt) => {
  if (!rows.length) return;
  console.log(`\n${title} (${rows.length})`);
  for (const r of rows) console.log("  " + fmt(r));
};

console.log(`board: ${board.nodes.length} folders   live: ${live.length} folders seen   label: ${board.countLabel ?? "?"}`);

section("DEAD — on the board but not found live", dead,
  (n) => `${n.name}  [${n.id}]  index.html:${n.line}`);

section("RENAMED — same folder, new name in Drive", renamed,
  (n) => `"${n.name}" -> "${n.liveName}"  index.html:${n.line}`);

section("MOVED — same folder, different parent in Drive (structural)", moved,
  (n) => `${n.name}: board parent ${name(n.parent)} -> live parent ${n.liveParentName}`);

section("NEW — in Drive, not on the board (routine, a row fits)", added,
  (f) => `${f.title}  under ${name(f.parentId)}  [${f.id}]`);

section("NEW BUT TOO DEEP — would need a 3rd drill-down level (structural)", tooDeep,
  (f) => `${f.title}  under ${name(f.parentId)}  [${f.id}]`);

const drift = dead.length + renamed.length + moved.length + added.length + tooDeep.length;
if (!drift) console.log("\nNo drift. The board matches Drive at every level it covers.");
else console.log(`\n${drift} difference(s). Moves and anything needing a 3rd level are structural — ask before reshaping.`);

process.exit(drift ? 1 : 0);
