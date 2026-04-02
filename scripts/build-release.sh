#!/usr/bin/env bash
# macOS: DMG + güncelleme imzası (.sig). Anahtar: src-tauri/updater.key (commit edilmez).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export TAURI_SIGNING_PRIVATE_KEY="$(cat src-tauri/updater.key)"
export TAURI_SIGNING_PRIVATE_KEY_PASSWORD=""
unset CI

npm run tauri build

VERSION=$(node -p "require('./package.json').version")
export RELEASE_TAG="v${VERSION}"
if node scripts/generate-latest-json.mjs; then
  echo "Güncelleme bildirimi: updater/latest.json (GitHub release varlığı olarak yükleyin)"
else
  echo "Uyarı: latest.json üretilemedi (.sig yoksa normal; TAURI_SIGNING_PRIVATE_KEY ile imzalı derleme yapın)"
fi

DMG=$(ls "$ROOT/src-tauri/target/release/bundle/dmg/"*_aarch64.dmg 2>/dev/null | head -1 || true)
if [[ -z "$DMG" ]]; then
  DMG=$(ls "$ROOT/src-tauri/target/aarch64-apple-darwin/release/bundle/dmg/"*_aarch64.dmg 2>/dev/null | head -1 || true)
fi
mkdir -p "$ROOT/installer"
if [[ -n "$DMG" && -f "$DMG" ]]; then
  cp "$DMG" "$ROOT/installer/MultiMod-AI-${VERSION}-macOS-arm64.dmg"
  echo "Kurulum diski: installer/MultiMod-AI-${VERSION}-macOS-arm64.dmg"
fi
