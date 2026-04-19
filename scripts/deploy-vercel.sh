#!/usr/bin/env bash
set -euo pipefail

# Deploys the frontend to Vercel using an API key set in VERCEL_API_KEY.
# Optional:
# - VERCEL_PROJECT_NAME (defaults to current directory name)
# - VERCEL_SCOPE (team/user scope)
# - VERCEL_CWD (defaults to repo root)

if [[ -z "${VERCEL_API_KEY:-}" ]]; then
  echo "Error: VERCEL_API_KEY is not set."
  echo "Set it first, then rerun this script."
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_DIR="${VERCEL_CWD:-$ROOT_DIR}"
PROJECT_NAME="${VERCEL_PROJECT_NAME:-$(basename "$ROOT_DIR")}" 

if [[ ! -f "$DEPLOY_DIR/package.json" ]]; then
  echo "Error: package.json not found in deployment directory: $DEPLOY_DIR"
  exit 1
fi

pushd "$DEPLOY_DIR" > /dev/null

if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

npm run build

VERCEL_ARGS=(deploy --prod --yes --token "$VERCEL_API_KEY")

if [[ -n "${VERCEL_SCOPE:-}" ]]; then
  VERCEL_ARGS+=(--scope "$VERCEL_SCOPE")
fi

VERCEL_ARGS+=(--name "$PROJECT_NAME")

echo "Deploying to Vercel project '$PROJECT_NAME' from: $DEPLOY_DIR"
npx vercel "${VERCEL_ARGS[@]}"

popd > /dev/null

echo "Vercel deployment command completed."
