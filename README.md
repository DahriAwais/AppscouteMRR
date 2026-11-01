# AppScoute — Play Store Intelligence (browser extension)

A Manifest V3 extension for **Chrome and Edge** that turns any Google Play app
page into a research dashboard: estimated revenue and downloads, growth, ASO,
reviews, competitors, a watchlist and side-by-side comparison.

The sidebar is injected into the page inside its own Shadow DOM — it is not the
Chrome side panel, it does not restyle the Play Store, and it disappears
completely when you uninstall the extension.

This folder is self-contained. Nothing outside `extension/` is part of the build.

---

## Quick start

```powershell
cd extension
npm install          # once
npm run build        # writes dist/
```

Then load it:

- **Chrome** — `chrome://extensions` → enable *Developer mode* → *Load unpacked* → pick `extension/dist`
- **Edge** — `edge://extensions` → *Load unpacked* → pick `extension/dist`

Open any `https://play.google.com/store/apps/details?id=…` page; the rail appears
on the right edge. Click it to expand, or use the toolbar popup.

**Toolbar button.** Clicking the AppScoute icon analyses the app in the current
tab and opens the full sidebar, even if that tab was already open before the
extension was installed or reloaded — the background worker injects
`content.js` on demand instead of asking you to refresh. Outside an app listing
the click opens a compact window with the watchlist instead of hijacking the tab.

Other scripts:

| Command | What it does |
| --- | --- |
| `npm run dev` | rebuilds the four bundles on change (reload the extension in the browser afterwards) |
| `npm run typecheck` | `tsc --noEmit` over `src` and the Vite configs |
| `npm test` | estimator regression tests (`tsx --test`) |
| `npm run zip` | packages `dist/` into `release/appscoute-extension-1.0.0.zip` for the stores |

---

## Mellowtel

The extension ships Mellowtel's browser SDK (see `src/background/index.ts` and
`src/mellowtel/content.ts`) using the integration id **`intgr-i0jY4yD9V9`**.

- The id is baked in at build time from `vite.shared.ts`. To ship under a
  different account: `MELLOWTEL_INTEGRATION_ID=intgr-… npm run build`.
- **It is off by default.** The user opts in from *Settings → Mellowtel* in the
  sidebar (or the options page). `optIn()` / `optOut()` call the SDK directly and
  the current state is read back with `getOptInStatus()`.
- The service worker calls `initBackground()`; the separate `<all_urls>` content
  script calls `initContentScript()`, which is Mellowtel's documented browser
  setup. Both are no-ops while the user stays opted out.
- `pdfjs-dist` is stubbed at build time (`stubPdfjs()`), because the SDK only
  imports it to read PDFs — a feature this extension does not use — and a lazily
  imported dependency would split the service worker into extra chunks.

If the SDK fails to load, the sidebar keeps working and Settings shows the error
instead of hiding it.

---

## What is in `dist/`

| File | Purpose |
| --- | --- |
| `manifest.json` | MV3 manifest, copied from the repo root of this folder |
| `background.js` | service worker: Play parsing, caching, storage, Mellowtel |
| `content.js` | Shadow-DOM sidebar + search-result cards (classic IIFE) |
| `mellowtel-content.js` | Mellowtel content script on `<all_urls>` (classic IIFE) |
| `popup.html` + `assets/*` | toolbar popup |
| `options.html` + `assets/*` | full-page settings |
| `icons/icon-{16,32,48,128}.png` | generated at build time, no image dependencies |

MV3 needs three different module shapes in one package, so the build runs Vite
four times (`vite.config.{background,content,mellowtel,pages}.ts`) into the same
`dist/` folder, then verifies that every injected script still parses as a
classic script and that the Mellowtel id survived bundling.

---

## Architecture

```
src/
  background/     service worker: fetch Play HTML, parse, cache, message API
  content/        page orchestration, Shadow-DOM mount, search-result cards, CSS
  sidebar/        React UI: rail, header, 12 modules, charts, range picker
  popup/          toolbar popup
  options/        options page
  mellowtel/      SDK content-script bridge
  lib/            Play parser, estimator wrapper, storage, messaging, formatting
```

- **Shared estimator.** `packages/core` (the desktop and mobile apps) is imported
  directly through the `@core` alias, so MRR/ARR, download and confidence rules
  cannot drift between the three clients.
- **One request per app.** The service worker dedupes in-flight requests, spaces
  them 700 ms apart and caches parsed records for the user's cache window
  (15 min by default). The sidebar, popup, search cards and compare view all go
  through the same `chrome.runtime` message API.
- **No duplicate injection.** The content script polls the URL (Play navigates
  with the History API) and mounts exactly one sidebar per package id; leaving the
  details page unmounts it and removes the observer.

## Data honesty

Every number in the UI is labelled by basis — *Observed*, *Modeled*, *Illustrative
audience* or *Custom assumptions* — and the sidebar never invents data:

- no fake country splits (Geography reports **unavailable** and says why),
- no invented keyword ranks or search volume,
- no population-weighted "estimates" presented as measurements,
- ARR is always described as annualized modeled MRR × 12,
- apps without a public install count are marked illustrative with *unavailable*
  confidence instead of showing a confident dollar figure,
- a listing that shows neither ads nor purchases gets the shared blended fallback
  rather than `$0/mo` (the same rule as the desktop app).

## Permissions

| Permission | Why |
| --- | --- |
| `storage` | settings, watchlist, cache, daily history |
| `scripting` | inject the sidebar into a tab that was open before install/reload |
| `activeTab` | lets that injection work even when Chrome withholds broad host access until the icon is clicked |
| `host_permissions: <all_urls>` | read `play.google.com` app pages, plus Mellowtel's required content-script scope |
| `declarativeNetRequest` | required by Mellowtel's SDK |
| `web_accessible_resources: *` | required by Mellowtel for its optional custom configuration files |

No remote code, no analytics endpoint, no keys in the bundle beyond the Mellowtel
integration id, which is a public app identifier.

## Deliberate deviations from the PRD

- **Charts and styling are hand-written** (inline SVG + CSS custom properties in
  the shadow root) instead of Tailwind/Recharts. A content script has to bundle
  everything it uses, and the shadow root should not depend on page CSS.
- **Country data, keyword ranks, search volume and the AI review summary are not
  implemented as mock data.** The PRD's own integrity rules (§9.6, §11, §20)
  require them to be real or absent; they are absent, and the modules explain what
  source would be needed.
- **Play layout is left untouched.** The sidebar overlays the page rather than
  pushing it aside, so restoring the store UI is just removing the host element.

## Known limits

- The Play Store markup is parsed from HTML; a major redesign can break parsing.
  Failures surface as an error card with a retry button, never as made-up numbers.
- History starts empty, so trend charts fill up as the user visits apps; a single
  snapshot is shown as a point, not a trend.
- Free plan watchlist is capped at 5 apps (configurable in Settings → Account).
  There is no billing backend; Pro is a local switch for previewing the plan UI.
