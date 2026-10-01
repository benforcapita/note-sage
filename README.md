# NoteSage

A private, offline-first notebook built around small chat-style thoughts. Capture an idea, add another later, and keep a conversation with yourself organized by note and tag.

## What works

- Create, rename, search, and delete notes
- Add and edit thoughts; confirm before removing a thought or a note
- Add/remove tags; search titles, tags, and thought text
- Immediate browser persistence, including unsent drafts, without waiting for autosave
- Import/export a complete workspace JSON backup, including dates, tags, drafts, and local-helper history
- Validated imports, replacement confirmation, corrupt-data recovery, visible storage failures, and cross-tab overwrite protection
- Download-based export in browsers without the File System Access API; save-picker cancellation is harmless
- Light/dark themes, mobile drawers, keyboard controls, and Hebrew/Arabic text direction
- Production service-worker caching for offline reload after an initial online visit
- A fully local helper for exact keyword search, counts, recently edited notes, and overviews with excerpts

The helper is **not an AI model**. It makes no network requests, invents no answers, and requires no API key or paid service.

## Run locally

Use Node 24 LTS and npm.

```sh
npm ci
npm run dev
```

For the production app, including its service worker:

```sh
npm run build
npm run preview -- --host 127.0.0.1
```

Serve the app over HTTPS in production (localhost is supported for development). The development server intentionally does not register a service worker, avoiding stale development assets. Installation is optional; browser support and install menus vary.

## Checks

```sh
npm run check       # TypeScript (including tests), lint, unit/UI tests, production build
npm run test:e2e    # Real Chromium product-flow tests against the production build
```

Install Playwright's official Chromium before running the browser suite:

```sh
npx playwright install chromium
npm run test:e2e
```

On Linux CI, use `npx playwright install --with-deps chromium`. To use an existing Chromium executable, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to its absolute path. The browser tests cover rapid switching, edits/deletes, drafts, search/tags, cancellation, repeated/invalid imports, export fallback, corrupt startup data, mobile/RTL/theme behavior, and actual offline reload. The GitHub workflow runs the complete check and browser suites.

Keyboard: Enter adds a thought; Shift+Enter makes a new line. Ctrl/Cmd+N creates a note; Ctrl/Cmd+K focuses search. Escape closes a drawer or dialog. While editing a thought, Ctrl/Cmd+Enter finishes editing. Thought edits save as you type.

## Keeping your notes safe

Notes live in this browser's local storage, on this device. They are not automatically synced or encrypted by NoteSage. Clearing site data, removing a browser profile, or using an ephemeral/private session can remove them. **Export backups regularly**, especially before changing devices or clearing browsing data.

Export creates a manual JSON snapshot. Opening or importing a file does not establish a live link to it. Your export file is never automatically updated.

Starting or importing a workspace replaces the current workspace on this device, after confirmation. Export first if you want to return to it. Invalid imports never replace the current workspace. If saved data cannot be read, NoteSage preserves the raw original for recovery and prevents accidental overwrites. If storage is full or unavailable, work remains in memory, a persistent warning appears, and reload/update actions require a discard confirmation. Export before leaving the tab.

Only one tab should edit a workspace at a time. A second tab detects a newer write and refuses to overwrite it. Export any changes in the older tab, then reload it.

## Workspace format

Existing version `1.0.0` files remain supported. Exports use `1.1.0` and include `id`, `name`, `notes`, `chatMessages`, `version`, and `lastUpdated`. Dates are ISO strings in JSON and Date objects in the app. Older unnamed browser workspaces and the original `notes` storage key migrate without a write during startup.

Import limits: 10 MB UTF-8 JSON, 5,000 notes, 100,000 thoughts per note, 100,000 helper messages, 100 tags per note, 500 characters per title, 100 characters per tag/name, and 1,000,000 characters per thought/draft/helper message. Browser storage capacity is often lower than the file limit; storage failures are reported, never disguised as successful saves. Normalized exports are compact and stay within the importer limits.

## Architecture

React + TypeScript + Vite. A single synchronous WorkspaceStore hydrates before rendering and owns persistence. Parser and file-export tools are separately tested. Vite PWA generates the only service worker and precaches bundled app assets. Fonts use device defaults and there are no external font, analytics, model, or backend requests.
