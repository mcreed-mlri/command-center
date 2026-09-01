/**
 * CI status proxy for the Training Unit Command Center.
 *
 * GET /api/ci — latest GitHub Actions run per tracked workflow.
 *
 * Uses GITHUB_TOKEN (or GH_TOKEN) when set for higher rate limits; both
 * repos are public so the endpoint works without it.
 *
 * Learning Hub and Brightspace Manager both run CI on a Monday cron
 * (`event=schedule`). Manager also runs CodeQL (including a Sunday scan).
 *
 * The unfiltered CI rows are pinned to `main`: a green run on a PR branch says
 * nothing about production, and the main-branch run doubles as the reference
 * the dashboard uses to tell a live failure from a stale scheduled one. Each
 * run therefore also reports `sha` and `createdAt` — re-running a scheduled run
 * replays its original commit, so a cron failure can outlive its own fix and
 * only those two fields can prove main has moved past it.
 */

const PROJECTS = [
  {
    repo: "mcreed-mlri/lms-discovery",
    label: "Learning Hub",
    workflows: [
      { file: "ci.yml", label: "CI", branch: "main" },
      { file: "ci.yml", label: "Weekly", event: "schedule" },
    ],
  },
  {
    repo: "mcreed-mlri/brightspace-manager",
    label: "Brightspace Manager",
    workflows: [
      { file: "ci.yml", label: "CI", branch: "main" },
      { file: "ci.yml", label: "Weekly", event: "schedule" },
      { file: "codeql.yml", label: "CodeQL", branch: "main" },
    ],
  },
];

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

/* GitHub answers a rejected call with a JSON `message`, and that message is the
   whole diagnosis: "Bad credentials" is a token to replace, "API rate limit
   exceeded" is a quota to raise. Losing it turns every cause into the same
   blank "Couldn't check", so it travels back to the browser. */
async function ghError(res) {
  let message = "";
  try {
    message = (await res.json()).message || "";
  } catch {}
  const err = new Error(message || `HTTP ${res.status}`);
  err.status = res.status;
  err.detail = message;
  return err;
}

async function fetchRun(repo, file, headers, { event, branch } = {}) {
  const params = new URLSearchParams({ per_page: "1" });
  if (event) params.set("event", event);
  if (branch) params.set("branch", branch);
  const url = `https://api.github.com/repos/${repo}/actions/workflows/${file}/runs?${params}`;
  let res = await fetch(url, { headers });
  /* A token that has expired or been revoked is worse than no token at all:
     both repos are public, so unauthenticated still answers. Drop the rejected
     credential and ask again rather than reporting the repo as unreachable. */
  if (res.status === 401 && headers.Authorization) {
    const { Authorization, ...anon } = headers;
    res = await fetch(url, { headers: anon });
  }
  if (!res.ok) throw await ghError(res);
  const data = await res.json();
  const run = data.workflow_runs?.[0];
  if (!run) return null;
  return {
    status: run.status,
    conclusion: run.conclusion,
    url: run.html_url,
    createdAt: run.created_at,
    updatedAt: run.updated_at,
    event: run.event,
    sha: run.head_sha,
  };
}

export async function onRequestGet({ env }) {
  const token = env.GITHUB_TOKEN || env.GH_TOKEN || "";
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "training-unit-command-center",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  try {
    const projects = await Promise.all(
      PROJECTS.map(async (project) => {
        const workflows = await Promise.all(
          project.workflows.map(async (w) => {
            try {
              const run = await fetchRun(project.repo, w.file, headers, w);
              return {
                file: w.file,
                label: w.label,
                event: w.event || null,
                branch: w.branch || null,
                run,
              };
            } catch (err) {
              return {
                file: w.file,
                label: w.label,
                event: w.event || null,
                branch: w.branch || null,
                run: null,
                error: true,
                errorStatus: err.status || null,
                errorMessage: err.detail || err.message || "",
              };
            }
          })
        );
        return { repo: project.repo, label: project.label, workflows };
      })
    );
    /* The unauthenticated GitHub quota is charged per IP, and a Pages Function
       shares its egress address with every other tenant in the colo — so this
       proxy can be throttled while the same call from the browser's own IP
       still has all 60/hr to itself. Saying so lets the client retry there
       instead of rendering five grey rows. */
    const flat = projects.flatMap((p) => p.workflows);
    const degraded = flat.length > 0 && flat.every((w) => w.error);
    return json({
      projects,
      degraded,
      tokenUsed: Boolean(token),
      updated: new Date().toISOString(),
    });
  } catch {
    return json({ error: "fetch failed" }, 502);
  }
}

export const onRequest = ({ request }) =>
  json({ error: `${request.method} not allowed` }, 405);
