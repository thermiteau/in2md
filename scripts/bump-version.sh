#!/usr/bin/env bash
set -euo pipefail

# Bump semver in package.json and src/manifest.json
# Usage: bump-version.sh [major|minor|patch]
#   Defaults to "patch" if no argument given.

PART="${1:-patch}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PKG="$ROOT/package.json"
MANIFEST="$ROOT/src/manifest.base.json"

# Read current version from package.json
CURRENT=$(node -p "require('$PKG').version")

IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT"

case "$PART" in
  major)
    MAJOR=$((MAJOR + 1))
    MINOR=0
    PATCH=0
    ;;
  minor)
    MINOR=$((MINOR + 1))
    PATCH=0
    ;;
  patch)
    PATCH=$((PATCH + 1))
    ;;
  *)
    echo "Usage: $0 [major|minor|patch]" >&2
    exit 1
    ;;
esac

NEW="$MAJOR.$MINOR.$PATCH"

# Update both files using node to preserve JSON formatting
node -e "
const fs = require('fs');
for (const file of ['$PKG', '$MANIFEST']) {
  const raw = fs.readFileSync(file, 'utf8');
  const json = JSON.parse(raw);
  json.version = '$NEW';
  fs.writeFileSync(file, JSON.stringify(json, null, 2) + '\n');
}
"

echo "$CURRENT -> $NEW"
