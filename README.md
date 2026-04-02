# MultiMod AI

Tauri 2 + React + TypeScript ile çok modlu AI masaüstü uygulaması (kod, video, fotoğraf, ajanlar, PC terminal, test).

**Sürüm (tümü aynı olmalı):** `0.2.0` — `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`

## Geliştirme

```bash
npm install
npm run tauri dev
```

## Üretim derlemesi (macOS installer + imza)

Özel imza anahtarı `src-tauri/updater.key` dosyasında olmalı (repoda yok; yerelde üretin).

```bash
export TAURI_SIGNING_PRIVATE_KEY="$(cat src-tauri/updater.key)"
export TAURI_SIGNING_PRIVATE_KEY_PASSWORD=""
npm run build:release
```

Çıktı: `src-tauri/target/release/bundle/dmg/*.dmg`, güncelleme için `*.app.tar.gz` + `.sig`, ayrıca kopya: `installer/MultiMod-AI-<sürüm>-macOS-arm64.dmg`.

Tek komut yerine doğrudan: `env -u CI npm run tauri build` (aynı `export` satırlarıyla).

## Git

Uzak repo:

```bash
git remote add origin https://github.com/ufuksamet0/code.claude.git
git push -u origin main
```

## Güncelleme sunucusu

`src-tauri/tauri.conf.json` içinde `plugins.updater.endpoints` şu an GitHub Releases üzerinden `latest.json` bekler:

`https://github.com/ufuksamet0/code.claude/releases/latest/download/latest.json`

Release oluştururken bu dosyayı ve imzalı paketleri asset olarak ekleyin. Örnek yapı: `updater/latest.json.example`.
