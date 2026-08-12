/**
 * Live site status probe for the Training Unit Command Center.
 *
 * GET /api/status — probes production health (not CI).
 * Prefer JSON /api/health when available; fall back to homepage reachability.
 */

const SITES = [
  {
    id: "learning-hub",
    label: "Learning Hub",
    healthUrl: "https://lms-discovery.vercel.app/",
    fallbackUrl: "https://lms-discovery.vercel.app/",
    kind: "homepage",
  },
  {
    id: "brightspace-manager",
    label: "Brightspace Manager",
    healthUrl: "https://brightspace-manager.vercel.app/api/health/",
    fallbackUrl: "https://brightspace-manager.vercel.app/",
  },
];

const TIMEOUT_MS = 5000;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

async function probeHomepage(site, signal) {
  const homeStarted = Date.now();
  const home = await fetch(site.fallbackUrl, {
    method: "GET",
    redirect: "follow",
    signal,
    headers: { "User-Agent": "training-unit-command-center" },
  });
  return {
    id: site.id,
    label: site.label,
    ok: home.ok || (home.status >= 300 && home.status < 400),
    source: "homepage",
    db: null,
    latencyMs: Date.now() - homeStarted,
    url: site.fallbackUrl,
    checkedAt: new Date().toISOString(),
  };
}

async function probeSite(site) {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    if (site.kind === "homepage") {
      return await probeHomepage(site, controller.signal);
    }

    const res = await fetch(site.healthUrl, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "training-unit-command-center",
      },
    });
    const latencyMs = Date.now() - started;
    const contentType = res.headers.get("content-type") || "";

    if (res.ok && contentType.includes("application/json")) {
      let body = null;
      try {
        body = await res.json();
      } catch {
        body = null;
      }
      if (body && typeof body.ok === "boolean") {
        return {
          id: site.id,
          label: site.label,
          ok: body.ok === true && body.db !== "fail",
          source: "health",
          db: body.db ?? null,
          latencyMs: typeof body.latencyMs === "number" ? body.latencyMs : latencyMs,
          url: site.fallbackUrl,
          checkedAt: new Date().toISOString(),
        };
      }
    }

    // Health route missing/old deploy — fall back to homepage reachability.
    if (res.status === 404 || !contentType.includes("application/json")) {
      const homeController = new AbortController();
      const homeTimer = setTimeout(() => homeController.abort(), TIMEOUT_MS);
      try {
        return await probeHomepage(site, homeController.signal);
      } finally {
        clearTimeout(homeTimer);
      }
    }

    return {
      id: site.id,
      label: site.label,
      ok: false,
      source: "health",
      db: "fail",
      latencyMs,
      url: site.fallbackUrl,
      checkedAt: new Date().toISOString(),
    };
  } catch (err) {
    return {
      id: site.id,
      label: site.label,
      ok: false,
      source: "error",
      db: null,
      latencyMs: Date.now() - started,
      url: site.fallbackUrl,
      error: err instanceof Error ? err.name : "fetch_failed",
      checkedAt: new Date().toISOString(),
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function onRequestGet() {
  try {
    const sites = await Promise.all(SITES.map(probeSite));
    return json({ sites, updated: new Date().toISOString() });
  } catch {
    return json({ error: "probe failed" }, 502);
  }
}

export const onRequest = ({ request }) =>
  json({ error: `${request.method} not allowed` }, 405);
