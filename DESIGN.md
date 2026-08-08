---
name: Training Unit Command Center
description: A warm paper wall of tool tiles and personal focus pages, sharing the LACE studio brand.
colors:
  brand: "#1a5aa0"
  brand-deep: "#12447c"
  paper: "#f5f5f1"
  paper-2: "#ebece7"
  card: "#ffffff"
  line: "#d9dbd4"
  ink: "#151719"
  muted: "#4f575c"
  faint: "#6b747a"
  on-accent: "#ffffff"
  ok: "#179a72"
  wait: "#1c63b0"
  idle: "#8b909d"
  overdue: "#c8493b"
  working: "#c8791b"
  danger: "#c8493b"
typography:
  display:
    fontFamily: "Geist, Segoe UI Variable, Segoe UI, Inter, system-ui, sans-serif"
    fontSize: "clamp(28px, 5vw, 40px)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Geist, Segoe UI Variable, Segoe UI, Inter, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Geist, Segoe UI Variable, Segoe UI, Inter, system-ui, sans-serif"
    fontSize: "16.5px"
    fontWeight: 650
    lineHeight: 1.35
    letterSpacing: "0"
  body:
    fontFamily: "Geist, Segoe UI Variable, Segoe UI, Inter, system-ui, sans-serif"
    fontSize: "14.5px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Geist, Segoe UI Variable, Segoe UI, Inter, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "0.04em"
  eyebrow:
    fontFamily: "Geist, Segoe UI Variable, Segoe UI, Inter, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "0.14em"
  meta:
    fontFamily: "Geist, Segoe UI Variable, Segoe UI, Inter, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 400
    lineHeight: 1.3
    fontFeature: "tabular-nums"
rounded:
  xs: "4px"
  sm: "8px"
  md: "10px"
  lg: "12px"
  xl: "16px"
  pill: "999px"
  circle: "50%"
spacing:
  hair: "2px"
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  "2xl": "24px"
  "3xl": "32px"
components:
  panel:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.xl}"
    padding: "18px"
  tile:
    backgroundColor: "{colors.paper-2}"
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    rounded: "{rounded.lg}"
    padding: "14px 16px"
  tile-hover:
    backgroundColor: "{colors.card}"
  app-tile:
    backgroundColor: "{colors.paper-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "16px 10px"
  app-tile-hover:
    backgroundColor: "{colors.card}"
  doc-row:
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "11px 12px"
  doc-row-hover:
    backgroundColor: "{colors.paper-2}"
  task-row:
    backgroundColor: "{colors.paper-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px 13px"
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.card}"
    rounded: "{rounded.sm}"
    padding: "7px 13px"
  button-ghost:
    textColor: "{colors.muted}"
    rounded: "{rounded.sm}"
    padding: "7px 13px"
  button-mini:
    backgroundColor: "{colors.paper-2}"
    textColor: "{colors.muted}"
    rounded: "{rounded.sm}"
    padding: "5px 9px"
  icon-button:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: "44px"
    width: "44px"
  input-text:
    backgroundColor: "{colors.paper-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "10px 12px"
  select-filter:
    backgroundColor: "{colors.paper-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "8px 34px 8px 12px"
  pill-nav:
    backgroundColor: "{colors.paper-2}"
    textColor: "{colors.muted}"
    rounded: "{rounded.pill}"
    padding: "6px 13px"
  pill-count:
    backgroundColor: "{colors.paper-2}"
    textColor: "{colors.muted}"
    rounded: "{rounded.pill}"
    padding: "3px 10px"
  view-toggle-button:
    textColor: "{colors.muted}"
    rounded: "{rounded.pill}"
    padding: "5px 12px"
  view-toggle-button-active:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.card}"
  monogram:
    rounded: "{rounded.md}"
    height: "40px"
    width: "40px"
  soon-tag:
    backgroundColor: "{colors.card}"
    textColor: "{colors.faint}"
    rounded: "{rounded.pill}"
    padding: "2px 7px"
---

# Design System: Training Unit Command Center

## Overview

**Creative North Star: "The Studio"**

Warm, precise, unhurried — the same studio as the LACE Learning Hub. The page is a
warm paper field, lit by a soft steel-blue wash at the top edge, and everything on
it is an object pinned to that field rather than a region carved out of a screen.
Tiles, task rows, and pin links all rest one tonal step below their container, lift
or slide toward you when touched, and carry their own pigment. Nothing shouts,
because in a well-kept studio nothing has to: the things you need are already
where you left them, labelled in your own hand.

The defining mechanism is **per-item accent inheritance**. Every tool, folder,
project, person, and pin owns a colour, declared once as `--accent` on the element,
and that colour propagates into exactly four places — the monogram chip's tint, the
hover border, the arrow or chevron, and the focus ring. Steel blue (`--brand`) is
only the fallback for items that haven't claimed a pigment of their own. This is what
makes the board read as a wall of distinct, colour-tagged objects while the surface
underneath stays quiet and uniform. Get this wrong — accent used as decoration, or
one accent applied globally — and the whole metaphor collapses into a generic panel
layout.

Structure is carried by hairline rules and a three-step tonal ladder working
together, never by heavy containers. Type is Geist sans throughout — the same
typeface as the Learning Hub — with tight tracking on display sizes. Small labels
are uppercase and tracked out. Every number is tabular. Depth is real but almost
inaudible — the shadow token is a 4%-alpha whisper, and the only genuinely floating
element in the entire product is one dropdown menu.

Shared tokens live in [`tokens.css`](tokens.css). The brand, status, and dark-mode
palette stay synced with LACE [`app/globals.css`](../../LACE/learning-hub/app/globals.css);
the light neutral ladder deliberately diverged from LACE's warm cream into a cooler,
salt-washed paper — re-syncing it wholesale would put the mud back.

**Key Characteristics:**

- Salt-washed neutral paper under a Cape Cod sunrise — the warmth is held entirely in the sky (apricot core off the top-right, peach across the top, a cool layer aloft on the far side), with sea glass rising from the bottom-left. Viewport-anchored, so the light stays put as the page scrolls
- Warm sky over cool ground, never warm over warm: the neutral ladder stays off-yellow on purpose, because saturated peach over cream paper is what turns resting surfaces khaki
- Per-item `--accent` inheritance into four fixed slots: monogram tint, hover border, arrow, focus ring
- A three-surface tonal ladder — page → resting object → raised object — that inverts on hover
- Hairline `1px` borders as the primary structural device; shadow is atmosphere, not hierarchy
- Geist sans for all text, including page titles and monogram letters
- Uppercase, tracked, 650-weight micro-labels; tabular figures on every count and date
- Motion is small and directional: 1–3px lifts and slides over 130–170ms
- Full dark counterpart for every token, aligned with LACE's near-black studio palette

## Colors

A warm paper-and-ink palette shared with the LACE Learning Hub: three near-neutral
cream surfaces, a warm graphite ink family, steel blue as the interactive brand
signal, and status pigments aligned with LACE lifecycle colours.

### Primary

- **Studio Blue** (`#1a5aa0`): The interactive signal — focus rings, link hovers,
  active toggles, primary buttons, progress, and anything that means *click here*.
- **Deep Blue** (`#12447c`): Darkened brand for interactive text on light surfaces.
- **Rust** (`#bb573b`): Structural warmth — panel ticks, eyebrows, hero wash, notices.
  Mirrors LACE `--hue-8`. Blue marks action; earth marks place.
- **Amber** (`#c8791b`): Due-soon and warn-state accents. Mirrors LACE `--hue-4`.

### Secondary

The per-item accents are the secondary layer, and they are *data*, not palette. Each
tool, Drive folder, Monday workspace, team member, and pin declares its own colour
inline — Drive's greens and yellows, Monday's `#ff3d57`, the four person accents
(`#7d4f9e`, `#4f8a5c`, `#a8553d`, `#3d6ea8`), and the eight LACE skill-hue pin
swatches. They are not tokens and must not be collapsed into one; the wall's
legibility depends on items being individually recognisable by colour.

### Neutral

- **Paper** (`#f5f5f1`): The page itself, flat and salt-washed. Never used for an
  object, only the field.
- **Surface Sunken** (`#ebece7`): The resting surface of every interactive object —
  tiles, rows, task cards, inputs, pills, buckets. If something can be clicked, it
  starts here.
- **Surface** (`#ffffff`): The raised surface. Panels sit on it permanently;
  tiles and rows arrive at it on hover. It is the top of the ladder, not a default.
- **Line** (`#d9dbd4`): Every border, divider, and rule in the product. Load-bearing.
- **Ink** (`#151719`): Body and heading text. A cooled near-black, never pure black —
  the neutral ladder was pulled off the old warm cream on purpose, and the ink
  follows it.
- **Ink Muted** (`#4f575c`): Secondary content — descriptions, counts, table
  meta, panel titles.
- **Ink Soft** (`#6b747a`): Tertiary text — timestamps, empty-state prose, hints,
  the quietest labels.
- **On Accent** (`#ffffff` light / `#0e0f14` dark): The foreground for anything
  sitting *on* an accent fill.

### Tertiary

Status pigments, each bound to a specific Monday state and aligned with LACE status
tokens:

- **Green** (`#179a72`, dark `#5fc9a8`): Done. Also the sync-saved indicator.
- **Blue** (`#1c63b0`, dark `#3b8ede`): Waiting or paused, "needs review".
- **Graphite** (`#8b909d`, dark `#a9b2c0`): Not started, and the neutral resting sync dot.
- **Changed Red** (`#c8493b`, dark `#e8957a`): Overdue only.
- **Amber** (`#c8791b`, dark `#e0a552`): Actively working on it.
- **Danger** (`#c8493b`, dark `#e8957a`): Destructive actions and sync errors.

### Named Rules

**The Four Slots Rule.** An item's `--accent` may appear in exactly four places: the
monogram chip's tint (12–16% mixed into the card colour), the hover and focus
border (30–55% mixed into `--line`), the arrow or chevron on hover, and the focus
ring (35% at 3px). Anywhere else — filled backgrounds, body text, icon strokes at
rest, decorative bars — is off the wall.

**The Status-Isn't-Brand Rule.** Pine, Ink Blue, Dry Clay, Red Ochre, and Raw Amber
encode Monday task state. They never appear as decoration, never as a category
colour, and never on the launcher board, which has no task state to express.

**The Warm-Sky, Cool-Ground Rule.** Light surfaces are a salt-washed cool neutral,
not warm cream — the only warmth on the page lives in the hero band and in accents.
Dark surfaces use a near-black studio palette (`#13151b` → `#212530` → `#191c24`).
Never port a light-mode neutral into the dark palette by darkening it; the two
ladders are separately authored.

**The On-Accent Rule.** Never hard-code white on an accent fill. Because the accent
*lightens* in dark mode, white-on-accent inverts from 5.0:1 to 2.7:1 — the label
disappears exactly where it used to be strongest. Use `--on-accent`, which flips to
dark ink with the theme.

**The Every-Colour-Is-A-Token Rule.** A colour that lives as a hex literal in a rule
will never get a dark-mode counterpart, because the dark blocks only redefine tokens.
Every one of this system's AA failures came from a literal. If a value is worth
writing twice, it is a token.

## Typography

**Display Font:** Geist (with Segoe UI Variable, Segoe UI, Inter, system-ui fallbacks)
**Body Font:** Geist (same stack)
**Label/Mono Font:** none — numeric alignment is handled by `font-variant-numeric: tabular-nums` on the sans, not by a mono family.

**Character:** The same Geist sans as the LACE Learning Hub — clean, institutional,
and readable over long sessions. Display sizes use tight negative tracking. Because
Geist loads from Google Fonts with system fallbacks, text stays crisp before the
font arrives.

### Hierarchy

- **Display** (sans, 700, `clamp(28px, 5vw, 40px)`, 1.05, tracking -0.02em): The page name, once per page. "Command Center", "Marlie's Focus Page". On narrow screens the clamp is retuned to `clamp(30px, 12vw, 40px)` so the title still commands the viewport.
- **Headline** (sans, 700, 18px, 1.2, tracking -0.02em): The week range and the calendar month.
- **Title** (sans, 650, 16.5px, tracking 0): Tool and tile names. Steps down to 15px for document rows and 15.5px on mobile, 14.5px for task names, 14px for app-tile labels.
- **Body** (sans, 400, 14–15px, 1.5): Descriptions, table cells, todo text. Line height relaxes to 1.45 for wrapping list items.
- **Label** (sans, 650, 14px, tracking 0.04em, uppercase): Panel titles. Set in Ink Muted, always preceded by the brand tick.
- **Eyebrow** (sans, 650, 11px, tracking 0.14em, uppercase): The brand-blue line above every page title — "MLRI · Training Unit", "Personal · MLRI Training Unit". The widest tracking in the system.
- **Meta** (sans, 400–650, 12–13.5px, tabular): Counts, dates, board names, staleness notes, sync status. Field labels drop to 11px at 0.06em uppercase in Ink Soft.

### Named Rules

**The Sans-Only Rule.** Geist sans is used for all text, including page titles,
week/month frames, and monogram letters. There is no serif voice in this system.

**The Tracked-Caps Rule.** Any text at 12px or below that functions as a label is
uppercase, tracked 0.04–0.14em, and weight 650–700. Small lowercase text is content,
never a label. The inverse also holds: nothing above 14px is ever uppercase.

**The Tabular Rule.** Every count, date, due value, and item tally carries
`font-variant-numeric: tabular-nums`. Numbers in this system align in columns even
when they aren't in a table.

## Layout

**Containers.** The launcher wraps at `min(1160px, 100%)`; focus pages at 1100px.
Body padding is `24px` horizontal, dropping to `12px` below 640px, with
`env(safe-area-inset-*)` respected top and bottom — the product is installed as a
standalone PWA, so it owns the whole window including the notch and home-indicator
zones.

**The asymmetric two-column split.** Both surfaces divide into a wide working column
and a narrow companion column: `minmax(0, 63fr) / minmax(300px, 37fr)`, unified across
the launcher and focus pages, with a hard `300px` floor on the right. The wide side
holds what you scan (tool sections, tasks); the narrow side holds what you keep
(quick links, lists, pins). The split collapses to one column at 960px on both
surfaces. Searching collapses it too — results go full-width, because a filtered set
has no left/right meaning.

**Rhythm.** A 2px-based scale where the load-bearing steps are 16px between panels
and columns, 12px inside a tool grid, 8px between list rows, and 2px between
drill-down children. Intermediate values (6, 10, 14, 18, 22px) appear as
component-internal padding; panel padding is 18px, tightening to `14px 12px` on
mobile. Panel heads are separated by a 12px gap plus a 1px rule, not by whitespace alone.

**Density behaviour.** The launcher's sections choose their own internal layout by
role: large accordion tiles for tools with children, a 2×2 grid for LMS rows, a
single-column list for documents, a 3-across icon grid for quick apps (2-across
below 400px). Task views on focus pages switch between a day-grouped week list, a
grouped table, a 3-column kanban, and a 7-column month grid — all inside the same
panel, all collapsing to single-column between 520 and 720px.

### Named Rules

**The 300px Floor Rule.** The narrow column never goes below 300px. Below that the
layout goes single-column instead of squeezing — a 250px sidebar would break every
pin row and task card in it.

**The 48px Target Rule.** At 640px and below, every tile, row, accordion summary,
and sublink takes `min-height: 48px`, monograms grow to 36px, and hover transforms
are disabled outright under `@media (hover: none)`. Touch gets more room, not the
same room.

## Elevation & Depth

This system runs **two depth mechanisms as co-equals**, and confusing their jobs is
the most common way to break it.

**The tonal ladder** answers *what layer am I on*. Three surfaces, always in the same
order: `--paper` is the page and never an object; `--paper-2` is where every
interactive object rests; `--card` is the raised state — permanent for panels,
earned on hover for tiles and rows. In dark mode the ladder is `#13151b` → `#212530`
→ `#191c24`, aligned with LACE's near-black studio direction.

**Ambient shadow** answers *where does this container end*. The shadow token is
deliberately near-invisible: a 1px contact line at 4% alpha plus a wide 20px
diffusion at 10%. It gives panels and the header band a soft edge against the paper
field. It is not hierarchy, and it never distinguishes two elements from each other.

Borders do the crisp work both mechanisms leave: a `1px` `--line` edge on
essentially every object in the product. Motion supplies state — 1–2px lifts, 2–3px
slides — and disappears entirely under `prefers-reduced-motion`.

### Shadow Vocabulary

- **Ambient** (`--shadow: 0 1px 2px rgba(38,54,63,.055), 0 9px 28px -9px rgba(38,54,63,.14)`): Panels, the header band, the head-meta chip, the results bar, the announcement banner. Present at rest, unnoticed. The tint is cool slate, not brown — a warm shadow over the sunrise reads as grime, a cool one as shade.
- **Ambient, dark** (`box-shadow: 0 2px 6px rgba(0,0,0,.38), 0 8px 28px -6px rgba(0,0,0,.52)`): The same role, much stronger alphas, because a dark ground swallows a 4% shadow.
- **Overlay** (`box-shadow: var(--shadow-lg)` — `0 3px 10px rgba(38,54,63,.08), 0 22px 46px -13px rgba(38,54,63,.20)`): Defined once and used once — the focus-page dropdown on the launcher. It is the only element in the product that genuinely floats.
- **Accent bloom** (`box-shadow: 0 4px 14px -6px color-mix(in srgb, var(--link-accent) 35%, transparent)`): Pin and quick-link rows on hover only. A tinted glow in the item's own pigment, not a neutral shadow.

### Named Rules

**The Line-Not-Shadow Rule.** Structure is drawn with a 1px `--line` border. If two
elements need visual separation, they get a rule or a tonal step — never a heavier
shadow.

**The Invert-On-Hover Rule.** An interactive object rests on `--paper-2` and becomes
`--card` on hover and focus, while its border mixes toward its own accent. The
surface brightening *is* the affordance; a colour-only hover reads as broken here.

**The One Overlay Rule.** `--shadow-lg` belongs to the single dropdown menu. A new
floating panel needs a real justification, not a shadow token.

## Shapes

Corners are generous but never soft-focus, and the radius encodes what a thing *is*.
`16px` (`--radius-lg`) is reserved for the outermost containers — panels, the header
band, the results bar, the empty state. `12px` (`--radius`) is the workhorse for
objects on the field: tiles, accordions, inputs, buckets, task tables, week-nav
buttons. `10px` marks the smaller inner objects — task rows, kanban cards, monogram
chips, sublinks. `8px` covers controls and menu items; `4px` the tiniest calendar
chips. Mobile pulls containers down a step, from 16px to 12px, so panels don't look
inflated at 375px.

Two shapes carry meaning on their own. **Pills** (`999px`) mean *quantity or mode*:
every count badge, the view toggle and its segments, the nav pills, the soon tag, the
"clear search" button, the round 44px icon buttons. **Circles** (`50%`) mean *state*:
status dots, bucket dots, sync dots, pin swatches, the sublink tick, the small
monogram in the dropdown.

Borders are uniformly `1px` and `--line`-coloured, with three deliberate exceptions:
the 3px left rule that carries an item's accent on task rows, kanban cards, and the
announcement banner; the 2px left rule on nested drill-down lists; and the 1.5px
`--idle` ring on an unchecked todo box. Empty states use a **dashed** `--line` border
— the only dashed stroke in the system, and it means *nothing here yet* rather than
*something failed*.

### Named Rules

**The Tick Rule.** Every panel title is preceded by a 4×12px brand-blue bar with a
2px radius, and every page eyebrow by the same mark. It is the product's signature —
a pin pushed into the wall. A panel title without it is not a panel title.

**The Radius-Is-Rank Rule.** 16px containers hold 12px objects hold 10px rows hold
8px controls. A radius larger than its parent's is always wrong.

## Components

### Buttons

- **Shape:** Rounded rectangles at `8px` for form actions, full pills for mode and count controls, `12px` for the square week/month nav steppers.
- **Primary:** Brand blue fill, on-accent text, 1px brand border, `7px 13px`, 650 weight at 13px.
- **Ghost / Mini:** Transparent or sunken background, `--muted` text, `--line` border. On hover the text goes to Ink and the border mixes 40% toward brand. `aria-pressed="true"` turns text and border brand rather than filling.
- **Danger:** Transparent with Iron Oxide text, pushed to the right of the action row by `margin-left: auto`. Destructive actions are never filled.
- **Hover / Focus:** `translateY(-1px)` and a border shift toward the accent, over 140–170ms. Focus-visible replaces the outline with a 3px accent ring at 35% opacity, always paired with the hover treatment so keyboard and pointer see the same thing.

### Chips

- **Count pills:** Kraft or Fresh Sheet fill, `--muted` text at 12–13px, `999px`, `3px 10px`, tabular figures, pushed right with `margin-left: auto`. They report; they never act. Hidden entirely below 400px, where the label matters more than the number.
- **Soon tag:** 10.5px, 700, tracked 0.08em, uppercase, Dry Pencil on Fresh Sheet with a `--line` pill border. Always paired with 55–62% opacity on its parent and the removal of the link — a soon item cannot be clicked.
- **Shared tag:** The same pill treatment at 10.5px on task names, marking an item assigned to more than one person.
- **Status pill:** No fill at all — an 8px status dot plus 12.5px 600-weight text. Done pills tint the text Pine; every other state keeps Graphite and lets the dot carry the colour.

### Cards / Containers

- **Panel:** Fresh Sheet, `16px` radius, 1px `--line`, ambient shadow, 18px padding. Its head is a 12px-padded row closed by a 1px rule, holding the ticked title, optional right-aligned tools, and a Dry Pencil note pushed to the far right.
- **Tile:** Kraft resting, `12px`, 1px `--line`, `14px 16px`, a 40px monogram at `10px` radius, a 16.5px name, a 14px `--muted` description that truncates to one line (two on mobile), and an arrow pushed right. Hover lifts 2px, inverts to Fresh Sheet, mixes the border 55% toward the item's accent, and slides the arrow 3px.
- **Accordion tile:** The same body as a tile but wrapped in `<details>` with `overflow: hidden`, a right-aligned count pill, and a chevron that rotates 90° when open. Children live in a `6px`-padded list under a 1px top rule, indented 12px, with a 2px `--line` left rule on the third level.
- **Kanban / task card:** Fresh Sheet or Kraft at `10px` with a 3px accent left rule, `10px 12px`, a 13.5–14.5px 600 name, and a tabular due value pushed right that turns Red Ochre when overdue.

### Inputs / Fields

- **Style:** Kraft fill, 1px `--line`, `12px` radius, `10px 12px`, inheriting the body font at 14px. The filter select drops `appearance` and paints its own inline-SVG chevron 11px from the right edge, with 34px of right padding reserved for it.
- **Focus:** The outline is removed and replaced by a solid brand border plus a lift of the background from sunken to surface. Text inputs are the one control where focus is a colour-and-surface change rather than a ring.
- **Checkbox:** An 18px box at `5px` radius with a 1.5px Dry Clay ring and a hidden white check. Checking fills it Pine and reveals the check; the row drops to 55% opacity and strikes its text through.
- **Search:** A panel that fades and lifts 6px into place from the icon button, 320px wide on desktop and pinned to both screen edges below 640px. Its clear button only appears once there is text.

### Navigation

- **Nav pill:** Sunken surface, `999px`, `6px 13px`, 12.5px 600 in `--muted`, with a 14px icon. Hover and open state go to surface with the border mixed 40% toward brand and the text to Ink. Stretches to full width and centres below 640px.
- **Dropdown:** Surface, `12px`, 6px padding, the overlay shadow, `min-width: 186px`, right-aligned under its trigger, holding 13.5px 600 rows at `8px` radius that highlight to sunken. Each row leads with a 24px circular sans monogram tinted 14% in that person's accent. Closed by default, and its chevron rotates 180°.
- **View toggle:** A sunken pill track with 3px of padding holding pill segments; the pressed segment fills brand with on-accent text. State lives in `aria-pressed`, not a class.
- **Skip link:** Fresh Sheet, `12px`, 650 weight, parked off-screen and fixed 16px from the top-left on focus.

### Signature Component: The Monogram Chip

The one element that appears on every surface and defines the wall. A 40px square at
`10px` radius (36px at `9px` on mobile, 24px circular in the dropdown, 17px at `5px`
in legacy quick links), filled with the item's own accent at 12–16% over the card
colour, holding either a sans capital at 700 or a 24px vendor logo. Logos are
individually size-corrected against their own padding — Learning Hub trims to 22px,
Brightspace's PNG grows to 28px, the D2L circle to 32px — so that every mark reads at
the same optical weight regardless of how its source file was cut. That correction,
per asset, is the level of care this system expects.

## Do's and Don'ts

### Do:

- **Do** declare an `--accent` on any new item that represents a distinct tool, project, folder, person, or pin, and let it flow to the four permitted slots only.
- **Do** build hover borders with `color-mix(in srgb, var(--accent, var(--brand)) N%, var(--line))` — 30% for document rows, 45% for accordions and app tiles, 55% for primary tiles.
- **Do** pair every `:hover` with a matching `:focus-visible` that adds `box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent, var(--brand)) 35%, transparent)` and removes the default outline. Keyboard users see the pointer treatment plus a ring, never less.
- **Do** rest interactive objects on `--paper-2` and raise them to `--card`, so the tonal ladder stays intact.
- **Do** put `font-variant-numeric: tabular-nums` on every count, date, and tally.
- **Do** precede every panel title with the 4×12px brand tick.
- **Do** author both dark-mode selectors together — `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }` and `:root[data-theme="dark"]` — because the toggle must beat the OS in both directions.
- **Do** give rows `min-height: 48px` below 640px and neutralise hover transforms under `@media (hover: none)`.
- **Do** mark a not-yet-live destination with the soon pattern: 55–62% opacity, a soon tag, and no href at all.
- **Do** reach for a semantic token — `--overdue`, `--danger`, `--working`, `--ok`, `--wait`, `--on-accent`, `--brand-deep` — instead of a hex literal, and give it a value in all three token blocks (light, `prefers-color-scheme: dark`, and `[data-theme="dark"]`).
- **Do** give hover-revealed controls a `@media (hover: none)` fallback that keeps them visible. An `opacity: 0` control still occupies its box and still takes taps.
- **Do** keep a small control's drawn size and grow only its hit area, using a `::after` pseudo-element at `inset: -3px`, so a 18px checkbox is still a 24px target.
- **Do** re-measure both themes when a colour changes. Every AA failure this system has had was dark-mode-only and invisible from a light-mode screenshot.

### Don't:

- **Don't** use a status pigment (Pine, Ink Blue, Dry Clay, Red Ochre, Raw Amber) for anything but Monday task state.
- **Don't** create resting hierarchy with shadow. Two elements at the same tonal step are at the same level, whatever their shadows say.
- **Don't** fill an area with brand blue beyond the primary button and the active toggle segment. It marks; it does not cover.
- **Don't** set a label lowercase below 12px, and don't set anything uppercase above 14px.
- **Don't** give a child a larger radius than its parent.
- **Don't** treat `--faint` as a lighter `--muted`. In light mode they are visually identical (`#6f675c` vs `#6b6459`) and in dark mode they separate; the choice is a role decision — `--muted` for content a person reads, `--faint` for metadata they only glance at.
- **Don't** put a bare `outline: none` on a `:focus` rule without a replacement indicator. If the element already carries a coloured border at rest, a border-colour change is not a focus state.
- **Don't** attach a click handler to a `<span>` or `<div>`. It is invisible to the keyboard; use a real control, or add `tabIndex`, a role, and Enter/Space handling together.
- **Don't** let motion be the only carrier of a state change. `prefers-reduced-motion` strips every transition in the product with a blanket `* { transition: none !important; }`, so anything communicated purely by movement disappears for those users.
- **Don't** add a second dashed border. The dashed `--line` box means "nothing here yet" and nothing else.
- **Don't** introduce a second accent colour system. Shared tokens live in `tokens.css` and stay synced with LACE `globals.css`.
