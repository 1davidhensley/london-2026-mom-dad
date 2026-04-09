# London 2026 Trip App — Known Issues

## Open Issues

### ~~1. Churchill War Rooms Ticket Missing~~
- **Status:** Resolved (April 6, 2026)
- **Details:** David purchased tickets on April 7, 2026. Order ref D7H35XV49 — 2 adult General Admission, £34 each, Apr 25 at 09:00.
- **Fix:** Ticket PDF created and embedded in app. Added `tickets` property to Churchill War Rooms stop data, added PDF to service worker cache (`ASSETS_TO_CACHE`), bumped cache v7→v8.
- **Note:** The embedded PDF is a recreated confirmation (not the original email PDF). David should keep the original booking email on his phone as backup for barcode scanning at entry.

### 2. Day 1 Dinner TBD
- **Status:** Pending decision
- **Details:** Day 1 (Apr 21) dinner is listed as "TBD — Bleeker Burger or Honest Burger"
- **Impact:** Minor — app will show both options until David decides.
- **Action:** David to pick a restaurant before the trip.

## Resolved Issues

### 3. Day Pill Navigation — Wrong Day-of-Week Labels
- **Status:** Fixed (April 6, 2026)
- **Root Cause:** The day pill buttons (sticky nav bar) had incorrect day-of-week abbreviations for April 21–25. They were shifted one day earlier (Mon instead of Tue, Tue instead of Wed, etc.). Days 26–28 were correct.
- **Reported by:** Paula
- **Fix:** Corrected pill labels: Mon→Tue 21, Tue→Wed 22, Wed→Thu 23, Thu→Fri 24, Fri→Sat 25. Days 26-28 were already correct.

### 4. Day Card Content Truncation
- **Status:** Fixed (April 6, 2026)
- **Root Cause:** `.day-card.expanded .day-content` had `max-height: 3000px` with `overflow: hidden`. Days with many stops, transport directions, exhibit checklists, and walk transitions (especially marathon day and Churchill + Soho day) exceeded 3000px, causing content to be cut off.
- **Fix:** Changed `max-height: 3000px` → `max-height: 50000px`. Used a large numeric value instead of `none` to preserve the CSS transition animation on expand/collapse.
- **Prevention:** If new stops or content are added to any day, this value provides ample headroom.

### 4. Editable Packing List Not Updating on Installed PWA
- **Status:** Fixed (March 30, 2026)
- **Root Cause:** Service worker cache not bumped after editable packing list was deployed. Main app was stuck at v5, Mom & Dad app at v1. Installed PWAs were serving the old cached HTML without edit functionality.
- **Symptoms:** Paula reported packing list editing didn't work. The code was correct — the stale service worker cache was preventing the updated HTML from loading.
- **Fix:** Bumped service worker cache version: main app v5→v6, Mom & Dad app v1→v2. This forces the service worker to re-fetch all assets on next load.
- **Prevention:** Always bump the service worker cache version whenever deploying code changes. Added this as a deployment checklist item.
