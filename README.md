# in2md

A cross-browser WebExtension (Manifest V3) that adds productivity tools to LinkedIn -- extract user profiles, posts, and comments as Markdown, and block the feed autorefresh that loses your place. Available for **Firefox** and **Chrome**.

## Features

- **Get User** -- Copy or save LinkedIn profile details as Markdown
- **Get Post** -- Extract post content and author metadata to clipboard or file
- **Get Comments** -- Export comment threads as structured Markdown
- **Block Autorefresh** -- Prevents LinkedIn from refreshing the feed when you switch tabs

See [docs/overview.md](docs/overview.md) for detailed feature documentation with screenshots.

## Building from Source

### Prerequisites

- Node.js >= 22 (tested with 22.22.0)
- pnpm >= 10 (tested with 10.14.0)
- Any OS (tested on macOS and Ubuntu 24.04)

### Steps

```bash
pnpm install
pnpm run build        # Builds both Firefox and Chrome packages
```

Or via `make`:

```bash
make build            # Both targets
make build-firefox    # Firefox only  → dist/in2md-<version>.zip
make build-chrome     # Chrome only   → dist/in2md-<version>-chrome.zip
```

Build pipeline: `src/*.ts` → esbuild → `build/<target>/` → web-ext (Firefox) or `zip` (Chrome) → `dist/`.

Manifests are composed at build time from `src/manifest.base.json` plus a per-target overlay (`manifest.firefox.json` / `manifest.chrome.json`), so browser-specific fields stay isolated.

The build is deterministic — running the above commands on the same source produces identical output.

## Development

```bash
make typecheck    # tsc --noEmit
make lint         # ESLint + web-ext lint
make test         # Vitest unit tests
make test-e2e     # Playwright e2e tests
make start        # Build + launch Firefox with the extension loaded
make iterate      # Bump patch version + clean + build
make clean        # Remove build/ and dist/
```

### Testing

Unit tests use Vitest with happy-dom. E2E tests use Playwright against a live LinkedIn session.

```bash
pnpm run test:unit          # Run unit tests
pnpm run test:unit:watch    # Watch mode
make test-auth              # Authenticate Playwright with LinkedIn (run once)
pnpm run test:e2e           # Run e2e tests
```

## Releasing

Releases are automated via GitHub Actions (`.github/workflows/release.yml`):

1. Go to **Actions → Release Firefox extension to AMO → Run workflow**
2. Choose `bump` (patch/minor/major/none), AMO `channel` (listed/unlisted), and whether to publish to the Chrome Web Store
3. The workflow bumps the version, builds both targets, packages source for AMO review, submits to AMO via `web-ext sign`, uploads + auto-publishes to Chrome Web Store via `chrome-webstore-upload-cli`, then tags the release and attaches artefacts to a GitHub Release

Required repository secrets:

| Secret | Purpose |
|---|---|
| `AMO_JWT_ISSUER`, `AMO_JWT_SECRET` | Mozilla Add-ons API credentials (https://addons.mozilla.org/developers/addon/api/key/) |
| `CWS_EXTENSION_ID` | Chrome Web Store extension ID |
| `CWS_CLIENT_ID`, `CWS_CLIENT_SECRET`, `CWS_REFRESH_TOKEN` | Google OAuth credentials for the Chrome Web Store API |

Both stores still require human review; the workflow only automates upload and submission.

## Project Structure

```
src/                         # TypeScript source
  manifest.base.json         # Shared MV3 manifest fields
  manifest.firefox.json      # Firefox-specific overlay
  manifest.chrome.json       # Chrome-specific overlay
  extraction/                # Get User / Get Post / Get Comments (content script)
  scraper/                   # Search-results scraper (content script)
  block-autorefresh.ts       # Blocks LinkedIn's feed refresh API calls
  inject-autorefresh-blocker.ts
  background.ts              # MV3 background script
  popup.ts / popup.html      # Toolbar popup
  lib/                       # Shared utilities
  icons/
build/
  firefox/                   # esbuild output for Firefox (gitignored)
  chrome/                    # esbuild output for Chrome (gitignored)
dist/                        # Packaged .zip artefacts (gitignored)
scripts/
  build.mjs                  # esbuild + manifest merge
  zip-chrome.mjs             # Chrome .zip packager
  bump-version.sh            # Version bump (package.json + manifest.base.json)
tests/
  unit/                      # Vitest unit tests
  e2e/                       # Playwright e2e tests
docs/                        # Feature documentation and screenshots
.github/workflows/           # CI/CD release workflow
```

## License

Unlicensed -- private project.
