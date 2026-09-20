# Daily Burn-Down & Technician Allocator

Offline-first, tablet-first PWA for mapping daily tasks to technicians and
tracking planned vs. burned hours during a morning toolbox talk.

Primary target: **iPhone 8 Plus, iOS 16.7 Safari (WebKit)**. Also tuned for
modern iPads in landscape.

## Why this isn't a single Claude Artifact

A true installable PWA on iOS needs `manifest.json` and `service-worker.js`
served as real, separate files at fixed root paths (`/manifest.json`,
`/service-worker.js`), which is exactly how `Add to Home Screen` and the
offline shell are wired up here. A single self-contained HTML page can't
serve those as independent resources, so this ships as a real Vite project
you build and deploy, not a one-file preview.

## Project layout (maps to the 5 execution steps)

| Step | File |
|---|---|
| 1. State store & schema | `src/store/useBoardStore.js` |
| 2. Drag-and-drop context | `src/components/Board.jsx` |
| 3. Technician swimlanes + capacity bar | `src/components/TechnicianLane.jsx` |
| 4. Task card (hour steppers) | `src/components/TaskCard.jsx` |
| 5. Dashboard shell / site summary | `src/App.jsx`, `src/components/SiteHeader.jsx` |

Supporting files: `src/components/UnassignedPool.jsx` (the unassigned task
column, same drop-target pattern as a technician lane), `src/hooks/useOnlineStatus.js`.

PWA files: `index.html` (iOS meta tags), `public/manifest.json`,
`public/service-worker.js`, `public/icons/*`.

## Setup

```bash
npm install
npm run dev        # local dev server
npm run build       # production build -> dist/
npm run preview     # serve the production build locally
```

## Deploying so the PWA actually installs

- **Serve over HTTPS** (or `localhost` for testing) — Safari refuses to
  register a service worker or offer "Add to Home Screen" as a real PWA
  otherwise.
- Deploy the contents of `dist/` as-is; `manifest.json`, `service-worker.js`,
  and `icons/` are copied from `public/` to the output root automatically by
  Vite.
- On iPhone/iPad: open the site in **Safari** (not Chrome — iOS only lets
  Safari install home-screen web apps), tap Share → **Add to Home Screen**.
  The app then launches full-screen, using `apple-touch-icon.png` and the
  meta tags in `index.html`.

## Offline behavior

- **App shell**: `service-worker.js` precaches `index.html`, the manifest,
  and icons on install, and cache-first-serves every other same-origin GET
  (the hashed JS/CSS bundles) after their first successful fetch — so a
  second launch works with zero network, including a cold "dead zone" start.
- **Board data**: Zustand's `persist` middleware writes to IndexedDB via
  `idb-keyval` on every change. This is async (won't jank the UI on older
  hardware) and survives accidental tab closure.
- **iOS eviction safety net**: iOS can clear IndexedDB after ~7 days of the
  PWA being unused. Use **Board options → Export board (.json)** before a
  long weekend or device handoff, and **Import board file** to restore.
  "Factory reset" and "Clear today's assignments" are separate, explicit,
  confirmation-gated actions so they can't be hit by accident mid-briefing.

## Performance notes for 2017-era hardware

- No web fonts are loaded — the type stack is the OS system font, so there's
  no network font request and no flash-of-unstyled-text.
- No charting library; the burn-down visual is a CSS-driven progress bar
  (cheap to paint/animate on an A10 GPU vs. an SVG chart library).
- `vite.config.js` targets `es2018`, a safe baseline for iOS 16.7's WebKit
  without shipping legacy transpilation weight for engines that don't need it.
- Drag-and-drop uses `@hello-pangea/dnd`, which is built for touch and
  pointer events (not the HTML5 native drag API, which iOS Safari does not
  support well on touchscreens).

## Known trade-offs / next steps

- Single site/day model — no multi-day history or per-technician login yet.
- Export/import is manual JSON, by design (no backend, no sync service —
  offline-first means no dependency on connectivity to function at all).
- Add a "days" archive (e.g. one IndexedDB key per date) if you need to look
  back at previous burn-downs.
