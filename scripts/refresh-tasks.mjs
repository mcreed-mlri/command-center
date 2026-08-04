#!/usr/bin/env node
/**
 * Regenerates the MY MONDAY TASKS snapshot inside marlie/index.html from the
 * live LACE boards. Run nightly by .github/workflows/refresh-tasks.yml.
 *
 *   MONDAY_API_TOKEN=... node scripts/refresh-tasks.mjs
 *
 * Flags:
 *   --check          print what would change, write nothing, exit 1 if stale
 *   --input <file>   read saved board records instead of calling the API
 *   --output <file>  save the fetched board records (makes an --input fixture)
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const HTML = fileURLToPath(new URL("../marlie/index.html", import.meta.url));

const API_URL = "https://api.monday.com/v2";
const API_VERSION = "2026-07"; // pinned; `query { versions }` lists what's current
const USER_ID = Number(process.env.MONDAY_USER_ID || 104326741); // Marlie Creed

/* Board config. `people`/`status`/`date`/`timeline` are Monday column ids —
   they are NOT guessable from column type, since several boards carry a second
   status column ("Priority") and a Timeline alongside the date. The script
   verifies every id still exists on its board and fails loudly if one moved.
   `key` must match a key in the page's own BOARDS map. */
const BOARDS = [
  { key: "ops",     heading: "Operations",             id: "18418833001",
    people: "multiple_person_mm4jktf9", status: "color_mm4v35ba", date: "date_mm4jybye",  timeline: "timerange_mm4jxj08" },
  { key: "lms",     heading: "LMS",                    id: "18421080121",
    people: "person",                   status: "status",         date: "date4",          timeline: "timerange_mm54mpqq" },
  { key: "content", heading: "Content Design",         id: "18420946283",
    people: "multiple_person_mm518x46", status: "color_mm513668", date: "date_mm51kh32",  timeline: "timerange_mm51x3zw" },
  { key: "data",    heading: "Data & Evaluation",      id: "18421082069",
    people: "person",                   status: "status",         date: "date4",          timeline: "timerange_mm54n315" },
  { key: "comms",   heading: "Comms & Branding",       id: "18421083526",
    people: "person",                   status: "status",         date: "date4",          timeline: "timerange_mm5fazhm" },
  { key: "sustain", heading: "Sustainability Roadmap", id: "18424143459",
    people: "multiple_person_mm5pbstd", status: "color_mm5pfhqn", date: "date_mm5p3hw2",  timeline: null },
];

/* Monday status label -> the page's three states. Unset counts as not started.
   Anything in DONE drops off the page entirely. */
const STATUS_MAP = {
  "working on it": "work",
  "waiting/paused": "wait",
  "needs review": "wait",
  "not started": "idle",
  "": "idle",
};
const DONE = new Set(["done"]);

/* Group titles run long in Monday; the page uses these short forms. */
const CAT_ALIAS = {
  "Pilot & Launch Readiness": "Pilot & Launch",
  "Governance & Operations": "Governance & Ops",
  "Platform and Administation": "Platform & Admin", // sic — the typo is in Monday
  "Expansion Planning for Future": "Expansion Planning",
  "LMS Build vs. Buy Research For Future": "LMS Build vs. Buy",
};

/* Hand-shortened display names, keyed by Monday item id. */
const NAME_OVERRIDES = {
  "12530495580": "Develop system of original and updated modules",
};

/* ---- args ------------------------------------------------------------- */
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const value = (name) => { const i = argv.indexOf(name); return i === -1 ? null : argv[i + 1]; };
const CHECK = flag("--check");
const INPUT = value("--input");
const OUTPUT = value("--output");

/* ---- Monday API ------------------------------------------------------- */
const QUERY = `
query ($boardId: ID!, $cols: [String!], $cursor: String) {
  boards(ids: [$boardId]) {
    columns { id }
    items_page(limit: 500, cursor: $cursor) {
      cursor
      items {
        id
        name
        group { title }
        column_values(ids: $cols) { id text value }
      }
    }
  }
}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function gql(variables, token) {
  const ATTEMPTS = 3;
  for (let attempt = 1; ; attempt++) {
    let res, body;
    try {
      res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
          "API-Version": API_VERSION,
        },
        body: JSON.stringify({ query: QUERY, variables }),
      });
      body = await res.json();
    } catch (err) {
      if (attempt >= ATTEMPTS) throw err;
      await sleep(attempt * 2000);
      continue;
    }
    const problem = !res.ok || body.errors || body.error_message;
    if (problem) {
      const msg =
        body?.errors?.map((e) => e.message).join("; ") ||
        body?.error_message ||
        `HTTP ${res.status}`;
      const retryable = res.status === 429 || res.status >= 500;
      if (retryable && attempt < ATTEMPTS) { await sleep(attempt * 5000); continue; }
      throw new Error(`Monday API: ${msg}`);
    }
    return body.data;
  }
}

/* Fetches one board and flattens it to plain records (the same shape --input
   takes), so the transform below is testable without an API call. */
async function fetchBoard(board, token) {
  const cols = [board.people, board.status, board.date, board.timeline].filter(Boolean);
  const records = [];
  let cursor = null;
  let verified = false;

  do {
    const data = await gql({ boardId: board.id, cols, cursor }, token);
    const live = data.boards?.[0];
    if (!live) throw new Error(`Board ${board.heading} (${board.id}) is not visible to this token`);

    if (!verified) {
      const present = new Set(live.columns.map((c) => c.id));
      const missing = cols.filter((c) => !present.has(c));
      if (missing.length) {
        throw new Error(
          `Board ${board.heading}: column(s) ${missing.join(", ")} no longer exist — ` +
            `update BOARDS in scripts/refresh-tasks.mjs`
        );
      }
      verified = true;
    }

    for (const item of live.items_page.items) {
      const col = (id) => item.column_values.find((c) => c.id === id) || {};
      let people = [];
      try {
        people = (JSON.parse(col(board.people).value || "{}").personsAndTeams || [])
          .filter((p) => p.kind === "person")
          .map((p) => Number(p.id));
      } catch { /* malformed people cell — treat as unassigned */ }

      let timelineTo = null;
      if (board.timeline) {
        try { timelineTo = JSON.parse(col(board.timeline).value || "{}").to || null; } catch { /* ignore */ }
      }

      records.push({
        id: item.id,
        name: item.name,
        group: item.group?.title || "",
        status: col(board.status).text || "",
        date: col(board.date).text || "",
        timelineTo,
        people,
      });
    }
    cursor = live.items_page.cursor;
  } while (cursor);

  return records;
}

/* ---- transform -------------------------------------------------------- */
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const unmapped = new Set();

function toTask(rec, board) {
  if (!rec.people.includes(USER_ID)) return null;

  const label = (rec.status || "").trim();
  if (DONE.has(label.toLowerCase())) return null;
  let s = STATUS_MAP[label.toLowerCase()];
  if (!s) { unmapped.add(`${board.heading}: "${label}"`); s = "idle"; }

  const date = (rec.date || "").trim();
  const due = ISO.test(date) ? date : ISO.test(rec.timelineTo || "") ? rec.timelineTo : null;

  return {
    b: board.key,
    cat: CAT_ALIAS[rec.group] || rec.group,
    n: NAME_OVERRIDES[rec.id] || rec.name,
    s,
    due,
    id: rec.id,
    shared: rec.people.length > 1,
  };
}

/* Board order, then due date (undated last), then name — deterministic so the
   nightly commit only shows real changes. The page re-sorts client-side. */
function ordered(tasks) {
  const rank = new Map(BOARDS.map((b, i) => [b.key, i]));
  return [...tasks].sort(
    (a, b) =>
      rank.get(a.b) - rank.get(b.b) ||
      (a.due === b.due ? 0 : a.due === null ? 1 : b.due === null ? -1 : a.due < b.due ? -1 : 1) ||
      a.n.localeCompare(b.n)
  );
}

/* JSON.stringify leaves "</script" intact, which would close the inline
   <script> early if an item name ever contained it. */
const js = (str) => JSON.stringify(str).replace(/<\//g, "<\\/");

function render(tasks, eol) {
  const lines = [];
  for (const board of BOARDS) {
    const mine = tasks.filter((t) => t.b === board.key);
    if (!mine.length) continue;
    lines.push(`      // ---- ${board.heading} ----`);
    for (const t of mine) {
      lines.push(
        `      { b:${js(t.b)}, cat:${js(t.cat)}, n:${js(t.n)}, s:${js(t.s)}, ` +
          `due:${t.due ? js(t.due) : "null"}, id:${js(t.id)}${t.shared ? ", shared:true" : ""} },`
      );
    }
  }
  return lines.join(eol);
}

/* ---- page rewrite ----------------------------------------------------- */
const START = "// >>> TASKS-START — generated by scripts/refresh-tasks.mjs, do not hand-edit";
const END = "// <<< TASKS-END";

function readBlock(html) {
  const from = html.indexOf(START);
  const to = html.indexOf(END);
  if (from === -1 || to === -1 || to < from) {
    throw new Error(`marlie/index.html is missing the ${START.slice(0, 22)} / ${END} markers`);
  }
  const bodyStart = html.indexOf("\n", from) + 1;
  const bodyEnd = html.lastIndexOf("\n", to) + 1;
  return { bodyStart, bodyEnd, body: html.slice(bodyStart, bodyEnd) };
}

/* Light parse of the block already on the page, so the run can report what
   actually changed rather than just "the file differs". */
function parseBlock(body) {
  const out = new Map();
  const line = /\{\s*b:"([^"]+)",\s*cat:"((?:[^"\\]|\\.)*)",\s*n:"((?:[^"\\]|\\.)*)",\s*s:"(\w+)",\s*due:(null|"[\d-]+"),\s*id:"(\d+)"(,\s*shared:true)?\s*\}/g;
  for (const m of body.matchAll(line)) {
    out.set(m[6], {
      b: m[1],
      cat: JSON.parse(`"${m[2]}"`),
      n: JSON.parse(`"${m[3]}"`),
      s: m[4],
      due: m[5] === "null" ? null : JSON.parse(m[5]),
      id: m[6],
      shared: Boolean(m[7]),
    });
  }
  return out;
}

function summarize(before, after) {
  const added = [], removed = [], changed = [];
  for (const t of after) {
    const old = before.get(t.id);
    if (!old) { added.push(t); continue; }
    const deltas = ["cat", "n", "s", "due", "shared", "b"]
      .filter((k) => (old[k] ?? null) !== (t[k] ?? null))
      .map((k) => `${k}: ${JSON.stringify(old[k] ?? null)} -> ${JSON.stringify(t[k] ?? null)}`);
    if (deltas.length) changed.push({ t, deltas });
  }
  const live = new Set(after.map((t) => t.id));
  for (const [id, t] of before) if (!live.has(id)) removed.push(t);
  return { added, removed, changed };
}

const todayET = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

/* ---- main ------------------------------------------------------------- */
const token = process.env.MONDAY_API_TOKEN;
if (!INPUT && !token) {
  console.error("MONDAY_API_TOKEN is not set (repo secret MONDAY_API_TOKEN feeds the nightly run).");
  process.exit(2);
}

const byBoard = INPUT
  ? JSON.parse(readFileSync(INPUT, "utf8"))
  : Object.fromEntries(
      await Promise.all(BOARDS.map(async (b) => [b.key, await fetchBoard(b, token)]))
    );

if (OUTPUT) writeFileSync(OUTPUT, JSON.stringify(byBoard, null, 1) + "\n");

const tasks = ordered(
  BOARDS.flatMap((board) =>
    (byBoard[board.key] || []).map((rec) => toTask(rec, board)).filter(Boolean)
  )
);

if (!tasks.length) {
  console.error("Refusing to write an empty task list — the API returned nothing for this user.");
  process.exit(2);
}

let html = readFileSync(HTML, "utf8");

const pageBoards = new Set(
  [...(html.match(/const BOARDS = \{[\s\S]*?\n {4}\};/)?.[0] || "").matchAll(/^\s{6}(\w+):\s*\{/gm)].map((m) => m[1])
);
const orphan = [...new Set(tasks.map((t) => t.b))].filter((k) => !pageBoards.has(k));
if (orphan.length) {
  console.error(`Board key(s) ${orphan.join(", ")} are not in the page's BOARDS map — add them to marlie/index.html.`);
  process.exit(2);
}

const { bodyStart, bodyEnd, body } = readBlock(html);
const { added, removed, changed } = summarize(parseBlock(body), tasks);

// The runner checks out LF; a Windows working copy is CRLF. Match what's there
// so the block isn't rewritten with mixed endings.
const eol = body.includes("\r\n") ? "\r\n" : "\n";
const rendered = render(tasks, eol) + eol;
const date = todayET();
const tasksChanged = rendered !== body;
let next = html.slice(0, bodyStart) + rendered + html.slice(bodyEnd);
// SNAPSHOT_DATE records the last time the page was checked against Monday, so
// it bumps on every successful run even when no task changed.
next = next.replace(/const SNAPSHOT_DATE = "[\d-]{10}";/, `const SNAPSHOT_DATE = "${date}";`);

console.log(`${tasks.length} tasks for user ${USER_ID} across ${new Set(tasks.map((t) => t.b)).size} boards`);
for (const t of added) console.log(`  + ${t.n} (${t.cat} · ${t.b})`);
for (const t of removed) console.log(`  - ${t.n} (${t.cat} · ${t.b})`);
for (const { t, deltas } of changed) console.log(`  ~ ${t.n} — ${deltas.join(", ")}`);
if (unmapped.size) {
  console.log(`\nUnrecognized status label(s), treated as "Not started" — add them to STATUS_MAP:`);
  for (const u of unmapped) console.log(`  ! ${u}`);
}

if (!tasksChanged) console.log("  (no task changes)");

// --check only judges the tasks; SNAPSHOT_DATE bumping on its own isn't stale.
if (CHECK) {
  console.log(tasksChanged ? "\n--check: tasks are stale (nothing written)." : "\n--check: tasks are current.");
  process.exit(tasksChanged ? 1 : 0);
}

if (next === html) { console.log("\nPage already current — nothing to write."); process.exit(0); }

writeFileSync(HTML, next);
console.log(`\nWrote marlie/index.html (SNAPSHOT_DATE ${date}).`);
