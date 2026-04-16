# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Chrome Web Store support.** Builds and packages now produce both Firefox (`.zip` / XPI) and Chrome (`.zip`) artefacts from a single source tree.
- **Per-target manifests.** Replaced `src/manifest.json` with `src/manifest.base.json` plus `manifest.firefox.json` and `manifest.chrome.json` overlays, merged at build time by `scripts/build.mjs` based on the `TARGET` environment variable.
- **`make build-firefox` and `make build-chrome`** targets for building a single browser target. `make build` now builds both.
- **Chrome packaging script** (`scripts/zip-chrome.mjs`) — zips `build/chrome/` into `dist/in2md-<version>-chrome.zip`.
- **GitHub Actions release workflow** (`.github/workflows/release.yml`). Manual dispatch with inputs for version bump (patch/minor/major/none), AMO channel (listed/unlisted), Chrome Web Store publish toggle, and Chrome publish target (default/trustedTesters). Automates:
  - Version bump via `scripts/bump-version.sh`
  - Typecheck, lint, build (both targets)
  - Source-code packaging for AMO review (`dist/in2md-source.zip`)
  - Sign + submit to AMO via `web-ext sign --upload-source-code`
  - Upload + auto-publish to Chrome Web Store via `chrome-webstore-upload-cli`
  - Commit version bump, tag `vX.Y.Z`, push, create GitHub Release with all artefacts attached
- **CHANGELOG.md** following Keep a Changelog / SemVer conventions.

### Changed

- **Documentation** — `README.md` and `CLAUDE.md` updated to describe the dual-target build, the base+overlay manifest pattern, and the CI/CD release process.
- **`scripts/build.mjs`** refactored to loop over targets from `TARGET` env var and merge base + per-target manifest overlays.

### Fixed

- **Makefile `PATH` corruption.** Removed `-include` of `~/.bash_secrets_exports` / `.zsh_secrets_exports` — those are shell-syntax files, and `make` was parsing `$PATH` as `$P` (empty) + `ATH`, which corrupted `PATH` inside recipes and caused child processes (notably `pnpm run build:firefox`) to fail with a spurious `-2` signal exit.
- **Makefile `SHELL` portability** — `SHELL := bash` changed to `SHELL := $(shell command -v bash)` so `make` resolves bash via the parse-time `PATH` instead of relying on `execve` without path lookup.
- **Makefile `PATH` ordering** — explicitly prepend `$(HOME)/.local/bin` so tools like `speaky` resolve inside recipes.
- **`make build` compound-script failure** — `build` no longer delegates to `pnpm run build` (which ran `pnpm run build:firefox && pnpm run build:chrome`); instead `make` orchestrates the two per-target builds as prerequisites, avoiding pnpm's nested-script signal quirks.
- **`lint` target** — closed the unterminated `"Linting complete"` string and dropped an invalid `@` prefix mid-command.
