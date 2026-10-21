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
  /* No date column; "Team Lead" is the people column. Most of the actual
     assignments on this board are subitems, which reach the pages only
     through the recently-assigned banner (see subitemTasks). */
  { key: "trial", heading: "Pre-Trial & Trial Skills", id: "18436276181",
    people: "multiple_person_mm8a8zxc", status: "color_mm8az2hx", date: null, timeline: "timerange_mm8az2z5" },
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
  // Pre-Trial & Trial Skills board labels
  "ongoing": "work",
  "planning": "work",
  "not started yet": "idle",
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
        created_at
        creator_id
        group { title }
        column_values(ids: $cols) { id text value }
        subitems {
          id
          name
          created_at
          creator_id
          board { id }
          column_values(types: [people, status, date, timeline]) { id type text value }
        }
      }
    }
  }
}`;

/* Who was added to which item's people column, and when. Only the last
   ASSIGN_LOOKBACK_DAYS are read: the pages flag anything assigned in the past
   week, so older history would just be weight. */
const ACTIVITY_QUERY = `
query ($boardId: ID!, $cols: [String], $from: ISO8601DateTime) {
  boards(ids: [$boardId]) {
    activity_logs(from: $from, column_ids: $cols, limit: 1000) { event data created_at user_id }
  }
}`;
const ASSIGN_LOOKBACK_DAYS = 8;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function gql(variables, token, query = QUERY) {
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
        body: JSON.stringify({ query, variables }),
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

/**
 * itemId -> { userId -> epoch ms } for people added to the board's people
 * column in the lookback window, ignoring self-assignment. Monday stamps
 * activity logs in 100ns units, hence the /1e4.
 */
async function fetchAssignments(board, token) {
  const from = new Date(Date.now() - ASSIGN_LOOKBACK_DAYS * 86400000).toISOString();
  const data = await gql({ boardId: board.id, cols: board.people ? [board.people] : null, from }, token, ACTIVITY_QUERY);
  const out = {};
  for (const log of data.boards?.[0]?.activity_logs || []) {
    if (log.event !== "update_column_value") continue;
    let d;
    try { d = JSON.parse(log.data); } catch { continue; }
    const ids = (v) => new Set((v?.personsAndTeams || []).filter((p) => p.kind === "person").map((p) => Number(p.id)));
    const before = ids(d.previous_value);
    const at = Number(log.created_at) / 1e4;
    for (const uid of ids(d.value)) {
      if (before.has(uid) || uid === Number(log.user_id)) continue;
      const item = (out[d.pulse_id] ||= {});
      if (!item[uid] || at > item[uid]) item[uid] = at;
    }
  }
  return out;
}

export async function fetchBoard(board, token) {
  const cols = [board.people, board.status, board.date, board.timeline].filter(Boolean);
  const records = [];
  let cursor = null;
  let verified = false;

  /* The banner is a nice-to-have: if the activity log can't be read, the task
     list still loads, just without anything flagged as new. */
  const assignments = await fetchAssignments(board, token).catch((err) => {
    console.warn(`Board ${board.heading}: activity log unavailable (${err.message})`);
    return {};
  });

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
        createdAt: item.created_at || null,
        creatorId: Number(item.creator_id) || null,
        assignedAt: assignments[item.id] || {},
        subitems: (item.subitems || []).map((sub) => subitemRecord(sub, item.name)),
      });
    }
    cursor = live.items_page.cursor;
  } while (cursor);

  /* Subitems live on their own "Subitems of …" board, so who-added-whom comes
     from that board's activity log. Every column on it is read: subitem
     boards name their people column however they like. */
  const subBoardIds = [...new Set(records.flatMap((r) => r.subitems.map((s) => s.boardId)).filter(Boolean))];
  for (const id of subBoardIds) {
    const subAssigned = await fetchAssignments({ id, heading: `${board.heading} subitems` }, token).catch((err) => {
      console.warn(`Board ${board.heading} subitems: activity log unavailable (${err.message})`);
      return {};
    });
    for (const r of records) for (const s of r.subitems) {
      if (subAssigned[s.id]) s.assignedAt = subAssigned[s.id];
    }
  }

  return records;
}

/* Subitem columns are found by type rather than id: each subitem board has
   its own ids, and they are not worth pinning in BOARDS for a banner. */
function subitemRecord(sub, parentName) {
  const ofType = (type) => (sub.column_values || []).find((c) => c.type === type) || {};
  let people = [];
  try {
    people = (JSON.parse(ofType("people").value || "{}").personsAndTeams || [])
      .filter((p) => p.kind === "person")
      .map((p) => Number(p.id));
  } catch { /* malformed people cell */ }
  let timelineTo = null;
  try { timelineTo = JSON.parse(ofType("timeline").value || "{}").to || null; } catch { /* ignore */ }
  return {
    id: sub.id,
    name: sub.name,
    parent: parentName,
    boardId: sub.board?.id || null,
    status: ofType("status").text || "",
    date: ofType("date").text || "",
    timelineTo,
    people,
    createdAt: sub.created_at || null,
    creatorId: Number(sub.creator_id) || null,
    assignedAt: {},
  };
}

export async function fetchAllBoards(token) {
  const entries = await Promise.all(
    BOARDS.map(async (b) => [b.key, await fetchBoard(b, token)])
  );
  return Object.fromEntries(entries);
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const ASSIGN_WINDOW_MS = 7 * 86400000;

const etDate = (ms) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ms));

/* When userId got this task, if it was in the last week and someone else
   gave it to them: an add in the activity log, or an item created with them
   already on it (creation doesn't always log a people-column change). */
function recentlyAssigned(rec, userId) {
  let at = rec.assignedAt?.[userId] || 0;
  const created = Date.parse(rec.createdAt || "") || 0;
  if (!at && created && rec.creatorId !== userId) at = created;
  return at && Date.now() - at < ASSIGN_WINDOW_MS ? etDate(at) : null;
}

function toTask(rec, board, userId, unmapped) {
  if (!rec.people.includes(userId)) return null;

  const label = (rec.status || "").trim();
  const isDone = DONE.has(label.toLowerCase());
  let s = isDone ? "done" : STATUS_MAP[label.toLowerCase()];
  if (!s) { unmapped.add(`${board.heading}: "${label}"`); s = "idle"; }

  const date = (rec.date || "").trim();
  const due = ISO.test(date) ? date : ISO.test(rec.timelineTo || "") ? rec.timelineTo : null;
  const assigned = isDone ? null : recentlyAssigned(rec, userId);

  return {
    b: board.key,
    cat: CAT_ALIAS[rec.group] || rec.group,
    n: NAME_OVERRIDES[rec.id] || rec.name,
    s,
    due,
    id: rec.id,
    ...(rec.people.length > 1 ? { shared: true } : {}),
    ...(assigned ? { a: assigned } : {}),
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

/* Subitems are steps under a milestone, not milestones, so the pages list
   none of them -- except one someone else handed you this past week, which
   rides along flagged sub:true for the "New this week" banner only. */
function subitemTasks(rec, board, userId) {
  return (rec.subitems || []).flatMap((sub) => {
    if (!sub.people.includes(userId)) return [];
    if (DONE.has((sub.status || "").trim().toLowerCase())) return [];
    const a = recentlyAssigned(sub, userId);
    if (!a) return [];
    const date = (sub.date || "").trim();
    return [{
      b: board.key,
      cat: CAT_ALIAS[rec.group] || rec.group,
      n: sub.name,
      s: STATUS_MAP[(sub.status || "").trim().toLowerCase()] || "idle",
      due: ISO.test(date) ? date : ISO.test(sub.timelineTo || "") ? sub.timelineTo : null,
      id: sub.id,
      ...(sub.people.length > 1 ? { shared: true } : {}),
      a,
      sub: true,
      p: sub.parent,
    }];
  });
}

export function tasksForUser(byBoard, userId) {
  const unmapped = new Set();
  const tasks = ordered(
    BOARDS.flatMap((board) =>
      (byBoard[board.key] || []).flatMap((rec) =>
        [toTask(rec, board, userId, unmapped), ...subitemTasks(rec, board, userId)].filter(Boolean)
      )
    )
  );
  return { tasks, unmapped };
}

export const todayET = () => etDate(Date.now());

/** Resolve Monday user id for a focus-page slug from Worker/Node env. */
export function userIdForSlug(slug, env = process.env) {
  const key = slug.toUpperCase();
  const fromEnv = env[`MONDAY_USER_ID_${key}`];
  if (fromEnv) return Number(fromEnv);
  if (slug === "marlie" && env.MONDAY_USER_ID) return Number(env.MONDAY_USER_ID);
  return DEFAULT_USER_IDS[slug] || 0;
}

export const SLUG_RE = /^[a-z][a-z0-9-]{1,30}$/;
