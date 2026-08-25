/**
 * Live Monday task fetch for focus pages.
 *
 * GET /api/tasks/:slug  →  { v, slug, snapshotDate, tasks, fetchedAt, cached? }
 *
 * Requires MONDAY_API_TOKEN as a Cloudflare Pages secret (same token as the
 * nightly GitHub Action). Optionally caches raw board data in KV for five
 * minutes so back-to-back refreshes don't hammer Monday. Pass ?fresh=1 to skip
 * that read -- someone pressing the refresh button has usually just changed
 * something in Monday, and serving them the cache shows them the world as it
 * was before their own edit.
 *
 * fetchedAt is when the boards were really read from Monday, not when this
 * response was assembled, so a cached answer can't claim to be a fresh pull.
 */

import {
  SLUG_RE,
  fetchAllBoards,
  tasksForUser,
  todayET,
  userIdForSlug,
} from "../../_lib/monday-tasks.js";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

const store = (env) => env.FOCUS_KV || env.KV || null;
const BOARDS_CACHE_KEY = "monday:boards:v1";
const BOARDS_CACHE_MS = 5 * 60 * 1000;

async function loadBoards(token, kv, fresh) {
  if (kv && !fresh) {
    try {
      const raw = await kv.get(BOARDS_CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        if (cached?.byBoard && cached.fetchedAt && Date.now() - Date.parse(cached.fetchedAt) < BOARDS_CACHE_MS) {
          return { byBoard: cached.byBoard, cached: true, fetchedAt: cached.fetchedAt };
        }
      }
    } catch { /* treat as miss */ }
  }

  const byBoard = await fetchAllBoards(token);
  const fetchedAt = new Date().toISOString();
  // A ?fresh=1 pull still refills the cache, so the next quiet sync stays cheap.
  if (kv) {
    try {
      await kv.put(BOARDS_CACHE_KEY, JSON.stringify({ byBoard, fetchedAt }));
    } catch { /* cache write is best-effort */ }
  }
  return { byBoard, cached: false, fetchedAt };
}

export async function onRequestGet({ params, env, request }) {
  const slug = params.slug;
  if (!SLUG_RE.test(slug)) return json({ error: "bad slug" }, 400);

  const userId = userIdForSlug(slug, env);
  if (!userId) return json({ error: "unknown slug" }, 404);

  const token = env.MONDAY_API_TOKEN;
  if (!token) return json({ error: "monday token not configured" }, 503);

  try {
    const kv = store(env);
    const fresh = new URL(request.url).searchParams.has("fresh");
    const { byBoard, cached, fetchedAt } = await loadBoards(token, kv, fresh);
    const { tasks } = tasksForUser(byBoard, userId);

    return json({
      v: 1,
      slug,
      snapshotDate: todayET(),
      tasks,
      fetchedAt,
      cached,
    });
  } catch (err) {
    return json({ error: err.message || "monday fetch failed" }, 502);
  }
}

export const onRequest = ({ request }) =>
  json({ error: `${request.method} not allowed` }, 405);
