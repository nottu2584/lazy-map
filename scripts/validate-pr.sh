#!/bin/bash
set -e

# Script to validate Dependabot PRs for breaking changes
# Usage: ./scripts/validate-pr.sh <pr-number>

PR_NUMBER=$1
if [ -z "$PR_NUMBER" ]; then
  echo "Usage: $0 <pr-number>"
  exit 1
fi

echo "================================================"
echo "Validating PR #$PR_NUMBER"
echo "================================================"

# Checkout the PR
echo "→ Checking out PR..."
gh pr checkout "$PR_NUMBER"

# Get current branch name
BRANCH=$(git branch --show-current)
echo "→ On branch: $BRANCH"

# Install dependencies
echo "→ Installing dependencies..."
pnpm install --frozen-lockfile

# Run builds
echo "→ Building all packages..."
pnpm build

# Check if frontend exists and run e2e tests
if [ -d "apps/frontend" ]; then
  echo "→ Running visual regression tests..."
  pnpm --filter frontend test:e2e || {
    echo "⚠️  Visual regression tests failed - review screenshots"
    echo "→ Opening test report..."
    pnpm --filter frontend exec playwright show-report
    exit 1
  }
fi

echo "================================================"
echo "✅ PR #$PR_NUMBER validation passed"
echo "================================================"
