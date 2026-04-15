.PHONY: build build-firefox build-chrome start test test-unit test-auth lint typecheck clean bump-patch bump-minor bump-major iterate

-include $(HOME)/.bash_secrets_exports
-include $(HOME)/.zsh_secrets_exports

# Add nvm's current node bin dir to PATH so make can find pnpm/node
NVM_BIN := $(shell ls -td $(HOME)/.nvm/versions/node/*/bin 2>/dev/null | head -n1)
export PATH := $(NVM_BIN):$(PATH)

# Firefox Developer Edition binary (override with FIREFOX_BIN=/path make start)
export FIREFOX_BIN ?= $(HOME)/Downloads/firefox/firefox

# Inherit DISPLAY from caller, fall back to :0 so web-ext can launch a GUI
export DISPLAY ?= :0

export

build:
	@set -e
	pnpm run build || speaky "Build failed"
	speaky "Build complete"
build-firefox:
	@set -e
	pnpm run build:firefox
build-chrome:
	@set -e
	pnpm run build:chrome
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
	pnpm run lint || @speaky "Linting failed"
	@speaky "Linting complete

clean:
	rm -rf dist build

bump-patch:
	@./scripts/bump-version.sh patch

bump-minor:
	@./scripts/bump-version.sh minor

bump-major:
	@./scripts/bump-version.sh major

iterate: bump-patch clean build
