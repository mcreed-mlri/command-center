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
 */

const PROJECTS = [
  {
    repo: "mcreed-mlri/lms-discovery",
    label: "Learning Hub",
    workflows: [
      { file: "ci.yml", label: "CI" },
      { file: "ci.yml", label: "Weekly", event: "schedule" },
    ],
  },
  {
    repo: "mcreed-mlri/brightspace-manager",
    label: "Brightspace Manager",
    workflows: [
      { file: "ci.yml", label: "CI" },
      { file: "ci.yml", label: "Weekly", event: "schedule" },
      { file: "codeql.yml", label: "CodeQL" },
    ],
  },
];

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

async function fetchRun(repo, file, headers, event) {
  const params = new URLSearchParams({ per_page: "1" });
  if (event) params.set("event", event);
  const res = await fetch(
    `https://api.github.com/repos/${repo}/actions/workflows/${file}/runs?${params}`,
    { headers }
  );
  if (!res.ok) throw new Error(String(res.status));
  const data = await res.json();
  const run = data.workflow_runs?.[0];
  if (!run) return null;
  return {
    status: run.status,
    conclusion: run.conclusion,
    url: run.html_url,
    updatedAt: run.updated_at,
    event: run.event,
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
              const run = await fetchRun(project.repo, w.file, headers, w.event);
              return { file: w.file, label: w.label, event: w.event || null, run };
            } catch {
              return {
                file: w.file,
                label: w.label,
                event: w.event || null,
                run: null,
                error: true,
              };
            }
          })
        );
        return { repo: project.repo, label: project.label, workflows };
      })
    );
    return json({ projects, updated: new Date().toISOString() });
  } catch {
    return json({ error: "fetch failed" }, 502);
  }
}

export const onRequest = ({ request }) =>
  json({ error: `${request.method} not allowed` }, 405);
