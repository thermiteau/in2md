# in2md

A Firefox extension (Manifest V3) that adds productivity tools to LinkedIn -- extract user profiles, posts, and comments as Markdown, and block the feed autorefresh that loses your place.

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
pnpm run build
```

This runs esbuild to compile TypeScript from `src/` into `build/`, then packages it with web-ext into `dist/in2md-<version>.zip`.

The output zip in `dist/` is the installable extension. The build is deterministic — running the above commands on the same source should produce identical output.

## Development

```bash
make typecheck    # tsc --noEmit
make lint         # ESLint + web-ext lint
make test         # Run unit tests (vitest)
make iterate      # Bump patch version + clean + build
```

### Testing

Unit tests use Vitest with happy-dom. E2E tests use Playwright against a live LinkedIn session.

```bash
pnpm run test:unit          # Run unit tests
pnpm run test:unit:watch    # Watch mode
make test-auth              # Authenticate Playwright with LinkedIn (run once)
pnpm run test:e2e           # Run e2e tests
```

## Project Structure

```
src/                  # TypeScript source
  manifest.json       # MV3 extension manifest
  extract.ts          # Content script for button injection and data extraction
  block-autorefresh.ts  # Blocks LinkedIn's feed refresh API calls
  popup.ts / popup.html # Toolbar popup
build/                # esbuild output (gitignored)
dist/                 # Packaged .zip (gitignored)
tests/
  unit/               # Vitest unit tests
  e2e/                # Playwright e2e tests
docs/                 # Feature documentation and screenshots
```

## License

Unlicensed -- private project.
