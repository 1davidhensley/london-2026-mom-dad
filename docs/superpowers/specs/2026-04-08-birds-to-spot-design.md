# Birds to Spot — Design

**Date:** 2026-04-08
**Status:** Brainstormed, awaiting implementation plan
**Apps affected:** Both — `index.html` (David & Paula) and `mom-dad/index.html` (David's parents)

## Purpose

Add a small bird-watching companion to both London trip PWAs as a wink to the bird-loving users. The feature should be discoverable but not loud — a "quiet wink" that pays off the more attention you give it. Birds shown should be locally relevant to wherever the user is on a given day.

## User-facing behavior

Two surfaces per app:

### 1. Per-day chip on day cards

A small `🐦 Birds nearby` chip appears under each day's weather bar on every day card that has matching birds. Closed by default. Tap to expand inline; tap again to collapse.

When expanded, shows 1–3 species for that day. Each entry contains:
- Emoji + bird name
- One short playful blurb (a sentence of personality, not field-guide-terse)
- Where to look (landmark, park, body of water)

Days with no matching birds simply omit the chip — no empty state, no placeholder.

### 2. "Birds to Spot" section in Resources

A new collapsible section in the existing Resources page, alongside Emergency, Transportation, etc. Lists every bird for the trip with a fuller entry: name, emoji, where to spot, blurb, and a fun fact line.

Each row is a tappable checkbox using the existing exhibit-checklist styling. Tap to mark as spotted; persists to localStorage. The section header shows the section title and a live counter in the canonical format: `🐦 Birds to Spot — 3 of 8 spotted`.

### Per-app bird selection logic

- **David & Paula app:** birds map to specific day numbers based on the stops the day visits. E.g. Day 22 (Tower of London) → Raven; Day 26 (marathon route through Canary Wharf) → Peregrine Falcon.
- **Mom & Dad app:** birds map to the day's region (Bath / Cotswolds / London) since the trip naturally splits by hotel location. Uses the same region tracking the parents' app already has for weather selection.

## Initial bird list (subject to copy review)

**David & Paula — London (~7 species):**
- Raven 🐦‍⬛ — Tower of London
- Great White Pelican 🦩 — St James's Park
- Rose-ringed Parakeet 🦜 — Kensington Gardens / Hyde Park
- Grey Heron — Thames embankments / Regent's Canal
- Peregrine Falcon — Canary Wharf towers (mile 19 of marathon route)
- Mute Swan — Hyde Park Serpentine
- Common Kingfisher — Regent's Canal (long shot but worth listing)

**Mom & Dad — Bath/Cotswolds/London (~10 species):**
- *Bath:* Dipper, Grey Wagtail, Kingfisher (River Avon)
- *Cotswolds:* Red Kite, Yellowhammer, Skylark, Little Owl
- *London:* same set as David & Paula's app

Final copy to be drafted during implementation and reviewed by David before commit.

## Data model

A new top-level `birds` const, sibling to `dayData`, in each `index.html`:

**David & Paula app:**
```js
const birds = [
  {
    id: 'tower-raven',
    name: 'Raven',
    emoji: '🐦‍⬛',
    where: 'Tower of London grounds',
    blurb: "London's most famous corvids — six (plus a spare) live at the Tower full-time, with their own Yeoman keeper.",
    funFact: "Legend says if the ravens ever leave, the Tower crumbles and the kingdom falls. Their wings are clipped just in case.",
    dayNumbers: [22]
  },
  // ...
];
```

**Mom & Dad app:** same shape, but `regions: ['bath' | 'cotswolds' | 'london']` instead of `dayNumbers`.

## Renderer changes

### `index.html` (David & Paula)

- **`renderDayCards()`** — for each day, compute `matchingBirds = birds.filter(b => b.dayNumbers.includes(day.number))`. If non-empty, emit a `<div class="birds-chip" data-day="N">` immediately after the weather bar with a collapsed list. Tap on the chip header toggles `.expanded` class via a delegated click handler.
- **`renderBirdsResources()`** — new function that builds the Resources section once during init. Iterates the full `birds` array, emits a header (`🐦 Birds to Spot — X of N spotted`) and one row per bird with a checkbox and the full entry. Wired into the existing Resources rendering flow.
- **`setupBirdChecklist()`** — new function mirroring the existing `setupChecklists()`. Reads `localStorage.getItem('birds-dp-spotted')`, checks the matching boxes, and attaches change handlers that update both the localStorage array and the counter element in the section header.
- **`init()`** — calls the new functions alongside the existing setup.

### `mom-dad/index.html`

Same shape, with two differences:
- Bird matching uses the day's `region` (already tracked for weather selection) instead of `dayNumbers`.
- localStorage key is `birds-mom-spotted` (per the CLAUDE.md namespacing convention).

## Persistence

- **David & Paula app:** `birds-dp-spotted` — JSON array of bird `id` strings.
- **Mom & Dad app:** `birds-mom-spotted` — same shape.

The existing `pack-dp-*` / `pack-mom-*` namespacing convention is followed so the two apps don't collide if ever served from the same origin.

## CSS

Approximately 40 lines of new CSS:
- `.birds-chip` — collapsed pill styling, fits under weather bar (~32px tall collapsed).
- `.birds-chip.expanded` — expanded inline list styling.
- `.bird-row` — Resources row styling (reuses existing `.exhibit-row` patterns where possible).
- `.birds-counter` — header counter element.
- Dark mode counterparts in the existing `prefers-color-scheme: dark` block.

## Data flow

1. On load → `init()` runs `renderDayCards()` (chips appear on matched days) and `renderBirdsResources()` + `setupBirdChecklist()` (Resources section + persisted ticks).
2. User taps chip header → CSS class toggle, no JS state change, no network.
3. User ticks a bird in Resources → handler reads + writes `birds-{dp|mom}-spotted` array in localStorage, recomputes and updates the counter element.

## Offline behavior

Pure data + text + emoji. Zero new cached assets, zero new network calls. Offline-safe by construction.

## Files touched

- `index.html` — new `birds` const, two new render functions, one new setup function, ~40 lines of CSS, chip wired into the day-card template, Resources section addition. Estimated ~250 lines added.
- `mom-dad/index.html` — same shape, region-based matching, separate bird list including Bath/Cotswolds species. Estimated ~250 lines added.
- `sw.js` — bump `CACHE_NAME` from `london-2026-v10` to `london-2026-v11`.
- `mom-dad/sw.js` — bump `CACHE_NAME` from `mom-dad-london-v2` to `mom-dad-london-v3`.
- `DEVELOPMENT.md` — append a new dated session log entry explaining the feature, its wink intent, and bird selection rationale.
- `ARCHITECTURE.md` — small addition under "UI Layer" components mentioning "Birds to Spot — per-day chip + Resources checklist."

`KNOWN-ISSUES.md` is not touched (no known issues introduced).

## Testing checklist

- Local serve, hard-reload, expand each of the 8 days → correct chip appears (or correctly absent) on each day.
- Tap chip → expands inline; tap again → collapses.
- Verify chip content matches the expected birds for that day's stops.
- Open Resources page → "Birds to Spot" section visible, all birds listed with full copy.
- Tick 3 boxes → counter shows "3 of N", reload page, ticks persist.
- Untick a bird → counter decrements correctly.
- Dark mode visual check — chip and section styling readable.
- Repeat all of the above in `mom-dad/` app, verifying birds switch correctly when navigating between Bath / Cotswolds / London days.
- Confirm both SW cache versions bumped: DevTools → Application → Cache Storage shows new version names.

## Risks and mitigations

- **Day card vertical crowding.** The chip lives on the day card, which already has a tight vertical rhythm (weather bar, theme, stops, transport, walk transitions). Marathon Day is already the longest. *Mitigation:* chip is collapsed by default (~32px tall) and slots cleanly under the weather bar where the day card already has natural breathing room.
- **`dayNumbers`-vs-stops coupling.** If a day is renumbered or renamed, bird matching could silently break. *Mitigation:* add a `console.warn` at init time if any bird's `dayNumbers` references a day not present in `dayData`.
- **Two apps, two bird lists drifting apart.** The London birds in both apps should stay in sync. *Mitigation:* document in the session log that any London bird edit must be applied to both files, same as the existing weather/packing/maps cross-app convention.

## Out of scope

- Bird photos or illustrations (cache bloat, offline cost not worth it for this surface).
- A separate "spotted log" with notes/dates per bird (the checkbox is the whole interaction).
- Audio (recordings of bird calls) — fun idea but adds asset weight and offline complexity.
- Sharing or social features.
- Any backend, API, or sync between the two apps' spotted lists.
