#!/usr/bin/env bash
# Check the next navbar version in isolation, then publish a validated build to the live checkout.
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ $(git branch --show-current) != main || -n $(git status --porcelain) ]]; then
  echo 'Builder checkout is in use; will retry on the next run.'
  exit 0
fi

git fetch origin main
if ! git merge-base --is-ancestor HEAD origin/main; then
  echo 'Builder main has local commits; will retry after they are resolved.'
  exit 0
fi

worktree=$(mktemp -d)
git worktree add --detach "$worktree" origin/main
trap 'git worktree remove --force "$worktree"' EXIT

(
  cd "$worktree"
  node scripts/update-navbar-release.mjs
  if ! git diff --quiet; then
    npm ci --ignore-scripts
    npm run check
    OUT=dist npm run build
    version=$(node -p 'require("./src/docs/release.json").version')
    git add package.json package-lock.json src/docs/release.json src/docs/changelog.html
    git commit -m "Update builder and docs to navbar v$version"
    git push origin HEAD:main
  fi
)

git fetch origin main
if [[ $(git rev-parse HEAD) == "$(git rev-parse origin/main)" && -f dist/.navbar-source &&
  $(<dist/.navbar-source) == "$(git rev-parse HEAD)" ]]; then
  exit 0
fi
if [[ -n $(git status --porcelain) ]]; then
  echo 'Builder checkout changed while checking the release; deployment deferred.'
  exit 0
fi
git merge --ff-only origin/main
npm ci --ignore-scripts
npm run check
npm run build
git rev-parse HEAD >dist/.navbar-source
