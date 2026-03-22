#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
UPSTREAM_CLEAN_DIR="${NATIVELY_UPSTREAM_CLEAN_DIR:-${REPO_ROOT}/../natively-upstream-clean}"

usage() {
  cat <<'EOF'
Usage:
  bash scripts/sync-local-product.sh

Optional:
  NATIVELY_UPSTREAM_CLEAN_DIR=/path/to/clean/upstream/repo bash scripts/sync-local-product.sh

This command:
  1. updates the clean upstream checkout
  2. rebases local/audio-reliability-base onto upstream/main
  3. merges local/audio-reliability-base into local/product-main
  4. runs Electron/native sanity checks

Safety:
  - both repos must have clean working trees
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ ! -d "${UPSTREAM_CLEAN_DIR}/.git" ]]; then
  echo "[sync:local-product] Clean upstream repo not found at: ${UPSTREAM_CLEAN_DIR}"
  echo "[sync:local-product] Set NATIVELY_UPSTREAM_CLEAN_DIR if your clean checkout lives elsewhere."
  exit 1
fi

if [[ -n "$(git -C "${REPO_ROOT}" status --porcelain)" ]]; then
  echo "[sync:local-product] Working repo is not clean. Commit or stash changes first."
  exit 1
fi

if [[ -n "$(git -C "${UPSTREAM_CLEAN_DIR}" status --porcelain)" ]]; then
  echo "[sync:local-product] Clean upstream repo is not clean. Commit or stash changes first."
  exit 1
fi

ORIGINAL_BRANCH="$(git -C "${REPO_ROOT}" rev-parse --abbrev-ref HEAD)"

echo "[sync:local-product] Updating clean upstream checkout..."
git -C "${UPSTREAM_CLEAN_DIR}" fetch upstream --prune
git -C "${UPSTREAM_CLEAN_DIR}" switch upstream-main
git -C "${UPSTREAM_CLEAN_DIR}" rebase upstream/main

echo "[sync:local-product] Updating local/audio-reliability-base..."
git -C "${REPO_ROOT}" fetch upstream --prune
git -C "${REPO_ROOT}" switch local/audio-reliability-base
git -C "${REPO_ROOT}" rebase upstream/main

echo "[sync:local-product] Merging carry base into local/product-main..."
git -C "${REPO_ROOT}" switch local/product-main
git -C "${REPO_ROOT}" merge --no-edit local/audio-reliability-base

echo "[sync:local-product] Running sanity checks..."
(cd "${REPO_ROOT}" && npm run build:electron)
(cd "${REPO_ROOT}" && npm run build:native)
(cd "${REPO_ROOT}" && cargo check)

if [[ "${ORIGINAL_BRANCH}" != "local/product-main" && "${ORIGINAL_BRANCH}" != "local/audio-reliability-base" ]]; then
  git -C "${REPO_ROOT}" switch "${ORIGINAL_BRANCH}"
  echo "[sync:local-product] Switched back to ${ORIGINAL_BRANCH}"
  echo "[sync:local-product] If this is an active feature branch, rebase it next with:"
  echo "  git rebase local/product-main"
fi

echo "[sync:local-product] Done."
