SHELL := $(shell command -v bash)
.ONESHELL:

.PHONY: build build-firefox build-chrome start test test-unit test-auth lint typecheck clean bump-patch bump-minor bump-major iterate


# Note: do NOT -include $(HOME)/.bash_secrets_exports or .zsh_secrets_exports —
# those are shell-syntax files. Make would parse $PATH as $P (empty) + ATH,
# corrupting PATH and breaking child processes. Environment is inherited from
# the invoking shell automatically.

# Add nvm's current node bin dir to PATH so make can find pnpm/node
NVM_BIN := $(shell ls -td $(HOME)/.nvm/versions/node/*/bin 2>/dev/null | head -n1)
export PATH := $(NVM_BIN):$(HOME)/.local/bin:$(PATH)

# Firefox Developer Edition binary (override with FIREFOX_BIN=/path make start)
export FIREFOX_BIN ?= $(HOME)/Downloads/firefox/firefox

# Inherit DISPLAY from caller, fall back to :0 so web-ext can launch a GUI
export DISPLAY ?= :0

export

build: build-firefox build-chrome
	@speaky "Build complete"

build-firefox:
	@set -e
	pnpm run build:firefox </dev/null || { speaky "Firefox build failed"; exit 1; }

build-chrome:
	@set -e
	pnpm run build:chrome </dev/null || { speaky "Chrome build failed"; exit 1; }
start:
	pnpm run start

test:
	@set -e
	@pnpm run test:unit || speaky "Tests complete"
	@speaky "Build complete"

test-e2e:
	@set -e
	@pnpm run test:e2e

test-auth:
	pnpm run test:auth

typecheck:
	pnpm run typecheck

lint:
	@set -e
	pnpm run lint || speaky "Linting failed"
	@speaky "Linting complete"

clean:
	rm -rf dist build
