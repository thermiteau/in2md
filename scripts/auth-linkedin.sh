#!/usr/bin/env bash
set -euo pipefail

# Opens a Firefox browser for manual LinkedIn login.
# Saves the session to tests/.auth/linkedin.json for reuse by Playwright tests.

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "Opening Firefox for LinkedIn login..."
echo "Log in manually, then the session will be saved."
echo ""

npx playwright test --project=auth --headed
