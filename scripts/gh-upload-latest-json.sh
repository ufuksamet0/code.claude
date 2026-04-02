#!/usr/bin/env bash
# Yerelde imzalı derleme + generate-latest-json sonrası GitHub release'e latest.json yükler.
# Önkoşul: gh CLI giriş yapmış (gh auth login)
# Kullanım: ./scripts/gh-upload-latest-json.sh v0.2.0
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

TAG="${1:?Kullanım: $0 v0.2.0}"
REPO="${GITHUB_REPOSITORY:-ufuksamet0/code.claude}"

if [[ ! -f updater/latest.json ]]; then
  echo "updater/latest.json yok. Önce imzalı derleme ve:"
  echo "  RELEASE_TAG=$TAG node scripts/generate-latest-json.mjs"
  exit 1
fi

echo "Yükleniyor: $REPO release $TAG → latest.json"
gh release upload "$TAG" updater/latest.json --clobber --repo "$REPO"

echo "Beklenen URL (en son sürüm bu release ise):"
echo "https://github.com/$REPO/releases/latest/download/latest.json"
