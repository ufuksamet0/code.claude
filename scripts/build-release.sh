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
DMG=$(ls "$ROOT/src-tauri/target/release/bundle/dmg/"*_aarch64.dmg 2>/dev/null | head -1 || true)
mkdir -p "$ROOT/installer"
if [[ -n "$DMG" && -f "$DMG" ]]; then
  cp "$DMG" "$ROOT/installer/MultiMod-AI-${VERSION}-macOS-arm64.dmg"
  echo "Kurulum diski: installer/MultiMod-AI-${VERSION}-macOS-arm64.dmg"
fi
