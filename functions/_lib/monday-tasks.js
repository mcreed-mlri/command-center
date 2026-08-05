/**
 * Shared Monday.com task fetch + transform for the nightly snapshot script
 * and the live /api/tasks/:slug Pages Function.
 *
 * Board column ids live here — if Monday moves a column, update BOARDS once
 * and both paths pick it up.
 */

export const API_URL = "https://api.monday.com/v2";
export const API_VERSION = "2026-07";

export const BOARDS = [
  { key: "ops", heading: "Operations", id: "18418833001",
    people: "multiple_person_mm4jktf9", status: "color_mm4v35ba", date: "date_mm4jybye", timeline: "timerange_mm4jxj08" },
  { key: "lms", heading: "LMS", id: "18421080121",
    people: "person", status: "status", date: "date4", timeline: "timerange_mm54mpqq" },
  { key: "content", heading: "Content Design", id: "18420946283",
    people: "multiple_person_mm518x46", status: "color_mm513668", date: "date_mm51kh32", timeline: "timerange_mm51x3zw" },
  { key: "data", heading: "Data & Evaluation", id: "18421082069",
    people: "person", status: "status", date: "date4", timeline: "timerange_mm54n315" },
  { key: "comms", heading: "Comms & Branding", id: "18421083526",
    people: "person", status: "status", date: "date4", timeline: "timerange_mm5fazhm" },
  { key: "sustain", heading: "Sustainability Roadmap", id: "18424143459",
    people: "multiple_person_mm5pbstd", status: "color_mm5pfhqn", date: "date_mm5p3hw2", timeline: null },
];

/** Default Monday user ids — env vars override in both Node and Workers. */
export const DEFAULT_USER_IDS = {
  marlie: 104326741,
  olivia: 103559830,
  carolina: 104326790,
  ashley: 104326737,
};

export const STATUS_MAP = {
  "working on it": "work",
  "waiting/paused": "wait",
  "needs review": "wait",
  "not started": "idle",
  "": "idle",
};
const DONE = new Set(["done"]);

export const CAT_ALIAS = {
  "Pilot & Launch Readiness": "Pilot & Launch",
  "Governance & Operations": "Governance & Ops",
  "Platform and Administation": "Platform & Admin",
  "Expansion Planning for Future": "Expansion Planning",
  "LMS Build vs. Buy Research For Future": "LMS Build vs. Buy",
};

export const NAME_OVERRIDES = {
  "12530495580": "Develop system of original and updated modules",
};

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

export async function gql(variables, token) {
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

export async function fetchBoard(board, token) {
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
          `Board ${board.heading}: column(s) ${missing.join(", ")} no longer exist — update BOARDS`
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
      } catch { /* malformed people cell */ }

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

export async function fetchAllBoards(token) {
  const entries = await Promise.all(
    BOARDS.map(async (b) => [b.key, await fetchBoard(b, token)])
  );
  return Object.fromEntries(entries);
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;

function toTask(rec, board, userId, unmapped) {
  if (!rec.people.includes(userId)) return null;

  const label = (rec.status || "").trim();
  const isDone = DONE.has(label.toLowerCase());
  let s = isDone ? "done" : STATUS_MAP[label.toLowerCase()];
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
    ...(rec.people.length > 1 ? { shared: true } : {}),
  };
}

function ordered(tasks) {
  const rank = new Map(BOARDS.map((b, i) => [b.key, i]));
  return [...tasks].sort(
    (a, b) =>
      rank.get(a.b) - rank.get(b.b) ||
      (a.due === b.due ? 0 : a.due === null ? 1 : b.due === null ? -1 : a.due < b.due ? -1 : 1) ||
      a.n.localeCompare(b.n)
  );
}

export function tasksForUser(byBoard, userId) {
  const unmapped = new Set();
  const tasks = ordered(
    BOARDS.flatMap((board) =>
      (byBoard[board.key] || []).map((rec) => toTask(rec, board, userId, unmapped)).filter(Boolean)
    )
  );
  return { tasks, unmapped };
}

export const todayET = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

/** Resolve Monday user id for a focus-page slug from Worker/Node env. */
export function userIdForSlug(slug, env = process.env) {
  const key = slug.toUpperCase();
  const fromEnv = env[`MONDAY_USER_ID_${key}`];
  if (fromEnv) return Number(fromEnv);
  if (slug === "marlie" && env.MONDAY_USER_ID) return Number(env.MONDAY_USER_ID);
  return DEFAULT_USER_IDS[slug] || 0;
}

export const SLUG_RE = /^[a-z][a-z0-9-]{1,30}$/;
