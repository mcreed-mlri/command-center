/**
 * Live site status probe for the Training Unit Command Center.
 *
 * GET /api/status — probes Learning Hub + Brightspace Manager production
 * reachability. Their /api/health/* routes are auth-gated, so we check the
 * public homepage (and follow redirects) rather than those operator endpoints.
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
    healthUrl: "https://brightspace-manager.vercel.app/",
    fallbackUrl: "https://brightspace-manager.vercel.app/",
    kind: "homepage",
  },
];

const TIMEOUT_MS = 5000;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

async function probeSite(site) {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(site.healthUrl, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "training-unit-command-center" },
    });
    const latencyMs = Date.now() - started;

    // Homepage / redirect-to-app is enough — deep health routes need secrets.
    if (site.kind === "homepage") {
      return {
        id: site.id,
        label: site.label,
        ok: res.ok || (res.status >= 300 && res.status < 400),
        source: "homepage",
        db: null,
        latencyMs,
        url: site.fallbackUrl,
        checkedAt: new Date().toISOString(),
      };
    }

    return {
      id: site.id,
      label: site.label,
      ok: res.ok,
      source: "health",
      db: null,
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
