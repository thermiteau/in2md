.PHONY: build start test test-unit test-auth lint typecheck clean bump-patch bump-minor bump-major iterate

include ~/.zsh_secrets_exports

export

build:
	@set -e
	npm run build || speaky "Build failed"
	speaky "Build complete"
start:
	npm run start

test:
	@set -e
	@npm run test:unit || speaky "Tests complete"
	@speaky "Build complete"

test-e2e:
	@set -e
	@npm run test:e2e

test-auth:
	npm run test:auth

typecheck:
	npm run typecheck

lint:
	@set -e
	npm run lint || @speaky "Linting failed"
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
