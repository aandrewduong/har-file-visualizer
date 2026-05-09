# HAR File Visualizer

A static, browser-only visualizer for [HTTP Archive (.har)](http://www.softwareishard.com/blog/har-12-spec/) files exported from your browser's DevTools. Drop a HAR file in and get a request list, a timing waterfall, summary stats, and per-request details — all parsed locally, nothing uploaded.

**Live site:** <https://aandrewduong.github.io/har-file-visualizer/>

## Features

- Drag-and-drop or pick a `.har` file
- One-click bundled examples to try the app without your own HAR
- Summary stats: total requests, transferred / resource bytes, wall-clock duration, status-code breakdown, by-type counts
- Filterable request list (search, page, method, type, status bucket, hide cached)
- Sortable columns
- Synchronized timing waterfall with per-phase coloring (blocked / dns / connect / ssl / send / wait / receive)
- Detail panel with tabs: Headers, Query, Cookies, Payload, Response body, Timing breakdown
- Resizable list/waterfall and detail panel (sizes persist across reloads)
- All processing is client-side — your HAR never leaves the browser

## Tech

Vite + React 19 + TypeScript (strict) + Tailwind v4. No backend.

## Local development

```bash
npm install
npm run dev
```

Then open the dev server URL printed in the terminal.

## Build

```bash
npm run build
npm run preview
```

The production bundle lands in `dist/`.

## Deploy to GitHub Pages

The repo ships with a workflow at `.github/workflows/deploy.yml` that builds and publishes to GitHub Pages on every push to `main`.

To enable it on your fork:

1. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
2. Push to `main`. The workflow runs `npm ci && npm run build` with `VITE_BASE=/<repo>/` so asset URLs resolve under the project page.
3. The site appears at `https://<your-user>.github.io/<repo>/`.

If you fork under a different repo name, no config change is needed — `VITE_BASE` is derived from `github.event.repository.name`.

## Project layout

```
public/examples/         # bundled example HAR files (served as static assets)
scripts/gen-examples.mjs # regenerates the example HARs (npm run gen-examples)
src/
  main.tsx               # entry
  App.tsx                # composition root
  index.css              # Tailwind + theme tokens
  types/har.ts           # HAR 1.2 spec types + normalized shape
  hooks/useDragX.ts      # drag-resize hook
  lib/
    har-parser.ts        # parse HAR text → ParsedHar
    filter.ts            # FilterState / SortState helpers
    format.ts            # bytes / ms / time formatters
    stats.ts             # summary stats
    http.ts              # HTTP status thresholds + bucketing
    storage.ts           # localStorage helpers
    layout.ts            # layout / resize constants
    copy.ts              # UI strings
    examples.ts          # bundled-examples manifest
  components/
    FileDropzone.tsx     # landing screen, drag/drop, examples
    Summary.tsx          # top stats strip
    FilterBar.tsx        # filter toolbar
    RequestList.tsx      # sortable request grid
    Waterfall.tsx        # timing waterfall chart
    RequestDetail.tsx    # right-side tabbed detail panel
    Splitter.tsx         # resizable splitter handle
tests/
  smoke.spec.ts          # Playwright smoke tests (npm test)
```

## Tests

```bash
npm test
```

Drives Chromium via Playwright through the upload, filter, drag-resize, and example-loading flows. Configured in `playwright.config.ts`.

## License

MIT
