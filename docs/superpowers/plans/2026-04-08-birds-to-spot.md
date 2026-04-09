# Birds to Spot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a small location-aware "Birds to Spot" companion to both London trip PWAs — a per-day chip on day cards plus a Resources section with a tappable spotted-checklist — as a wink to the bird-loving users.

**Architecture:** Pure data-driven addition. A new top-level `birds` array (sibling to `dayData` / `itinerary`) drives both surfaces. The David & Paula app matches birds to days by `dayNumbers`; the Mom & Dad app matches by region (`day.weather.location` — already present). No new files, no new dependencies, no network calls. Resources entries are injected by JS at init in both apps so bird data lives in exactly one place per app.

**Tech Stack:** Vanilla HTML/CSS/JS in two single-file PWAs. No build, no framework, no test runner. Verification is manual in a browser per task. Final commit is bundled at the end (per user request).

**Spec:** `docs/superpowers/specs/2026-04-08-birds-to-spot-design.md`

**Cross-app convention reminder:** The CLAUDE.md "mandatory deployment checklist" applies here — both `sw.js` files must have their `CACHE_NAME` bumped before this lands. Tasks 9 and 13 handle that.

---

## Phase 0 — Preflight Decisions

These are content/decision tasks, no code. They unblock everything else.

### Task 1: Lock the David & Paula bird → day mapping

**Files:**
- Read: `index.html` (the `dayData` array starts at ~line 2059)

**Goal:** Decide which `dayNumbers` each of the 7 London birds appears on, based on the actual stops each day visits. The spec only locked 2 of 7 (Tower Raven → Day 22, Peregrine → Day 26); this task locks the rest.

- [ ] **Step 1: Read each day's stops in `dayData`**

Already known from initial exploration:
- **Day 21 (Arrival):** Heathrow → hotel → Leicester Square → dinner. Mostly indoors/transit.
- **Day 22 (Tower + City + Soho):** Tower of London, Tower Bridge, Leadenhall, Canary Wharf, Marathon Expo, Carnaby Street, Brasserie Zedel.
- **Day 23 (Westminster + South Bank):** Westminster Abbey, Big Ben, South Bank, Fishcoteque, **St James's Park** (the data literally says `'Walk through the park, not around · Blue bridge · Pelicans?!'`), Buckingham Palace, Trafalgar Square.
- **Day 24 (Museum + Covent Garden):** British Museum + Covent Garden (mostly indoors).
- **Day 25 (Churchill + Soho + Marylebone):** Churchill War Rooms (next to St James's Park), Soho, Marylebone.
- **Day 26 (Marathon):** Blackheath start → Greenwich → Cutty Sark → Tower Bridge → **Canary Wharf miles 17-19** → Embankment → Buckingham Palace finish.
- **Day 27 (Kensington + Central):** Akasha Spa → Dishoom Kensington → **Kensington Palace & Gardens** (data literally says `'Round Pond · Princess Diana memorial fountain · Rose garden · Birds!'`) → Fortnum & Mason → Connaught.
- **Day 28 (South Bank Farewell):** Waterstones → St Paul's → **cross Millennium Bridge** → Globe → **Borough Market** (right on the Thames).

- [ ] **Step 2: Lock the assignments**

| Bird | Day(s) | Why this day |
|---|---|---|
| Raven | 22 | Tower of London is on this day. |
| Great White Pelican | 23 | Day visits St James's Park; existing stop already says "Pelicans?!" — the wink lands. |
| Rose-ringed Parakeet | 27 | Kensington Palace & Gardens stop already mentions "Birds!" and the Round Pond. |
| Mute Swan | 27 | Same Kensington stop — Round Pond has resident swans. Bundled with parakeets to keep the chip lean. |
| Grey Heron | 28 | South Bank Farewell day crosses Millennium Bridge + Borough Market on the Thames — herons fish the river embankments. |
| Peregrine Falcon | 26 | Marathon route mile 17-19 runs directly under the Canary Wharf towers where peregrines nest. |
| Common Kingfisher | 25 | Day visits St James's Park area (Churchill War Rooms is adjacent). Long shot but fits the strolling pace. |

Notes:
- Days 21 and 24 deliberately get NO chip (arrival logistics / indoors-heavy day). The spec allows that — no empty state on bird-less days.
- No bird is double-assigned to two days. If it were ever desired, `dayNumbers` is an array, so trivially supported.

- [ ] **Step 3: Record the mapping**

Just keep this table handy for Task 4. No file changes in this task.

---

### Task 2: Verify Mom & Dad region structure (already done, document and move on)

**Files:**
- Read: `mom-dad/index.html:835-940` (the `itinerary` array)

- [ ] **Step 1: Confirm the region field exists on every day**

Verified during planning: every entry in `itinerary` has `weather.location` set to one of `'Bath' | 'Cotswolds' | 'London'`. Bath days: Apr 18-20. Cotswolds days: Apr 21-23. London days: Apr 24-30.

- [ ] **Step 2: Pick the matching key**

Use `day.weather.location.toLowerCase()` for matching against bird `regions`. That keeps the source data unchanged and gives us lowercase region keys for the bird entries.

No code changes in this task.

---

### Task 3: Draft the bird copy

**Files:**
- Create (temporary, scratchpad only — copy will be inlined into `index.html` in Task 4): in-memory or local notes

**Goal:** Write the playful blurb + fun fact lines for all 10 unique species. Each entry is ~1 sentence of personality + ~1 sentence of trivia. Tone: gently witty, not jokey. Per the spec: terse field-guide doesn't wink, minimalist doesn't either.

- [ ] **Step 1: Draft copy for the 7 London birds (used by both apps)**

```
Raven 🐦‍⬛ — Tower of London grounds
Blurb: London's most famous corvids — six (plus a spare) live at the Tower full-time, with their own Yeoman keeper.
Fun fact: Legend says if the ravens ever leave, the Tower crumbles and the kingdom falls. Their wings are clipped just in case.

Great White Pelican 🪿 — St James's Park
Blurb: Yes, pelicans, in the middle of London. A gift from the Russian ambassador to Charles II in 1664, and the colony's been there ever since.
Fun fact: They're fed fish daily at 2:30pm by the park keepers — exactly when this day's itinerary walks through.

Rose-ringed Parakeet 🦜 — Kensington Gardens
Blurb: London's rowdy green invaders. Listen for the screech before you see them flashing through the canopy.
Fun fact: The leading origin myth says they escaped from the set of *The African Queen* in 1951. Probably not true, definitely funny.

Mute Swan 🦢 — The Round Pond, Kensington Gardens
Blurb: Big, white, deeply unimpressed by tourists. Every unmarked swan in open water in the UK technically belongs to the King.
Fun fact: The annual "Swan Upping" ceremony on the Thames still rounds them up for a royal headcount, in skiffs.

Grey Heron 🪶 — Thames embankments and South Bank
Blurb: Tall, grey, and statue-still in the shallows. London has a healthy resident population that doesn't mind the city at all.
Fun fact: They commute. Heron pairs nest in Regent's Park then fly into central London for the day's fishing.

Peregrine Falcon 🦅 — Canary Wharf towers
Blurb: The fastest animal on the planet (up to 240 mph in a stoop) nests on the skyscrapers around mile 19 of the marathon route. Look up.
Fun fact: London's peregrines are a comeback story — the city now has more breeding pairs than the entire Lake District.

Common Kingfisher 💎 — St James's Park lake edges, slow water
Blurb: A flash of electric blue and orange that's gone before your brain processes it. Worth a slow walk along the lake just in case.
Fun fact: They hunt by hovering, then plunge straight in. The "common" in the name is doing a lot of work — sightings still feel like a small miracle.
```

- [ ] **Step 2: Draft copy for the 3 extra Bath/Cotswolds birds (Mom & Dad app only)**

```
Dipper 🐦 — River Avon, Bath (especially Pulteney Weir)
Blurb: A round little chocolate-and-white bird that walks underwater along fast-flowing river beds. Genuinely.
Fun fact: It's the UK's only truly aquatic songbird. Scan the rocks at Pulteney Weir and look for one bobbing up and down.

Red Kite 🪁 — Cotswolds skies, especially over Blenheim and the A40
Blurb: The huge forked-tail raptor wheeling over Cotswold meadows. Once nearly extinct in the UK, now everywhere in the south.
Fun fact: They were reintroduced from Spain in the 1990s. Drive the back roads near Blenheim and you'll spot a dozen without trying.

Skylark 🎵 — Cotswolds farmland, hovering high above the fields
Blurb: A small brown bird famous for its wildly elaborate song delivered while hovering 100m up. The soundtrack to an English spring.
Fun fact: They're so high you usually hear them long before you spot the dot — the song goes on for several minutes without a pause.
```

- [ ] **Step 3: Show the copy to David for review**

Send the above as a single message to David. Wait for sign-off (or edits) before proceeding to Task 4. This is the only review checkpoint in the plan — once copy is locked, the rest is mechanical.

---

## Phase 1 — David & Paula App (`index.html`)

### Task 4: Add the `birds` const

**Files:**
- Modify: `index.html` (insert immediately after the `dayData` array closes at ~line 3018, before the `// Checklist persistence` comment at line 3020)

- [ ] **Step 1: Insert the new const**

Insert this block right after the `];` that closes `dayData` and before the next comment:

```js
    // ---- Birds to Spot — local species the bird-loving David & Paula might catch ----
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
      {
        id: 'great-white-pelican',
        name: 'Great White Pelican',
        emoji: '🪿',
        where: "St James's Park",
        blurb: "Yes, pelicans, in the middle of London. A gift from the Russian ambassador to Charles II in 1664, and the colony's been there ever since.",
        funFact: "They're fed fish daily at 2:30pm by the park keepers — exactly when this day's itinerary walks through.",
        dayNumbers: [23]
      },
      {
        id: 'kingfisher',
        name: 'Common Kingfisher',
        emoji: '💎',
        where: "St James's Park lake edges, slow water",
        blurb: "A flash of electric blue and orange that's gone before your brain processes it. Worth a slow walk along the lake just in case.",
        funFact: "They hunt by hovering, then plunge straight in. The \"common\" in the name is doing a lot of work — sightings still feel like a small miracle.",
        dayNumbers: [25]
      },
      {
        id: 'peregrine-falcon',
        name: 'Peregrine Falcon',
        emoji: '🦅',
        where: 'Canary Wharf towers (around mile 19 of the marathon route)',
        blurb: "The fastest animal on the planet (up to 240 mph in a stoop) nests on the skyscrapers around mile 19 of the marathon route. Look up.",
        funFact: "London's peregrines are a comeback story — the city now has more breeding pairs than the entire Lake District.",
        dayNumbers: [26]
      },
      {
        id: 'rose-ringed-parakeet',
        name: 'Rose-ringed Parakeet',
        emoji: '🦜',
        where: 'Kensington Gardens canopy',
        blurb: "London's rowdy green invaders. Listen for the screech before you see them flashing through the canopy.",
        funFact: "The leading origin myth says they escaped from the set of The African Queen in 1951. Probably not true, definitely funny.",
        dayNumbers: [27]
      },
      {
        id: 'mute-swan',
        name: 'Mute Swan',
        emoji: '🦢',
        where: 'The Round Pond, Kensington Gardens',
        blurb: "Big, white, deeply unimpressed by tourists. Every unmarked swan in open water in the UK technically belongs to the King.",
        funFact: "The annual \"Swan Upping\" ceremony on the Thames still rounds them up for a royal headcount, in skiffs.",
        dayNumbers: [27]
      },
      {
        id: 'grey-heron',
        name: 'Grey Heron',
        emoji: '🪶',
        where: 'Thames embankments and South Bank',
        blurb: "Tall, grey, and statue-still in the shallows. London has a healthy resident population that doesn't mind the city at all.",
        funFact: "They commute. Heron pairs nest in Regent's Park then fly into central London for the day's fishing.",
        dayNumbers: [28]
      }
    ];
```

- [ ] **Step 2: Verify**

Hard-reload the local serve. Open DevTools console and type `birds.length` — expect `7`. Type `birds.map(b => b.dayNumbers).flat().sort()` — expect `[22, 23, 25, 26, 27, 27, 28]`. No visible app change yet.

---

### Task 5: Add `.birds-chip` and bird-section CSS

**Files:**
- Modify: `index.html` — insert the CSS in the existing `<style>` block. Place near the existing `.weather-bar` rules (which start at ~line 857) so related layout stays together. The full weather block spans roughly lines 857–895 and includes `.weather-bar`, `.weather-icon`, `.weather-details`, `.weather-item`, `.weather-label`, `.weather-value`, etc. Dark-mode overrides go inside the existing `@media (prefers-color-scheme: dark)` block (~line 1473).

- [ ] **Step 1: Add the chip + bird-row CSS**

Insert this block immediately after the closing `}` of the last `.weather-*` rule (around line 895 — the `.weather-value` block) and before the next unrelated section:

```css
    /* ---- Birds to Spot ---- */
    .birds-chip {
      margin: 0.5rem 0 0.75rem;
      background: #f1f7ed;
      border: 1px solid #cfe1c2;
      border-radius: 8px;
      overflow: hidden;
      transition: background 0.15s ease;
    }

    .birds-chip-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.55rem 0.9rem;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--primary);
      user-select: none;
      touch-action: manipulation;
    }

    .birds-chip-header .chevron {
      margin-left: auto;
      font-size: 0.7rem;
      transition: transform 0.2s ease;
    }

    .birds-chip.expanded .chevron {
      transform: rotate(180deg);
    }

    .birds-chip-body {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.25s ease;
    }

    .birds-chip.expanded .birds-chip-body {
      max-height: 800px;
    }

    .bird-entry {
      padding: 0.6rem 0.9rem;
      border-top: 1px solid #dbe9d0;
    }

    .bird-entry-name {
      font-weight: 600;
      font-size: 0.9rem;
      color: var(--primary);
      margin-bottom: 0.15rem;
    }

    .bird-entry-blurb {
      font-size: 0.82rem;
      color: var(--text);
      line-height: 1.4;
      margin-bottom: 0.25rem;
    }

    .bird-entry-where {
      font-size: 0.75rem;
      color: var(--text-dim);
      font-style: italic;
    }

    /* Resources page bird section */
    .birds-resource-counter {
      font-size: 0.78rem;
      font-weight: 400;
      opacity: 0.9;
      margin-left: auto;
    }

    .resource-group-header.birds-header {
      justify-content: flex-start;
    }

    .bird-resource-row {
      padding: 0.75rem 1.25rem;
      border-bottom: 1px solid var(--card-border);
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .bird-resource-row:last-child {
      border-bottom: none;
    }

    .bird-resource-row input[type="checkbox"] {
      margin-top: 0.2rem;
      width: 20px;
      height: 20px;
      accent-color: var(--primary);
      cursor: pointer;
      flex-shrink: 0;
    }

    .bird-resource-row .bird-content {
      flex: 1;
    }

    .bird-resource-row.spotted .bird-entry-name {
      text-decoration: line-through;
      opacity: 0.55;
    }

    .bird-resource-row .bird-fun-fact {
      font-size: 0.75rem;
      color: var(--text-dim);
      margin-top: 0.3rem;
      font-style: italic;
    }
```

- [ ] **Step 2: Add dark-mode overrides**

Find the existing `@media (prefers-color-scheme: dark)` block (search for `prefers-color-scheme: dark`). Inside it, add:

```css
      .birds-chip {
        background: #1f2a1e;
        border-color: #2f4128;
      }
      .bird-entry {
        border-top-color: #2f4128;
      }
      .birds-chip-header {
        color: #b3d6a8;
      }
      .bird-entry-name {
        color: #b3d6a8;
      }
```

- [ ] **Step 3: Verify**

Hard-reload. Visually nothing should have changed yet (no element uses these classes). Open DevTools, search the Elements panel CSS — confirm `.birds-chip` is present. No console errors.

---

### Task 6: Render the chip in `renderDayCards()`

**Files:**
- Modify: `index.html` — inside `renderDayCards()` (~line 3129), add the chip markup right after the `weather-bar` block and before `<div class="stop-list">`.

- [ ] **Step 1: Insert chip markup**

Find this in the template literal inside `renderDayCards()`:

```html
            ` : ''}
            <div class="stop-list">
              <div class="stop-connector"></div>
```

(That's the end of the weather-bar conditional and the start of the stop list.)

Insert immediately between them:

```html
            ` : ''}
            ${(() => {
              const dayBirds = birds.filter(b => b.dayNumbers.includes(day.number));
              if (dayBirds.length === 0) return '';
              return `
                <div class="birds-chip" data-day="${day.number}">
                  <div class="birds-chip-header" onclick="toggleBirdsChip(${day.number})">
                    <span>🐦</span>
                    <span>Birds nearby (${dayBirds.length})</span>
                    <span class="chevron">▼</span>
                  </div>
                  <div class="birds-chip-body">
                    ${dayBirds.map(b => `
                      <div class="bird-entry">
                        <div class="bird-entry-name">${b.emoji} ${b.name}</div>
                        <div class="bird-entry-blurb">${b.blurb}</div>
                        <div class="bird-entry-where">${b.where}</div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              `;
            })()}
            <div class="stop-list">
              <div class="stop-connector"></div>
```

(Note: only the *new* lines between the original `` ` : ''} `` and `<div class="stop-list">` are being added — the surrounding context is shown to make the insertion point unambiguous.)

- [ ] **Step 2: Add the toggle handler**

Find `function getStepIcon(iconType)` (~line 3241). Immediately above it, add:

```js
    // Birds chip — toggle expand/collapse
    function toggleBirdsChip(dayNumber) {
      const chip = document.querySelector(`.birds-chip[data-day="${dayNumber}"]`);
      if (chip) chip.classList.toggle('expanded');
    }
```

- [ ] **Step 3: Verify**

Hard-reload. Expand each day card and look for the `🐦 Birds nearby (N)` chip immediately under the weather bar. Expected:
- Day 21: NO chip
- Day 22: chip with "(1)" — Raven
- Day 23: chip with "(1)" — Pelican
- Day 24: NO chip
- Day 25: chip with "(1)" — Kingfisher
- Day 26: chip with "(1)" — Peregrine
- Day 27: chip with "(2)" — Parakeet + Swan
- Day 28: chip with "(1)" — Heron

Tap a chip → it should expand smoothly to show entries. Tap again → collapse. Check on Day 27 that BOTH bird entries appear (this is the only multi-bird day for D&P).

If a chip is missing or wrong, check the `dayNumbers` arrays in Task 4.

---

### Task 7: Inject the Resources "Birds to Spot" section

**Files:**
- Modify: `index.html` — `init()` at line 3118 (add a new function call) and add the new function definitions immediately after `setupChecklists()` (~line 3031–3046).

The Resources section in `index.html` is hardcoded HTML, not data-driven. We inject the new bird group via JS at init so the bird data lives in exactly one place (the `birds` const).

- [ ] **Step 1: Add the renderer + checklist setup function**

Insert this block immediately after the closing `}` of `setupChecklists()` (~line 3046):

```js
    // ---- Birds to Spot — Resources section ----
    function getBirdsSpotted() {
      try { return JSON.parse(localStorage.getItem('birds-dp-spotted') || '[]'); }
      catch { return []; }
    }

    function saveBirdsSpotted(spotted) {
      try { localStorage.setItem('birds-dp-spotted', JSON.stringify(spotted)); }
      catch {}
    }

    function updateBirdCounter() {
      const counterEl = document.querySelector('.birds-resource-counter');
      if (!counterEl) return;
      const spotted = getBirdsSpotted();
      counterEl.textContent = `${spotted.length} of ${birds.length} spotted`;
    }

    function renderBirdsResources() {
      const container = document.getElementById('resourcesSection');
      if (!container) return;
      // Avoid double-injection on hot reload
      if (container.querySelector('.bird-resource-row')) return;

      const group = document.createElement('div');
      group.className = 'resource-group';
      group.innerHTML = `
        <div class="resource-group-header birds-header">
          <span>🐦</span>
          <span>Birds to Spot</span>
          <span class="birds-resource-counter">0 of ${birds.length} spotted</span>
        </div>
        ${birds.map(b => `
          <div class="bird-resource-row" data-bird-id="${b.id}">
            <input type="checkbox" id="bird-chk-${b.id}">
            <div class="bird-content">
              <div class="bird-entry-name">${b.emoji} ${b.name}</div>
              <div class="bird-entry-blurb">${b.blurb}</div>
              <div class="bird-entry-where">${b.where}</div>
              <div class="bird-fun-fact">${b.funFact}</div>
            </div>
          </div>
        `).join('')}
      `;
      container.appendChild(group);
    }

    function setupBirdsChecklist() {
      const spotted = getBirdsSpotted();
      document.querySelectorAll('.bird-resource-row').forEach(row => {
        const id = row.dataset.birdId;
        const cb = row.querySelector('input[type="checkbox"]');
        if (spotted.includes(id)) {
          cb.checked = true;
          row.classList.add('spotted');
        }
        cb.addEventListener('change', () => {
          const current = getBirdsSpotted();
          if (cb.checked) {
            if (!current.includes(id)) current.push(id);
            row.classList.add('spotted');
          } else {
            const i = current.indexOf(id);
            if (i >= 0) current.splice(i, 1);
            row.classList.remove('spotted');
          }
          saveBirdsSpotted(current);
          updateBirdCounter();
        });
      });
      updateBirdCounter();
    }
```

- [ ] **Step 2: Wire into `init()`**

Find `init()` (~line 3118) and add two new calls:

```js
    function init() {
      renderDayCards();
      setupChecklists();
      renderBirdsResources();      // <-- NEW
      setupBirdsChecklist();        // <-- NEW
      initPackingList();
      setupEventListeners();
      registerServiceWorker();
      // Fetch live weather (non-blocking — falls back to hardcoded averages if offline)
      fetchWeather();
    }
```

- [ ] **Step 3: Add a sanity check for orphan dayNumbers**

Inside `init()`, immediately after the new `setupBirdsChecklist();` call, add:

```js
      // Sanity check: warn if any bird targets a non-existent day
      const validDays = new Set(dayData.map(d => d.number));
      birds.forEach(b => {
        const orphans = b.dayNumbers.filter(n => !validDays.has(n));
        if (orphans.length) {
          console.warn(`[birds] "${b.name}" references missing day numbers:`, orphans);
        }
      });
```

This is the spec's "Risks and mitigations" item — silent failure if a day is renumbered. The warning lands in DevTools without breaking the app.

- [ ] **Step 4: Verify**

Hard-reload. Tap the gold "Resources" pill in the nav bar. Scroll the Resources page to the bottom — a new "🐦 Birds to Spot — 0 of 7 spotted" group should appear after the existing groups. Each bird should have a checkbox and the full text (name, blurb, where, fun fact).

Tick 3 boxes. Counter should update live to "3 of 7 spotted". Reload. Counter should still say "3 of 7 spotted" and the same 3 should still be ticked. Untick one. Counter goes to "2 of 7 spotted". Reload again to confirm.

DevTools console: confirm no warnings (the orphan-day warning should be silent because Task 1 mapped all birds to real days).

---

### Task 8: Visual sweep on the David & Paula app

**Files:** none

- [ ] **Step 1: Light mode visual pass**

Hard-reload. Walk through every day card top to bottom. Confirm:
- The chip slot doesn't crowd Marathon Day's existing dense content (chip is collapsed by default — should slot cleanly under the weather bar).
- Tapping a chip doesn't break the day-card expand/collapse behavior.
- Tapping a chip header twice in quick succession doesn't break the chevron rotation.
- The Resources page bird section reads cleanly and the counter is visible in the section header.

- [ ] **Step 2: Dark mode visual pass**

Toggle OS theme to dark. Hard-reload. Confirm:
- Chip background is the dark green variant, not the light cream variant.
- Bird text is readable (not low-contrast white-on-light or dark-on-dark).
- Resources rows look correct.

- [ ] **Step 3: Mobile width visual pass**

DevTools device toolbar → 375px width (iPhone SE). Confirm chip and bird entries don't overflow horizontally. Long names like "Rose-ringed Parakeet" should not break the layout.

If any of these fail, return to Task 5 (CSS) and fix before moving on.

---

### Task 9: Bump David & Paula service worker cache

**Files:**
- Modify: `sw.js` line 2

- [ ] **Step 1: Bump CACHE_NAME**

Change:
```js
const CACHE_NAME = 'london-2026-v10';
```
to:
```js
const CACHE_NAME = 'london-2026-v11';
```

- [ ] **Step 2: Verify**

Hard-reload via DevTools → Application → Service Workers → "Update on reload" enabled. Confirm in Cache Storage that `london-2026-v11` exists and `london-2026-v10` is cleaned up (the activate handler does this automatically).

This is the CLAUDE.md mandatory deployment rule — do not skip even though we're not deploying yet. The bumped cache must be in place when David eventually pushes to GitHub Pages.

---

## Phase 2 — Mom & Dad App (`mom-dad/index.html`)

The mom-dad app is structured differently from the D&P app: it renders one day at a time via `renderDay()` (not all days at once), has data-driven Resources via `renderResources()`, and matches birds by region (`day.weather.location`) rather than day number.

### Task 10: Add the `birds` const to the mom-dad app

**Files:**
- Modify: `mom-dad/index.html` — insert after the `resources` array closes (~line 1170, before the `// ==================== RENDERING ====================` marker)

- [ ] **Step 1: Insert the new const**

Insert immediately after the closing `];` of the `resources` array:

```js
// ---- Birds to Spot — Mom & Dad ----
const birds = [
  // Bath
  {
    id: 'dipper',
    name: 'Dipper',
    emoji: '🐦',
    where: 'River Avon, Bath (especially Pulteney Weir)',
    blurb: "A round little chocolate-and-white bird that walks underwater along fast-flowing river beds. Genuinely.",
    funFact: "It's the UK's only truly aquatic songbird. Scan the rocks at Pulteney Weir and look for one bobbing up and down.",
    regions: ['bath']
  },
  {
    id: 'kingfisher',
    name: 'Common Kingfisher',
    emoji: '💎',
    where: 'River Avon and slow Bath waterways',
    blurb: "A flash of electric blue and orange that's gone before your brain processes it. Worth a slow walk along the river just in case.",
    funFact: "They hunt by hovering, then plunge straight in. The \"common\" in the name is doing a lot of work — sightings still feel like a small miracle.",
    regions: ['bath', 'london']
  },
  // Cotswolds
  {
    id: 'red-kite',
    name: 'Red Kite',
    emoji: '🪁',
    where: 'Cotswolds skies, especially over Blenheim and the A40',
    blurb: "The huge forked-tail raptor wheeling over Cotswold meadows. Once nearly extinct in the UK, now everywhere in the south.",
    funFact: "They were reintroduced from Spain in the 1990s. Drive the back roads near Blenheim and you'll spot a dozen without trying.",
    regions: ['cotswolds']
  },
  {
    id: 'skylark',
    name: 'Skylark',
    emoji: '🎵',
    where: 'Cotswolds farmland, hovering high above the fields',
    blurb: "A small brown bird famous for its wildly elaborate song delivered while hovering 100m up. The soundtrack to an English spring.",
    funFact: "They're so high you usually hear them long before you spot the dot — the song goes on for several minutes without a pause.",
    regions: ['cotswolds']
  },
  // London (mirrors the David & Paula list)
  {
    id: 'tower-raven',
    name: 'Raven',
    emoji: '🐦‍⬛',
    where: 'Tower of London grounds',
    blurb: "London's most famous corvids — six (plus a spare) live at the Tower full-time, with their own Yeoman keeper.",
    funFact: "Legend says if the ravens ever leave, the Tower crumbles and the kingdom falls. Their wings are clipped just in case.",
    regions: ['london']
  },
  {
    id: 'great-white-pelican',
    name: 'Great White Pelican',
    emoji: '🪿',
    where: "St James's Park",
    blurb: "Yes, pelicans, in the middle of London. A gift from the Russian ambassador to Charles II in 1664, and the colony's been there ever since.",
    funFact: "They're fed fish daily at 2:30pm by the park keepers — set a watch.",
    regions: ['london']
  },
  {
    id: 'rose-ringed-parakeet',
    name: 'Rose-ringed Parakeet',
    emoji: '🦜',
    where: 'Kensington Gardens canopy',
    blurb: "London's rowdy green invaders. Listen for the screech before you see them flashing through the canopy.",
    funFact: "The leading origin myth says they escaped from the set of The African Queen in 1951. Probably not true, definitely funny.",
    regions: ['london']
  },
  {
    id: 'mute-swan',
    name: 'Mute Swan',
    emoji: '🦢',
    where: 'The Round Pond, Kensington Gardens',
    blurb: "Big, white, deeply unimpressed by tourists. Every unmarked swan in open water in the UK technically belongs to the King.",
    funFact: "The annual \"Swan Upping\" ceremony on the Thames still rounds them up for a royal headcount, in skiffs.",
    regions: ['london']
  },
  {
    id: 'grey-heron',
    name: 'Grey Heron',
    emoji: '🪶',
    where: 'Thames embankments and South Bank',
    blurb: "Tall, grey, and statue-still in the shallows. London has a healthy resident population that doesn't mind the city at all.",
    funFact: "They commute. Heron pairs nest in Regent's Park then fly into central London for the day's fishing.",
    regions: ['london']
  },
  {
    id: 'peregrine-falcon',
    name: 'Peregrine Falcon',
    emoji: '🦅',
    where: 'Canary Wharf towers',
    blurb: "The fastest animal on the planet (up to 240 mph in a stoop) nests on the skyscrapers near the Thames. Look up.",
    funFact: "London's peregrines are a comeback story — the city now has more breeding pairs than the entire Lake District.",
    regions: ['london']
  }
];
```

- [ ] **Step 2: Verify**

Hard-reload `mom-dad/index.html` locally. Console: `birds.length` → `10`. `birds.filter(b => b.regions.includes('cotswolds')).length` → `2`. `birds.filter(b => b.regions.includes('london')).length` → `7` (kingfisher counts in both Bath and London).

---

### Task 11: Add CSS to the mom-dad app

**Files:**
- Modify: `mom-dad/index.html` — insert in the existing `<style>` block. Place near the existing weather-card styles for layout coherence.

- [ ] **Step 1: Add the same chip + resource-row CSS**

Same CSS as Task 5, but adapt to the mom-dad app's existing CSS variable names. Check what variables this app uses by searching for `var(--` in `mom-dad/index.html`. If the variable names differ from the D&P app, substitute accordingly. If the app uses literal hex colors instead of variables, use the same hex codes used by other elements in that section.

Insert this CSS block (adjust variable names to match this file's conventions if needed):

```css
    /* ---- Birds to Spot ---- */
    .birds-chip {
      margin: 0.5rem 0 0.75rem;
      background: #f1f7ed;
      border: 1px solid #cfe1c2;
      border-radius: 8px;
      overflow: hidden;
    }
    .birds-chip-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.55rem 0.9rem;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 500;
      color: #2d5a3d;
      user-select: none;
      touch-action: manipulation;
    }
    .birds-chip-header .chevron {
      margin-left: auto;
      font-size: 0.7rem;
      transition: transform 0.2s ease;
    }
    .birds-chip.expanded .chevron { transform: rotate(180deg); }
    .birds-chip-body {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.25s ease;
    }
    .birds-chip.expanded .birds-chip-body { max-height: 800px; }
    .bird-entry {
      padding: 0.6rem 0.9rem;
      border-top: 1px solid #dbe9d0;
    }
    .bird-entry-name {
      font-weight: 600;
      font-size: 0.9rem;
      color: #2d5a3d;
      margin-bottom: 0.15rem;
    }
    .bird-entry-blurb {
      font-size: 0.82rem;
      line-height: 1.4;
      margin-bottom: 0.25rem;
    }
    .bird-entry-where {
      font-size: 0.75rem;
      opacity: 0.7;
      font-style: italic;
    }
    .birds-resource-counter {
      font-size: 0.78rem;
      font-weight: 400;
      opacity: 0.9;
      margin-left: auto;
    }
    .bird-resource-row {
      padding: 0.75rem 1.25rem;
      border-bottom: 1px solid rgba(0,0,0,0.08);
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }
    .bird-resource-row:last-child { border-bottom: none; }
    .bird-resource-row input[type="checkbox"] {
      margin-top: 0.2rem;
      width: 20px;
      height: 20px;
      accent-color: #2d5a3d;
      cursor: pointer;
      flex-shrink: 0;
    }
    .bird-resource-row .bird-content { flex: 1; }
    .bird-resource-row.spotted .bird-entry-name {
      text-decoration: line-through;
      opacity: 0.55;
    }
    .bird-fun-fact {
      font-size: 0.75rem;
      opacity: 0.7;
      margin-top: 0.3rem;
      font-style: italic;
    }
```

- [ ] **Step 2: Add dark-mode overrides**

Find the existing `@media (prefers-color-scheme: dark)` block in `mom-dad/index.html`. Add inside:

```css
      .birds-chip { background: #1f2a1e; border-color: #2f4128; }
      .bird-entry { border-top-color: #2f4128; }
      .birds-chip-header, .bird-entry-name { color: #b3d6a8; }
      .bird-resource-row { border-bottom-color: rgba(255,255,255,0.08); }
```

- [ ] **Step 3: Verify**

Hard-reload. Visually unchanged (no element uses the classes yet). No console errors.

---

### Task 12: Render the chip in `renderDay()`

**Files:**
- Modify: `mom-dad/index.html` — `renderDay()` at line 1229

- [ ] **Step 1: Add chip rendering after the weather card**

Find this in `renderDay()` (~line 1259):

```js
  html += `<div class="weather-card">
    <div class="icon">${w.icon}</div>
    <div class="info">
      <div class="temp">${w.temp}</div>
      <div class="desc">${w.desc}</div>
      <div class="rain">${w.rain}</div>
    </div>
  </div>`;
```

Immediately after the closing `</div>` (still inside `renderDay()`), add:

```js
  // Birds chip (region-matched)
  const region = (w.location || '').toLowerCase();
  const dayBirds = birds.filter(b => b.regions.includes(region));
  if (dayBirds.length > 0) {
    html += `<div class="birds-chip" data-region="${region}">
      <div class="birds-chip-header" onclick="toggleBirdsChip('${region}')">
        <span>🐦</span>
        <span>Birds nearby (${dayBirds.length})</span>
        <span class="chevron">▼</span>
      </div>
      <div class="birds-chip-body">
        ${dayBirds.map(b => `
          <div class="bird-entry">
            <div class="bird-entry-name">${b.emoji} ${b.name}</div>
            <div class="bird-entry-blurb">${b.blurb}</div>
            <div class="bird-entry-where">${b.where}</div>
          </div>
        `).join('')}
      </div>
    </div>`;
  }
```

- [ ] **Step 2: Add the toggle handler**

Find a logical home for utility functions in `mom-dad/index.html` — search for `function mapLinkHTML` (~line 1177) and add immediately above it (or below, doesn't matter):

```js
function toggleBirdsChip(region) {
  const chip = document.querySelector(`.birds-chip[data-region="${region}"]`);
  if (chip) chip.classList.toggle('expanded');
}
```

- [ ] **Step 3: Verify**

Hard-reload. Use the date scroller / arrows to navigate through every day:
- Apr 18-20 (Bath days): chip appears with "(2)" — Dipper + Kingfisher
- Apr 21-23 (Cotswolds days): chip appears with "(2)" — Red Kite + Skylark
- Apr 24-30 (London days): chip appears with "(7)" — full London set including Kingfisher

Tap chip → expands. Tap again → collapses. Navigate to a different day and back → state resets (each day re-renders fresh, that's fine for this surface).

---

### Task 13: Add Birds resource group + checklist to mom-dad

**Files:**
- Modify: `mom-dad/index.html` — `renderResources()` at line 1339, plus a new helper function

The mom-dad Resources renderer is data-driven (`resources.map(g => ...)`), but the existing `resources` array shape doesn't support tappable checkboxes. Cleanest fix: append the bird group as a separate render step after `renderResources()` runs, so we don't have to teach the existing renderer about a new item type.

- [ ] **Step 1: Add bird checklist helpers**

Insert this block immediately after `renderResources()` ends (~line 1370 — find the closing `}` of the function):

```js
// ---- Birds to Spot — Resources injection ----
function getBirdsSpotted() {
  try { return JSON.parse(localStorage.getItem('birds-mom-spotted') || '[]'); }
  catch { return []; }
}

function saveBirdsSpotted(spotted) {
  try { localStorage.setItem('birds-mom-spotted', JSON.stringify(spotted)); }
  catch {}
}

function updateBirdCounter() {
  const counterEl = document.querySelector('.birds-resource-counter');
  if (!counterEl) return;
  const spotted = getBirdsSpotted();
  counterEl.textContent = `${spotted.length} of ${birds.length} spotted`;
}

function renderBirdsResources() {
  const container = document.getElementById('resourcesList');
  if (!container) return;
  if (container.querySelector('.bird-resource-row')) return;

  const group = document.createElement('div');
  group.className = 'resource-group';
  group.innerHTML = `
    <div class="resource-group-header">
      <span style="display:flex;align-items:center;gap:0.5rem;width:100%">
        <span>🐦 Birds to Spot</span>
        <span class="birds-resource-counter" style="margin-left:auto">0 of ${birds.length} spotted</span>
      </span>
    </div>
    ${birds.map(b => `
      <div class="bird-resource-row" data-bird-id="${b.id}">
        <input type="checkbox" id="bird-chk-${b.id}">
        <div class="bird-content">
          <div class="bird-entry-name">${b.emoji} ${b.name}</div>
          <div class="bird-entry-blurb">${b.blurb}</div>
          <div class="bird-entry-where">${b.where}</div>
          <div class="bird-fun-fact">${b.funFact}</div>
        </div>
      </div>
    `).join('')}
  `;
  container.appendChild(group);

  const spotted = getBirdsSpotted();
  group.querySelectorAll('.bird-resource-row').forEach(row => {
    const id = row.dataset.birdId;
    const cb = row.querySelector('input[type="checkbox"]');
    if (spotted.includes(id)) {
      cb.checked = true;
      row.classList.add('spotted');
    }
    cb.addEventListener('change', () => {
      const current = getBirdsSpotted();
      if (cb.checked) {
        if (!current.includes(id)) current.push(id);
        row.classList.add('spotted');
      } else {
        const i = current.indexOf(id);
        if (i >= 0) current.splice(i, 1);
        row.classList.remove('spotted');
      }
      saveBirdsSpotted(current);
      updateBirdCounter();
    });
  });
  updateBirdCounter();
}
```

- [ ] **Step 2: Wire it into the resources view switch**

Find this in the bottom of the file (~line 1676):

```js
  else if (view === 'resources') renderResources();
```

Change to:

```js
  else if (view === 'resources') { renderResources(); renderBirdsResources(); }
```

- [ ] **Step 3: Verify**

Hard-reload. Tap the "🚨 Resources" tab. Scroll the Resources page — confirm a "🐦 Birds to Spot — 0 of 10 spotted" group appears at the bottom. Tick 4 birds → counter updates to "4 of 10 spotted". Switch to a different tab and back → ticks persist, counter still shows 4. Reload page → still 4. Untick → counter decrements.

---

### Task 14: Bump mom-dad service worker cache

**Files:**
- Modify: `mom-dad/sw.js` line 1

- [ ] **Step 1: Bump CACHE_NAME**

Change:
```js
const CACHE_NAME = 'mom-dad-london-v2';
```
to:
```js
const CACHE_NAME = 'mom-dad-london-v3';
```

- [ ] **Step 2: Verify**

DevTools → Application → Cache Storage shows `mom-dad-london-v3`. Old `v2` is cleaned up by the activate handler.

---

### Task 15: Visual sweep on the mom-dad app

**Files:** none

- [ ] **Step 1: Walk through every day**

Navigate Apr 18 → Apr 30 using arrows. For each day confirm the chip appears with the right region's birds. Tap to expand on a few days; confirm content reads cleanly.

- [ ] **Step 2: Birthday day (Apr 25) check**

Apr 25 is Mom's birthday with a confetti banner and pink theme. Confirm the bird chip doesn't visually clash with the birthday styling — the green chip should still be readable on top of the birthday-pink page background.

- [ ] **Step 3: Dark mode + mobile width**

Same checks as Task 8 steps 2 and 3, but on the mom-dad app.

If anything looks wrong, return to Task 11 (CSS) and fix.

---

## Phase 3 — Documentation + Commit

### Task 16: Update DEVELOPMENT.md and ARCHITECTURE.md

**Files:**
- Modify: `DEVELOPMENT.md` (append a new dated session entry)
- Modify: `ARCHITECTURE.md` (small addition under "UI Layer" components list)

- [ ] **Step 1: Append session log entry**

At the bottom of `DEVELOPMENT.md`, append:

```markdown
### Session 13 — April 8, 2026
**Birds to Spot — wink feature for both apps**

Both end users (David & Paula and Mom & Dad) are bird-watchers. Added a small location-aware bird-watching companion to both PWAs as a quiet wink: a per-day chip on day cards plus a Resources section with a tappable spotted-checklist and live "X of N spotted" counter.

**David & Paula app (`index.html`):**
- New `birds` const (7 species) sibling to `dayData`. Each bird tagged with `dayNumbers` for day-card matching.
- Birds map to days where the user actually visits the relevant place: Tower → Raven (Day 22), St James's Park → Pelican (Day 23), Kingfisher (Day 25), Marathon route mile 19 → Peregrine (Day 26), Kensington Palace → Parakeet + Mute Swan (Day 27), Thames South Bank → Grey Heron (Day 28).
- New `.birds-chip` rendered in `renderDayCards()` immediately under the weather bar. Collapsed by default, tap to expand.
- New `renderBirdsResources()` and `setupBirdsChecklist()` inject a "🐦 Birds to Spot" group into the existing hardcoded Resources page at init time. localStorage key: `birds-dp-spotted` (JSON array of bird ids).
- Sanity-check warning logged on init if any bird's `dayNumbers` references a missing day (mitigates the spec's silent-failure risk).
- Service worker cache bumped v10 → v11.

**Mom & Dad app (`mom-dad/index.html`):**
- New `birds` const (10 species — adds Bath dipper, Bath/London kingfisher, Cotswolds red kite & skylark on top of the London 7).
- Birds matched to days by `day.weather.location` (already present on every day in `itinerary` — no data-model change needed).
- Chip rendered in `renderDay()` after the weather card. Each day re-renders fresh, so chip state is per-render (acceptable for this surface — the spotted-checklist in Resources is the persistent state).
- New `renderBirdsResources()` injected after `renderResources()` when the Resources view opens. localStorage key: `birds-mom-spotted` (per the cross-app namespacing convention).
- Service worker cache bumped v2 → v3.

**Why a wink and not a dominant feature:** The chip is collapsed by default and the Resources entry sits below the existing groups, so the feature stays out of the way for the trip's primary navigation needs but pays off the more attention you give it. Both apps share the London bird list — any future London bird edits must be applied to both files (per CLAUDE.md cross-app convention).

**Offline:** Pure data + text + emoji. Zero new cached assets. Works fully offline by construction.
```

- [ ] **Step 2: Update ARCHITECTURE.md**

Find the "UI Layer (`index.html` + inline CSS/JS)" section in `ARCHITECTURE.md` (~line 26). In the bulleted component list, add a new bullet (in a sensible place near the exhibit checklists):

```markdown
- **Birds to Spot** — quiet wink for the bird-loving users: a `🐦 Birds nearby` chip on each day card (collapsed by default, location-matched to that day's stops/region) and a "Birds to Spot" group on the Resources page with a tappable spotted-checklist and live "X of N spotted" counter. localStorage keys: `birds-dp-spotted` (David & Paula app) and `birds-mom-spotted` (Mom & Dad app).
```

- [ ] **Step 3: Verify**

Re-read both files. Confirm the additions read naturally and don't contradict anything else in the doc.

---

### Task 17: Final cross-check

**Files:** none — verification only

- [ ] **Step 1: Confirm both cache bumps are in place**

```bash
grep "CACHE_NAME" sw.js mom-dad/sw.js
```

Expected:
```
sw.js:const CACHE_NAME = 'london-2026-v11';
mom-dad/sw.js:const CACHE_NAME = 'mom-dad-london-v3';
```

- [ ] **Step 2: Confirm no orphan birds**

In both apps' DevTools console, reload and look for any `[birds]` warnings. None expected.

- [ ] **Step 3: Confirm the counter format is consistent across both apps**

Open Resources in both apps. Both should show: `🐦 Birds to Spot — N of N spotted` style header (the canonical format from the spec).

- [ ] **Step 4: Confirm cross-app London bird list parity**

The 7 London birds in the D&P app and the 7 London birds in the mom-dad app must have matching `id`, `name`, `emoji`, and roughly matching copy. Two **deliberate** divergences are allowed and should NOT be "fixed":

1. **Pelican fun-fact** — D&P version says "...exactly when this day's itinerary walks through" (a wink to the Day 23 St James's Park stop at 2pm). Mom & Dad version drops this wink because the parents' app structures days differently.
2. **Kingfisher `where` and `blurb`** — D&P says "St James's Park lake edges" / lake-themed. Mom & Dad says "River Avon and slow Bath waterways" / river-themed. This is deliberate because the mom-dad kingfisher covers BOTH the Bath and London regions (`regions: ['bath', 'london']`), so its copy is written more generically toward "rivers and lakes."

Everything else (id, name, emoji, fun fact text minus the day-specific wink, structural shape) should match. Cross-check by eye.

- [ ] **Step 5: Run through the spec's testing checklist one final time**

Reference: `docs/superpowers/specs/2026-04-08-birds-to-spot-design.md` → "Testing checklist" section. Tick each item.

---

### Task 18: Single bundled commit

Per the user's preference: one commit at the end, not per task. The user said "I'll be good to commit when we're done" — surface the diff to the user and ask explicitly before running `git commit`.

**Files:** all changes from Tasks 4–16

- [ ] **Step 1: Show the user the diff summary**

Run:
```bash
git status
git diff --stat
```

Surface output. Confirm with the user that they're ready to commit before proceeding.

- [ ] **Step 2: Stage the right files**

```bash
git add index.html sw.js mom-dad/index.html mom-dad/sw.js DEVELOPMENT.md ARCHITECTURE.md docs/superpowers/specs/2026-04-08-birds-to-spot-design.md docs/superpowers/plans/2026-04-08-birds-to-spot.md
```

(Includes the spec and plan docs, which weren't committed earlier per the user's preference.)

- [ ] **Step 3: Commit**

Use a HEREDOC for clean formatting:

```bash
git commit -m "$(cat <<'EOF'
feat: add Birds to Spot wink feature to both London trip apps

A small location-aware bird-watching companion as a wink to the
bird-loving end users. Each day card gets a collapsed "🐦 Birds
nearby" chip with locally relevant species; the Resources page
gains a tappable spotted-checklist with a live "X of N spotted"
counter. Pure data + text + emoji — zero new cached assets,
fully offline.

David & Paula app: 7 London birds, matched to days by stop
(Tower → Raven, St James's → Pelican, Marathon route → Peregrine,
Kensington Gardens → Parakeet + Swan, etc.). SW cache v10 → v11.

Mom & Dad app: 10 birds (adds Bath dipper, Cotswolds red kite +
skylark to the London set), matched by region via the existing
day.weather.location field. SW cache v2 → v3.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 4: Verify**

```bash
git log -1
git status
```

Expected: one new commit, working tree clean.

**Note:** Do NOT push. There's no remote configured on this local repo and the user hasn't asked to deploy. If/when David is ready to push to GitHub Pages, that's a separate step that follows the existing deployment pattern in `DEVELOPMENT.md` (clone the GitHub repo, copy updated files in, push).

---

## Done

The feature is implemented, both apps tested, both caches bumped, docs updated, and the change is on a single commit ready for David to push when he's ready to deploy.
