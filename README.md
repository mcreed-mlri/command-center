# Training Unit — Command Center

One place for every tool the MLRI Training Unit uses. A single-page launcher
(tiles + chips) that opens each real tool in a new tab. It's a Progressive Web
App, so you can install it to your home screen / taskbar and it works offline
after the first visit.

**Live site:** https://trainingunit.pages.dev

Built for Ashley, Carolina, Olivia & Marlie. Maintained by Marlie.

---

## How it's built

Plain HTML/CSS/JS — **no build step, no dependencies**. Three files matter:

| File | What it is |
|------|------------|
| `index.html` | The whole app: styles, the link list, and the render logic. **This is the only file you normally edit.** |
| `sw.js` | Service worker — caches the app so it loads instantly and works offline. |
| `manifest.webmanifest` | PWA settings (name, icons, colors). Rarely touched. |

Everything you edit day-to-day lives in the **`EDIT HERE`** block near the
bottom of `index.html` (search the file for `EDIT HERE`).

---

## Add / edit / remove a tile

In `index.html`, find the `LINKS = [ ... ]` list inside the `EDIT HERE` block.
Each entry is one tile or chip. To add one, copy an existing line and change it:

```js
{ section: "Quick Links", name: "Tool name", desc: "Short description",
  quick: true, url: "https://the-real-url.com",
  mono: "T", accent: "#b4531f", keywords: "words that help search find it" },
```

- **`section`** — which heading it appears under (`"Work"`, `"Schedule a meeting"`, `"Quick Links"`).
- **`url`** — the real link. Opens in a new tab.
- **`accent`** — any CSS color; sets the little monogram + hover color.
- **`mono`** — a letter for the monogram (or use `icon: "icons/thing.svg"` for a logo).
- **`keywords`** — extra words so the search box (`/`) can find it.
- **`soon: true`** — mark a tool that isn't live yet. It shows dimmed with a
  "soon" tag and isn't clickable, so there are **no dead links** on the board.

To remove a tile, delete its entry. That's it.

After editing, **bump the cache** (see below) so everyone gets the change.

---

## Post a team announcement

A dismissible notice banner appears at the top of the page. To use it, edit the
`ANNOUNCEMENT` object in the `EDIT HERE` block:

```js
const ANNOUNCEMENT = {
  id:   "2026-07-21",                 // change this every time you change the text
  text: "Team meeting moved to Fri 2pm.",  // leave "" to hide the banner
  url:  "",                           // optional link the banner opens
};
```

- Set `text` to your message. Leave it `""` to hide the banner entirely.
- **Always change `id`** when you change the message (today's date works well).
  Bumping the `id` re-shows the banner to everyone who dismissed the last one.
- `url` is optional — if set, the whole banner becomes a link.

---

## How it deploys

Hosted on **Cloudflare Pages**, connected to this GitHub repo. To publish a
change: commit and push to `main`. Cloudflare rebuilds automatically (no build
command — it just serves the files) and the live URL updates in ~1 minute.

```
git add -A
git commit -m "Update links"
git push
```

---

## Bump the cache (do this after any edit)

Because the app is cached for offline use, bump the version in `sw.js` so
everyone picks up your change on their next visit:

```js
const CACHE = "tu-shell-v9";   // change v9 → v10, etc.
```

The page itself is fetched network-first, so text edits usually show up right
away — but bumping the cache guarantees a clean update for the whole team.

---

## Run it locally (optional)

From this folder:

```
python -m http.server 8000
```

Then open <http://localhost:8000>. (Opening `index.html` directly with
`file://` also works, but a local server matches how it behaves when deployed.)
