# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Firefox extension (Manifest V3) called "in2md" that provides tools for working with LinkedIn in the browser. Features include post content extraction, user profile extraction, comment export, and feed autorefresh blocking. TypeScript codebase bundled with esbuild.

## Build & Development

```bash
make build          # TypeScript → esbuild → web-ext zip
make start          # Build + launch Firefox with extension
make typecheck      # tsc --noEmit
make lint           # ESLint + web-ext lint
make test           # Playwright e2e tests
make test-auth      # Authenticate Playwright with LinkedIn
make iterate        # Bump patch version + clean + build
```

Build pipeline: `src/*.ts` → esbuild → `build/` → web-ext → `dist/*.zip`

Version is tracked in both `package.json` and `src/manifest.json`. Use `make bump-patch|bump-minor|bump-major` to update both.

## Architecture

TypeScript source in `src/`, bundled by esbuild (`scripts/build.mjs`):

- **`src/config.ts`** — `CONFIG` object with scraping parameters, DOM selectors, URL patterns
- **`src/logger.ts`** — Structured logger shared across content scripts
- **`src/content.ts`** — Content script for the original search results scraper
- **`src/extract.ts`** — Content script for Get User, Get Post, Get Coments button injection and data extraction. Handles both feed (obfuscated DOM) and single-post page (classic DOM) layouts
- **`src/block-autorefresh.ts`** — Page-world script that wraps `fetch` to block LinkedIn's autorefresh API calls
- **`src/inject-autorefresh-blocker.ts`** — Content script that injects `block-autorefresh.js` into the page world via a `<script>` tag
- **`src/background.ts`** — Background script (ES module, MV3). Currently a placeholder
- **`src/popup.ts`** + **`src/popup.html`** — Toolbar popup showing extension version
- **`src/types.ts`** — Shared TypeScript interfaces

## Key Considerations

- **Manifest V3** — Uses `"action"` (not `"browser_action"`), ES module background, object-format `web_accessible_resources`
- **`chrome.*` APIs** — Firefox supports the `chrome` namespace in MV3. Do not switch to `browser.*`
- **DOM selectors are fragile** — LinkedIn uses obfuscated class names in the feed that change across deploys. Selectors use `aria-label`, `data-testid`, `href` patterns, and structural relationships instead. The `examples/` folder has reference HTML snapshots
- **Two DOM styles** — Feed pages use obfuscated classes; individual post pages (`/posts/...`) use classic `update-components-*` classes. Both paths are handled in `extract.ts`
- **Curly quotes** — LinkedIn uses U+2019 (RIGHT SINGLE QUOTATION MARK) in aria-labels like "View more options for Name\u2019s comment.", not straight apostrophes

## Testing

Playwright e2e tests in `tests/e2e/`. Uses a saved LinkedIn session (`tests/.auth/linkedin.json`, gitignored). Extension scripts are injected via `addInitScript` with a `chrome.runtime` stub since Playwright's Firefox can't load unsigned extensions natively.

Run `make test-auth` once to authenticate, then `make test` for tests.
