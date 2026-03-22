#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

usage() {
  cat <<'EOF'
Usage:
  bash scripts/new-feature-branch.sh <feature-name>

Examples:
  bash scripts/new-feature-branch.sh shortcuts-polish
  npm run feature:new -- shortcuts-polish

This command:
  1. checks that the working tree is clean
  2. switches to local/product-main
  3. creates feature/<feature-name>
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" || "${1:-}" == "" ]]; then
  usage
  exit "${1:+0}"
fi

FEATURE_NAME="${1#feature/}"
TARGET_BRANCH="feature/${FEATURE_NAME}"

if [[ -n "$(git -C "${REPO_ROOT}" status --porcelain)" ]]; then
  echo "[feature:new] Refusing to switch branches because the working tree is not clean."
  echo "[feature:new] Commit or stash your changes first."
  exit 1
fi

if ! git -C "${REPO_ROOT}" rev-parse --verify local/product-main >/dev/null 2>&1; then
  echo "[feature:new] local/product-main does not exist."
  exit 1
fi

git -C "${REPO_ROOT}" switch local/product-main
git -C "${REPO_ROOT}" switch -c "${TARGET_BRANCH}"

echo "[feature:new] Created ${TARGET_BRANCH} from local/product-main"
