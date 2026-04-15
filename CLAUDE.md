# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cross-browser WebExtension (Manifest V3) called "in2md" that provides tools for working with LinkedIn in the browser. Features include post content extraction, user profile extraction, comment export, and feed autorefresh blocking. TypeScript codebase bundled with esbuild. Ships to both **Firefox (AMO)** and **Chrome Web Store** from a single source tree.

## Build & Development

```bash
make build          # Build both Firefox and Chrome packages
make build-firefox  # Firefox only → dist/in2md-<version>.zip (XPI)
make build-chrome   # Chrome only  → dist/in2md-<version>-chrome.zip
make start          # Build Firefox + launch Firefox with extension
make typecheck      # tsc --noEmit
make lint           # ESLint + web-ext lint
make test           # Vitest unit tests
make test-e2e       # Playwright e2e tests
make test-auth      # Authenticate Playwright with LinkedIn (once)
make iterate        # Bump patch version + clean + build
make clean          # Remove build/ and dist/
```

Build pipeline: `src/*.ts` → esbuild (`scripts/build.mjs`) → `build/<target>/` → web-ext (Firefox) or `zip` (Chrome) → `dist/*.zip`

Version is tracked in `package.json` and `src/manifest.base.json`. Use `make bump-patch|bump-minor|bump-major` (wrappers around `scripts/bump-version.sh`) to update both atomically.

### Manifest layout (dual-target)

- `src/manifest.base.json` — shared manifest fields (version, permissions, etc.)
- `src/manifest.firefox.json` — Firefox-only overlay (e.g. `browser_specific_settings.gecko.id`)
- `src/manifest.chrome.json` — Chrome-only overlay
- `scripts/build.mjs` merges base + the per-target overlay at build time, selected by `TARGET=firefox|chrome`

## Release (CI/CD)

Releases are driven by `.github/workflows/release.yml`, triggered via GitHub Actions → **Run workflow**:

- Inputs: `bump` (patch/minor/major/none), `channel` (AMO listed/unlisted), `chrome_publish` (true/false), `chrome_target` (default/trustedTesters)
- Workflow runs `scripts/bump-version.sh`, builds both targets, packages source for AMO review, calls `web-ext sign` to submit to AMO, and uses `chrome-webstore-upload-cli` to upload + auto-publish to the Chrome Web Store
- Commits the version bump, tags `vX.Y.Z`, pushes, and creates a GitHub Release with all artefacts attached

Required GitHub secrets: `AMO_JWT_ISSUER`, `AMO_JWT_SECRET`, `CWS_EXTENSION_ID`, `CWS_CLIENT_ID`, `CWS_CLIENT_SECRET`, `CWS_REFRESH_TOKEN`.

## Architecture

TypeScript source in `src/`, bundled by esbuild (`scripts/build.mjs`):

- **`src/manifest.base.json`** + per-target overlays — see above
- **`src/config.ts`** — `CONFIG` object with scraping parameters, DOM selectors, URL patterns
- **`src/logger.ts`** — Structured logger shared across content scripts
- **`src/scraper/`** — Content script for the search-results scraper (entry: `scraper/index.ts`)
- **`src/extraction/`** — Content script for Get User, Get Post, Get Comments button injection and data extraction (entry: `extraction/index.ts`). Handles both feed (obfuscated DOM) and single-post page (classic DOM) layouts
- **`src/lib/`** — Shared utilities
- **`src/block-autorefresh.ts`** — Page-world script that wraps `fetch` to block LinkedIn's autorefresh API calls
- **`src/inject-autorefresh-blocker.ts`** — Content script that injects `block-autorefresh.js` into the page world via a `<script>` tag
- **`src/background.ts`** — Background script (ES module, MV3). Currently a placeholder
- **`src/popup.ts`** + **`src/popup.html`** — Toolbar popup showing extension version
- **`src/types.ts`** — Shared TypeScript interfaces

## Key Considerations

- **Manifest V3** — Uses `"action"` (not `"browser_action"`), ES module background, object-format `web_accessible_resources`
- **`chrome.*` APIs** — Firefox supports the `chrome` namespace in MV3. Do not switch to `browser.*` — keeps the Chrome build working without shims
- **Per-target manifest differences** — Firefox requires `browser_specific_settings.gecko.id` for AMO signing; Chrome rejects unknown fields. Keep target-specific fields in the overlay files, never in `manifest.base.json`
- **DOM selectors are fragile** — LinkedIn uses obfuscated class names in the feed that change across deploys. Selectors use `aria-label`, `data-testid`, `href` patterns, and structural relationships instead. The `examples/` folder has reference HTML snapshots
- **Two DOM styles** — Feed pages use obfuscated classes; individual post pages (`/posts/...`) use classic `update-components-*` classes. Both paths are handled in `extraction/`
- **Curly quotes** — LinkedIn uses U+2019 (RIGHT SINGLE QUOTATION MARK) in aria-labels like "View more options for Name\u2019s comment.", not straight apostrophes
- **Makefile quirks** — `SHELL := $(shell command -v bash)` for portability; do NOT `-include` shell-syntax files (e.g. `~/.bash_secrets_exports`) as make parses `$PATH` as `$P` + `ATH`, corrupting `PATH`

## Testing

Unit tests use Vitest with happy-dom (`tests/unit/`). E2E tests use Playwright against a live LinkedIn session (`tests/e2e/`), using a saved session (`tests/.auth/linkedin.json`, gitignored). Extension scripts are injected via `addInitScript` with a `chrome.runtime` stub since Playwright's Firefox can't load unsigned extensions natively.

Run `make test-auth` once to authenticate, then `make test` (unit) or `make test-e2e` (e2e).
