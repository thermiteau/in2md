.PHONY: build start test test-unit test-auth lint typecheck clean bump-patch bump-minor bump-major iterate

include ~/.zsh_secrets_exports

export

build:
	@set -e
	pnpm run build || speaky "Build failed"
	speaky "Build complete"
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
