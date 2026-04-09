# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Two sibling Progressive Web Apps for David & Paula's London marathon trip (April 21–28, 2026):

- **Root (`index.html` + `sw.js` + `manifest.json`)** — David & Paula's app. Deployed to https://1davidhensley.github.io/london-2026/ (repo `1davidhensley/london-2026`).
- **`mom-dad/`** — Separate app for David's parents (trip Apr 18–30: Bath → Cotswolds → London). Deployed to https://1davidhensley.github.io/london-2026-mom-dad/ (separate repo `1davidhensley/london-2026-mom-dad`). It has its own `.git`, `sw.js`, and `manifest.json` — treat it as an independent project that just happens to live in a subfolder here.

There is no build step, no package manager, no framework. Each app is a **single `index.html` file** containing all markup, CSS, and JS, plus a service worker and manifest. Authoritative context lives in `ARCHITECTURE.md`, `DEVELOPMENT.md` (full session log — read this to understand why features exist), and `KNOWN-ISSUES.md`.

## Common Commands

```bash
# Serve locally for testing (from repo root or mom-dad/)
python -m http.server 8000
# Then open http://localhost:8000/
```

When testing service-worker changes locally, hard-reload (Ctrl+Shift+R) or use DevTools → Application → Service Workers → "Update on reload". Installed PWAs will **not** pick up HTML/CSS/JS changes until the `CACHE_NAME` in `sw.js` is bumped (see deployment rule below).

## Deployment

Deployment is manual via git push to the respective GitHub repos (the dirs here are thin local repos with no remotes configured — David pushes from a clone elsewhere, typically by grabbing a token with `gh auth token` from `cmd` shell, not PowerShell). GitHub Pages serves from `main`/root.

**Mandatory deployment checklist** (learned the hard way in Session 10 — Paula reported a feature wasn't working because the SW cache was stale):

1. Make code changes.
2. Test locally.
3. **Bump the `CACHE_NAME` version in `sw.js`** — e.g. `london-2026-v10` → `v11`. Do this on *every* deploy that touches `index.html`, assets in `ASSETS_TO_CACHE`, or any cached resource. Without the bump, installed PWAs serve the old cached HTML and users see no changes.
4. If you added a new cacheable asset (e.g. a new ticket PDF), add it to `ASSETS_TO_CACHE` in `sw.js`.
5. Push to GitHub, verify the live site loads the new version.

The two apps have independent cache namespaces (`london-2026-vN` and `mom-dad-london-vN`) — bump whichever app you changed.

## Architecture

### Single-file data-driven rendering
`index.html` holds a `const dayData = [...]` array (around line 2059) that describes all 8 days. Each day has `number`, `date`, `theme`, `weather`, `stops[]`, and `transport[]`. Each stop can carry any of these optional fields:

- `time`, `emoji`, `name`, `details`, `link` — core display
- `mapsQuery` — populates the "📍 Open in Maps" button
- `walkTo` — renders a dashed walk-transition bullet to the next stop
- `transportDir` — inline step-by-step transport callout (Board/Ride/Transfer/Exit icons)
- `checklist` — array of strings rendered as persistent checkboxes (exhibit tracking for Tower of London, Westminster Abbey, British Museum, Churchill War Rooms)
- `tickets: { name, pdf }` — auto-generates a "View Tickets" button wired to `viewTicket()` which loads the PDF into `#ticketModal`
- `reservation` — renders a color-coded reservation tag

`renderDayCards()` in `init()` walks `dayData` and builds the DOM. **To add/edit stops or days, edit the `dayData` array — do not hand-write card HTML.**

### Offline-first is a hard constraint
The Tube has no signal. Everything the app needs at any point in the trip must be in the service worker cache or in inline HTML/JS. `sw.js` uses cache-first with a navigation fallback to `./index.html`. Ticket PDFs are explicitly listed in `ASSETS_TO_CACHE` so they're available underground. Live data (the Open-Meteo weather fetch in `fetchWeather()`) **must** have a static fallback — currently the hardcoded April averages already baked into each day's `weather` object. Never introduce a feature that hard-fails when offline.

### localStorage persistence keys
State that survives reloads:
- `london2026-checked` — JSON map of exhibit checklist state, keyed `d{day}-s{stopIdx}-{itemIdx}`
- `pack-dp-custom-list` — full user-edited packing list JSON (created once Paula edits the list; if absent, `defaultPackingList` loads)
- `pack-dp-{itemId}` — per-item packing checkbox state

The `mom-dad/` app uses `pack-mom-*` equivalents. When adding state, namespace it the same way so the two apps don't collide if ever hosted on the same origin.

### Ticket viewer
Each ticketed stop carries a `tickets: { name, pdf }` property. The template auto-emits a button that calls `viewTicket(name, pdfPath)`, which loads the PDF into the `#ticketModal` iframe. PDFs live in `tickets/`. Pattern is documented in `SESSION-PROMPT-next.md` and the existing Tower of London / Westminster Abbey / British Museum / Churchill War Rooms stops are the reference implementations.

### Design system
"Kensington Garden" palette — CSS custom properties at the top of `<style>`, full token table in `ARCHITECTURE.md`. Marathon Day (Day 26) uses MJFF orange (`--marathon-red: #e07800`) — do not hardcode marathon colors, use the variable (Session 6 fixed hardcoded `#c44536` escapes). Dark mode is automatic via `prefers-color-scheme: dark` — any new color must have a dark-mode counterpart in the media query block.

### Day-card expand animation gotcha
`.day-card.expanded .day-content` uses `max-height: 50000px` (not `none`) so the CSS transition still animates. If you add a lot of content to a day, keep the large numeric value — switching to `none` breaks the animation; switching to a too-small value (the old `3000px`) silently truncates content under `overflow: hidden`. See KNOWN-ISSUES.md §4 for the incident.

## Working conventions

- **Keep it single-file.** Don't split `index.html` into modules or add a bundler. The simplicity is load-bearing — David and Paula install this as a PWA and any build step adds risk with no benefit.
- **Data changes, not DOM changes.** To add a stop, walk link, ticket, or checklist, edit `dayData`. The renderer handles the rest.
- **Update the session log.** After any non-trivial change, append a dated entry to `DEVELOPMENT.md` explaining *why* (it's the project's institutional memory — multiple past sessions relied on it). Update `KNOWN-ISSUES.md` when you resolve or introduce a known issue, and `ARCHITECTURE.md` if you touch file structure or the ticket table.
- **Mirror cross-app changes deliberately.** Features like weather bars, packing lists, and Maps links were explicitly rolled out to both the David & Paula app and the `mom-dad/` app (Sessions 7–9). If a change applies to both, update both and bump both service workers. If it only applies to one, say so in the session log.
- **Bump the SW cache on every deploy.** This is the #1 source of "it works locally but not on Paula's phone" bugs in this project.
