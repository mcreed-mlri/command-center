/**
 * Personal pins + todos for the team focus pages (/marlie, /olivia, …).
 *
 * Cloudflare Pages picks this up automatically as GET|PUT /api/data/:slug,
 * where slug is the page name — /olivia reads and writes KV key "focus:olivia".
 * No accounts, no tokens: opening the page on any device gets your stuff.
 * That also means the endpoint is open, which is a deliberate call for a
 * small internal tool on an unlisted URL.
 *
 * Setup (one time, in the Cloudflare dashboard):
 *   the Pages project → Settings → Bindings → add a KV namespace binding
 *   pointing at the "command_center" namespace → redeploy.
 *   (namespace id ddf1904797a24202a72c837b91bca6c1, for wrangler/API use —
 *    the dashboard picks it from a dropdown, so you never type it there.)
 *
 * The *variable name* you choose there is what shows up on `env` — the
 * namespace's own name is not what the code sees. Either FOCUS_KV or KV
 * works here, so whichever the dashboard defaulted to is fine.
 *
 * Until that binding exists this returns 503 and the pages fall back to
 * localStorage only, which is also what happens offline. Nothing breaks.
 */

const SLUG_RE = /^[a-z][a-z0-9-]{1,30}$/;
const MAX_BYTES = 64 * 1024;
const MAX_PINS = 40;
const MAX_TODOS = 300;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

const str = (v, max) => (typeof v === "string" ? v : "").slice(0, max).trim();

/* Only http(s) survives. A pin url becomes an href, so a "javascript:" value
   arriving from storage would be a self-XSS waiting to happen. */
function safeUrl(v) {
  try {
    const u = new URL(str(v, 2048));
    return u.protocol === "http:" || u.protocol === "https:" ? u.href : "";
  } catch {
    return "";
  }
}

/* The client sanitizes too, but never trust that — this is the only gate in
   front of whatever ends up in KV. */
function clean(input) {
  const o = input && typeof input === "object" ? input : {};
  const pins = (Array.isArray(o.pins) ? o.pins : []).slice(0, MAX_PINS).map((p) => ({
    id: str(p?.id, 40),
    label: str(p?.label, 60),
    url: safeUrl(p?.url),
    icon: str(p?.icon, 24),
    color: /^#[0-9a-fA-F]{6}$/.test(p?.color || "") ? p.color : "#b4531f",
  }));
  const todos = (Array.isArray(o.todos) ? o.todos : []).slice(0, MAX_TODOS).map((t) => ({
    id: str(t?.id, 40),
    text: str(t?.text, 300),
    done: Boolean(t?.done),
    created: str(t?.created, 40),
  }));
  return {
    v: 1,
    pins: pins.filter((p) => p.id && p.label && p.url),
    todos: todos.filter((t) => t.id && t.text),
    updated: str(o.updated, 40) || new Date().toISOString(),
  };
}

const kvKey = (slug) => `focus:${slug}`;

/* Accepts whichever binding variable the dashboard was set up with. */
const store = (env) => env.FOCUS_KV || env.KV || null;

export async function onRequestGet({ params, env }) {
  if (!SLUG_RE.test(params.slug)) return json({ error: "bad slug" }, 400);
  const kv = store(env);
  if (!kv) return json({ error: "kv not bound" }, 503);

  const raw = await kv.get(kvKey(params.slug));
  if (!raw) return json({ v: 1, pins: [], todos: [], updated: null });
  return new Response(raw, {
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export async function onRequestPut({ params, env, request }) {
  if (!SLUG_RE.test(params.slug)) return json({ error: "bad slug" }, 400);
  const kv = store(env);
  if (!kv) return json({ error: "kv not bound" }, 503);

  const body = await request.text();
  if (body.length > MAX_BYTES) return json({ error: "too large" }, 413);

  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    return json({ error: "bad json" }, 400);
  }

  const value = clean(parsed);
  await kv.put(kvKey(params.slug), JSON.stringify(value));
  return json({ ok: true, updated: value.updated });
}

export const onRequest = ({ request }) =>
  json({ error: `${request.method} not allowed` }, 405);
