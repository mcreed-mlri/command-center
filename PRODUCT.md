# Product

## Platform

web

## Users

The four members of the MLRI Training Unit — Ashley, Carolina, Olivia, and Marlie.
Confirmed: nobody else. Not wider MLRI staff, not external faculty or partner
organizations. Marlie maintains the site.

They are four known people who use it every working day and need no orientation.
There is no cold visitor to design for, no "what is this" moment to earn, and no
reason to expand internal terminology for an outsider.

Primary situation, confirmed: **installed as a PWA or kept as a pinned tab on a
laptop**, opened once and glanced at throughout the day. Design consequences that
follow from the scene rather than from taste:

- It runs in a standalone window with no browser chrome, so the page is the whole
  application shell — there is no surrounding UI to lean on.
- The first viewport is not a first impression, it is the resting state someone
  returns to a dozen times a day. It has to survive repetition.
- Instant paint matters more than reveal or arrival; the page is already open.
- Desktop widths are the design target. Phone was explicitly not chosen as an
  equal scene, so mobile must stay correct and usable but does not lead.

## Product Purpose

One door to every tool the Training Unit works in, so nobody hunts through
bookmarks, Slack history, or Drive search to reach a board, folder, or document
they use weekly.

Two kinds of surface:

1. **The team board** (`/`) — a launcher of every shared tool, document, and
   project folder, grouped into four sections with drill-down for Drive folders
   and Monday workspaces, plus a `/` search across everything.
2. **Personal focus pages** (`/marlie`, `/olivia`, `/carolina`, `/ashley`) — one
   per person: their own Monday tasks, their own list, their own pins.

Success is that the tool someone needs is one glance and one click away, and that
nothing on the board is stale, broken, or dead-ended.

## Positioning

Not competing with anything — it is the seam between tools that don't talk to each
other. The mechanism a generic bookmark manager or intranet page could not copy:
the board and the focus pages carry **real project structure** (the actual LACE
board columns, the actual Drive folder tree, each person's actual assigned Monday
items), refreshed automatically, while staying a static site with no login.

## Operating Context

**Tools the unit lives in**, all reachable from the board: Google Drive (project
folders, drilled two levels deep), Monday.com (four workspaces and their boards),
Slack, Otter.ai, Claude, Learning Hub, Brightspace Manager, Brightspace (D2L),
D2L Academy.

**Standing documents** on the board: LACE Project Planning, Meeting Notes, Weekly
Meeting Agenda, Faculty Database, Curriculum Map.

**Projects** that organize the work, and whose color coding is consistent across
the Drive and Monday tiles: LACE, Access to Counsel, Basic Benefits Trainings,
MLRI Trainings, Training Unit Operations, Research.

**The six LACE boards** that feed the focus pages: Operations, LMS, Content
Design, Data & Evaluation, Comms & Branding, Sustainability Roadmap.

**Rituals** the surfaces are shaped around: a weekly meeting with a standing
agenda doc, nightly task refresh, and per-person daily task triage in Monday.

## Capabilities and Constraints

### Confirmed constraints on future work

- **WCAG 2.1 AA is binding.** Confirmed as a real standard, not best-effort:
  4.5:1 text contrast in both light and dark themes, full keyboard operation of
  drill-downs, filters, view toggles, and list reordering, a visible focus state
  on every control, screen-reader labels on icon-only buttons, and
  `prefers-reduced-motion` honored. The code already carries `sr-only` text,
  `aria-pressed`, `aria-label`, `:focus-visible`, and a reduced-motion rule —
  the standard now governs anything added.
- **No accounts, ever.** Nobody signs in. The unlisted URL is the access control
  and `/api/data/:slug` is deliberately open (documented as a considered call for
  a small internal tool). Design may never assume an authenticated identity, and
  nothing genuinely sensitive belongs on this site.
- **No build step.** Plain HTML/CSS/JS, one self-contained file per page with
  inline `<style>` and `<script>`. No bundler, no framework, no `npm install`;
  Cloudflare Pages serves the files as they are. Any addition has to be a plain
  script or a vendored file. (From the README, not re-asked.)

### Shipped facts, load-bearing but not confirmed as constraints

Recorded so future work knows they exist and doesn't break them casually. Neither
was confirmed as inviolable when asked, so neither outranks a good reason:

- **Offline support.** `sw.js` caches the shell (`tu-shell-vN`, bumped by hand on
  each change); the page itself is fetched network-first. Focus pages fall back
  to `localStorage` when Cloudflare KV is unreachable or unbound.
- **Hand-editability.** The `EDIT HERE` block near the bottom of `index.html`
  holds `ANNOUNCEMENT` and the `LINKS` array as a flat, commented, copy-a-line
  list, plus `SECTION_ORDER`, `LEFT_SECTIONS`, `SECTION_META`, and `FOCUS_PAGES`.

### How the data actually arrives

- **Monday tasks are static snapshots, not live fetches.**
  `.github/workflows/refresh-tasks.yml` runs at 07:17 UTC nightly, calls
  `scripts/refresh-tasks.mjs` against the Monday API (pinned version `2026-07`),
  and commits regenerated `TASKS` blocks into all four focus pages. Each page
  carries a `SNAPSHOT_DATE` and shows its own staleness. The script fails loudly
  if a Monday column id moves.
- **Pins and lists** persist through `GET|PUT /api/data/:slug` (Cloudflare Pages
  Function, KV namespace `command_center`, key `focus:<slug>`). Returns 503 when
  the KV binding is missing, and the page keeps working on `localStorage` alone.
  Server-side caps and sanitization live in the function — pins are limited to 40,
  todos to 300, and only `http(s)` URLs survive.
- **Focus pages are generated.** `marlie/index.html` is the source of truth;
  `scripts/generate-focus-pages.mjs` copies it into the other three with regex
  substitutions. **A design change to a focus page must be made in Marlie's page
  and regenerated**, or it will be overwritten. The generator's strip rules are
  whitespace- and CRLF-sensitive.
- **Hosting:** Cloudflare Pages, deployed on push to `main`, no build command.
  Live at `https://trainingunit.pages.dev`. The nightly bot commit deploys too.

### Confirmed product rules

- **No dead links.** A tool that isn't live yet is marked `soon: true` and renders
  dimmed, tagged, and unclickable rather than linking nowhere.
- **Theme is a user choice with a system default.** OS preference wins until
  someone picks explicitly; the override persists in `localStorage` as `tu-theme`
  and is applied before first paint to avoid a flash.
- **Focus pages are doors, not a directory.** They sit behind a collapsed menu on
  the board on purpose — the point is quick access to your own page, not a roster
  of everyone else's.

### Undecided / not established

- No success metric or usage measurement exists, and none was requested.
- Nothing is recorded about how the four sections should grow if the tool count
  doubles.

## Brand Commitments

- **Name:** "Training Unit — Command Center" (`Training Unit` as the short/PWA
  name). Owned by the MLRI Training Unit.
- **Voice, as written in the shipped copy and the README:** plain, warm, direct,
  second-person, no product-marketing register. "One place for every tool the
  MLRI Training Unit uses." "Go back to team page." "Add something…" "Personal
  focus page." Instructions are written for a colleague, not a developer. Match
  this; do not raise the register.
- **Assets on hand:** `icons/` holds real vendor marks (Google Drive, Monday,
  Slack, Otter, Claude, Brightspace, D2L, Learning Hub) and a full app icon set
  in `icons/app/` including a maskable 512. Inline Lucide (MIT) paths cover UI
  icons.
- **Terminology, used as-is internally:** MLRI, Training Unit, LACE, Brightspace
  / D2L, Monday, Otter, Learning Hub. No expansion needed for this audience.

Not established and not to be invented: no logo lockup, wordmark, brand
guidelines, or type licence was named.

## Evidence on Hand

- Real content throughout: every URL on the board is a live Drive folder, Monday
  board, or document. No placeholder or lorem content.
- Real task data, per person, refreshed nightly from Monday.
- `README.md` is a maintained, accurate operator's guide.

Absences that future work must not fabricate: **no testimonials, usage numbers,
adoption stats, case studies, press, pricing, or third-party endorsements exist
or apply.** This is an internal tool for four people; there is nothing to prove
and no one to persuade.

## Product Principles

1. **The resting state is the product.** It lives in a pinned window seen dozens
   of times a day. Optimize for the hundredth look, not the first — nothing that
   demands attention twice.
2. **Real structure over generic shell.** The value is that the board mirrors the
   unit's actual projects, folders, boards, and assignments. Preserve that
   fidelity; never flatten real structure to make a layout tidier.
3. **Nothing dead, nothing stale.** No dead links, no silent staleness. If data
   has an age, the surface says so; if a tool isn't ready, it says that too.
4. **Editable by the person who maintains it.** One maintainer, no build step.
   Features that can only be changed by editing render logic cost more than they
   look like they do.
5. **Accessible because of who this serves.** WCAG 2.1 AA is a floor for a legal
   services organization, applied to new work without being asked.

## Accessibility & Inclusion

WCAG 2.1 AA, confirmed as binding. See Capabilities and Constraints for the
specific obligations it places on contrast, keyboard operation, focus states,
screen-reader labeling, and motion.
