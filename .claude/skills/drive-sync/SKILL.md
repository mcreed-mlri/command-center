---
name: drive-sync
description: Sync the Command Center board's hardcoded Google Drive tree in index.html against the live Training Unit and External Collaboration shared drives, then ship it and verify it deployed. Use this whenever the user asks to check, sync, refresh or update the Drive folders, asks whether the board is up to date, mentions new or renamed Google folders, or asks for the weekly Drive sweep — even if they never say "index.html" or "the board". Also use it when someone has reorganised folders in Drive and the board needs to follow.
---

# Drive folder sync

The board at `index.html` hardcodes its Google Drive tree inside the `LINKS`
array. Nothing regenerates it, so it drifts the moment anyone adds, renames or
moves a folder in Drive. This skill closes that gap: read the board, read live
Drive, diff them, ship what's routine, and ask about what isn't.

Two shared drives feed the Drive tile:

| Drive | Root folder id |
|---|---|
| Training Unit | `0AN0wtOcYONTeUk9PVA` |
| External Collaboration | `0AKgEti2nIL4SUk9PVA` |

Everything else is derived from the board, so the skill keeps working as
folders come and go.

## Before you start

Run from the repo root, with node on PATH:

```bash
export PATH="$HOME/tools/nodejs:$PATH"
```

The snapshot bot pushes to `main` several times a day, so the local checkout is
usually behind. Get level first, or the push at the end fails:

```bash
git fetch origin -q
git status --short          # must be clean before editing
git pull --ff-only origin main
```

If the tree is dirty, stop and tell the user what's uncommitted rather than
editing around it.

## Step 1 — read the board

```bash
node .claude/skills/drive-sync/scripts/board-tree.mjs index.html > board.json
```

This prints every folder row with its id, name, board parent, dot colour and
line number. Put scratch files in the session scratchpad, not the repo.

## Step 2 — read live Drive

Query the Google Drive connector with `search_files`. One query per batch of
parents; several parents can be OR'd together, which keeps the round trips
down:

```
(parentId = '<id>' or parentId = '<id>' or ...) and mimeType = 'application/vnd.google-apps.folder'
```

Query **every** id in `board.json` plus both drive roots. Include folders that
currently have no children on the board — a flat folder that has since gained
subfolders is exactly the kind of change worth catching, and an empty `{}`
response is how the connector says "no subfolders".

Concatenate every `files` array the connector returned into one flat JSON array
and save it as `live.json`. The diff script accepts the raw shapes, so you can
paste the arrays together without reformatting each record.

## Step 3 — diff

```bash
node .claude/skills/drive-sync/scripts/diff-drive.mjs board.json live.json
```

It exits 0 when the board matches Drive and 1 when there is drift, and sorts
what it finds into five buckets. The split matters because it decides what you
may do on your own:

**Routine — make the change, ship it, report afterwards:**

- `NEW … (routine, a row fits)` — a folder whose parent is a drive root or a
  top-level row, so an ordinary row shows it.
- `RENAMED` — same folder id, new name in Drive. Follow Drive's spelling.

**Structural — stop and ask before reshaping anything:**

- `MOVED` — the folder still exists but now lives under a different parent.
  A reorganisation, and how the board should follow is the user's call.
- `NEW BUT TOO DEEP` — the parent is already a subfolder, so showing this
  would need a third drill-down level the renderer does not have.
- `DEAD` — on the board, not found live. Could be a deletion, a permissions
  change, or a failed query. Confirm which before removing a row.

The reason for the split: adding a row is reversible and obvious, while
reshaping the tree changes how people navigate and has more than one defensible
answer. When you do ask, lay out the options concretely — what each one costs
the user in clicks, and whether it needs a code change.

## Step 4 — edit index.html

Match the surrounding rows exactly; the array is hand-maintained and reads like
prose.

- **Order** is plain alphabetical within each `children` array, the same order
  Drive shows. `Legal Simulators and Tech` sorts before `Legal Skills` because
  `i` precedes `k`.
- **Project folders** carry `cat: "…"`, which pulls the dot colour from
  `CATEGORY_COLORS` so the folder and its Monday workspace share a colour.
- **Non-project folders** carry an inline `color:` instead, chosen from a gap
  in that map so it doesn't read as a project. Precedents: the External
  Collaboration trio (`#16a6a6`, `#6a76d9`, `#8cb63f`) and the idle slate
  `#8b909d` for staging areas.
- **The `count:` label** on the tile counts top-level folders across both
  drives. Update it whenever that number changes — the diff prints the current
  label so you can check.
- A folder with no subfolders gets no `children` array; it just opens in Drive.

## Step 5 — gate, ship, verify

Run the syntax gate. `index.html` carries the whole app in two inline
`<script>` blocks and Cloudflare has no build step, so a stray comma ships a
blank page:

```bash
node .claude/skills/drive-sync/scripts/check-syntax.mjs index.html sw.js
```

Bump the service worker cache in `sw.js`. Installed PWAs reload on a new worker
taking over, so without the bump the change reaches browsers but not
home-screen apps:

```bash
CUR=$(grep -o 'tu-shell-v[0-9]*' sw.js)
sed -i "s/$CUR/tu-shell-v$(( $(echo $CUR | tr -dc 0-9) + 1 ))/" sw.js
```

Commit in the repo's style: a plain-language subject, then a body that names
each folder that changed, states what stayed the same, confirms the remaining
ids still resolve, and notes the cache bump. Write the message to a file and
use `git commit -F` — heredoc quoting has mangled these messages before. End
with the `Co-Authored-By:` line the session specifies.

Push, rebasing if the bot landed something meanwhile:

```bash
git fetch origin -q
[ "$(git rev-list --count HEAD..origin/main)" -gt 0 ] && git rebase origin/main
git push origin main
```

Then confirm it actually deployed, rather than assuming. Cloudflare Pages
builds off `main` and usually lands in 30–60s:

```bash
for i in $(seq 1 10); do
  curl -sL "https://trainingunit.pages.dev/?cb=$(date +%s%N)" | grep -q '<NEW FOLDER ID>' \
    && { echo "live after ~$((i*15))s"; break; }
  echo "attempt $i: not yet"; command sleep 15
done
```

## Reporting back

Lead with what changed in Drive, not with what you edited — that's the part the
user can't see for themselves. Name each folder, say what stayed the same so
"no news" is explicit rather than assumed, and confirm no ids went dead. Close
with the commit, the cache version, and that you saw it live.

## Known quirks — don't re-litigate these

- **`Appeals — Dick Bauer Materials`** uses an em dash on the board where Drive
  has a hyphen. A deliberate typographic choice, not drift. The diff will report
  it as `RENAMED` every run; leave it unless the user asks.
- **The design hook** flags pre-existing findings in `index.html` (an overused
  font, clipped overflow containers). They predate any sync and are unrelated
  to a data edit — mention them if asked, don't fold a CSS fix into a folder
  commit.
- **Two folders named `Evaluation`** exist, one under LACE and one under
  Research's Legal Skills. Different ids, both correct.
- **Drive search only returns folders the account can see.** A count that drops
  unexpectedly is more likely a permissions change than a deletion — check
  before removing rows.
