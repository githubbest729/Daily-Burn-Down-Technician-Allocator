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

**The most common mistake:** GitHub Pages' "Deploy from branch" setting
serves whatever files are in that branch *as-is* — it does not run
`npm run build`. This app's source is JSX (`src/main.jsx` etc.), which
browsers cannot execute directly, so uploading the raw source repo and
pointing Pages at it results in a blank page and cascading 404s for
`manifest.json`, `service-worker.js`, and the icons.

### Recommended: GitHub Actions (build happens automatically)

This repo includes `.github/workflows/deploy.yml`, which builds the app with
Vite and publishes `dist/` to GitHub Pages on every push to `main`.

1. Push this repo to GitHub.
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **GitHub Actions** (not
   "Deploy from branch").
4. Push to `main` (or run the workflow manually from the **Actions** tab).
   The first run may take a minute; your site will be live at
   `https://<username>.github.io/<repo-name>/`.

### Manual alternative

```bash
npm install
npm run build          # produces dist/
```

Deploy the **contents of `dist/`** (not the repo source) — e.g. push them to
a `gh-pages` branch — and point "Deploy from branch" at that branch.

### Why paths are relative, not `/absolute`

`vite.config.js` sets `base: './'`, `index.html` uses Vite's `%BASE_URL%`
token for the manifest/icon links, `manifest.json`'s `start_url`/`scope`/
icon `src` values are relative (`.`, `icons/icon-192.png`), and
`service-worker.js` resolves every cached URL against
`self.registration.scope` rather than a hardcoded `/`. Together this means
the built app works unmodified whether it's hosted at a domain root
(`example.com/`) or a GitHub Pages project subpath
(`username.github.io/repo-name/`) — no repo-name hardcoding required.

### Installing on iPhone/iPad

Open the deployed URL in **Safari** (not Chrome — iOS only lets Safari
install home-screen web apps), tap Share → **Add to Home Screen**. The app
then launches full-screen, using `apple-touch-icon.png` and the meta tags in
`index.html`.

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
