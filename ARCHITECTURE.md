# London 2026 Trip App — Architecture

## Overview

A Progressive Web App (PWA) serving as an offline-capable interactive trip guide for David and Paula's London marathon trip (April 20–28, 2026). Built as a single-page HTML/CSS/JS application with service worker caching for full offline capability.

## Architecture Decision: PWA over Native Android

**Decision:** Build as a PWA rather than a native Android app.

**Why:**
- Existing HTML prototype provides 80% of the UI — minimal rework needed
- PWA installs directly from Chrome ("Add to Home Screen") — no app store
- Full offline support via service worker — critical for London Tube (no signal underground)
- Both David and Paula can install independently by visiting the same URL or opening the HTML file
- Trip is ~3 weeks away — PWA is fastest path to a working app
- Shares architecture patterns with Project Phil (also HTML-based)

**Trade-offs accepted:**
- No push notifications (not in MVP anyway)
- No background sync between devices (each phone has its own copy)
- Limited to what the browser can do (sufficient for our needs)

## System Components

### 1. UI Layer (`index.html` + inline CSS/JS)
Single-file PWA containing all markup, styles, and logic. Key UI components:
- **Hero header** with trip title and date range
- **Day pill navigation bar** (sticky, scrollable) for jumping between days
- **Expandable day cards** with stops, times, details, and tags
- **Transport direction callouts** with step-by-step board/ride/transfer/exit icons
- **Ticket viewer** — embedded PDF viewer per activity (Tower of London, Westminster Abbey, British Museum)
- **Reservation tags** — color-coded with who booked and party size
- **Resources page** — emergency contacts, medical info, cab apps, venue links, travel tips
- **Google Maps navigation** — tappable 📍 links on walk transitions and transport directions for turn-by-turn navigation
- **Venue links** — restaurant, hotel, attraction, and shop names link to official websites
- **Exhibit checklists** — interactive checkboxes for Tower of London, Westminster Abbey, British Museum, and Churchill War Rooms with localStorage persistence
- **Birds to Spot** — quiet wink for the bird-loving users: a collapsed `🐦 Birds nearby` chip on each day card (location-matched to that day's stops, shows 0–2 species) and a "🐦 Birds to Spot" group on the Resources page with a tappable spotted-checklist and live "X of N spotted" counter. localStorage keys: `birds-dp-spotted` (David & Paula app, 7 London species matched by day number) and `birds-mom-spotted` (Mom & Dad app, 14 species matched by `day.weather.location` across Bath / Cotswolds / London). London bird copy stays in sync across both files.
- **MJFF marathon branding** — marathon day uses Michael J. Fox Foundation orange (#e07800) with Team Fox fundraising link
  - **Marathon race-day operations** — full start info (bib #60613, Blue assembly, Wave 10, 10:23 start), transport to Blackheath, on-course hydration/aid by mile, post-finish logistics with meeting points
  - **Race prep checklist** — Saturday evening checklist for bib pinning, kit layout, alarm, and weather check
  - **Running Show bib pickup** — QR code + photo ID reminder, Event Pack contents checklist on Day 22
- **Live weather** — auto-fetches 16-day London forecast from Open-Meteo API on load; falls back to April averages when offline
- **Dark mode** — automatic via `prefers-color-scheme: dark` media query
- **Today auto-highlight** — during the trip, auto-expands and highlights the current day
- **Collapsible flight bar** — auto-hides mid-trip, toggle to show/hide
- **Back to top button** — floating button appears on scroll for quick navigation
- **Timeline connector** — visual progress dots between stops within each day

### 2. Service Worker (`sw.js`)
Handles offline caching strategy:
- **Cache on install:** Pre-caches the app shell (index.html, manifest, fonts, ticket PDFs)
- **Cache-first strategy:** Serves from cache, falls back to network
- **Versioned cache:** Cache name includes version number for clean updates
- Fonts loaded from Google Fonts are cached on first load

### 3. Web App Manifest (`manifest.json`)
Makes the app installable:
- App name: "London 2026"
- Short name: "London 26"
- Theme color: #2d5a3d (Kensington Garden green)
- Background color: #f7f5f0 (cream)
- Display: standalone (hides browser chrome)
- Orientation: portrait
- App icons at multiple sizes

## Design System: "Kensington Garden" Palette

Chosen by David — a springtime London theme with fresh greens and warm gold.

| Token | Hex | Usage |
|-------|-----|-------|
| --bg | #f7f5f0 | Main background |
| --card | #ffffff | Card backgrounds |
| --card-border | #e8e2d8 | Card borders, dividers |
| --primary | #2d5a3d | Headings, day numbers, nav active |
| --primary-light | #4a8c62 | Secondary green accents |
| --accent | #c07d3e | Times, gold accents |
| --accent-light | #d4a253 | Lighter gold touches |
| --text | #2c2c2c | Body text |
| --text-dim | #7a7568 | Secondary/detail text |
| --tag-reservation | #c07d3e | Reservation tag color |
| --tag-ticket | #3a7ca5 | Ticket tag color |
| --marathon-red | #e07800 | Marathon day accent (MJFF orange) |
| --marathon-bg | #fef6ed | Marathon day card bg |
| --transport-bg | #eef4f8 | Transport callout bg |
| --transport-border | #b8d4e8 | Transport callout border |

**Typography:** Playfair Display (headings, 700) + DM Sans (body, 300–600)

## Ticket Embedding Strategy

Ticket PDFs are stored in `/tickets/` and embedded in the app using base64-encoded data URIs or `<object>`/`<iframe>` tags for offline viewing. Each ticket-requiring activity has a "View Ticket" button that opens the relevant PDF.

| Attraction | File | Day |
|------------|------|-----|
| Tower of London | tower-of-london.pdf | Day 2 (Apr 22) |
| Westminster Abbey | westminster-abbey.pdf | Day 3 (Apr 23) |
| British Museum | british-museum.pdf | Day 4 (Apr 24) |
| Churchill War Rooms | churchill-war-rooms.pdf | Day 5 (Apr 25) |

## File Structure

```
London Trip App/
├── index.html          # Main PWA (single-file app)
├── sw.js               # Service worker for offline caching
├── manifest.json       # Web app manifest for installability
├── icons/              # App icons (multiple sizes)
├── tickets/            # Ticket PDFs for offline viewing
│   ├── tower-of-london.pdf
│   ├── westminster-abbey.pdf
│   ├── british-museum.pdf
│   └── churchill-war-rooms.pdf
├── ARCHITECTURE.md     # This file
├── DEVELOPMENT.md      # Development roadmap and session log
└── KNOWN-ISSUES.md     # Known issues and follow-ups
```

## Key Constraints

1. **Offline-first:** Everything must work without internet (Tube has no signal)
2. **Android Chrome:** Primary target browser; must pass PWA installability checks
3. **Single-file preference:** Keep the app as simple as possible — one HTML file + supporting assets
4. **No backend/server:** Fully client-side; no API calls, no database, no auth
5. **3-week deadline:** Trip starts April 20, 2026 — MVP must be ready before then
